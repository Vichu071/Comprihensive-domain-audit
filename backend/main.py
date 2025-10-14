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
from collections import Counter

# ---------------------- Basic Setup ----------------------
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("domain-audit")

app = FastAPI(title="Domain Audit API", version="2.5")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

# ---------------------- DNS Resolver ----------------------
resolver = dns.resolver.Resolver()
resolver.nameservers = ["8.8.8.8", "1.1.1.1", "8.8.4.4", "1.0.0.1"]
resolver.timeout = 10
resolver.lifetime = 10

# ---------------------- Requests Session ----------------------
session = requests.Session()
retries = Retry(total=3, backoff_factor=1, status_forcelist=[500, 502, 503, 504])
session.mount("http://", HTTPAdapter(max_retries=retries))
session.mount("https://", HTTPAdapter(max_retries=retries))

# ---------------------- Utility Functions ----------------------
def safe_fetch(url: str, timeout: int = 15) -> str:
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    }
    try:
        resp = session.get(url, headers=headers, timeout=timeout, verify=False, allow_redirects=True)
        resp.raise_for_status()
        return resp.text
    except Exception as e:
        logger.warning(f"Failed to fetch {url}: {e}")
        return ""

def normalize_domain(domain: str) -> str:
    domain = domain.strip().lower()
    domain = re.sub(r"^https?://", "", domain)
    domain = re.sub(r"^www\.", "", domain)
    domain = re.sub(r"/.*$", "", domain)
    return domain

# ---------------------- WHOIS ----------------------
def get_whois_info(domain: str) -> Dict[str, Any]:
    try:
        w = whois.whois(domain)
        def format_date(d): 
            if not d: return "Unknown"
            if isinstance(d, list): d = d[0]
            try:
                if isinstance(d, str): return d
                return d.strftime("%Y-%m-%d")
            except: return str(d)
        return {
            "Registrar": w.registrar or "Unknown",
            "Created Date": format_date(w.creation_date),
            "Updated Date": format_date(w.updated_date),
            "Expiry Date": format_date(w.expiration_date),
            "Name Servers": w.name_servers or ["Unknown"],
        }
    except Exception as e:
        logger.error(f"WHOIS failed: {e}")
        return {"Registrar":"Unknown","Created Date":"Unknown","Updated Date":"Unknown","Expiry Date":"Unknown","Name Servers":["Unknown"]}

# ---------------------- Hosting Info ----------------------
def get_hosting_info(domain: str) -> Dict[str, str]:
    try:
        ip = socket.gethostbyname(domain)
        try:
            resp = session.head(f"https://{domain}", timeout=10, verify=False)
            server = resp.headers.get("Server", "Unknown")
            powered_by = resp.headers.get("X-Powered-By", "Unknown")
        except: server, powered_by = "Unknown", "Unknown"
        server_lower = server.lower()
        if "cloudflare" in server_lower: provider = "Cloudflare"
        elif "nginx" in server_lower: provider = "Nginx"
        elif "apache" in server_lower: provider = "Apache"
        elif "iis" in server_lower or "microsoft" in server_lower: provider = "Microsoft IIS"
        elif "litespeed" in server_lower: provider = "LiteSpeed"
        elif "cpanel" in server_lower: provider = "cPanel"
        else: provider = "Unknown"
        return {"IP Address": ip, "Server": server, "Powered By": powered_by, "Hosting Provider": provider}
    except Exception as e:
        logger.error(f"Hosting info failed: {e}")
        return {"IP Address":"Unknown","Server":"Unknown","Powered By":"Unknown","Hosting Provider":"Unknown"}

# ---------------------- Email Detection ----------------------
def get_mx_records(domain: str) -> List[str]:
    try:
        return [str(r.exchange).rstrip(".") for r in resolver.resolve(domain, "MX")]
    except Exception as e:
        logger.warning(f"MX lookup failed for {domain}: {e}")
        return []

def get_txt_records(domain: str) -> List[str]:
    try:
        return [str(r) for r in resolver.resolve(domain, "TXT")]
    except: return []

def detect_email_provider(mx_records: List[str], txt_records: List[str]) -> str:
    indicators = []
    for mx in mx_records:
        lmx = mx.lower()
        if "google" in lmx or "aspmx.l.google.com" in mx: indicators.append("Google Workspace")
        elif "outlook" in lmx or "protection.outlook" in lmx: indicators.append("Microsoft 365")
        elif "zoho" in lmx: indicators.append("Zoho Mail")
        elif "yahoo" in lmx: indicators.append("Yahoo Mail")
        elif "protonmail" in lmx or "pm.me" in lmx: indicators.append("ProtonMail")
        elif "fastmail" in lmx: indicators.append("Fastmail")
    for txt in txt_records:
        ltxt = txt.lower()
        if "google-site-verification" in ltxt: indicators.append("Google Workspace")
        elif "ms=" in ltxt or "microsoft" in ltxt: indicators.append("Microsoft 365")
        elif "zoho" in ltxt: indicators.append("Zoho Mail")
    if indicators: return Counter(indicators).most_common(1)[0][0]
    if mx_records: return "Custom Email Provider"
    return "No Email Service Detected"

def extract_emails(domain: str) -> List[str]:
    try:
        pages = [f"https://{domain}", f"https://{domain}/contact", f"https://{domain}/contact-us", f"https://{domain}/about"]
        all_emails = set()
        for page in pages:
            html = safe_fetch(page)
            if html:
                emails = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', html)
                valid_emails = [e for e in emails if domain in e and not e.endswith((".png",".jpg"))]
                all_emails.update(valid_emails)
        return list(all_emails)[:10]
    except Exception as e:
        logger.warning(f"Email extraction failed: {e}")
        return []

# ---------------------- Technology Detection ----------------------
def detect_tech_stack(domain: str) -> Dict[str, List[str]]:
    try:
        tech_data = builtwith.parse(f"https://{domain}") or {}
        html = safe_fetch(f"https://{domain}")
        if html:
            html_l = html.lower()
            if "react" in html_l: tech_data.setdefault("javascript-frameworks",[]).append("React")
            if "vue" in html_l: tech_data.setdefault("javascript-frameworks",[]).append("Vue.js")
            if "angular" in html_l: tech_data.setdefault("javascript-frameworks",[]).append("Angular")
            if "jquery" in html_l: tech_data.setdefault("javascript-frameworks",[]).append("jQuery")
        return tech_data
    except Exception as e:
        logger.error(f"Tech stack detection failed: {e}")
        return {}

# ---------------------- WordPress Detection ----------------------
def detect_wordpress(domain: str) -> Dict[str, Any]:
    wp_info = {"Is WordPress":"No","Version":"Not Detected","Theme":"Not Detected","Plugins":[],"Page Builder":"Not Detected"}
    try:
        base_url = f"https://{domain}"
        html = safe_fetch(base_url)
        if not html: return wp_info
        html_l = html.lower()
        wp_signatures = ["wp-content","wp-includes","wp-json","wp-admin","wp-login.php","xmlrpc.php"]
        if any(sig in html_l for sig in wp_signatures): wp_info["Is WordPress"]="Yes"
        # Detect version
        version_patterns = [r'content=["\']WordPress\s*([0-9]+\.[0-9]+(?:\.[0-9]+)?)["\']',
                            r'wp-embed\.min\.js\?ver=([0-9]+\.[0-9]+(?:\.[0-9]+)?)',
                            r'wp-includes/js/wp-embed\.js\?ver=([0-9]+\.[0-9]+(?:\.[0-9]+)?)']
        for pattern in version_patterns:
            m = re.search(pattern, html_l, re.IGNORECASE)
            if m: wp_info["Version"]=m.group(1); break
        # Detect theme
        theme_match = re.search(r"/wp-content/themes/([^/]+)/", html_l)
        if theme_match: wp_info["Theme"]=theme_match.group(1).replace("-"," ").title()
        # Plugins
        plugins = re.findall(r"/wp-content/plugins/([^/]+)/", html_l)
        if plugins: wp_info["Plugins"] = sorted(list(set([p.replace("-", " ").title() for p in plugins])))[:10]
        # Page Builders
        builders = {"Elementor":["elementor"],"Divi":["et_pb"],"WPBakery":["vc_row"],"Oxygen":["ct_builder"]}
        for b, keys in builders.items():
            if any(k in html_l for k in keys):
                wp_info["Page Builder"]=b
                break
    except Exception as e:
        logger.error(f"WordPress detection error: {e}")
    return wp_info

# ---------------------- Ads Detection ----------------------
def detect_ads(domain: str) -> Dict[str, Any]:
    result = {"ad_networks":[],"analytics_tools":[],"tracking_scripts":[],"social_media_pixels":[]}
    try:
        html = safe_fetch(f"https://{domain}")
        if not html: return {"error":"Unable to scan website"}
        soup = BeautifulSoup(html,"html.parser")
        all_scripts = [s.get("src") for s in soup.find_all("script",src=True)]
        all_scripts += [s.string for s in soup.find_all("script") if s.string]
        all_scripts += [img.get("src") for img in soup.find_all("img",src=True)]
        all_scripts += [iframe.get("src") for iframe in soup.find_all("iframe",src=True)]
        # Ad patterns
        ad_patterns = {
            "Google Ads":["googlesyndication.com","doubleclick.net","googleadservices.com","adsbygoogle"],
            "Amazon Ads":["amazon-adsystem.com","assoc-amazon.com"],
            "Media.net":["media.net","contextual.media.net"]
        }
        analytics_patterns = {
            "Google Analytics":["google-analytics.com","gtag("],
            "Google Tag Manager":["googletagmanager.com/gtm.js"],
            "Facebook Pixel":["connect.facebook.net","fbq("]
        }
        social_pixels = {
            "Facebook Pixel":"facebook.com/tr",
            "LinkedIn Insight":"linkedin.com/li.js",
            "TikTok Pixel":"tiktok.com/i18n/pixel"
        }
        detected_ads, detected_analytics, detected_pixels = set(), set(), set()
        for network, patterns in ad_patterns.items():
            if any(any(re.search(p, str(script), re.IGNORECASE) for script in all_scripts) for p in patterns):
                detected_ads.add(network)
        for tool, patterns in analytics_patterns.items():
            if any(any(re.search(p, str(script), re.IGNORECASE) for script in all_scripts) for p in patterns):
                detected_analytics.add(tool)
        for platform, pattern in social_pixels.items():
            if any(re.search(pattern,str(script),re.IGNORECASE) for script in all_scripts):
                detected_pixels.add(platform)
        result["ad_networks"]=list(detected_ads)
        result["analytics_tools"]=list(detected_analytics)
        result["social_media_pixels"]=list(detected_pixels)
        result["tracking_scripts"]=list(detected_ads | detected_analytics | detected_pixels)
    except Exception as e:
        logger.error(f"Ads detection failed: {e}")
        result["error"]=f"Ads detection failed: {e}"
    return result

# ---------------------- Security ----------------------
def audit_security(domain: str) -> Dict[str,str]:
    sec = {"SSL Certificate":"Not Found","SSL Expiry":"Unknown","HSTS":"Not Found",
           "X-Frame-Options":"Not Found","X-Content-Type-Options":"Not Found",
           "Content-Security-Policy":"Not Found","Referrer-Policy":"Not Found"}
    try:
        context = ssl.create_default_context()
        context.check_hostname=False
        context.verify_mode=ssl.CERT_NONE
        with socket.create_connection((domain,443),timeout=10) as sock:
            with context.wrap_socket(sock,server_hostname=domain) as ssock:
                cert=ssock.getpeercert()
                if cert: sec["SSL Certificate"]="Valid"
                if "notAfter" in cert:
                    exp_date=datetime.strptime(cert["notAfter"],'%b %d %H:%M:%S %Y %Z')
                    sec["SSL Expiry"]=f"{(exp_date-datetime.now()).days} days"
        resp = session.get(f"https://{domain}",timeout=10,verify=False)
        headers = resp.headers
        for key,hdr in {"HSTS":"Strict-Transport-Security","X-Frame-Options":"X-Frame-Options",
                        "X-Content-Type-Options":"X-Content-Type-Options",
                        "Content-Security-Policy":"Content-Security-Policy",
                        "Referrer-Policy":"Referrer-Policy"}.items():
            sec[key] = "Present" if headers.get(hdr) else "Not Found"
    except Exception as e:
        logger.warning(f"Security audit issue: {e}")
    return sec

# ---------------------- Performance ----------------------
def analyze_performance(domain: str) -> Dict[str,Any]:
    try:
        start=time.time()
        resp=session.get(f"https://{domain}",timeout=15,verify=False)
        load_time=time.time()-start
        page_size=len(resp.content)/1024
        header_size=len(str(resp.headers).encode("utf-8"))/1024
        if load_time<1.0: score="Excellent"
        elif load_time<2.5: score="Good"
        elif load_time<4.0: score="Average"
        else: score="Poor"
        return {"Load Time":f"{load_time:.2f}s","Page Size":f"{page_size:.1f} KB",
                "Headers Size":f"{header_size:.1f} KB","Total Size":f"{page_size+header_size:.1f} KB",
                "Score":score,"Status":resp.status_code}
    except:
        return {"Load Time":"Failed","Page Size":"Unknown","Headers Size":"Unknown",
                "Total Size":"Unknown","Score":"Unknown","Status":"Unknown"}

# ---------------------- API Endpoints ----------------------
@app.get("/")
def home():
    return {"message":"Domain Audit API","version":"2.5","status":"active"}

@app.get("/audit/{domain}")
def audit_domain(domain: str):
    start_time=time.time()
    domain=normalize_domain(domain)
    if not domain or len(domain)<3:
        return JSONResponse({"error":"Invalid domain"},status_code=400)
    mx=get_mx_records(domain)
    txt=get_txt_records(domain)
    results={
        "Domain":domain,
        "Domain Info":get_whois_info(domain),
        "Hosting":get_hosting_info(domain),
        "Email Setup":{
            "Provider":detect_email_provider(mx,txt),
            "MX Records":mx,
            "TXT Records":txt,
            "Contact Emails":extract_emails(domain)
        },
        "Website Tech":detect_tech_stack(domain),
        "WordPress":detect_wordpress(domain),
        "Advertising":detect_ads(domain),
        "Security":audit_security(domain),
        "Performance":analyze_performance(domain),
        "Audit Date":datetime.now().strftime("%B %d, %Y at %I:%M %p"),
        "Processing Time":f"{time.time()-start_time:.2f}s"
    }
    return JSONResponse(results)

@app.get("/health")
def health_check():
    return {"status":"healthy","timestamp":datetime.now().isoformat()}

@app.get("/test/{domain}")
def test_domain(domain: str):
    domain=normalize_domain(domain)
    return {
        "domain":domain,
        "wordpress":detect_wordpress(domain),
        "ads":detect_ads(domain),
        "email":{"mx":get_mx_records(domain),"txt":get_txt_records(domain)}
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
