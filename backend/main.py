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
from datetime import datetime, timedelta
import concurrent.futures

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("domain-audit")

app = FastAPI(title="Domain Audit API", version="2.6")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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

# ---------------------- Utility Functions ----------------------

def normalize_domain(domain: str) -> str:
    """Normalize domain by removing protocol, www, and paths"""
    domain = domain.strip().lower()
    domain = re.sub(r"^https?://", "", domain)
    domain = re.sub(r"^www\.", "", domain)
    domain = re.sub(r"/.*$", "", domain)  # Remove path
    return domain

def fetch_with_fallback(domain: str, path: str = "/", timeout: int = 10) -> Tuple[str, str]:
    """Try both https and http automatically and return first successful (content, used_url)"""
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
    """Safely fetch URL content with error handling"""
    try:
        response = session.get(url, timeout=timeout, verify=False, allow_redirects=True)
        response.raise_for_status()
        return response.text or ""
    except Exception as e:
        logger.debug(f"safe_fetch failed for {url}: {e}")
        return ""

# ---------------------- WHOIS Information ----------------------

def get_whois_info(domain: str) -> Dict[str, Any]:
    """Get WHOIS information with robust error handling"""
    default = {
        "Registrar": "Unknown", 
        "Created Date": "Unknown", 
        "Expiry Date": "Unknown", 
        "Name Servers": ["Unknown"], 
        "Updated Date": "Unknown"
    }
    
    try:
        w = whois.whois(domain)
        
        def format_date(date_value):
            """Format various date formats to consistent string"""
            if not date_value:
                return "Unknown"
                
            if isinstance(date_value, list):
                date_value = date_value[0]
                
            if isinstance(date_value, datetime):
                return date_value.strftime("%Y-%m-%d")
                
            # Try common date formats
            date_str = str(date_value)
            formats = ["%Y-%m-%d", "%d-%b-%Y", "%Y.%m.%d", "%Y-%m-%d %H:%M:%S", "%Y%m%d"]
            
            for fmt in formats:
                try:
                    return datetime.strptime(date_str, fmt).strftime("%Y-%m-%d")
                except:
                    continue
                    
            return date_str

        return {
            "Registrar": getattr(w, "registrar", "Unknown") or "Unknown",
            "Created Date": format_date(getattr(w, "creation_date", None)),
            "Expiry Date": format_date(getattr(w, "expiration_date", None)),
            "Name Servers": getattr(w, "name_servers", ["Unknown"]) or ["Unknown"],
            "Updated Date": format_date(getattr(w, "updated_date", None)),
        }
    except Exception as e:
        logger.warning(f"WHOIS lookup failed for {domain}: {e}")
        return default

# ---------------------- Hosting Details ----------------------

def get_hosting_info(domain: str) -> Dict[str, Any]:
    """Get hosting information including IP, server headers, and provider detection"""
    info = {
        "IP Address": "Unknown", 
        "Server": "Unknown", 
        "Powered By": "Unknown", 
        "Hosting Provider": "Unknown", 
        "Resolver": "Unknown"
    }
    
    try:
        # DNS resolution
        try:
            answers = resolver.resolve(domain, "A")
            ip = str(answers[0])
            info["IP Address"] = ip
            info["Resolver"] = ", ".join([str(ns) for ns in resolver.nameservers])
        except Exception as e:
            logger.debug(f"DNS resolution failed, trying socket: {e}")
            try:
                ip = socket.gethostbyname(domain)
                info["IP Address"] = ip
            except Exception:
                pass

        # Get server headers
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

        # Detect hosting provider
        server_lower = info["Server"].lower() if info["Server"] else ""
        ip = info["IP Address"]
        
        # CloudFlare detection
        if "cloudflare" in server_lower or (ip and any(ip.startswith(prefix) for prefix in ["104.", "172.", "173.", "198."])):
            info["Hosting Provider"] = "Cloudflare"
        elif "nginx" in server_lower:
            info["Hosting Provider"] = "Nginx"
        elif "apache" in server_lower:
            info["Hosting Provider"] = "Apache"
        elif "iis" in server_lower or "microsoft" in server_lower:
            info["Hosting Provider"] = "Microsoft IIS"
        elif "cpanel" in server_lower:
            info["Hosting Provider"] = "cPanel"
        elif "litespeed" in server_lower:
            info["Hosting Provider"] = "LiteSpeed"
        else:
            # Try reverse DNS for provider detection
            try:
                if ip and ip != "Unknown":
                    hostname = socket.gethostbyaddr(ip)[0]
                    info["Hosting Provider"] = hostname
            except Exception:
                pass

    except Exception as e:
        logger.warning(f"Hosting info error for {domain}: {e}")

    return info

# ---------------------- Email Detection ----------------------

def get_mx_records(domain: str) -> List[str]:
    """Get MX records for domain"""
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
    """Get TXT records for domain"""
    try:
        txts = []
        answers = resolver.resolve(domain, 'TXT')
        for r in answers:
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
    """Detect email provider from MX and TXT records"""
    if not mx_records and not txt_records:
        return "No Email Service Detected"
        
    indicators = []
    
    # Check MX records
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
    
    # Check TXT records
    for t in txt_records:
        tl = t.lower()
        if "google-site-verification" in tl:
            indicators.append("Google Workspace")
        if "spf1 include:spf.protection.outlook.com" in tl or "spf.protection.outlook.com" in tl:
            indicators.append("Microsoft 365")
        if "zoho" in tl:
            indicators.append("Zoho Mail")
    
    # Return most common provider
    if indicators:
        from collections import Counter
        return Counter(indicators).most_common(1)[0][0]
        
    if mx_records:
        return "Custom Email Provider (MX present)"
        
    return "No Email Service Detected"

def extract_emails(domain: str) -> List[str]:
    """Extract email addresses from website pages"""
    pages = ["/", "/contact", "/contact-us", "/about", "/about-us", "/wp-admin", "/wp-login.php"]
    emails = set()
    pattern = re.compile(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', re.I)
    
    for p in pages:
        html, url = fetch_with_fallback(domain, p, timeout=8)
        if not html:
            continue
            
        # Regex email extraction
        for m in pattern.findall(html):
            # Filter out image-like false positives
            if any(m.lower().endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.svg', '.gif']):
                continue
            emails.add(m)
        
        # Extract from mailto links
        try:
            soup = BeautifulSoup(html, "html.parser")
            for a in soup.select('a[href^=mailto]'):
                mail = a.get('href').split(':', 1)[-1].split('?')[0]
                if mail and '@' in mail:
                    emails.add(mail)
        except Exception:
            pass
    
    # Prefer emails that use the domain
    domain_emails = [e for e in emails if normalize_domain(e.split('@')[-1]) == domain]
    if domain_emails:
        return domain_emails[:10]
        
    return list(emails)[:10]

# ---------------------- Technology Detection ----------------------

def detect_tech_stack(domain: str) -> Dict[str, List[str]]:
    """Detect technology stack using builtwith and custom detection"""
    tech = {}
    
    # Use builtwith for initial detection
    try:
        bw = builtwith.parse(f"https://{domain}")
        if bw:
            tech.update(bw)
    except Exception as e:
        logger.debug(f"builtwith parse failed: {e}")

    # Enhanced detection with HTML analysis
    html, url_used = fetch_with_fallback(domain, "/", timeout=8)
    if html:
        html_low = html.lower()
        
        # JavaScript frameworks
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
        
        # CMS detection
        if 'wordpress' in html_low:
            tech.setdefault('cms', []).append('WordPress')
        elif 'drupal' in html_low:
            tech.setdefault('cms', []).append('Drupal')
        elif 'joomla' in html_low:
            tech.setdefault('cms', []).append('Joomla')
        elif 'shopify' in html_low:
            tech.setdefault('ecommerce', []).append('Shopify')
        elif 'magento' in html_low:
            tech.setdefault('ecommerce', []).append('Magento')
        
        # Server-side technologies
        if 'php' in html_low:
            tech.setdefault('programming-languages', []).append('PHP')
        if 'asp.net' in html_low or 'aspx' in html_low:
            tech.setdefault('frameworks', []).append('ASP.NET')
        if 'python' in html_low:
            tech.setdefault('programming-languages', []).append('Python')
    
    return tech

# ---------------------- WordPress Detection ----------------------

def detect_wordpress(domain: str) -> Dict[str, Any]:
    """Advanced WordPress detection with version, theme, and plugin detection"""
    wp = {
        "Is WordPress": "No", 
        "Version": "Not Detected", 
        "Theme": "Not Detected", 
        "Plugins": []
    }
    
    try:
        html, used = fetch_with_fallback(domain, "/", timeout=8)
        if not html:
            return wp
            
        html_low = html.lower()
        
        # WordPress indicators
        checks = {
            "wp-content": "wp-content" in html_low,
            "wp-includes": "wp-includes" in html_low,
            "wp-json": "/wp-json/" in html_low or '"wp/v2' in html_low,
            "wp-admin": "/wp-admin" in html_low,
            "xmlrpc": "xmlrpc.php" in html_low,
            "generator": 'meta name="generator" content="wordpress' in html_low
        }
        
        score = sum(1 for v in checks.values() if v)
        
        # Check WordPress endpoints
        endpoint_hits = 0
        for ep in ["/wp-json/", "/wp-login.php", "/readme.html", "/wp-admin/", "/xmlrpc.php"]:
            _, url = fetch_with_fallback(domain, ep, timeout=6)
            if url:
                endpoint_hits += 1

        # Determine if WordPress
        is_wp = score >= 2 or endpoint_hits >= 1
        
        if is_wp:
            wp["Is WordPress"] = "Yes"
            
            # Version detection
            version_patterns = [
                r'<meta name="generator" content="WordPress\s*([0-9\.]+)"',
                r'wp-embed\.min\.js\?ver=([0-9\.]+)',
                r'wp-includes/js/wp-embed\.js\?ver=([0-9\.]+)',
                r'wordpress.*?([0-9]+\.[0-9]+\.[0-9]+)'
            ]
            
            for p in version_patterns:
                m = re.search(p, html, re.I)
                if m:
                    wp["Version"] = m.group(1)
                    break
            
            # Theme detection
            theme_patterns = [
                r'/wp-content/themes/([^/"]+)/',
                r'themes/([^/"]+)/style\.css'
            ]
            
            for tp in theme_patterns:
                m = re.search(tp, html, re.I)
                if m:
                    theme = m.group(1).strip().replace('"', '').replace("'", "")
                    wp["Theme"] = theme.title()
                    break
            
            # Plugin detection
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
                "Gravity Forms": r'gravityforms',
                "Advanced Custom Fields": r'acf',
                "WP Super Cache": r'wp-super-cache',
                "W3 Total Cache": r'w3-total-cache'
            }
            
            for name, pat in common_plugins.items():
                if re.search(pat, html_low):
                    possible_plugins.append(name)
            
            # Check readme.html for additional plugin hints
            readme_html, _ = fetch_with_fallback(domain, "/readme.html", timeout=5)
            if readme_html:
                for name, pat in common_plugins.items():
                    if re.search(pat, readme_html.lower()):
                        if name not in possible_plugins:
                            possible_plugins.append(name)
            
            wp["Plugins"] = possible_plugins[:15]
            
    except Exception as e:
        logger.warning(f"WordPress detection error for {domain}: {e}")
        
    return wp

# ---------------------- Ads & Tracking Detection ----------------------

# Pattern definitions for ads and tracking
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
    """Detect advertising networks, analytics tools, and tracking scripts"""
    res = {
        "ad_networks": [], 
        "analytics_tools": [], 
        "tracking_scripts": [], 
        "social_media_pixels": []
    }
    
    try:
        html, _ = fetch_with_fallback(domain, "/", timeout=10)
        if not html:
            return {"error": "Unable to fetch site content"}
            
        soup = BeautifulSoup(html, "html.parser")
        candidates = []
        
        # Gather script sources and inline scripts
        for s in soup.find_all("script"):
            src = s.get("src")
            if src:
                candidates.append(src)
            if s.string:
                candidates.append(s.string[:5000])  # Cap length for performance

        # Check images and iframes
        for tag in soup.find_all(["img", "iframe"]):
            if tag.get("src"):
                candidates.append(tag.get("src"))

        # Detect ad networks
        detected_ads = set()
        for name, patterns in AD_PATTERNS.items():
            for pattern in patterns:
                for candidate in candidates:
                    try:
                        if re.search(pattern, str(candidate), re.I):
                            detected_ads.add(name)
                            break
                    except Exception:
                        continue

        # Detect analytics tools
        detected_analytics = set()
        for name, patterns in ANALYTICS_PATTERNS.items():
            for pattern in patterns:
                for candidate in candidates:
                    try:
                        if re.search(pattern, str(candidate), re.I):
                            detected_analytics.add(name)
                            break
                    except Exception:
                        continue

        # Detect social media pixels
        detected_pixels = set()
        for name, pattern in SOCIAL_PIXELS.items():
            for candidate in candidates:
                try:
                    if re.search(pattern, str(candidate), re.I):
                        detected_pixels.add(name)
                        break
                except Exception:
                    continue

        res["ad_networks"] = sorted(list(detected_ads))
        res["analytics_tools"] = sorted(list(detected_analytics))
        res["social_media_pixels"] = sorted(list(detected_pixels))
        res["tracking_scripts"] = sorted(list(detected_ads | detected_analytics | detected_pixels))
        
    except Exception as e:
        logger.warning(f"Ads detection error for {domain}: {e}")
        res["error"] = str(e)
        
    return res

# ---------------------- Security Audit ----------------------

def parse_cert_notAfter(notAfter: str) -> str:
    """Parse SSL certificate expiration date from various formats"""
    formats = [
        "%b %d %H:%M:%S %Y %Z",  # Common from getpeercert
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y%m%d%H%M%SZ",
        "%Y-%m-%d %H:%M:%S"
    ]
    
    for fmt in formats:
        try:
            d = datetime.strptime(notAfter, fmt)
            return d.strftime("%Y-%m-%d %H:%M:%S")
        except:
            continue
            
    return notAfter

def audit_security(domain: str) -> Dict[str, Any]:
    """Comprehensive security audit including SSL and security headers"""
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
        # SSL certificate check
        try:
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            with socket.create_connection((domain, 443), timeout=6) as sock:
                with ctx.wrap_socket(sock, server_hostname=domain) as ssock:
                    cert = ssock.getpeercert()
                    if cert:
                        security["SSL Certificate"] = "Valid"
                        not_after = cert.get("notAfter")
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

        # Security headers check
        html, used_url = fetch_with_fallback(domain, "/", timeout=7)
        headers = {}
        if used_url:
            try:
                r = session.get(used_url, timeout=7, verify=False, allow_redirects=True)
                headers = r.headers
            except Exception:
                pass

        # Check security headers
        header_map = {
            "Strict-Transport-Security": "HSTS",
            "X-Frame-Options": "X-Frame-Options",
            "X-Content-Type-Options": "X-Content-Type-Options",
            "Content-Security-Policy": "Content-Security-Policy",
            "Referrer-Policy": "Referrer-Policy",
        }

        for header, key in header_map.items():
            if headers.get(header):
                security[key] = f"Present ({headers.get(header)})"
            else:
                security[key] = "Not Found"
                
    except Exception as e:
        logger.warning(f"Security audit failed for {domain}: {e}")

    return security

# ---------------------- Performance Analysis ----------------------

def analyze_performance(domain: str) -> Dict[str, Any]:
    """Analyze website performance including load time and size"""
    try:
        start = time.time()
        html, used = fetch_with_fallback(domain, "/", timeout=12)
        if not html:
            return {"Load Time": "Failed", "Page Size": "Unknown", "Score": "Unknown", "Status": "Failed"}
            
        load_time = time.time() - start
        size_kb = len(html.encode("utf-8")) / 1024
        
        # Performance scoring
        if load_time < 1.0:
            score = "Excellent"
        elif load_time < 2.5:
            score = "Good"
        elif load_time < 4.0:
            score = "Average"
        else:
            score = "Poor"

        return {
            "Load Time": f"{load_time:.2f}s", 
            "Page Size": f"{size_kb:.1f} KB", 
            "Score": score, 
            "Status": "OK"
        }
        
    except Exception as e:
        logger.debug(f"Performance analysis failed for {domain}: {e}")
        return {
            "Load Time": "Failed", 
            "Page Size": "Unknown", 
            "Score": "Unknown", 
            "Status": "Unknown"
        }

# ---------------------- Main Audit Function ----------------------

def run_parallel_checks(domain: str) -> Dict[str, Any]:
    """Run checks in parallel for better performance"""
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        # Submit tasks
        whois_future = executor.submit(get_whois_info, domain)
        hosting_future = executor.submit(get_hosting_info, domain)
        mx_future = executor.submit(get_mx_records, domain)
        txt_future = executor.submit(get_txt_records, domain)
        tech_future = executor.submit(detect_tech_stack, domain)
        wp_future = executor.submit(detect_wordpress, domain)
        ads_future = executor.submit(detect_ads, domain)
        security_future = executor.submit(audit_security, domain)
        perf_future = executor.submit(analyze_performance, domain)
        emails_future = executor.submit(extract_emails, domain)
        
        # Get results
        whois_info = whois_future.result()
        hosting_info = hosting_future.result()
        mx_records = mx_future.result()
        txt_records = txt_future.result()
        tech_stack = tech_future.result()
        wp_info = wp_future.result()
        ads_info = ads_future.result()
        security_info = security_future.result()
        perf_info = perf_future.result()
        emails = emails_future.result()
        
        # Detect email provider
        email_provider = detect_email_provider(mx_records, txt_records)
        
        return {
            "Domain Info": whois_info,
            "Hosting": hosting_info,
            "Email Setup": {
                "Provider": email_provider,
                "MX Records": mx_records or ["None"],
                "TXT Records": txt_records or ["None"],
                "Contact Emails": emails or []
            },
            "Website Tech": tech_stack,
            "WordPress": wp_info,
            "Advertising": ads_info,
            "Security": security_info,
            "Performance": perf_info
        }

# ---------------------- FastAPI Routes ----------------------

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
        # Run all checks in parallel
        audit_results = run_parallel_checks(domain)
        
        results = {
            "Domain": domain,
            **audit_results,
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
    """Test endpoint for debugging specific domains"""
    domain = normalize_domain(domain)
    return {
        "domain": domain,
        "wordpress": detect_wordpress(domain),
        "ads": detect_ads(domain),
        "email": {
            "mx": get_mx_records(domain), 
            "txt": get_txt_records(domain)
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
