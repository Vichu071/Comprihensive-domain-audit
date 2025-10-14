# main.py
import re
import ssl
import socket
import time
import logging
import builtwith
import whois
import dns.resolver
from datetime import datetime
from typing import Dict, Any, List, Tuple
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from bs4 import BeautifulSoup
import aiohttp
import asyncio

# ---------------- Logging ----------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("domain-audit")

# ---------------- FastAPI ----------------
app = FastAPI(title="Domain Audit API", version="3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- DNS Resolver ----------------
resolver = dns.resolver.Resolver()
resolver.nameservers = ["8.8.8.8", "1.1.1.1", "8.8.4.4", "1.0.0.1"]
resolver.timeout = 5
resolver.lifetime = 8

# ---------------- Helpers ----------------
def normalize_domain(domain: str) -> str:
    domain = domain.strip().lower()
    domain = re.sub(r"^https?://", "", domain)
    domain = re.sub(r"^www\.", "", domain)
    domain = re.sub(r"/.*$", "", domain)
    return domain

async def fetch(session: aiohttp.ClientSession, url: str, timeout: int = 10) -> str:
    try:
        async with session.get(url, ssl=False, timeout=timeout) as resp:
            if resp.status < 400:
                return await resp.text()
    except Exception as e:
        logger.debug(f"fetch failed {url}: {e}")
    return ""

async def fetch_with_fallback(session: aiohttp.ClientSession, domain: str, path: str = "/") -> Tuple[str, str]:
    urls = [f"https://{domain}{path}", f"http://{domain}{path}"]
    for url in urls:
        html = await fetch(session, url)
        if html:
            return html, url
    return "", ""

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
            if hasattr(d, "strftime"):
                return d.strftime("%Y-%m-%d")
            return str(d)
        return {
            "Registrar": getattr(w, "registrar", "Unknown") or "Unknown",
            "Created Date": fmt(getattr(w, "creation_date", None)),
            "Expiry Date": fmt(getattr(w, "expiration_date", None)),
            "Name Servers": getattr(w, "name_servers", ["Unknown"]) or ["Unknown"],
            "Updated Date": fmt(getattr(w, "updated_date", None)),
        }
    except Exception as e:
        logger.warning(f"whois lookup failed: {e}")
        return default

# ---------------- Hosting ----------------
def get_hosting_info(domain: str) -> Dict[str, Any]:
    info = {"IP Address": "Unknown", "Server": "Unknown", "Powered By": "Unknown", "Hosting Provider": "Unknown", "Resolver": "Unknown"}
    try:
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
    except Exception as e:
        logger.warning(f"hosting info failed: {e}")
    return info

# ---------------- Email ----------------
def get_mx_records(domain: str) -> List[str]:
    try:
        mx_records = []
        answers = resolver.resolve(domain, 'MX')
        for r in answers:
            mx_records.append(str(r.exchange).rstrip("."))
        return mx_records
    except:
        return []

def get_txt_records(domain: str) -> List[str]:
    try:
        txts = []
        answers = resolver.resolve(domain, 'TXT')
        for r in answers:
            txts.append("".join([t.decode('utf-8') if isinstance(t, bytes) else str(t) for t in r.strings]))
        return txts
    except:
        return []

def detect_email_provider(mx_records: List[str], txt_records: List[str]) -> str:
    indicators = []
    for mx in mx_records:
        m = mx.lower()
        if "google" in m:
            indicators.append("Google Workspace")
        elif "outlook" in m:
            indicators.append("Microsoft 365")
        elif "zoho" in m:
            indicators.append("Zoho Mail")
    for t in txt_records:
        tl = t.lower()
        if "google-site-verification" in tl:
            indicators.append("Google Workspace")
        if "zoho" in tl:
            indicators.append("Zoho Mail")
    from collections import Counter
    if indicators:
        return Counter(indicators).most_common(1)[0][0]
    if mx_records:
        return "Custom Email Provider"
    return "No Email Service Detected"

async def extract_emails(session: aiohttp.ClientSession, domain: str) -> List[str]:
    pages = ["/", "/contact", "/contact-us", "/about", "/about-us"]
    emails = set()
    pattern = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
    for p in pages:
        html, _ = await fetch_with_fallback(session, domain, p)
        if not html:
            continue
        for m in pattern.findall(html):
            emails.add(m)
        try:
            soup = BeautifulSoup(html, "html.parser")
            for a in soup.select('a[href^=mailto]'):
                mail = a.get('href').split(':', 1)[-1]
                if mail:
                    emails.add(mail)
        except:
            pass
    domain_emails = [e for e in emails if normalize_domain(e.split('@')[-1]) == domain]
    return domain_emails[:10] if domain_emails else list(emails)[:10]

# ---------------- Technology ----------------
def detect_tech_stack(domain: str) -> Dict[str, List[str]]:
    tech = {}
    try:
        bw = builtwith.parse(f"https://{domain}")
        if bw:
            tech.update(bw)
    except:
        pass
    return tech

# ---------------- WordPress ----------------
async def detect_wordpress(session: aiohttp.ClientSession, domain: str) -> Dict[str, Any]:
    wp = {"Is WordPress": "No", "Version": "Not Detected", "Theme": "Not Detected", "Plugins": []}
    html, _ = await fetch_with_fallback(session, domain)
    if not html:
        return wp
    html_low = html.lower()
    if "wp-content" in html_low or "/wp-json/" in html_low:
        wp["Is WordPress"] = "Yes"
        # version detection
        m = re.search(r'<meta name="generator" content="WordPress\s*([0-9\.]+)"', html, re.I)
        if m:
            wp["Version"] = m.group(1)
        # theme
        m2 = re.search(r'/wp-content/themes/([^/]+)/', html, re.I)
        if m2:
            wp["Theme"] = m2.group(1).title()
        # plugins
        plugins = []
        for name, pat in {"Yoast SEO":"yoast","WooCommerce":"woocommerce","Elementor":"elementor"}.items():
            if re.search(pat, html_low):
                plugins.append(name)
        wp["Plugins"] = plugins
    return wp

# ---------------- Ads / Tracking ----------------
AD_PATTERNS = {
    "Google Ads": [r"googlesyndication\.com", r"doubleclick\.net"],
    "Amazon Associates": [r"amazon-adsystem\.com"],
}
ANALYTICS_PATTERNS = {
    "Google Analytics": [r"google-analytics\.com", r"gtag\("],
}

async def detect_ads(session: aiohttp.ClientSession, domain: str) -> Dict[str, Any]:
    html, _ = await fetch_with_fallback(session, domain)
    if not html:
        return {}
    soup = BeautifulSoup(html, "html.parser")
    candidates = [s.get("src") for s in soup.find_all("script") if s.get("src")] + \
                 [s.string[:5000] for s in soup.find_all("script") if s.string]
    detected_ads = set()
    for name, pats in AD_PATTERNS.items():
        for pat in pats:
            for c in candidates:
                if re.search(pat, str(c), re.I):
                    detected_ads.add(name)
    detected_analytics = set()
    for name, pats in ANALYTICS_PATTERNS.items():
        for pat in pats:
            for c in candidates:
                if re.search(pat, str(c), re.I):
                    detected_analytics.add(name)
    return {"ad_networks": list(detected_ads), "analytics_tools": list(detected_analytics)}

# ---------------- Performance ----------------
async def analyze_performance(session: aiohttp.ClientSession, domain: str) -> Dict[str, Any]:
    start = time.time()
    html, _ = await fetch_with_fallback(session, domain)
    if not html:
        return {"Load Time": "Failed"}
    load_time = time.time() - start
    size_kb = len(html.encode("utf-8")) / 1024
    score = "Excellent" if load_time < 1.0 else "Good" if load_time < 2.5 else "Average" if load_time < 4.0 else "Poor"
    return {"Load Time": f"{load_time:.2f}s", "Page Size": f"{size_kb:.1f} KB", "Score": score}

# ---------------- Routes ----------------
@app.get("/")
def home():
    return {"message": "Domain Audit API Async", "version": "3.0"}

@app.get("/audit/{domain}")
async def audit_domain(domain: str):
    domain = normalize_domain(domain)
    async with aiohttp.ClientSession() as session:
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
                "Contact Emails": await extract_emails(session, domain)
            },
            "Website Tech": detect_tech_stack(domain),
            "WordPress": await detect_wordpress(session, domain),
            "Advertising": await detect_ads(session, domain),
            "Performance": await analyze_performance(session, domain),
            "Audit Date": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%SZ"),
        }
        return JSONResponse(results)

# ---------------- Health ----------------
@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
