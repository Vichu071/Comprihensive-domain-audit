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

# ============================================================
# ⚙️ Setup & Config
# ============================================================

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("domain-audit")

app = FastAPI(title="Domain Audit API", version="3.1 Stable")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

resolver = dns.resolver.Resolver()
resolver.nameservers = ["8.8.8.8", "1.1.1.1"]
resolver.timeout = 4
resolver.lifetime = 8

session = requests.Session()
retries = Retry(total=3, backoff_factor=0.7, status_forcelist=[500, 502, 503, 504])
session.mount("http://", HTTPAdapter(max_retries=retries))
session.mount("https://", HTTPAdapter(max_retries=retries))


# ============================================================
# 🧩 Helpers
# ============================================================

def normalize_domain(domain: str) -> str:
    d = re.sub(r"^https?://", "", domain.strip().lower())
    d = re.sub(r"^www\.", "", d)
    return re.sub(r"/.*$", "", d)


def fetch_with_fallback(domain: str, path: str = "/", timeout: int = 10) -> Tuple[str, str]:
    """Fetch page HTML from https/http with fallback."""
    for proto in ("https", "http"):
        url = f"{proto}://{domain}{path}"
        try:
            resp = session.get(url, timeout=timeout, verify=False, allow_redirects=True)
            if resp.status_code < 400 and len(resp.text) > 100:
                return resp.text, url
        except Exception:
            continue
    return "", ""


def safe_head(domain: str, timeout: int = 6):
    """Return headers safely."""
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
        c = w.creation_date
        if isinstance(c, list): c = c[0]
        if isinstance(c, datetime): c = c.strftime("%Y-%m-%d")
        e = w.expiration_date
        if isinstance(e, list): e = e[0]
        if isinstance(e, datetime): e = e.strftime("%Y-%m-%d")
        info["Created"] = c or "Unknown"
        info["Expiry"] = e or "Unknown"
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
    match = re.search(r'content="WordPress\s*([\d\.]+)"', html, re.I)
    if match:
        wp["Version"] = match.group(1)
    theme = re.search(r'/wp-content/themes/([^/"]+)/', html)
    if theme:
        wp["Theme"] = theme.group(1).title()
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
            wp["Plugins"].append(name)
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
    except Exception as e:
        sec["SSL"] = "Unavailable"
        logger.debug(f"SSL error: {e}")
    headers = safe_head(domain)
    lower_headers = [h.lower() for h in headers]
    if "strict-transport-security" in lower_headers:
        sec["HSTS"] = "Yes"
    if "content-security-policy" in lower_headers:
        sec["CSP"] = "Yes"
    return sec


# ============================================================
# 🚀 Performance
# ============================================================

def analyze_performance(domain: str):
    start = time.time()
    html, url = fetch_with_fallback(domain)
    if not html:
        return {"Status": "Failed", "Load Time": "-", "Size": "-", "Score": "Poor", "URL": "-"}
    load_time = round(time.time() - start, 2)
    size = len(html.encode()) / 1024
    score = "Excellent" if load_time < 1 else "Good" if load_time < 2 else "Average" if load_time < 4 else "Poor"
    return {"Status": "OK", "Load Time": f"{load_time}s", "Size": f"{size:.1f}KB", "Score": score, "URL": url}


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
        results = {}
        for k, f in futures.items():
            try:
                results[k] = f.result(timeout=20)
            except Exception as e:
                results[k] = {"error": str(e)}

    email_provider = detect_email_provider(results.get("mx", []), results.get("txt", []))
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
    return {"message": "Domain Audit API v3.1", "status": "running"}


@app.get("/audit/{domain}")
def audit(domain: str):
    start = time.time()
    d = normalize_domain(domain)
    if len(d) < 3:
        return JSONResponse({"error": "Invalid domain"}, status_code=400)
    try:
        data = run_parallel(d)
        result = {
            "Domain": d,
            "Audit Time": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%SZ"),
            "Processing Time": f"{time.time() - start:.2f}s",
            "Results": data,
        }
        return JSONResponse(result)
    except Exception as e:
        logger.exception(f"Audit failed: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
