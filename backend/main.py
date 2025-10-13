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
from typing import Dict, List, Any
import time
import urllib3
from datetime import datetime

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("domain-audit")

app = FastAPI(title="Domain Audit API", version="2.2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# DNS Resolver
resolver = dns.resolver.Resolver()
resolver.nameservers = ["8.8.8.8", "1.1.1.1"]

# Requests session
session = requests.Session()
retries = Retry(total=3, backoff_factor=0.5, status_forcelist=[500, 502, 503, 504])
session.mount("http://", HTTPAdapter(max_retries=retries))
session.mount("https://", HTTPAdapter(max_retries=retries))

# ---------------------- Utility Functions ----------------------

def safe_fetch(url: str, timeout: int = 10) -> str:
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    }
    try:
        response = session.get(url, headers=headers, timeout=timeout, verify=False)
        response.raise_for_status()
        return response.text
    except Exception as e:
        logger.warning(f"Failed to fetch {url}: {str(e)}")
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

        def format_date(date_value):
            if not date_value:
                return "Unknown"
            if isinstance(date_value, list):
                date_value = date_value[0]
            try:
                if isinstance(date_value, str):
                    return date_value
                return date_value.strftime("%Y-%m-%d")
            except:
                return str(date_value)

        return {
            "Registrar": w.registrar or "Unknown",
            "Created Date": format_date(w.creation_date),
            "Expiry Date": format_date(w.expiration_date),
            "Name Servers": w.name_servers or ["Unknown"],
        }
    except Exception as e:
        logger.error(f"WHOIS failed: {str(e)}")
        return {"Registrar": "Unknown", "Created Date": "Unknown", "Expiry Date": "Unknown", "Name Servers": ["Unknown"]}

# ---------------------- Hosting Details ----------------------

def get_hosting_info(domain: str) -> Dict[str, Any]:
    try:
        ip = socket.gethostbyname(domain)

        try:
            response = session.head(f"https://{domain}", timeout=5, verify=False)
            server = response.headers.get("Server", "Unknown")
        except:
            server = "Unknown"

        provider = "Unknown"
        if "cloudflare" in server.lower():
            provider = "Cloudflare"
        elif "nginx" in server.lower():
            provider = "Nginx"
        elif "apache" in server.lower():
            provider = "Apache"

        return {"IP Address": ip, "Server": server, "Hosting Provider": provider}
    except Exception as e:
        logger.error(f"Hosting info failed: {str(e)}")
        return {"IP Address": "Unknown", "Server": "Unknown", "Hosting Provider": "Unknown"}

# ---------------------- Email Detection ----------------------

def get_mx_records(domain: str) -> List[str]:
    try:
        mx_records = []
        answers = resolver.resolve(domain, "MX")
        for rdata in answers:
            mx_records.append(str(rdata.exchange).rstrip("."))
        return mx_records
    except:
        return []

def detect_email_provider(mx_records: List[str]) -> str:
    for mx in mx_records:
        mx_lower = mx.lower()
        if "google" in mx_lower:
            return "Google Workspace"
        elif "outlook" in mx_lower or "protection.outlook" in mx_lower:
            return "Microsoft 365"
        elif "zoho" in mx_lower:
            return "Zoho Mail"
        elif "yahoo" in mx_lower:
            return "Yahoo Mail"
    return "Custom" if mx_records else "Unknown"

def extract_emails(domain: str) -> List[str]:
    try:
        html = safe_fetch(f"https://{domain}")
        emails = re.findall(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", html)
        return emails[:5]
    except:
        return []

# ---------------------- Technology Detection ----------------------

def detect_tech_stack(domain: str) -> Dict[str, List[str]]:
    try:
        return builtwith.parse(f"https://{domain}") or {}
    except:
        return {}

# ---------------------- Improved WordPress Detection ----------------------
def detect_wordpress(domain: str) -> Dict[str, Any]:
    wp_info = {
        "Is WordPress": "No",
        "Version": "Not Detected",
        "Theme": "Not Detected",
        "Plugins": [],
        "Page Builder": "Not Detected"
    }

    try:
        base_url = f"https://{domain}"
        html = safe_fetch(base_url)
        if not html:
            return wp_info

        html_lower = html.lower()

        # ---------------- Check for WordPress Presence ----------------
        wp_signatures = [
            "wp-content", "wp-includes", "wp-json", "wp-admin", "wp-login.php", "xmlrpc.php"
        ]
        if any(sig in html_lower for sig in wp_signatures):
            wp_info["Is WordPress"] = "Yes"

        # REST API confirmation
        try:
            rest_response = session.get(f"{base_url}/wp-json/", timeout=5, verify=False)
            if rest_response.status_code == 200:
                wp_info["Is WordPress"] = "Yes"
        except:
            pass

        # Readme fallback
        readme_html = safe_fetch(f"{base_url}/readme.html")
        if "wordpress" in readme_html.lower():
            wp_info["Is WordPress"] = "Yes"

        # ---------------- Detect Version ----------------
        version_patterns = [
            r'content=["\']WordPress\s*([0-9]+\.[0-9]+(?:\.[0-9]+)?)["\']',
            r"wp-embed\.min\.js\?ver=([0-9]+\.[0-9]+(?:\.[0-9]+)?)",
            r"ver=([0-9]+\.[0-9]+(?:\.[0-9]+)?)",
            r"WordPress\s*([0-9]+\.[0-9]+(?:\.[0-9]+)?)"
        ]
        for pattern in version_patterns:
            match = re.search(pattern, html, re.IGNORECASE)
            if match:
                wp_info["Version"] = match.group(1)
                break

        # Meta generator fallback
        soup = BeautifulSoup(html, "html.parser")
        generator = soup.find("meta", attrs={"name": "generator"})
        if generator and "wordpress" in generator.get("content", "").lower():
            ver_match = re.search(r"([0-9]+\.[0-9]+(?:\.[0-9]+)?)", generator["content"])
            if ver_match:
                wp_info["Version"] = ver_match.group(1)

        # wp-json version check
        if wp_info["Version"] == "Not Detected":
            try:
                wp_json = session.get(f"{base_url}/wp-json/", timeout=5, verify=False)
                if wp_json.status_code == 200:
                    data = wp_json.json()
                    gen = data.get("generator", "")
                    match = re.search(r"([0-9]+\.[0-9]+(?:\.[0-9]+)?)", gen)
                    if match:
                        wp_info["Version"] = match.group(1)
            except:
                pass

        # Readme.html version fallback
        if wp_info["Version"] == "Not Detected":
            match = re.search(r"Version\s*([0-9]+\.[0-9]+(?:\.[0-9]+)?)", readme_html)
            if match:
                wp_info["Version"] = match.group(1)

        # ---------------- Detect Theme ----------------
        theme_match = re.search(r"/wp-content/themes/([^/]+)/", html_lower)
        if theme_match:
            theme_slug = theme_match.group(1)
            theme_name = theme_slug.replace("-", " ").title()
            wp_info["Theme"] = theme_name

            # Optional: extract official theme name from style.css
            css_url = f"{base_url}/wp-content/themes/{theme_slug}/style.css"
            css_content = safe_fetch(css_url)
            css_name = re.search(r"Theme Name:\s*(.+)", css_content)
            if css_name:
                wp_info["Theme"] = css_name.group(1).strip()

        # ---------------- Detect Plugins ----------------
        plugins = re.findall(r"/wp-content/plugins/([^/]+)/", html_lower)
        if plugins:
            wp_info["Plugins"] = sorted(list(set([p.replace("-", " ").title() for p in plugins])))

        # ---------------- Detect Page Builders ----------------
        builders = {
            "Elementor": ["elementor", "elementor-frontend", "elementor-icons"],
            "Divi": ["et_pb", "et_divi_builder", "divi"],
            "WPBakery": ["wpb_animate_when_almost_visible", "vc_row", "wpb_wrapper"],
            "Oxygen": ["ct_builder", "oxygen_vsb"],
            "Beaver Builder": ["fl-builder", "fl-builder-content"],
            "Bricks Builder": ["bricks-builder"],
            "Brizy": ["brz-"],
        }

        for builder, keywords in builders.items():
            if any(k in html_lower for k in keywords):
                wp_info["Page Builder"] = builder
                break

    except Exception as e:
        logger.error(f"WordPress detection error: {str(e)}")

    return wp_info


# ---------------------- Improved Ads Detection ----------------------

def detect_ads(domain: str) -> List[str]:
    try:
        html = safe_fetch(f"https://{domain}")
        if not html:
            return ["Unable to scan website"]

        found_ads = set()

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
                r"ga\([\'\"]",
                r"gtag\([\'\"]",
                r"googletagmanager\.com/gtag/js",
            ],
            "Google Tag Manager": [
                r"googletagmanager\.com/gtm\.js",
                r"googletagmanager\.com/ns\.html",
            ],
            "Facebook Pixel": [
                r"connect\.facebook\.net",
                r"fbq\([\'\"]",
                r"facebook\.com/tr\?",
                r"facebook\.com/tr/",
            ],
            "Microsoft Advertising": [r"bat\.bing\.com", r"bing\.com/ads"],
            "Amazon Ads": [r"amazon-adsystem\.com", r"assoc-amazon\.com"],
            "LinkedIn Insight": [r"linkedin\.com/li\.js", r"linkedin\.com/px"],
            "Twitter Ads": [r"ads-twitter\.com", r"analytics\.twitter\.com"],
            "Pinterest Tag": [r"ct\.pinterest\.com", r"pinterest\.com/tag"],
            "TikTok Pixel": [r"tiktok\.com/i18n/pixel", r"analytics\.tiktok\.com"],
        }

        soup = BeautifulSoup(html, "html.parser")

        # Check external scripts
        for script in soup.find_all("script", src=True):
            src = script["src"]
            for network, patterns in ad_networks.items():
                if any(re.search(pattern, src, re.IGNORECASE) for pattern in patterns):
                    found_ads.add(network)

        # Check inline scripts
        for network, patterns in ad_networks.items():
            if any(re.search(pattern, html, re.IGNORECASE) for pattern in patterns):
                found_ads.add(network)

        return list(found_ads) if found_ads else ["No advertising networks detected"]

    except Exception as e:
        logger.error(f"Ad detection failed: {str(e)}")
        return ["Ad detection failed"]

# ---------------------- Security Audit ----------------------

def audit_security(domain: str) -> Dict[str, str]:
    security = {
        "SSL Certificate": "Invalid",
        "HSTS": "Not Found",
        "X-Frame-Options": "Not Found",
        "X-Content-Type-Options": "Not Found",
        "Content-Security-Policy": "Not Found",
    }

    try:
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE

        with socket.create_connection((domain, 443), timeout=5) as sock:
            with context.wrap_socket(sock, server_hostname=domain) as ssock:
                cert = ssock.getpeercert()
                if cert:
                    security["SSL Certificate"] = "Valid"

        response = session.get(f"https://{domain}", timeout=5, verify=False)
        headers = response.headers

        if headers.get("Strict-Transport-Security"):
            security["HSTS"] = "Present"
        if headers.get("X-Frame-Options"):
            security["X-Frame-Options"] = "Present"
        if headers.get("X-Content-Type-Options"):
            security["X-Content-Type-Options"] = "Present"
        if headers.get("Content-Security-Policy"):
            security["Content-Security-Policy"] = "Present"

    except Exception as e:
        logger.warning(f"Security audit issue: {str(e)}")

    return security

# ---------------------- Performance Analysis ----------------------

def analyze_performance(domain: str) -> Dict[str, Any]:
    try:
        start_time = time.time()
        response = session.get(f"https://{domain}", timeout=10, verify=False)
        load_time = time.time() - start_time
        page_size = len(response.content) / 1024  # KB

        if load_time < 1.5:
            score = "Excellent"
        elif load_time < 3.0:
            score = "Good"
        elif load_time < 5.0:
            score = "Average"
        else:
            score = "Poor"

        return {
            "Load Time": f"{load_time:.2f}s",
            "Page Size": f"{page_size:.1f} KB",
            "Score": score,
            "Status": response.status_code,
        }
    except Exception as e:
        logger.warning(f"Performance analysis failed: {str(e)}")
        return {
            "Load Time": "Failed to measure",
            "Page Size": "Unknown",
            "Score": "Unknown",
            "Status": "Unknown",
        }

# ---------------------- Routes ----------------------

@app.get("/")
def home():
    return {"message": "Domain Audit API", "version": "2.2"}

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
