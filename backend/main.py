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
from typing import Dict, List, Any, Tuple, Optional
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

app = FastAPI(title="Domain Audit API", version="6.1 Enhanced")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

resolver = dns.resolver.Resolver()
resolver.nameservers = ["8.8.8.8", "1.1.1.1", "8.8.4.4", "1.0.0.1"]
resolver.timeout = 8
resolver.lifetime = 15

session = requests.Session()
retries = Retry(total=2, backoff_factor=1.0, status_forcelist=[500, 502, 503, 504])
session.mount("http://", HTTPAdapter(max_retries=retries))
session.mount("https://", HTTPAdapter(max_retries=retries))


# ============================================================
# 🧩 Core Helpers
# ============================================================

def normalize_domain(domain: str) -> str:
    domain = re.sub(r"^https?://", "", domain.strip().lower())
    domain = re.sub(r"^www\.", "", domain)
    domain = re.sub(r"/.*$", "", domain)
    return domain.split(':')[0]


def fetch_with_fallback(domain: str, path: str = "/", timeout: int = 12) -> Tuple[str, str, Dict]:
    user_agents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ]
    
    for proto in ("https", "http"):
        url = f"{proto}://{domain}{path}"
        for user_agent in user_agents:
            try:
                headers = {
                    'User-Agent': user_agent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                }
                resp = session.get(url, headers=headers, timeout=timeout, verify=False, allow_redirects=True)
                if resp.status_code == 200 and len(resp.text) > 1000:
                    return resp.text, url, dict(resp.headers)
            except Exception:
                continue
    return "", "", {}


# ============================================================
# 🧠 WHOIS Info
# ============================================================

def get_whois_info(domain: str) -> Dict[str, Any]:
    info = {}
    try:
        w = whois.whois(domain)
        if w.registrar:
            info["Registrar"] = w.registrar

        def get_safe_date(date_val):
            if not date_val:
                return None
            if isinstance(date_val, list):
                date_val = date_val[0]
            if isinstance(date_val, datetime):
                return date_val.strftime("%Y-%m-%d")
            try:
                return datetime.strptime(str(date_val), '%Y-%m-%d').strftime('%Y-%m-%d')
            except:
                return None

        created = get_safe_date(w.creation_date)
        if created:
            info["Created"] = created
            
        expiry = get_safe_date(w.expiration_date)
        if expiry:
            info["Expiry"] = expiry
        
        nameservers = getattr(w, "name_servers", []) or []
        if nameservers and nameservers[0] is not None:
            clean_ns = [ns.rstrip('.').upper() for ns in nameservers if ns and ns != "None"]
            if clean_ns:
                info["Nameservers"] = clean_ns
    except Exception as e:
        logger.debug(f"WHOIS failed for {domain}: {e}")
    
    return info


# ============================================================
# ☁️ Hosting Detection (Accurate)
# ============================================================

def detect_hosting_provider(ip: str, server: str = "", nameservers: List[str] = None) -> Optional[str]:
    """Return hosting provider with higher accuracy using known patterns and reverse DNS."""
    if not ip:
        return None

    server_lower = server.lower() if server else ""
    ns_str = " ".join(nameservers).lower() if nameservers else ""

    patterns = {
        "cloudflare": "Cloudflare",
        "aws": "Amazon Web Services (AWS)",
        "amazon": "Amazon Web Services (AWS)",
        "ec2": "Amazon EC2",
        "google": "Google Cloud",
        "gws": "Google Cloud",
        "azure": "Microsoft Azure",
        "microsoft": "Microsoft Azure",
        "digitalocean": "DigitalOcean",
        "siteground": "SiteGround",
        "godaddy": "GoDaddy",
        "bluehost": "Bluehost",
        "ovh": "OVHcloud",
        "hostgator": "HostGator",
        "linode": "Linode",
        "akamai": "Akamai",
        "netlify": "Netlify",
        "vercel": "Vercel",
        "wix": "Wix",
        "squarespace": "Squarespace",
        "shopify": "Shopify",
    }

    all_text = " ".join([server_lower, ns_str])
    for key, provider in patterns.items():
        if key in all_text:
            return provider

    try:
        rev = socket.gethostbyaddr(ip)[0].lower()
        for key, provider in patterns.items():
            if key in rev:
                return provider
    except Exception:
        pass

    return "Unknown Provider"


def get_hosting_info(domain: str, nameservers: List[str] = None) -> Dict[str, Any]:
    data = {}
    try:
        try:
            ip = str(resolver.resolve(domain, "A")[0])
            data["IP Address"] = ip
        except:
            try:
                ip = socket.gethostbyname(domain)
                data["IP Address"] = ip
            except:
                ip = None
        
        html, url, headers = fetch_with_fallback(domain)
        if headers:
            server = headers.get("Server", "")
            if server:
                server = re.sub(r'\([^)]*\)', '', server).strip()
                server = server.split('/')[0] if '/' in server else server
                data["Server"] = server
        
        provider = detect_hosting_provider(ip, data.get("Server"), nameservers)
        if provider:
            data["Provider"] = provider
    except Exception as e:
        logger.debug(f"Hosting lookup failed: {e}")
    
    return data


# ============================================================
# 📧 Email Detection
# ============================================================

def get_mx(domain: str) -> List[str]:
    try:
        mx_records = [str(r.exchange).rstrip(".").lower() for r in resolver.resolve(domain, "MX")]
        return mx_records if mx_records else []
    except:
        return []


def detect_email_provider(mx: List[str]) -> Optional[str]:
    if not mx:
        return None
    mx_str = " ".join(mx).lower()
    if "google.com" in mx_str or "aspmx.l.google.com" in mx_str:
        return "Google Workspace"
    if "outlook.com" in mx_str or "protection.outlook.com" in mx_str:
        return "Microsoft 365"
    if "zoho.com" in mx_str:
        return "Zoho Mail"
    if "protonmail.com" in mx_str:
        return "ProtonMail"
    return "Custom Email Service"


# ============================================================
# ⚙️ Technology Detection
# ============================================================

def detect_tech(domain: str) -> Dict[str, List[str]]:
    tech = {}
    try:
        builtwith_result = builtwith.parse(f"https://{domain}")
        for category, technologies in builtwith_result.items():
            if technologies:
                tech[category] = list(set(technologies))
    except Exception:
        pass
    
    html, _, _ = fetch_with_fallback(domain)
    if not html:
        return tech
    
    html_lower = html.lower()
    if "react" in html_lower and ("react." in html_lower or "/react/" in html_lower):
        tech.setdefault("javascript-frameworks", []).append("React")
    if "vue" in html_lower and ("vue.js" in html_lower or "vue/" in html_lower):
        tech.setdefault("javascript-frameworks", []).append("Vue.js")
    if "jquery" in html_lower and ("jquery" in html_lower or "/jquery/" in html_lower):
        tech.setdefault("javascript-frameworks", []).append("jQuery")
    
    return tech


# ============================================================
# 📰 WordPress Detection (Predicted)
# ============================================================

def get_verified_wordpress_theme(domain: str, html: str) -> Optional[str]:
    if not html:
        return None

    theme_slug = None
    match = re.search(r'/wp-content/themes/([^/]+)/', html, re.IGNORECASE)
    if match:
        theme_slug = match.group(1)

    if theme_slug:
        for style_url in [f"/wp-content/themes/{theme_slug}/style.css"]:
            css_content, _, _ = fetch_with_fallback(domain, style_url, 6)
            if css_content:
                theme_name_match = re.search(r'Theme Name:\s*(.+)', css_content, re.IGNORECASE)
                if theme_name_match:
                    return theme_name_match.group(1).strip()
        return theme_slug.replace("-", " ").title()

    return None


def get_verified_wordpress_version(html: str) -> Optional[str]:
    if not html:
        return None
    soup = BeautifulSoup(html, 'html.parser')
    gen = soup.find('meta', attrs={'name': 'generator'})
    if gen and 'wordpress' in gen.get('content', '').lower():
        m = re.search(r'wordpress\s*([\d.]+)', gen.get('content', ''), re.IGNORECASE)
        if m:
            return f"WordPress {m.group(1)}"

    match = re.search(r'\?ver=([0-9]+\.[0-9]+(\.[0-9]+)?)', html)
    if match:
        return f"WordPress {match.group(1)} (Predicted)"

    return "WordPress (Detected)"


def detect_wordpress(domain: str) -> Dict[str, Any]:
    wp_info = {}
    html, _, _ = fetch_with_fallback(domain)
    if not html:
        return wp_info

    html_lower = html.lower()
    wp_indicators = ["wp-content", "wp-includes", "wordpress", "/wp-json/"]
    wp_count = sum(1 for indicator in wp_indicators if indicator in html_lower)
    if wp_count < 2:
        return wp_info

    wp_info["Detected"] = "Yes"
    version = get_verified_wordpress_version(html)
    if version:
        wp_info["Version"] = version
    theme = get_verified_wordpress_theme(domain, html)
    if theme:
        wp_info["Theme"] = theme

    plugin_matches = re.findall(r'/wp-content/plugins/([^/"]+)/', html_lower)
    if plugin_matches:
        wp_info["Plugins"] = sorted(list(set([p.replace("-", " ").title() for p in plugin_matches])))

    return wp_info


# ============================================================
# 🔒 Security Audit
# ============================================================

def audit_security(domain: str) -> Dict[str, Any]:
    sec = {}
    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((domain, 443), timeout=10) as sock:
            with ctx.wrap_socket(sock, server_hostname=domain) as ssock:
                cert = ssock.getpeercert()
                if cert:
                    sec["SSL"] = "Valid"
                    sec["TLS"] = ssock.version()
                    if "notAfter" in cert:
                        expiry_date = datetime.strptime(cert["notAfter"], '%b %d %H:%M:%S %Y %Z')
                        days_until_expiry = (expiry_date - datetime.utcnow()).days
                        sec["Expires"] = f"{expiry_date.strftime('%Y-%m-%d')} ({days_until_expiry} days)"
    except Exception:
        sec["SSL"] = "Invalid"
    
    html, _, headers = fetch_with_fallback(domain)
    if headers:
        security_headers = []
        headers_lower = {k.lower(): v for k, v in headers.items()}
        if "strict-transport-security" in headers_lower:
            security_headers.append("HSTS")
        if "content-security-policy" in headers_lower:
            security_headers.append("CSP")
        if "x-frame-options" in headers_lower:
            security_headers.append("X-Frame-Options")
        if security_headers:
            sec["Security Headers"] = security_headers
    
    return sec


# ============================================================
# 🚀 Performance
# ============================================================

def analyze_performance(domain: str) -> Dict[str, Any]:
    start = time.time()
    html, url, headers = fetch_with_fallback(domain)
    if not html:
        return {"Status": "Failed to load"}
    load_time = round(time.time() - start, 2)
    size = len(html.encode()) / 1024
    perf = {
        "Load Time": f"{load_time}s",
        "Page Size": f"{size:.1f} KB"
    }
    if load_time < 1.0:
        perf["Rating"] = "Excellent"
    elif load_time < 2.0:
        perf["Rating"] = "Good"
    elif load_time < 3.0:
        perf["Rating"] = "Average"
    else:
        perf["Rating"] = "Slow"
    return perf


# ============================================================
# 🧩 Parallel Execution
# ============================================================

def run_parallel(domain: str):
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
        whois_future = ex.submit(get_whois_info, domain)
        whois_info = whois_future.result(timeout=20)
        nameservers = whois_info.get("Nameservers", [])
        
        futures = {
            "whois": whois_future,
            "hosting": ex.submit(get_hosting_info, domain, nameservers),
            "mx": ex.submit(get_mx, domain),
            "tech": ex.submit(detect_tech, domain),
            "wp": ex.submit(detect_wordpress, domain),
            "security": ex.submit(audit_security, domain),
            "perf": ex.submit(analyze_performance, domain),
        }
        
        results = {}
        for k, f in futures.items():
            try:
                result = f.result(timeout=25)
                if result:
                    results[k] = result
            except Exception as e:
                logger.debug(f"Task {k} failed: {e}")
    
    final_results = {}
    if results.get("whois"):
        final_results["Domain Info"] = results["whois"]
    if results.get("hosting"):
        final_results["Hosting"] = results["hosting"]
    mx_records = results.get("mx", [])
    if mx_records:
        email_info = {"MX Records": mx_records}
        provider = detect_email_provider(mx_records)
        if provider:
            email_info["Provider"] = provider
        final_results["Email"] = email_info
    if results.get("tech"):
        final_results["Technology"] = results["tech"]
    if results.get("wp"):
        final_results["WordPress"] = results["wp"]
    if results.get("security"):
        final_results["Security"] = results["security"]
    if results.get("perf"):
        final_results["Performance"] = results["perf"]
    
    return final_results


# ============================================================
# 🌐 Routes
# ============================================================

@app.get("/")
def home():
    return {
        "message": "Domain Audit API v6.1 Enhanced",
        "status": "running",
        "version": "6.1",
        "accuracy": "verified & predicted data"
    }


@app.get("/audit/{domain}")
def audit(domain: str):
    start = time.time()
    d = normalize_domain(domain)
    if len(d) < 3 or not re.match(r'^[a-z0-9.-]+\.[a-z]{2,}$', d):
        return JSONResponse({"error": "Invalid domain format"}, status_code=400)
    try:
        logger.info(f"Starting audit for: {d}")
        data = run_parallel(d)
        processing_time = time.time() - start
        result = {
            "Domain": d,
            "Audit Time": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "Processing Time": f"{processing_time:.2f}s",
            "Results": data,
        }
        logger.info(f"Audit completed for {d} in {processing_time:.2f}s")
        return JSONResponse(result)
    except Exception as e:
        logger.exception(f"Audit failed for {domain}: {e}")
        return JSONResponse({
            "error": "Domain audit failed. Please try again.",
            "domain": domain
        }, status_code=500)


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "Domain Audit API v6.1"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
