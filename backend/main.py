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

app = FastAPI(title="Domain Audit API", version="6.0 Final")

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
# 🧩 Core Helpers - Only Verified Methods
# ============================================================

def normalize_domain(domain: str) -> str:
    """Normalize domain by removing protocol, www, and paths."""
    domain = re.sub(r"^https?://", "", domain.strip().lower())
    domain = re.sub(r"^www\.", "", domain)
    domain = re.sub(r"/.*$", "", domain)
    return domain.split(':')[0]


def fetch_with_fallback(domain: str, path: str = "/", timeout: int = 12) -> Tuple[str, str, Dict]:
    """Fetch page HTML with multiple user agents and proper headers."""
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
# 🧠 Accurate WHOIS Info
# ============================================================

def get_whois_info(domain: str) -> Dict[str, Any]:
    """Get verified WHOIS information."""
    info = {}
    try:
        w = whois.whois(domain)
        
        # Only add verified fields
        if w.registrar:
            info["Registrar"] = w.registrar
        
        # Handle dates carefully
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
        
        # Nameservers - only if we have them
        nameservers = getattr(w, "name_servers", []) or []
        if nameservers and nameservers[0] is not None:
            clean_ns = [ns.rstrip('.').upper() for ns in nameservers if ns and ns != "None"]
            if clean_ns:
                info["Nameservers"] = clean_ns
            
    except Exception as e:
        logger.debug(f"WHOIS failed for {domain}: {e}")
    
    return info


# ============================================================
# ☁️ Verified Hosting Detection
# ============================================================

def detect_hosting_provider(ip: str, server: str = "", nameservers: List[str] = None) -> Optional[str]:
    """Only return hosting provider when we have strong evidence."""
    if not ip:
        return None
    
    server_lower = server.lower() if server else ""
    
    # Strong server header matches
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
    
    # Strong nameserver matches
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
    
    # Only return generic if we have server info but can't identify specifically
    if server and server != "Not Detected":
        return "Generic Hosting"
    
    return None


def get_hosting_info(domain: str, nameservers: List[str] = None) -> Dict[str, Any]:
    """Get verified hosting information."""
    data = {}
    
    try:
        # Get IP address
        try:
            ip = str(resolver.resolve(domain, "A")[0])
            data["IP Address"] = ip
        except:
            try:
                ip = socket.gethostbyname(domain)
                data["IP Address"] = ip
            except:
                ip = None
        
        # Get server headers
        html, url, headers = fetch_with_fallback(domain)
        if headers:
            server = headers.get("Server", "")
            if server:
                # Clean server string
                server = re.sub(r'\([^)]*\)', '', server).strip()
                server = server.split('/')[0] if '/' in server else server
                data["Server"] = server
        
        # Only detect provider if we have strong evidence
        provider = detect_hosting_provider(ip, data.get("Server"), nameservers)
        if provider:
            data["Provider"] = provider
            
    except Exception as e:
        logger.debug(f"Hosting lookup failed: {e}")
    
    return data


# ============================================================
# 📧 Verified Email Detection
# ============================================================

def get_mx(domain: str) -> List[str]:
    """Get MX records."""
    try:
        mx_records = [str(r.exchange).rstrip(".").lower() for r in resolver.resolve(domain, "MX")]
        return mx_records if mx_records else []
    except:
        return []


def get_txt(domain: str) -> List[str]:
    """Get TXT records."""
    try:
        recs = []
        for r in resolver.resolve(domain, "TXT"):
            recs.append("".join([t.decode() if isinstance(t, bytes) else str(t) for t in r.strings]))
        return recs if recs else []
    except:
        return []


def parse_txt_records(txt_records: List[str]) -> Dict[str, List[str]]:
    """Parse and categorize TXT records."""
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
    """Only return email provider when we have clear evidence."""
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
# ⚙️ Verified Technology Detection
# ============================================================

def detect_tech(domain: str) -> Dict[str, List[str]]:
    """Only return technologies we can verify."""
    tech = {}
    
    # Use builtwith for reliable detection
    try:
        builtwith_result = builtwith.parse(f"https://{domain}")
        for category, technologies in builtwith_result.items():
            if technologies:
                tech[category] = list(set(technologies))
    except Exception:
        pass
    
    # Additional verification from HTML
    html, _, _ = fetch_with_fallback(domain)
    if not html:
        return tech
    
    html_lower = html.lower()
    
    # Only add frameworks if we find clear evidence
    if "react" in html_lower and ("react." in html_lower or "/react/" in html_lower):
        tech.setdefault("javascript-frameworks", []).append("React")
    
    if "vue" in html_lower and ("vue.js" in html_lower or "vue/" in html_lower):
        tech.setdefault("javascript-frameworks", []).append("Vue.js")
    
    if "jquery" in html_lower and ("jquery" in html_lower or "/jquery/" in html_lower):
        tech.setdefault("javascript-frameworks", []).append("jQuery")
    
    return tech


# ============================================================
# 📰 Verified WordPress Detection
# ============================================================

def get_verified_wordpress_theme(domain: str, html: str) -> Optional[str]:
    """Only return theme if we can verify it from style.css."""
    if not html:
        return None
    
    # Look for theme directory in CSS/JS links
    theme_patterns = [
        r'/wp-content/themes/([^/]+)/',
        r'/themes/([^/]+)/',
    ]
    
    theme_slug = None
    for pattern in theme_patterns:
        matches = re.findall(pattern, html, re.IGNORECASE)
        if matches:
            theme_slug = matches[0]
            break
    
    if not theme_slug:
        return None
    
    # Verify theme by checking style.css
    style_urls = [
        f"/wp-content/themes/{theme_slug}/style.css",
        f"/themes/{theme_slug}/style.css",
    ]
    
    for style_url in style_urls:
        try:
            css_content, _, _ = fetch_with_fallback(domain, style_url, 8)
            if css_content:
                # Extract theme name from CSS header
                theme_name_match = re.search(r'Theme Name:\s*(.+)', css_content, re.IGNORECASE)
                if theme_name_match:
                    return theme_name_match.group(1).strip()
        except:
            continue
    
    return None


def get_verified_wordpress_version(html: str) -> Optional[str]:
    """Only return WordPress version if we can verify it."""
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
    """Only return plugins we can verify."""
    plugins_found = set()
    
    if not html:
        return []
    
    html_lower = html.lower()
    
    # Plugin indicators that are very specific
    plugin_indicators = {
        "Yoast SEO": ["yoast-seo", "wpseo_"],
        "Elementor": ["elementor", "elementor-"],
        "WooCommerce": ["woocommerce", "wc-"],
        "Contact Form 7": ["contact-form-7", "wpcf7"],
        "WP Rocket": ["wp-rocket"],
        "LiteSpeed Cache": ["litespeed-cache"],
        "Jetpack": ["jetpack", "jp-"],
    }
    
    # Check for plugin directories in URLs (most reliable)
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
    """Only return WordPress data we can verify."""
    wp_info = {}
    
    html, _, _ = fetch_with_fallback(domain)
    if not html:
        return wp_info
    
    html_lower = html.lower()
    
    # Multiple WordPress indicators required
    wp_indicators = [
        "wp-content", "wp-includes", "wordpress", "/wp-json/"
    ]
    
    wp_count = sum(1 for indicator in wp_indicators if indicator in html_lower)
    if wp_count < 2:  # Require at least 2 indicators
        return wp_info
    
    wp_info["Detected"] = "Yes"
    
    # Get version if we can verify it
    version = get_verified_wordpress_version(html)
    if version:
        wp_info["Version"] = version
    
    # Get theme if we can verify it
    theme = get_verified_wordpress_theme(domain, html)
    if theme:
        wp_info["Theme"] = theme
    
    # Get plugins
    plugins = detect_wordpress_plugins(html)
    if plugins:
        wp_info["Plugins"] = plugins
    
    return wp_info


# ============================================================
# 🎯 Verified Ads & Tracking Detection
# ============================================================

def detect_ads_and_tracking(domain: str) -> Dict[str, List[str]]:
    """Only return tracking we can verify with high confidence."""
    ads_data = {}
    
    html, _, _ = fetch_with_fallback(domain)
    if not html:
        return ads_data
    
    html_lower = html.lower()
    
    # High confidence patterns only
    analytics_services = {
        "Google Analytics": ["google-analytics.com/ga.js", "www.google-analytics.com/analytics.js", "googletagmanager.com/gtag/js"],
        "Google Tag Manager": ["googletagmanager.com/gtm.js", "www.googletagmanager.com/gtm.js"],
        "Facebook Pixel": ["facebook.net/en_US/fbevents.js", "connect.facebook.net/en_US/fbevents.js"],
    }
    
    ad_networks = {
        "Google AdSense": ["googleads.g.doubleclick.net", "pagead2.googlesyndication.com"],
        "Google Ad Manager": ["securepubads.g.doubleclick.net", "googletagservices.com/tag/js/gpt.js"],
    }
    
    # Check for analytics
    analytics_found = []
    for service, patterns in analytics_services.items():
        for pattern in patterns:
            if pattern in html_lower:
                analytics_found.append(service)
                break
    
    if analytics_found:
        ads_data["Analytics"] = analytics_found
    
    # Check for ad networks
    ads_found = []
    for network, patterns in ad_networks.items():
        for pattern in patterns:
            if pattern in html_lower:
                ads_found.append(network)
                break
    
    if ads_found:
        ads_data["Ad Networks"] = ads_found
    
    return ads_data


# ============================================================
# 🔒 Verified Security Audit
# ============================================================

def audit_security(domain: str) -> Dict[str, Any]:
    """Only return security information we can verify."""
    sec = {}
    
    # SSL/TLS Check
    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((domain, 443), timeout=10) as sock:
            with ctx.wrap_socket(sock, server_hostname=domain) as ssock:
                cert = ssock.getpeercert()
                if cert:
                    sec["SSL"] = "Valid"
                    sec["TLS"] = ssock.version()
                    
                    # Certificate expiry
                    if "notAfter" in cert:
                        expiry_date = datetime.strptime(cert["notAfter"], '%b %d %H:%M:%S %Y %Z')
                        days_until_expiry = (expiry_date - datetime.utcnow()).days
                        sec["Expires"] = f"{expiry_date.strftime('%Y-%m-%d')} ({days_until_expiry} days)"
    except Exception:
        sec["SSL"] = "Invalid"
    
    # Security Headers
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
# 🚀 Verified Performance Analysis
# ============================================================

def analyze_performance(domain: str) -> Dict[str, Any]:
    """Measure performance with verification."""
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
    
    # Performance rating based on actual measurements
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
# 🧩 Verified Parallel Execution
# ============================================================

def run_parallel(domain: str):
    """Run all audit functions in parallel with verification."""
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
        # Get WHOIS info first for nameservers
        whois_future = ex.submit(get_whois_info, domain)
        whois_info = whois_future.result(timeout=20)
        nameservers = whois_info.get("Nameservers", [])
        
        # Submit other tasks
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
        
        results = {}
        for k, f in futures.items():
            try:
                result = f.result(timeout=25)
                # Only add to results if we have data
                if result:
                    results[k] = result
            except Exception as e:
                logger.debug(f"Task {k} failed: {e}")
                # Don't add failed tasks to results
    
    # Process and verify final results
    final_results = {}
    
    # Domain Info
    if results.get("whois"):
        final_results["Domain Info"] = results["whois"]
    
    # Hosting
    if results.get("hosting"):
        final_results["Hosting"] = results["hosting"]
    
    # Email - only if we have MX records
    mx_records = results.get("mx", [])
    if mx_records:
        email_info = {
            "MX Records": mx_records
        }
        
        # Email provider
        provider = detect_email_provider(mx_records)
        if provider:
            email_info["Provider"] = provider
        
        # TXT records
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
    if results.get("wp"):
        final_results["WordPress"] = results["wp"]
    
    # Security
    if results.get("security"):
        final_results["Security"] = results["security"]
    
    # Performance
    if results.get("perf"):
        final_results["Performance"] = results["perf"]
    
    # Ads & Tracking
    if results.get("ads"):
        final_results["Tracking"] = results["ads"]
    
    return final_results


# ============================================================
# 🌐 Final Routes
# ============================================================

@app.get("/")
def home():
    return {
        "message": "Domain Audit API v6.0 Final", 
        "status": "running",
        "version": "6.0",
        "accuracy": "verified-data-only"
    }


@app.get("/audit/{domain}")
def audit(domain: str):
    start = time.time()
    d = normalize_domain(domain)
    
    if len(d) < 3 or not re.match(r'^[a-z0-9.-]+\.[a-z]{2,}$', d):
        return JSONResponse({"error": "Invalid domain format"}, status_code=400)
    
    try:
        logger.info(f"Starting verified audit for: {d}")
        data = run_parallel(d)
        processing_time = time.time() - start
        
        result = {
            "Domain": d,
            "Audit Time": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "Processing Time": f"{processing_time:.2f}s",
            "Results": data,
        }
        
        logger.info(f"Verified audit completed for {d} in {processing_time:.2f}s")
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
        "service": "Domain Audit API v6.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
