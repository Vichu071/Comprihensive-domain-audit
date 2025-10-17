from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import dns.resolver
import whois
import requests
from bs4 import BeautifulSoup
import builtwith
import re
import logging
from requests.adapters import HTTPAdapter, Retry
import ssl
import socket
from typing import Dict, List, Any, Tuple
import time
import urllib3
from datetime import datetime
import concurrent.futures
from collections import Counter

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("domain-audit")

# --- App setup ---
app = FastAPI(title="Domain Audit API", version="2.7 (optimized)")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DNS Resolver ---
resolver = dns.resolver.Resolver()
resolver.nameservers = ["8.8.8.8", "1.1.1.1"]
resolver.timeout = 4
resolver.lifetime = 8

# --- HTTP Session ---
session = requests.Session()
retries = Retry(total=3, backoff_factor=0.7, status_forcelist=[500, 502, 503, 504])
session.mount("http://", HTTPAdapter(max_retries=retries))
session.mount("https://", HTTPAdapter(max_retries=retries))

# ============================================================
# 🧩 Utility Helpers
# ============================================================

def normalize_domain(domain: str) -> str:
    d = re.sub(r"^https?://", "", domain.strip().lower())
    d = re.sub(r"^www\.", "", d)
    return re.sub(r"/.*$", "", d)

def fetch_with_fallback(domain: str, path: str = "/", timeout: int = 10) -> Tuple[str, str]:
    """Fetch HTTPS → fallback HTTP."""
    for proto in ("https", "http"):
        url = f"{proto}://{domain}{path}"
        try:
            resp = session.get(url, timeout=timeout, verify=False, allow_redirects=True)
            if resp.status_code < 400 and len(resp.text) > 200:
                return resp.text, url
        except Exception:
            continue
    return "", ""

def safe_head(domain: str, timeout: int = 6):
    """Fetch headers quickly with HEAD/GET fallback"""
    for proto in ("https", "http"):
        try:
            r = session.head(f"{proto}://{domain}", timeout=timeout, verify=False)
            if r.status_code < 400:
                return r.headers
        except:
            continue
    try:
        r = session.get(f"http://{domain}", timeout=timeout, verify=False)
        return r.headers
    except:
        return {}

# ============================================================
# 🧠 WHOIS INFO
# ============================================================

def get_whois_info(domain: str) -> Dict[str, Any]:
    info = {"Registrar": "Unknown", "Created": "Unknown", "Expiry": "Unknown", "Nameservers": []}
    try:
        w = whois.whois(domain)
        info["Registrar"] = w.registrar or "Unknown"
        c = w.creation_date[0] if isinstance(w.creation_date, list) else w.creation_date
        e = w.expiration_date[0] if isinstance(w.expiration_date, list) else w.expiration_date
        info["Created"] = str(c)[:10] if c else "Unknown"
        info["Expiry"] = str(e)[:10] if e else "Unknown"
        info["Nameservers"] = [ns for ns in getattr(w, "name_servers", []) if ns] or ["Unknown"]
    except Exception as e:
        logger.debug(f"WHOIS failed for {domain}: {e}")
    return info

# ============================================================
# ☁️ Hosting Info
# ============================================================

def detect_hosting_provider(ip: str, server: str = "") -> str:
    if not ip:
        return "Unknown"
    try:
        if ip.startswith(("104.", "172.", "173.")):
            return "Cloudflare"
        if "aws" in server or re.search(r"amazonaws|ec2", server, re.I):
            return "AWS"
        if re.search(r"azure|microsoft", server, re.I):
            return "Microsoft Azure"
        if re.search(r"google|1e100.net", server, re.I):
            return "Google Cloud"
        if re.search(r"digitalocean", server, re.I):
            return "DigitalOcean"
        if re.search(r"ovh", server, re.I):
            return "OVH"
    except:
        pass
    return "Generic Hosting"

def get_hosting_info(domain: str) -> Dict[str, Any]:
    data = {"IP": "Unknown", "Server": "Unknown", "Provider": "Unknown"}
    try:
        try:
            ip = str(resolver.resolve(domain, "A")[0])
        except:
            ip = socket.gethostbyname(domain)
        data["IP"] = ip
        headers = safe_head(domain)
        server = headers.get("Server", "")
        data["Server"] = server or "Unknown"
        data["Provider"] = detect_hosting_provider(ip, server)
    except Exception as e:
        logger.debug(f"Hosting lookup failed: {e}")
    return data

# ============================================================
# 📧 Email Detection
# ============================================================

def get_mx(domain: str):
    try:
        return [str(r.exchange).rstrip(".") for r in resolver.resolve(domain, "MX")]
    except:
        return []

def get_txt(domain: str):
    try:
        recs = []
        for r in resolver.resolve(domain, "TXT"):
            recs.append("".join([t.decode() if isinstance(t, bytes) else str(t) for t in r.strings]))
        return recs
    except:
        return []

def detect_email_provider(mx: List[str], txt: List[str]) -> str:
    joined = " ".join(mx + txt).lower()
    if "google.com" in joined or "aspmx.l.google.com" in joined:
        return "Google Workspace"
    if "outlook" in joined or "protection.outlook.com" in joined:
        return "Microsoft 365"
    if "zoho" in joined:
        return "Zoho Mail"
    if "protonmail" in joined:
        return "ProtonMail"
    if mx:
        return "Custom Email Provider"
    return "No Email Service"

# ============================================================
# ⚙️ Technology Detection
# ============================================================

def detect_tech(domain: str):
    tech = {}
    try:
        tech = builtwith.parse(f"https://{domain}")
    except:
        pass
    html, _ = fetch_with_fallback(domain)
    if not html:
        return tech
    html = html.lower()
    if "react" in html:
        tech.setdefault("javascript-frameworks", []).append("React")
    if "vue.js" in html:
        tech.setdefault("javascript-frameworks", []).append("Vue.js")
    if "angular" in html:
        tech.setdefault("javascript-frameworks", []).append("Angular")
    if "wp-content" in html:
        tech.setdefault("cms", []).append("WordPress")
    if "shopify" in html:
        tech.setdefault("ecommerce", []).append("Shopify")
    return tech

# ============================================================
# 📰 WordPress Detection
# ============================================================

def detect_wordpress(domain: str):
    wp = {"Is WordPress": "No", "Version": "Unknown", "Theme": "Unknown", "Plugins": []}
    html, _ = fetch_with_fallback(domain)
    if not html or "wp-content" not in html.lower():
        return wp
    wp["Is WordPress"] = "Yes"
    # Version
    match = re.search(r'content="WordPress\s*([\d\.]+)"', html, re.I)
    if match:
        wp["Version"] = match.group(1)
    # Theme
    theme = re.search(r'/wp-content/themes/([^/"]+)/', html)
    if theme:
        wp["Theme"] = theme.group(1).title()
    # Plugins
    plugins = []
    for name, key in {
        "Yoast SEO": "yoast",
        "WooCommerce": "woocommerce",
        "Elementor": "elementor",
        "Contact Form 7": "contact-form-7",
        "Jetpack": "jetpack",
        "WP Rocket": "wp-rocket",
        "WP Super Cache": "wp-super-cache",
    }.items():
        if key in html:
            plugins.append(name)
    wp["Plugins"] = plugins
    return wp

# ============================================================
# 🔒 Security
# ============================================================

def audit_security(domain: str):
    sec = {"SSL": "Unknown", "TLS": "Unknown", "Expiry": "Unknown", "HSTS": "No", "CSP": "No"}
    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((domain, 443), timeout=5) as sock:
            with ctx.wrap_socket(sock, server_hostname=domain) as ssock:
                cert = ssock.getpeercert()
                if cert:
                    sec["SSL"] = "Valid"
                    sec["Expiry"] = cert.get("notAfter", "")
                    sec["TLS"] = ssock.version()
    except:
        sec["SSL"] = "Unavailable"

    # Security headers
    headers = safe_head(domain)
    if "strict-transport-security" in [h.lower() for h in headers]:
        sec["HSTS"] = "Yes"
    if "content-security-policy" in [h.lower() for h in headers]:
        sec["CSP"] = "Yes"
    return sec

# ============================================================
# 🚀 Performance
# ============================================================

def analyze_performance(domain: str):
    start = time.time()
    html, url = fetch_with_fallback(domain)
    if not html:
        return {"Status": "Failed"}
    load_time = round(time.time() - start, 2)
    size = len(html.encode()) / 1024
    score = "Excellent" if load_time < 1 else "Good" if load_time < 2 else "Average" if load_time < 4 else "Poor"
    return {"Load Time": f"{load_time}s", "Size": f"{size:.1f}KB", "Score": score, "URL": url}

# ============================================================
# 🧩 Parallel Execution
# ============================================================

def run_parallel(domain: str):
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
        futures = {
            "whois": ex.submit(get_whois_info, domain),
            "hosting": ex.submit(get_hosting_info, domain),
            "mx": ex.submit(get_mx, domain),
            "txt": ex.submit(get_txt, domain),
            "tech": ex.submit(detect_tech, domain),
            "wp": ex.submit(detect_wordpress, domain),
            "security": ex.submit(audit_security, domain),
            "perf": ex.submit(analyze_performance, domain),
        }
        results = {k: f.result() for k, f in futures.items()}

    email_provider = detect_email_provider(results["mx"], results["txt"])
    return {
        "Domain Info": results["whois"],
        "Hosting": results["hosting"],
        "Email": {"Provider": email_provider, "MX": results["mx"], "TXT": results["txt"]},
        "Tech Stack": results["tech"],
        "WordPress": results["wp"],
        "Security": results["security"],
        "Performance": results["perf"],
    }

# ============================================================
# 🌐 Routes
# ============================================================

@app.get("/")
def home():
    return {"message": "Domain Audit API v2.7 Optimized", "status": "running"}

@app.get("/audit/{domain}")
def audit(domain: str):
    start = time.time()
    d = normalize_domain(domain)
    if len(d) < 3:
        return JSONResponse({"error": "Invalid domain"}, status_code=400)
    try:
        data = run_parallel(d)
        data["Domain"] = d
        data["Audit Time"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%SZ")
        data["Processing Time"] = f"{time.time() - start:.2f}s"
        return JSONResponse(data)
    except Exception as e:
        logger.exception(f"Audit failed: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
