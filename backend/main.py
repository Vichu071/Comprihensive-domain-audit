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

app = FastAPI(title="Domain Audit API", version="9.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

resolver = dns.resolver.Resolver()
resolver.nameservers = ["8.8.8.8", "1.1.1.1", "8.8.4.4", "1.0.0.1"]
resolver.timeout = 10
resolver.lifetime = 15

session = requests.Session()
retries = Retry(total=3, backoff_factor=1.0, status_forcelist=[500, 502, 503, 504])
session.mount("http://", HTTPAdapter(max_retries=retries))
session.mount("https://", HTTPAdapter(max_retries=retries))

def normalize_domain(domain: str) -> str:
    domain = re.sub(r"^https?://", "", domain.strip().lower())
    domain = re.sub(r"^www\.", "", domain)
    domain = re.sub(r"/.*$", "", domain)
    return domain.split(':')[0]

def fetch_with_fallback(domain: str, path: str = "/", timeout: int = 20) -> Tuple[str, str, Dict]:
    user_agents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ]
    
    for proto in ("https", "http"):
        url = f"{proto}://{domain}{path}"
        for user_agent in user_agents:
            try:
                headers = {
                    'User-Agent': user_agent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                }
                resp = session.get(url, headers=headers, timeout=timeout, verify=False, allow_redirects=True)
                if resp.status_code == 200:
                    return resp.text, url, dict(resp.headers)
            except Exception as e:
                continue
    return "", "", {}

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

def detect_hosting_provider(ip: str, server: str = "", nameservers: List[str] = None) -> Optional[str]:
    if not ip:
        return None
    
    server_lower = server.lower() if server else ""
    
    if "cloudflare" in server_lower:
        return "Cloudflare"
    if "aws" in server_lower or "amazon" in server_lower or "ec2" in server_lower:
        return "AWS"
    if "google" in server_lower or "gws" in server_lower:
        return "Google Cloud"
    if "azure" in server_lower or "microsoft" in server_lower:
        return "Microsoft Azure"
    if "digitalocean" in server_lower:
        return "DigitalOcean"
    if "siteground" in server_lower:
        return "SiteGround"
    if "godaddy" in server_lower:
        return "GoDaddy"
    if "bluehost" in server_lower:
        return "Bluehost"
    if "nginx" in server_lower:
        return "Nginx"
    if "apache" in server_lower:
        return "Apache"
    
    if nameservers:
        ns_str = " ".join(nameservers).lower()
        if "cloudflare" in ns_str:
            return "Cloudflare"
        if "aws" in ns_str or "amazon" in ns_str:
            return "AWS"
        if "google" in ns_str:
            return "Google Cloud"
        if "siteground" in ns_str:
            return "SiteGround"
        if "godaddy" in ns_str:
            return "GoDaddy"
    
    if server and server != "Not Detected":
        return "Generic Hosting"
    
    return None

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

def get_mx(domain: str) -> List[str]:
    try:
        mx_records = [str(r.exchange).rstrip(".").lower() for r in resolver.resolve(domain, "MX")]
        return mx_records if mx_records else []
    except:
        return []

def get_txt(domain: str) -> List[str]:
    try:
        recs = []
        for r in resolver.resolve(domain, "TXT"):
            recs.append("".join([t.decode() if isinstance(t, bytes) else str(t) for t in r.strings]))
        return recs if recs else []
    except:
        return []

def parse_txt_records(txt_records: List[str]) -> Dict[str, List[str]]:
    parsed = {}
    
    for record in txt_records:
        if record.startswith("v=spf1"):
            parsed.setdefault("SPF", []).append(record)
        elif record.startswith("v=dmarc1"):
            parsed.setdefault("DMARC", []).append(record)
        elif "google-site-verification" in record.lower():
            parsed.setdefault("Google Verification", []).append(record)
        elif record.startswith("MS="):
            parsed.setdefault("Microsoft Verification", []).append(record)
    
    return parsed

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

def detect_tech(domain: str) -> Dict[str, List[str]]:
    tech = {}
    
    # First try builtwith
    try:
        builtwith_result = builtwith.parse(f"https://{domain}")
        for category, technologies in builtwith_result.items():
            if technologies:
                tech[category] = list(set(technologies))
    except Exception as e:
        logger.debug(f"BuiltWith failed: {e}")
    
    # Enhanced manual detection
    html, _, headers = fetch_with_fallback(domain)
    if not html:
        return tech
    
    html_lower = html.lower()
    
    # Server detection from headers
    server = headers.get("Server", "").lower()
    if server:
        if "nginx" in server:
            tech.setdefault("web-servers", []).append("Nginx")
        elif "apache" in server:
            tech.setdefault("web-servers", []).append("Apache")
        elif "iis" in server:
            tech.setdefault("web-servers", []).append("Microsoft IIS")
        elif "cloudflare" in server:
            tech.setdefault("web-servers", []).append("Cloudflare")
    
    # Framework detection
    if "react" in html_lower:
        tech.setdefault("javascript-frameworks", []).append("React")
    
    if "vue" in html_lower:
        tech.setdefault("javascript-frameworks", []).append("Vue.js")
    
    if "angular" in html_lower:
        tech.setdefault("javascript-frameworks", []).append("Angular")
    
    if "jquery" in html_lower:
        tech.setdefault("javascript-frameworks", []).append("jQuery")
    
    if "bootstrap" in html_lower:
        tech.setdefault("css-frameworks", []).append("Bootstrap")
    
    # CMS detection
    if any(indicator in html_lower for indicator in ["wp-content", "wp-includes", "wordpress"]):
        tech.setdefault("cms", []).append("WordPress")
    
    if "joomla" in html_lower:
        tech.setdefault("cms", []).append("Joomla")
    
    if "drupal" in html_lower:
        tech.setdefault("cms", []).append("Drupal")
    
    # Programming languages
    if ".php" in html_lower or "php" in headers.get("X-Powered-By", "").lower():
        tech.setdefault("programming-languages", []).append("PHP")
    
    if ".aspx" in html_lower or "asp.net" in headers.get("X-Powered-By", "").lower():
        tech.setdefault("programming-languages", []).append("ASP.NET")
    
    # Analytics detection
    if "google-analytics" in html_lower or "gtag" in html_lower:
        tech.setdefault("analytics", []).append("Google Analytics")
    
    if "googletagmanager" in html_lower:
        tech.setdefault("tag-managers", []).append("Google Tag Manager")
    
    if "facebook.net" in html_lower or "fbq(" in html_lower:
        tech.setdefault("analytics", []).append("Facebook Pixel")
    
    return tech

def detect_wordpress_theme(html: str, domain: str) -> Optional[str]:
    if not html:
        return None
    
    # Look for theme in multiple patterns
    theme_patterns = [
        r'/wp-content/themes/([^/"\']+)/',
        r'/themes/([^/"\']+)/',
    ]
    
    for pattern in theme_patterns:
        matches = re.findall(pattern, html, re.IGNORECASE)
        if matches:
            return matches[0].title()
    
    return None

def detect_wordpress_version(html: str) -> Optional[str]:
    if not html:
        return None
    
    soup = BeautifulSoup(html, 'html.parser')
    
    # Check generator meta tag
    generator = soup.find('meta', attrs={'name': 'generator'})
    if generator and 'wordpress' in generator.get('content', '').lower():
        version_match = re.search(r'wordpress\s*([\d.]+)', generator.get('content', ''), re.IGNORECASE)
        if version_match:
            return f"WordPress {version_match.group(1)}"
    
    return None

def detect_wordpress_plugins(html: str) -> List[str]:
    plugins_found = set()
    
    if not html:
        return []
    
    html_lower = html.lower()
    
    # Plugin indicators
    plugin_indicators = {
        "Yoast SEO": ["yoast", "wpseo"],
        "Elementor": ["elementor"],
        "WooCommerce": ["woocommerce", "wc-"],
        "Contact Form 7": ["contact-form-7", "wpcf7"],
        "WP Rocket": ["wp-rocket"],
        "LiteSpeed Cache": ["litespeed"],
        "Jetpack": ["jetpack"],
        "Akismet": ["akismet"],
        "Wordfence": ["wordfence"],
    }
    
    # Check for plugin directories in URLs
    plugin_dir_matches = re.findall(r'/wp-content/plugins/([^/"]+)/', html_lower)
    for plugin_dir in plugin_dir_matches:
        plugin_name = plugin_dir.replace('-', ' ').title()
        plugins_found.add(plugin_name)
    
    # Check HTML content for specific indicators
    for plugin_name, indicators in plugin_indicators.items():
        for indicator in indicators:
            if indicator in html_lower:
                plugins_found.add(plugin_name)
                break
    
    return sorted(list(plugins_found))

def detect_wordpress(domain: str) -> Dict[str, Any]:
    wp_info = {"Detected": "No", "Confidence": "0%"}
    
    html, _, headers = fetch_with_fallback(domain)
    if not html:
        return wp_info
    
    html_lower = html.lower()
    
    # WordPress indicators
    wp_indicators = [
        "wp-content", "wp-includes", "wordpress", "wp-json", "wp-admin"
    ]
    
    wp_count = sum(1 for indicator in wp_indicators if indicator in html_lower)
    
    # If we have at least 2 indicators, consider it WordPress
    if wp_count >= 2:
        wp_info["Detected"] = "Yes"
        wp_info["Confidence"] = f"{int((wp_count / len(wp_indicators)) * 100)}%"
        
        # Get version
        version = detect_wordpress_version(html)
        if version:
            wp_info["Version"] = version
        
        # Get theme
        theme = detect_wordpress_theme(html, domain)
        if theme:
            wp_info["Theme"] = theme
        
        # Get plugins
        plugins = detect_wordpress_plugins(html)
        if plugins:
            wp_info["Plugins"] = plugins
    
    return wp_info

def detect_ads_and_tracking(domain: str) -> Dict[str, List[str]]:
    ads_data = {"Analytics": [], "Ad Networks": []}
    
    html, _, _ = fetch_with_fallback(domain)
    if not html:
        return ads_data
    
    html_lower = html.lower()
    
    # Analytics services
    analytics_services = {
        "Google Analytics": ["google-analytics.com", "gtag(", "ga.js", "analytics.js"],
        "Google Tag Manager": ["googletagmanager.com", "gtm.js"],
        "Facebook Pixel": ["facebook.net", "fbq(", "connect.facebook.net"],
        "Hotjar": ["hotjar.com"],
        "Microsoft Clarity": ["clarity.ms"],
    }
    
    # Ad networks
    ad_networks = {
        "Google AdSense": ["googleads.g.doubleclick.net", "pagead2.googlesyndication.com"],
        "Google Ad Manager": ["securepubads.g.doubleclick.net", "googletagservices.com"],
        "Amazon Associates": ["amazon-adsystem.com"],
    }
    
    # Detect analytics
    for service, patterns in analytics_services.items():
        for pattern in patterns:
            if pattern in html_lower:
                ads_data["Analytics"].append(service)
                break
    
    # Detect ad networks
    for network, patterns in ad_networks.items():
        for pattern in patterns:
            if pattern in html_lower:
                ads_data["Ad Networks"].append(network)
                break
    
    return ads_data

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
        if "x-content-type-options" in headers_lower:
            security_headers.append("X-Content-Type-Options")
        
        if security_headers:
            sec["Security Headers"] = security_headers
    
    return sec

def analyze_performance(domain: str) -> Dict[str, Any]:
    start = time.time()
    html, url, headers = fetch_with_fallback(domain)
    
    if not html:
        return {
            "Status": "Failed to load", 
            "Load Time": "N/A", 
            "Page Size": "N/A", 
            "Rating": "Failed",
            "Score": "F"
        }
    
    load_time = round(time.time() - start, 2)
    size = len(html.encode()) / 1024
    
    perf = {
        "Load Time": f"{load_time}s",
        "Page Size": f"{size:.1f} KB",
        "Status": "Success"
    }
    
    # Performance rating
    if load_time < 1.0:
        perf["Rating"] = "Excellent"
        perf["Score"] = "A"
    elif load_time < 2.0:
        perf["Rating"] = "Good"
        perf["Score"] = "B"
    elif load_time < 3.0:
        perf["Rating"] = "Average"
        perf["Score"] = "C"
    elif load_time < 5.0:
        perf["Rating"] = "Slow"
        perf["Score"] = "D"
    else:
        perf["Rating"] = "Very Slow"
        perf["Score"] = "F"
    
    return perf

def run_parallel(domain: str):
    results = {}
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
        # Get WHOIS info first for nameservers
        whois_future = ex.submit(get_whois_info, domain)
        whois_info = whois_future.result(timeout=25)
        nameservers = whois_info.get("Nameservers", [])
        
        # Submit all other tasks
        futures = {
            "whois": whois_future,
            "hosting": ex.submit(get_hosting_info, domain, nameservers),
            "mx": ex.submit(get_mx, domain),
            "txt": ex.submit(get_txt, domain),
            "tech": ex.submit(detect_tech, domain),
            "wp": ex.submit(detect_wordpress, domain),
            "security": ex.submit(audit_security, domain),
            "perf": ex.submit(analyze_performance, domain),
            "ads": ex.submit(detect_ads_and_tracking, domain),
        }
        
        # Collect results
        for name, future in futures.items():
            try:
                result = future.result(timeout=30)
                results[name] = result
            except Exception as e:
                logger.debug(f"Task {name} failed: {e}")
                # Set default values
                if name == "wp":
                    results[name] = {"Detected": "No", "Confidence": "0%"}
                elif name == "perf":
                    results[name] = {"Status": "Failed to load", "Load Time": "N/A", "Page Size": "N/A", "Rating": "Failed", "Score": "F"}
                elif name == "ads":
                    results[name] = {"Analytics": [], "Ad Networks": []}
                elif name == "tech":
                    results[name] = {}
                else:
                    results[name] = {}
    
    # Build final results
    final_results = {}
    
    # Domain Info
    if results.get("whois"):
        final_results["Domain Info"] = results["whois"]
    
    # Hosting
    if results.get("hosting"):
        final_results["Hosting"] = results["hosting"]
    
    # Email
    mx_records = results.get("mx", [])
    if mx_records:
        email_info = {
            "MX Records": mx_records
        }
        
        provider = detect_email_provider(mx_records)
        if provider:
            email_info["Provider"] = provider
        
        txt_records = results.get("txt", [])
        if txt_records:
            parsed_txt = parse_txt_records(txt_records)
            if parsed_txt:
                email_info["DNS Records"] = parsed_txt
        
        final_results["Email"] = email_info
    
    # Technology
    if results.get("tech"):
        final_results["Technology"] = results["tech"]
    
    # WordPress
    final_results["WordPress"] = results.get("wp", {"Detected": "No", "Confidence": "0%"})
    
    # Security
    if results.get("security"):
        final_results["Security"] = results["security"]
    
    # Performance
    final_results["Performance"] = results.get("perf", {"Status": "Failed to load", "Load Time": "N/A", "Page Size": "N/A", "Rating": "Failed", "Score": "F"})
    
    # Tracking
    final_results["Tracking"] = results.get("ads", {"Analytics": [], "Ad Networks": []})
    
    return final_results

@app.get("/")
def home():
    return {
        "message": "Domain Audit API v9.0", 
        "status": "running",
        "version": "9.0"
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
        "service": "Domain Audit API v9.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
