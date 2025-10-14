# main.py
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
from typing import Dict, List, Any, Tuple
import time
import urllib3
from datetime import datetime, timedelta

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("domain-audit")

app = FastAPI(title="Domain Audit API", version="2.6")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# DNS Resolver with better configuration
resolver = dns.resolver.Resolver()
resolver.nameservers = ["8.8.8.8", "1.1.1.1", "8.8.4.4", "1.0.0.1"]
resolver.timeout = 5
resolver.lifetime = 8

# Requests session with retries
session = requests.Session()
retries = Retry(total=3, backoff_factor=1, status_forcelist=[500, 502, 503, 504], allowed_methods=None)
session.mount("http://", HTTPAdapter(max_retries=retries))
session.mount("https://", HTTPAdapter(max_retries=retries))

# Helper: try both https and http automatically and return first successful (content, used_url)
def fetch_with_fallback(domain: str, path: str = "/", timeout: int = 10) -> Tuple[str, str]:
    urls = [f"https://{domain}{path}", f"http://{domain}{path}"]
    for url in urls:
        try:
            resp = session.get(url, timeout=timeout, verify=False, allow_redirects=True)
            if resp.status_code < 400 and resp.text:
                return resp.text, url
        except Exception as e:
            logger.debug(f"fetch_with_fallback failed for {url}: {e}")
    return "", ""

def safe_fetch(url: str, timeout: int = 12) -> str:
    try:
        response = session.get(url, timeout=timeout, verify=False, allow_redirects=True)
        response.raise_for_status()
        return response.text or ""
    except Exception as e:
        logger.debug(f"safe_fetch failed for {url}: {e}")
        return ""

def normalize_domain(domain: str) -> str:
    domain = domain.strip().lower()
    domain = re.sub(r"^https?://", "", domain)
    domain = re.sub(r"^www\.", "", domain)
    domain = re.sub(r"/.*$", "", domain)  # Remove path
    return domain

# ---------------- WHOIS ----------------
def get_whois_info(domain: str) -> Dict[str, Any]:
    default = {"Registrar": "Unknown", "Created Date": "Unknown", "Expiry Date": "Unknown", "Name Servers": ["Unknown"], "Updated Date": "Unknown"}
    try:
        w = whois.whois(domain)
        def fmt(d):
            if not d:
                return "Unknown"
            if isinstance(d, list):
                d = d[0]
            if isinstance(d, datetime):
                return d.strftime("%Y-%m-%d")
            # sometimes whois returns string
            for fmt_try in ("%Y-%m-%d", "%d-%b-%Y", "%Y.%m.%d"):
                try:
                    return datetime.strptime(str(d), fmt_try).strftime("%Y-%m-%d")
                except:
                    pass
            return str(d)
        return {
            "Registrar": getattr(w, "registrar", "Unknown") or "Unknown",
            "Created Date": fmt(getattr(w, "creation_date", None)),
            "Expiry Date": fmt(getattr(w, "expiration_date", None)),
            "Name Servers": getattr(w, "name_servers", ["Unknown"]) or ["Unknown"],
            "Updated Date": fmt(getattr(w, "updated_date", None)),
        }
    except Exception as e:
        logger.warning(f"whois lookup failed for {domain}: {e}")
        return default

# ---------------- Hosting ----------------
def get_hosting_info(domain: str) -> Dict[str, Any]:
    info = {"IP Address": "Unknown", "Server": "Unknown", "Powered By": "Unknown", "Hosting Provider": "Unknown", "Resolver": "Unknown"}
    try:
        # Resolve A
        try:
            answers = resolver.resolve(domain, "A")
            ip = str(answers[0])
            info["IP Address"] = ip
            info["Resolver"] = ", ".join([str(ns) for ns in resolver.nameservers])
        except Exception:
            try:
                ip = socket.gethostbyname(domain)
                info["IP Address"] = ip
            except Exception:
                pass

        # Try to HEAD/GET to obtain server headers
        for scheme in ("https://", "http://"):
            try:
                resp = session.head(f"{scheme}{domain}", timeout=8, verify=False, allow_redirects=True)
                if resp.status_code < 400:
                    headers = resp.headers
                    info["Server"] = headers.get("Server", info["Server"])
                    info["Powered By"] = headers.get("X-Powered-By", info["Powered By"])
                    break
            except Exception:
                continue

        server_lower = info["Server"].lower() if info["Server"] else ""
        # provider heuristics
        if "cloudflare" in server_lower or info["IP Address"].startswith("104.") or info["IP Address"].startswith("172."):
            info["Hosting Provider"] = "Possibly Cloudflare / CDN"
        elif "nginx" in server_lower:
            info["Hosting Provider"] = "Nginx-based"
        elif "apache" in server_lower:
            info["Hosting Provider"] = "Apache"
        elif "iis" in server_lower or "microsoft" in server_lower:
            info["Hosting Provider"] = "Microsoft IIS"
        else:
            # reverse lookup attempt
            try:
                rev = socket.gethostbyaddr(info["IP Address"])
                info["Hosting Provider"] = rev[0]
            except Exception:
                pass

    except Exception as e:
        logger.warning(f"get_hosting_info error for {domain}: {e}")

    return info

# ---------------- Email ----------------
def get_mx_records(domain: str) -> List[str]:
    try:
        mx_records = []
        answers = resolver.resolve(domain, 'MX')
        for r in answers:
            mx_records.append(str(r.exchange).rstrip("."))
        return mx_records
    except Exception as e:
        logger.debug(f"MX lookup failed for {domain}: {e}")
        return []

def get_txt_records(domain: str) -> List[str]:
    try:
        txts = []
        answers = resolver.resolve(domain, 'TXT')
        for r in answers:
            # r.strings can be list of bytes
            try:
                joined = "".join([t.decode('utf-8') if isinstance(t, bytes) else str(t) for t in r.strings])
            except:
                joined = str(r)
            txts.append(joined)
        return txts
    except Exception as e:
        logger.debug(f"TXT lookup failed for {domain}: {e}")
        return []

def detect_email_provider(mx_records: List[str], txt_records: List[str]) -> str:
    if not mx_records and not txt_records:
        return "No Email Service Detected"
    indicators = []
    for mx in mx_records:
        m = mx.lower()
        if "google" in m or "aspmx.l.google.com" in m:
            indicators.append("Google Workspace")
        elif "outlook" in m or "protection.outlook" in m or "mail.protection" in m:
            indicators.append("Microsoft 365")
        elif "zoho" in m:
            indicators.append("Zoho Mail")
        elif "yahoo" in m:
            indicators.append("Yahoo Mail")
        elif "protonmail" in m or "pm.proton" in m or "proton" in m:
            indicators.append("ProtonMail")
        elif "fastmail" in m:
            indicators.append("Fastmail")
    for t in txt_records:
        tl = t.lower()
        if "google-site-verification" in tl:
            indicators.append("Google Workspace")
        if "spf1 include:spf.protection.outlook.com" in tl or "spf.protection.outlook.com" in tl:
            indicators.append("Microsoft 365")
        if "zoho" in tl:
            indicators.append("Zoho Mail")
    if indicators:
        from collections import Counter
        return Counter(indicators).most_common(1)[0][0]
    if mx_records:
        return "Custom Email Provider (MX present)"
    return "No Email Service Detected"

def extract_emails(domain: str) -> List[str]:
    # widened pages and better filtering
    pages = ["/", "/contact", "/contact-us", "/about", "/about-us", "/wp-admin", "/wp-login.php"]
    emails = set()
    pattern = re.compile(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', re.I)
    for p in pages:
        html, url = fetch_with_fallback(domain, p, timeout=8)
        if not html:
            continue
        # read meta emails in markup and simple mailto
        for m in pattern.findall(html):
            # filter out image-like and generic trackers
            if any(m.lower().endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.svg']):
                continue
            emails.add(m)
        # mailto links
        try:
            soup = BeautifulSoup(html, "html.parser")
            for a in soup.select('a[href^=mailto]'):
                mail = a.get('href').split(':', 1)[-1]
                if mail:
                    emails.add(mail)
        except Exception:
            pass
    # prefer emails that use domain
    domain_emails = [e for e in emails if normalize_domain(e.split('@')[-1]) == domain]
    if domain_emails:
        return domain_emails[:10]
    return list(emails)[:10]

# ---------------- Technology Detection ----------------
def detect_tech_stack(domain: str) -> Dict[str, List[str]]:
    try:
        tech = {}
        # builtwith sometimes fails; guard it
        try:
            bw = builtwith.parse(f"https://{domain}")
            if bw:
                tech.update(bw)
        except Exception as e:
            logger.debug(f"builtwith parse failed: {e}")

        html, url_used = fetch_with_fallback(domain, "/", timeout=8)
        if html:
            html_low = html.lower()
            # frameworks
            frameworks = []
            if 'react' in html_low or 'react-dom' in html_low:
                frameworks.append('React')
            if 'vue' in html_low and 'vue.js' in html_low:
                frameworks.append('Vue.js')
            if 'angular' in html_low:
                frameworks.append('Angular')
            if 'jquery' in html_low:
                frameworks.append('jQuery')
            if frameworks:
                tech.setdefault('javascript-frameworks', []).extend(frameworks)
            # server side hints
            if 'wordpress' in html_low:
                tech.setdefault('cms', []).append('WordPress')
        return tech
    except Exception as e:
        logger.warning(f"detect_tech_stack error for {domain}: {e}")
        return {}

# ---------------- WordPress Detection (improved) ----------------
def detect_wordpress(domain: str) -> Dict[str, Any]:
    wp = {"Is WordPress": "No", "Version": "Not Detected", "Theme": "Not Detected", "Plugins": []}
    html, used = fetch_with_fallback(domain, "/", timeout=8)
    try:
        if not html:
            # still try wp-json endpoint
            rest_html, rest_used = fetch_with_fallback(domain, "/wp-json/", timeout=6)
            html = rest_html or html

        if not html:
            return wp

        html_low = html.lower()
        score = 0
        checks = {
            "wp-content": "wp-content" in html_low,
            "wp-includes": "wp-includes" in html_low,
            "wp-json": "/wp-json/" in html_low or '"wp/v2' in html_low,
            "wp-admin": "/wp-admin" in html_low,
            "xmlrpc": "xmlrpc.php" in html_low,
            "generator": "meta name=\"generator\" content=\"wordpress" in html_low
        }
        score = sum(1 for v in checks.values() if v)
        # check endpoints
        endpoint_hits = 0
        for ep in ["/wp-json/", "/wp-login.php", "/readme.html", "/wp-admin/", "/xmlrpc.php"]:
            _, url = fetch_with_fallback(domain, ep, timeout=6)
            if url:
                endpoint_hits += 1

        is_wp = score >= 2 or endpoint_hits >= 1
        if is_wp:
            wp["Is WordPress"] = "Yes"

            # 1) Try REST API for version: /wp-json/
            try:
                resp = session.get(f"https://{domain}/wp-json/", timeout=6, verify=False, allow_redirects=True)
                if resp.status_code < 400:
                    try:
                        js = resp.json()
                        if isinstance(js, dict):
                            # WP exposes "name" & "namespaces" but not always version.
                            if 'generator' in js:
                                wp["Version"] = js.get('generator') or wp["Version"]
                            # try classic WP: /wp-json/wp/v2
                            if 'wp/v2' in str(js):
                                wp["Version"] = wp["Version"] if wp["Version"] != "Not Detected" else "Detected via WP REST"
                    except Exception:
                        pass
            except Exception:
                pass

            # 2) Search meta generator or common version query strings in HTML
            version_patterns = [
                r'<meta name="generator" content="WordPress\s*([0-9\.]+)"',
                r'wp\-embed\.min\.js\?ver=([0-9\.]+)',
                r'wp-includes/js/wp-embed\.js\?ver=([0-9\.]+)',
                r'wordpress.*?([0-9]+\.[0-9]+\.[0-9]+)'
            ]
            for p in version_patterns:
                m = re.search(p, html, re.I)
                if m:
                    wp["Version"] = m.group(1)
                    break

            # 3) Theme detection via style.css or template
            theme_patterns = [r'/wp-content/themes/([^/]+)/', r'themes/([^/]+)/style\.css']
            for tp in theme_patterns:
                m = re.search(tp, html, re.I)
                if m:
                    theme = m.group(1).strip().replace('"', '').replace("'", "")
                    wp["Theme"] = theme.title()
                    break

            # 4) Plugin detection via common plugin filenames and known slugs
            possible_plugins = []
            common_plugins = {
                "Yoast SEO": r'yoast|wpseo',
                "WooCommerce": r'woocommerce|wc-',
                "Elementor": r'elementor',
                "Contact Form 7": r'contact-form-7|wpcf7',
                "Akismet": r'akismet',
                "Jetpack": r'jetpack',
                "Wordfence": r'wordfence',
                "All in One SEO": r'aioseo',
                "WP Rocket": r'wp-rocket',
            }
            for name, pat in common_plugins.items():
                if re.search(pat, html_low):
                    possible_plugins.append(name)
            # try readme.html for plugin hints
            readme_html, _ = fetch_with_fallback(domain, "/readme.html", timeout=5)
            if readme_html:
                for name, pat in common_plugins.items():
                    if re.search(pat, readme_html.lower()):
                        if name not in possible_plugins:
                            possible_plugins.append(name)

            wp["Plugins"] = possible_plugins[:15]
    except Exception as e:
        logger.warning(f"detect_wordpress error for {domain}: {e}")

    return wp

# ---------------- Ads & Tracking (improved) ----------------
AD_PATTERNS = {
    "Google Ads": [r"googlesyndication\.com", r"doubleclick\.net", r"googleadservices\.com", r"adsbygoogle", r"pagead2\.googlesyndication"],
    "Google AdSense": [r"pagead2\.googlesyndication\.com", r"adsense\.google\.com"],
    "Amazon Associates": [r"amazon-adsystem\.com", r"assoc-amazon\.com"],
    "Media.net": [r"media\.net", r"contextual\.media\.net"],
    "Propeller Ads": [r"propellerads\.com"],
    "Adsterra": [r"adsterra\.com"],
    "MonetizeMore": [r"monetizemore\.com"],
}

ANALYTICS_PATTERNS = {
    "Google Analytics": [r"google-analytics\.com", r"\bga\(", r"gtag\(", r"gtag/js", r"analytics.js"],
    "Google Tag Manager": [r"googletagmanager\.com/gtm\.js", r"googletagmanager\.com/ns\.html"],
    "Facebook Pixel": [r"connect\.facebook\.net", r"\bfbq\(", r"facebook\.com/tr\?"],
    "Microsoft Clarity": [r"clarity\.ms"],
    "Hotjar": [r"hotjar\.com"],
    "Mixpanel": [r"mixpanel\.com"],
    "Amplitude": [r"amplitude\.com"],
    "TikTok Pixel": [r"tiktok\.com/i18n/pixel"],
    "LinkedIn Insight Tag": [r"linkedin\.com/li\.js"],
}

SOCIAL_PIXELS = {
    "Facebook Pixel": r"facebook\.com/tr",
    "LinkedIn Insight Tag": r"linkedin\.com/li\.js",
    "Twitter Pixel": r"tpxl\.com",
    "Pinterest Tag": r"ct\.pinterest\.com",
    "TikTok Pixel": r"tiktok\.com/i18n/pixel",
}

def detect_ads(domain: str) -> Dict[str, Any]:
    res = {"ad_networks": [], "analytics_tools": [], "tracking_scripts": [], "social_media_pixels": []}
    try:
        html, _ = fetch_with_fallback(domain, "/", timeout=10)
        if not html:
            return {"error": "Unable to fetch site content"}
        soup = BeautifulSoup(html, "html.parser")

        candidates = []
        # gather script src and inline script bodies
        for s in soup.find_all("script"):
            src = s.get("src")
            if src:
                candidates.append(src)
            if s.string:
                # inline script body
                candidates.append(s.string[:5000])  # cap length

        # images and iframes
        for t in soup.find_all(["img", "iframe"]):
            if t.get("src"):
                candidates.append(t.get("src"))

        detected_ads = set()
        for name, pats in AD_PATTERNS.items():
            for p in pats:
                for c in candidates:
                    try:
                        if re.search(p, str(c), re.I):
                            detected_ads.add(name)
                            break
                    except Exception:
                        continue

        detected_analytics = set()
        for name, pats in ANALYTICS_PATTERNS.items():
            for p in pats:
                for c in candidates:
                    try:
                        if re.search(p, str(c), re.I):
                            detected_analytics.add(name)
                            break
                    except Exception:
                        continue

        detected_pixels = set()
        for name, p in SOCIAL_PIXELS.items():
            for c in candidates:
                try:
                    if re.search(p, str(c), re.I):
                        detected_pixels.add(name)
                        break
                except Exception:
                    continue

        res["ad_networks"] = sorted(list(detected_ads))
        res["analytics_tools"] = sorted(list(detected_analytics))
        res["social_media_pixels"] = sorted(list(detected_pixels))
        res["tracking_scripts"] = sorted(list(detected_ads | detected_analytics | detected_pixels))
    except Exception as e:
        logger.warning(f"detect_ads error for {domain}: {e}")
        res["error"] = str(e)
    return res

# ---------------- Security ----------------
def parse_cert_notAfter(notAfter: str) -> str:
    # try several formats
    fmts = [
        "%b %d %H:%M:%S %Y %Z",  # common from getpeercert
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y%m%d%H%M%SZ",
        "%Y-%m-%d %H:%M:%S"
    ]
    for f in fmts:
        try:
            d = datetime.strptime(notAfter, f)
            return d.strftime("%Y-%m-%d %H:%M:%S")
        except:
            continue
    # fallback
    return notAfter

def audit_security(domain: str) -> Dict[str, Any]:
    security = {
        "SSL Certificate": "Unknown",
        "SSL Expiry": "Unknown",
        "HSTS": "Not Found",
        "X-Frame-Options": "Not Found",
        "X-Content-Type-Options": "Not Found",
        "Content-Security-Policy": "Not Found",
        "Referrer-Policy": "Not Found",
        "TLS Version": "Unknown",
    }
    try:
        # SSL certificate via socket
        try:
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            with socket.create_connection((domain, 443), timeout=6) as sock:
                with ctx.wrap_socket(sock, server_hostname=domain) as ssock:
                    cert = ssock.getpeercert()
                    if cert:
                        security["SSL Certificate"] = "Valid"
                        not_after = cert.get("notAfter") or cert.get("not_after")
                        if not_after:
                            security["SSL Expiry"] = parse_cert_notAfter(not_after)
                        # TLS version
                        try:
                            tls = ssock.version()
                            security["TLS Version"] = tls
                        except Exception:
                            pass
        except Exception as e:
            logger.debug(f"SSL cert fetch issue for {domain}: {e}")
            security["SSL Certificate"] = "Unavailable"

        # headers
        html, used_url = fetch_with_fallback(domain, "/", timeout=7)
        headers = {}
        if used_url:
            try:
                r = session.get(used_url, timeout=7, verify=False, allow_redirects=True)
                headers = r.headers
            except Exception:
                pass

        header_map = {
            "Strict-Transport-Security": "HSTS",
            "X-Frame-Options": "X-Frame-Options",
            "X-Content-Type-Options": "X-Content-Type-Options",
            "Content-Security-Policy": "Content-Security-Policy",
            "Referrer-Policy": "Referrer-Policy",
        }
        for h, key in header_map.items():
            if headers.get(h):
                security[key] = f"Present ({headers.get(h)})"
            else:
                security[key] = "Not Found"
    except Exception as e:
        logger.warning(f"audit_security failed for {domain}: {e}")

    return security

# ---------------- Performance ----------------
def analyze_performance(domain: str) -> Dict[str, Any]:
    try:
        start = time.time()
        html, used = fetch_with_fallback(domain, "/", timeout=12)
        if not html:
            return {"Load Time": "Failed", "Page Size": "Unknown", "Score": "Unknown", "Status": "Failed"}
        load_time = time.time() - start
        size_kb = len(html.encode("utf-8")) / 1024
        if load_time < 1.0:
            score = "Excellent"
        elif load_time < 2.5:
            score = "Good"
        elif load_time < 4.0:
            score = "Average"
        else:
            score = "Poor"
        return {"Load Time": f"{load_time:.2f}s", "Page Size": f"{size_kb:.1f} KB", "Score": score, "Status": "OK"}
    except Exception as e:
        logger.debug(f"analyze_performance failed for {domain}: {e}")
        return {"Load Time": "Failed", "Page Size": "Unknown", "Score": "Unknown", "Status": "Unknown"}

# ---------------- Routes ----------------
@app.get("/")
def home():
    return {"message": "Domain Audit API", "version": "2.6", "status": "active"}

@app.get("/audit/{domain}")
def audit_domain(domain: str):
    start_time = time.time()
    domain = normalize_domain(domain)
    if not domain or len(domain) < 3:
        return JSONResponse({"error": "Invalid domain"}, status_code=400)
    try:
        mx = get_mx_records(domain)
        txt = get_txt_records(domain)
        results = {
            "Domain": domain,
            "Domain Info": get_whois_info(domain),
            "Hosting": get_hosting_info(domain),
            "Email Setup": {
                "Provider": detect_email_provider(mx, txt),
                "MX Records": mx or ["None"],
                "TXT Records": txt or ["None"],
                "Contact Emails": extract_emails(domain) or []
            },
            "Website Tech": detect_tech_stack(domain),
            "WordPress": detect_wordpress(domain),
            "Advertising": detect_ads(domain),
            "Security": audit_security(domain),
            "Performance": analyze_performance(domain),
            "Audit Date": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%SZ"),
            "Processing Time": f"{time.time() - start_time:.2f}s"
        }
        return JSONResponse(results)
    except Exception as e:
        logger.exception(f"Audit failed for {domain}: {e}")
        return JSONResponse({"error": f"Audit failed: {str(e)}"}, status_code=500)

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.get("/test/{domain}")
def test_domain(domain: str):
    domain = normalize_domain(domain)
    return {
        "domain": domain,
        "wordpress": detect_wordpress(domain),
        "ads": detect_ads(domain),
        "email": {"mx": get_mx_records(domain), "txt": get_txt_records(domain)}
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
