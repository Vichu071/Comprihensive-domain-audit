from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import dns.resolver
import whois
import builtwith
import requests
from bs4 import BeautifulSoup
import re
import logging
import os
from requests.adapters import HTTPAdapter, Retry
import ssl
import socket
from typing import Dict, List, Any, Optional
import time
import urllib3
from datetime import datetime

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("domain-audit")

app = FastAPI(title="Domain Audit API", version="2.3")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# DNS Resolver
resolver = dns.resolver.Resolver()
resolver.nameservers = ["8.8.8.8", "1.1.1.1"]

# Requests session with retries
session = requests.Session()
retries = Retry(total=3, backoff_factor=0.5, status_forcelist=[429, 500, 502, 503, 504])
session.mount("http://", HTTPAdapter(max_retries=retries))
session.mount("https://", HTTPAdapter(max_retries=retries))

# ---------------------- Utility Functions ----------------------

def safe_fetch(url: str, timeout: int = 10, method: str = "GET") -> str:
    """Fetch a URL and return text (silently returns empty string on failure)."""
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    }
    try:
        if method.upper() == "HEAD":
            response = session.head(url, headers=headers, timeout=timeout, verify=False)
            response.raise_for_status()
            return ""
        response = session.get(url, headers=headers, timeout=timeout, verify=False)
        response.raise_for_status()
        return response.text
    except Exception as e:
        logger.debug(f"safe_fetch failed for {url}: {e}")
        return ""


def normalize_domain(domain: str) -> str:
    domain = domain.strip().lower()
    domain = re.sub(r"^https?://", "", domain)
    domain = re.sub(r"^www\.", "", domain)
    return domain.split("/")[0]


# ---------------------- WHOIS Information ----------------------

def get_whois_info(domain: str) -> Dict[str, Any]:
    try:
        w = whois.whois(domain)

        def format_date(date_value: Optional[Any]):
            if not date_value:
                return "Unknown"
            if isinstance(date_value, list):
                date_value = date_value[0]
            try:
                if isinstance(date_value, str):
                    return date_value
                return date_value.strftime("%Y-%m-%d")
            except Exception:
                return str(date_value)

        registrar = getattr(w, "registrar", None) or "Unknown"
        creation = format_date(getattr(w, "creation_date", None))
        expiration = format_date(getattr(w, "expiration_date", None))
        name_servers = getattr(w, "name_servers", None) or ["Unknown"]

        return {
            "Registrar": registrar,
            "Created Date": creation,
            "Expiry Date": expiration,
            "Name Servers": name_servers,
        }
    except Exception as e:
        logger.warning(f"WHOIS failed for {domain}: {e}")
        return {"Registrar": "Unknown", "Created Date": "Unknown", "Expiry Date": "Unknown", "Name Servers": ["Unknown"]}


# ---------------------- Hosting Details ----------------------

def get_hosting_info(domain: str) -> Dict[str, Any]:
    """
    Returns IP, server header (sanitized), reverse lookup (PTR) and a guessed provider.
    We sanitize 'X-Powered-By' or other headers so we don't return 'powered by' strings directly.
    """
    try:
        ip = socket.gethostbyname(domain)
    except Exception as e:
        logger.warning(f"DNS resolution failed for {domain}: {e}")
        return {"IP Address": "Unknown", "Server": "Unknown", "Hosting Provider": "Unknown", "Reverse PTR": "Unknown"}

    server = "Unknown"
    reverse_ptr = "Unknown"
    provider = "Unknown"

    # Try reverse DNS PTR
    try:
        reverse_ptr = socket.gethostbyaddr(ip)[0]
    except Exception:
        reverse_ptr = "Unknown"

    # Try to get headers
    try:
        resp = session.head(f"https://{domain}", timeout=6, verify=False)
        server_header = resp.headers.get("Server") or resp.headers.get("server") or ""
        x_powered = resp.headers.get("X-Powered-By") or resp.headers.get("x-powered-by") or ""

        # sanitize server header (remove known "powered by" noise and truncate long values)
        combined_server = (server_header + " " + x_powered).strip()
        combined_server = re.sub(r"powered by[:\s]*[A-Za-z0-9\-_. ]+", "", combined_server, flags=re.IGNORECASE)
        combined_server = re.sub(r"\s{2,}", " ", combined_server).strip()
        if combined_server:
            # Limit to 120 chars to avoid overly long values
            server = combined_server[:120]

        # Guess provider from reverse ptr or server header
        lp = (reverse_ptr + " " + server).lower()
        if "cloudflare" in lp:
            provider = "Cloudflare"
        elif "amazonaws" in lp or "awselb" in lp or "amazon" in lp:
            provider = "AWS"
        elif "google" in lp or "googleusercontent" in lp:
            provider = "Google Cloud"
        elif "microsoft" in lp or "azure" in lp or "windows" in lp:
            provider = "Microsoft Azure"
        elif "digitalocean" in lp:
            provider = "DigitalOcean"
        elif "fastly" in lp:
            provider = "Fastly"
        elif "akamai" in lp:
            provider = "Akamai"

    except Exception as e:
        logger.debug(f"Header fetch failed for hosting info: {e}")

    return {"IP Address": ip, "Server": server or "Unknown", "Hosting Provider": provider, "Reverse PTR": reverse_ptr}


# ---------------------- Email Detection ----------------------

def get_mx_records(domain: str) -> List[str]:
    try:
        mx_records = []
        answers = resolver.resolve(domain, "MX")
        for rdata in answers:
            mx_records.append(str(rdata.exchange).rstrip("."))
        return mx_records
    except Exception:
        return []


def detect_email_provider(mx_records: List[str]) -> str:
    for mx in mx_records:
        mx_lower = mx.lower()
        if any(k in mx_lower for k in ["google", "googlemail", "gmail"]):
            return "Google Workspace"
        elif any(k in mx_lower for k in ["outlook", "protection.outlook", "office365", "hotmail"]):
            return "Microsoft 365"
        elif "zoho" in mx_lower:
            return "Zoho Mail"
        elif "yahoodns" in mx_lower or "yahoo" in mx_lower:
            return "Yahoo Mail"
    return "Custom" if mx_records else "Unknown"


def extract_emails(domain: str) -> List[str]:
    try:
        html = safe_fetch(f"https://{domain}") or safe_fetch(f"http://{domain}")
        emails = re.findall(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", html)
        # return unique, limited list
        uniq = []
        for e in emails:
            if e not in uniq:
                uniq.append(e)
            if len(uniq) >= 5:
                break
        return uniq
    except Exception as e:
        logger.debug(f"extract_emails failed: {e}")
        return []


# ---------------------- Technology Detection ----------------------

def detect_tech_stack(domain: str) -> Dict[str, List[str]]:
    """
    Use builtwith.parse but filter out noisy categories like 'photo galleries' and some JS frameworks
    if the user requested those to be excluded.
    """
    try:
        tech = builtwith.parse(f"https://{domain}") or {}
        # Remove or shorten noisy categories
        filtered = {}
        ignore_keys = ["photo galleries", "image hosting", "javascript libraries", "javascript frameworks"]
        for k, v in tech.items():
            kl = k.lower()
            if any(ik in kl for ik in ignore_keys):
                continue
            # limit the number of items for readability
            filtered[k] = v[:6]
        return filtered
    except Exception as e:
        logger.debug(f"builtwith failed: {e}")
        return {}


# ---------------------- Improved WordPress Detection ----------------------

def detect_wordpress(domain: str) -> Dict[str, Any]:
    wp_info = {"Is WordPress": False, "Version": None, "Theme": None, "Detection Evidence": []}

    try:
        html = safe_fetch(f"https://{domain}") or safe_fetch(f"http://{domain}")
        if not html:
            return wp_info

        lower_html = html.lower()

        # Common indicators
        indicators = {
            "wp-json": "/wp-json/",
            "wp-content": "wp-content",
            "wp-includes": "wp-includes",
            "xmlrpc": "xmlrpc.php",
            "readme": "/readme.html",
            "wp-admin": "wp-admin",
        }

        found = 0
        for k, sig in indicators.items():
            if sig in lower_html:
                wp_info["Detection Evidence"].append(sig)
                found += 1

        # Check wp-json endpoint (best evidence)
        try:
            wpjson = session.get(f"https://{domain}/wp-json/", timeout=6, verify=False)
            if wpjson.status_code == 200 and "namespaces" in wpjson.text.lower():
                wp_info["Is WordPress"] = True
                wp_info["Detection Evidence"].append("/wp-json/")
                # Try to extract version from wp-json (if present)
                try:
                    jsonb = wpjson.json()
                    # Theme or version might be under 'generator' or similar fields
                    # Many sites expose generator meta instead; we'll still look at homepage
                    version = jsonb.get("version") or jsonb.get("generator")
                    if version:
                        wp_info["Version"] = str(version)
                except Exception:
                    pass
        except Exception:
            pass

        # Meta generator tag
        try:
            soup = BeautifulSoup(html, "html.parser")
            generator = soup.find("meta", attrs={"name": "generator"})
            if generator and "wordpress" in generator.get("content", "").lower():
                wp_info["Is WordPress"] = True
                gen = generator.get("content", "")
                ver_match = re.search(r"([0-9]+\.[0-9]+(?:\.[0-9]+)?)", gen)
                if ver_match:
                    wp_info["Version"] = ver_match.group(1)
                wp_info["Detection Evidence"].append("meta:generator")
        except Exception:
            pass

        # Look for theme in CSS references
        try:
            theme_match = re.search(r"/wp-content/themes/([^/\s]+)/", html, re.IGNORECASE)
            if theme_match:
                wp_info["Theme"] = theme_match.group(1)
                wp_info["Is WordPress"] = True
                wp_info["Detection Evidence"].append("themes/style")
        except Exception:
            pass

        # If several indicators present, mark as WordPress
        if found >= 2:
            wp_info["Is WordPress"] = True

        # Final cleanup: convert boolean to Yes/No for user-friendly output
        if wp_info["Is WordPress"]:
            wp_info["Is WordPress"] = "Yes"
            wp_info["Version"] = wp_info["Version"] or "Not Detected"
            wp_info["Theme"] = wp_info["Theme"] or "Not Detected"
        else:
            wp_info["Is WordPress"] = "No"
            wp_info["Version"] = "Not Detected"
            wp_info["Theme"] = "Not Detected"

    except Exception as e:
        logger.debug(f"WordPress detection error for {domain}: {e}")

    return wp_info


# ---------------------- Improved Ads Detection ----------------------

def detect_ads(domain: str) -> List[str]:
    try:
        html = safe_fetch(f"https://{domain}") or safe_fetch(f"http://{domain}")
        if not html:
            return ["Unable to scan website"]

        found_ads = set()

        # Major ad and analytics networks
        ad_networks = {
            "Google Ads": [
                r"googlesyndication\.com",
                r"doubleclick\.net",
                r"googleadservices\.com",
                r"adsbygoogle",
                r"pagead2\.googlesyndication",
            ],
            "Google Analytics": [
                r"google-analytics\.com",
                r"gtag\(",
                r"ga\(",
                r"googletagmanager\.com/gtag/js",
            ],
            "Google Tag Manager": [
                r"googletagmanager\.com/gtm\.js",
                r"googletagmanager\.com/ns\.html",
            ],
            "Facebook Pixel": [
                r"connect\.facebook\.net",
                r"fbq\(",
                r"facebook\.com/tr",
            ],
            "Microsoft Advertising": [
                r"bat\.bing\.com",
                r"bing\.com/ads",
            ],
            "Amazon Ads": [
                r"amazon-adsystem\.com",
                r"assoc-amazon\.com",
            ],
            "LinkedIn Insight": [
                r"linkedin\.com/li\.js",
                r"linkedin\.com/px",
            ],
            "Twitter Ads": [
                r"ads-twitter\.com",
                r"analytics\.twitter\.com",
            ],
            "Pinterest Tag": [
                r"ct\.pinterest\.com",
                r"pinterest\.com/tag",
            ],
            "TikTok Pixel": [
                r"tiktok\.com/i18n/pixel",
                r"analytics\.tiktok\.com",
            ],
        }

        soup = BeautifulSoup(html, "html.parser")

        # 🔍 Check external <script> and <iframe> sources
        for tag in soup.find_all(["script", "iframe"]):
            src = tag.get("src") or tag.get("data-src") or ""
            if src:
                for network, patterns in ad_networks.items():
                    if any(re.search(p, src, re.IGNORECASE) for p in patterns):
                        found_ads.add(network)

        # 🔍 Check inline scripts and entire HTML body
        for network, patterns in ad_networks.items():
            if any(re.search(p, html, re.IGNORECASE) for p in patterns):
                found_ads.add(network)

        # ✅ Clean, sorted results
        if found_ads:
            return sorted(list(found_ads))
        return ["No advertising networks detected"]

    except Exception as e:
        logger.warning(f"Ad detection failed for {domain}: {e}")
        return ["Ad detection failed"]

# ---------------------- Security Audit ----------------------

def audit_security(domain: str) -> Dict[str, Any]:
    security = {
        "SSL Certificate": "Invalid",
        "SSL Expires": "Unknown",
        "HSTS": "Not Found",
        "X-Frame-Options": "Not Found",
        "X-Content-Type-Options": "Not Found",
        "Content-Security-Policy": "Not Found",
    }

    # Check TLS certificate validity and expiry
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        with socket.create_connection((domain, 443), timeout=6) as sock:
            with ctx.wrap_socket(sock, server_hostname=domain) as ssock:
                cert = ssock.getpeercert()
                if cert:
                    security["SSL Certificate"] = "Valid"
                    # try to extract notAfter
                    not_after = cert.get("notAfter")
                    if not_after:
                        # example format: 'Jun  1 12:00:00 2026 GMT'
                        try:
                            expires = datetime.strptime(not_after, "%b %d %H:%M:%S %Y %Z")
                            security["SSL Expires"] = expires.strftime("%Y-%m-%d")
                            # check expiry
                            days_left = (expires - datetime.utcnow()).days
                            security["SSL Days Left"] = max(days_left, 0)
                        except Exception:
                            security["SSL Expires"] = str(not_after)

    except Exception as e:
        logger.debug(f"Certificate check failed for {domain}: {e}")

    # Check security headers
    try:
        resp = session.get(f"https://{domain}", timeout=6, verify=False)
        headers = {k.lower(): v for k, v in resp.headers.items()}
        if "strict-transport-security" in headers:
            security["HSTS"] = "Present"
        if "x-frame-options" in headers:
            security["X-Frame-Options"] = "Present"
        if "x-content-type-options" in headers:
            security["X-Content-Type-Options"] = "Present"
        if "content-security-policy" in headers:
            security["Content-Security-Policy"] = "Present"

        # Check cookies for secure & httpOnly flags (if any set in headers)
        set_cookie = resp.headers.get("Set-Cookie")
        if set_cookie:
            security["Cookies"] = set_cookie
    except Exception as e:
        logger.debug(f"Security headers check failed: {e}")

    return security


# ---------------------- Performance Analysis ----------------------

def analyze_performance(domain: str) -> Dict[str, Any]:
    try:
        start_time = time.time()
        # make a HEAD first to avoid downloading large bodies
        try:
            head = session.head(f"https://{domain}", timeout=6, verify=False)
            status = head.status_code
            content_length = head.headers.get("Content-Length")
            if content_length:
                page_size_kb = int(content_length) / 1024
            else:
                # fallback to GET
                resp = session.get(f"https://{domain}", timeout=10, verify=False)
                status = resp.status_code
                page_size_kb = len(resp.content) / 1024
        except Exception:
            resp = session.get(f"https://{domain}", timeout=10, verify=False)
            status = resp.status_code
            page_size_kb = len(resp.content) / 1024

        load_time = time.time() - start_time

        if load_time < 1.5:
            score = "Excellent"
        elif load_time < 3.0:
            score = "Good"
        elif load_time < 5.0:
            score = "Average"
        else:
            score = "Poor"

        return {"Load Time": f"{load_time:.2f}s", "Page Size": f"{page_size_kb:.1f} KB", "Score": score, "Status": status}
    except Exception as e:
        logger.debug(f"Performance analysis failed for {domain}: {e}")
        return {"Load Time": "Failed to measure", "Page Size": "Unknown", "Score": "Unknown", "Status": "Unknown"}


# ---------------------- Routes ----------------------

@app.get("/")
def home():
    return {"message": "Domain Audit API", "version": "2.3"}


@app.get("/audit/{domain}")
def audit_domain(domain: str):
    domain = normalize_domain(domain)
    if not domain:
        return JSONResponse({"error": "Invalid domain"}, status_code=400)

    mx_records = get_mx_records(domain)

    results = {
        "Domain": domain,
        "Domain Info": get_whois_info(domain),
        "Hosting": get_hosting_info(domain),
        "Email Setup": {
            "Provider": detect_email_provider(mx_records),
            "MX Records": mx_records,
            "Contact Emails": extract_emails(domain),
        },
        "Website Tech": detect_tech_stack(domain),
        "WordPress": detect_wordpress(domain),
        "Ads Running": detect_ads(domain),
        "Security": audit_security(domain),
        "Performance": analyze_performance(domain),
        "Audit Date": datetime.now().strftime("%B %d, %Y at %I:%M %p"),
    }

    return JSONResponse(results)


@app.get("/health")
def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
