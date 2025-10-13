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

app = FastAPI(title="Domain Audit API", version="2.5")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# DNS Resolver with better configuration
resolver = dns.resolver.Resolver()
resolver.nameservers = ["8.8.8.8", "1.1.1.1", "8.8.4.4", "1.0.0.1"]
resolver.timeout = 10
resolver.lifetime = 10

# Requests session with better configuration
session = requests.Session()
retries = Retry(total=3, backoff_factor=1, status_forcelist=[500, 502, 503, 504])
session.mount("http://", HTTPAdapter(max_retries=retries))
session.mount("https://", HTTPAdapter(max_retries=retries))

# ---------------------- Utility Functions ----------------------

def safe_fetch(url: str, timeout: int = 15) -> str:
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    }
    try:
        response = session.get(url, headers=headers, timeout=timeout, verify=False, allow_redirects=True)
        response.raise_for_status()
        return response.text
    except Exception as e:
        logger.warning(f"Failed to fetch {url}: {str(e)}")
        return ""

def normalize_domain(domain: str) -> str:
    domain = domain.strip().lower()
    domain = re.sub(r"^https?://", "", domain)
    domain = re.sub(r"^www\.", "", domain)
    domain = re.sub(r"/.*$", "", domain)  # Remove paths
    return domain

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
            "Updated Date": format_date(w.updated_date),
        }
    except Exception as e:
        logger.error(f"WHOIS failed: {str(e)}")
        return {"Registrar": "Unknown", "Created Date": "Unknown", "Expiry Date": "Unknown", "Name Servers": ["Unknown"]}

# ---------------------- Hosting Details ----------------------

def get_hosting_info(domain: str) -> Dict[str, Any]:
    try:
        ip = socket.gethostbyname(domain)

        try:
            response = session.head(f"https://{domain}", timeout=10, verify=False)
            server = response.headers.get("Server", "Unknown")
            powered_by = response.headers.get("X-Powered-By", "Unknown")
        except:
            server = "Unknown"
            powered_by = "Unknown"

        provider = "Unknown"
        server_lower = server.lower()
        
        if "cloudflare" in server_lower:
            provider = "Cloudflare"
        elif "nginx" in server_lower:
            provider = "Nginx"
        elif "apache" in server_lower:
            provider = "Apache"
        elif "iis" in server_lower or "microsoft" in server_lower:
            provider = "Microsoft IIS"
        elif "liteSpeed" in server_lower:
            provider = "LiteSpeed"
        elif "cpanel" in server_lower:
            provider = "cPanel"

        return {
            "IP Address": ip, 
            "Server": server, 
            "Powered By": powered_by,
            "Hosting Provider": provider
        }
    except Exception as e:
        logger.error(f"Hosting info failed: {str(e)}")
        return {"IP Address": "Unknown", "Server": "Unknown", "Powered By": "Unknown", "Hosting Provider": "Unknown"}

# ---------------------- Improved Email Detection ----------------------

def get_mx_records(domain: str) -> List[str]:
    try:
        mx_records = []
        answers = resolver.resolve(domain, "MX")
        for rdata in answers:
            mx_record = str(rdata.exchange).rstrip(".")
            mx_records.append(mx_record)
        return mx_records
    except Exception as e:
        logger.warning(f"MX lookup failed for {domain}: {str(e)}")
        return []

def get_txt_records(domain: str) -> List[str]:
    try:
        txt_records = []
        answers = resolver.resolve(domain, "TXT")
        for rdata in answers:
            txt_records.append(str(rdata))
        return txt_records
    except:
        return []

def detect_email_provider(mx_records: List[str], txt_records: List[str]) -> str:
    email_indicators = []
    
    # Check MX records
    for mx in mx_records:
        mx_lower = mx.lower()
        if "google" in mx_lower or "aspmx.l.google.com" in mx:
            email_indicators.append("Google Workspace")
        elif "outlook" in mx_lower or "protection.outlook" in mx_lower or "mail.protection.outlook.com" in mx:
            email_indicators.append("Microsoft 365")
        elif "zoho" in mx_lower:
            email_indicators.append("Zoho Mail")
        elif "yahoo" in mx_lower:
            email_indicators.append("Yahoo Mail")
        elif "protonmail" in mx_lower or "pm.me" in mx_lower:
            email_indicators.append("ProtonMail")
        elif "fastmail" in mx_lower:
            email_indicators.append("Fastmail")
    
    # Check TXT records for email verification
    for txt in txt_records:
        txt_lower = txt.lower()
        if "google-site-verification" in txt_lower:
            email_indicators.append("Google Workspace")
        elif "ms=" in txt_lower or "microsoft" in txt_lower:
            email_indicators.append("Microsoft 365")
        elif "zoho" in txt_lower:
            email_indicators.append("Zoho Mail")
    
    # Return the most common provider or Custom/Unknown
    if email_indicators:
        from collections import Counter
        most_common = Counter(email_indicators).most_common(1)
        return most_common[0][0]
    elif mx_records:
        return "Custom Email Provider"
    else:
        return "No Email Service Detected"

def extract_emails(domain: str) -> List[str]:
    try:
        # Try multiple pages
        pages_to_check = [
            f"https://{domain}",
            f"https://{domain}/contact",
            f"https://{domain}/contact-us",
            f"https://{domain}/about",
        ]
        
        all_emails = set()
        
        for page in pages_to_check:
            try:
                html = safe_fetch(page)
                if html:
                    # Improved email regex
                    emails = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', html)
                    # Filter out common false positives and ensure domain matches
                    valid_emails = [email for email in emails if domain in email and not email.endswith('.png') and not email.endswith('.jpg')]
                    all_emails.update(valid_emails)
            except:
                continue
        
        return list(all_emails)[:10]  # Return max 10 emails
    except Exception as e:
        logger.warning(f"Email extraction failed: {str(e)}")
        return []

# ---------------------- Technology Detection ----------------------

def detect_tech_stack(domain: str) -> Dict[str, List[str]]:
    try:
        tech_data = builtwith.parse(f"https://{domain}") or {}
        
        # Enhance with additional detection
        html = safe_fetch(f"https://{domain}")
        if html:
            soup = BeautifulSoup(html, 'html.parser')
            
            # Detect React
            if 'react' in html.lower() or 'react-dom' in html:
                tech_data.setdefault('javascript-frameworks', []).append('React')
            
            # Detect Vue.js
            if 'vue' in html.lower() or 'vue.js' in html:
                tech_data.setdefault('javascript-frameworks', []).append('Vue.js')
            
            # Detect Angular
            if 'angular' in html.lower():
                tech_data.setdefault('javascript-frameworks', []).append('Angular')
            
            # Detect jQuery
            if 'jquery' in html.lower():
                tech_data.setdefault('javascript-frameworks', []).append('jQuery')
        
        return tech_data
    except Exception as e:
        logger.error(f"Tech stack detection failed: {str(e)}")
        return {}

# ---------------------- Advanced WordPress Detection ----------------------

def detect_wordpress(domain: str) -> Dict[str, Any]:
    wp_info = {
        "Is WordPress": "No", 
        "Version": "Not Detected", 
        "Theme": "Not Detected",
        "Plugins": []
    }

    try:
        # Check multiple WordPress indicators
        indicators = {
            "wp-content": 0,
            "wp-includes": 0,
            "wp-json": 0,
            "wp-admin": 0,
            "xmlrpc.php": 0,
            "wp-embed": 0
        }
        
        html = safe_fetch(f"https://{domain}")
        if not html:
            return wp_info

        # Count WordPress signatures
        html_lower = html.lower()
        for indicator in indicators:
            indicators[indicator] = html_lower.count(indicator)
        
        total_score = sum(indicators.values())
        
        # Check additional WordPress endpoints
        wp_endpoints = [
            f"https://{domain}/wp-json/",
            f"https://{domain}/wp-login.php",
            f"https://{domain}/readme.html",
            f"https://{domain}/wp-admin/",
            f"https://{domain}/xmlrpc.php"
        ]
        
        endpoint_hits = 0
        for endpoint in wp_endpoints:
            try:
                response = session.head(endpoint, timeout=5, verify=False)
                if response.status_code < 400:
                    endpoint_hits += 1
            except:
                pass

        # Determine if WordPress
        is_wordpress = total_score >= 3 or endpoint_hits >= 2
        
        if is_wordpress:
            wp_info["Is WordPress"] = "Yes"
            
            # Detect WordPress version
            version_patterns = [
                r'<meta name="generator" content="WordPress ([0-9.]+)"',
                r'wp-embed-min\.js\?ver=([0-9.]+)',
                r'wp-includes/js/wp-embed\.js\?ver=([0-9.]+)',
                r'wordpress[^>]*?([0-9]+\.[0-9]+\.[0-9]+)',
                r'"version":"([0-9.]+)"',
            ]
            
            for pattern in version_patterns:
                match = re.search(pattern, html, re.IGNORECASE)
                if match:
                    wp_info["Version"] = match.group(1)
                    break
            
            # Detect theme
            theme_patterns = [
                r'/wp-content/themes/([^"/]+)/',
                r'themes/([^"/]+)/style\.css',
                r'"template":"([^"]+)"',
                r"'template':'([^']+)'"
            ]
            
            for pattern in theme_patterns:
                match = re.search(pattern, html, re.IGNORECASE)
                if match:
                    theme_name = match.group(1)
                    # Clean up theme name
                    theme_name = re.sub(r'[\'"]', '', theme_name)
                    theme_name = theme_name.title()
                    wp_info["Theme"] = theme_name
                    break
            
            # Detect common plugins
            common_plugins = {
                "Yoast SEO": [r'yoast', r'wpseo'],
                "WooCommerce": [r'woocommerce', r'wc-'],
                "Elementor": [r'elementor', r'e-elementor'],
                "Contact Form 7": [r'contact-form-7', r'wpcf7'],
                "Akismet": [r'akismet'],
                "Jetpack": [r'jetpack'],
                "Wordfence": [r'wordfence'],
                "All in One SEO": [r'aioseo'],
                "WP Rocket": [r'wp-rocket'],
            }
            
            detected_plugins = []
            for plugin, patterns in common_plugins.items():
                for pattern in patterns:
                    if re.search(pattern, html_lower):
                        detected_plugins.append(plugin)
                        break
            
            wp_info["Plugins"] = detected_plugins[:10]  # Limit to 10 plugins

    except Exception as e:
        logger.error(f"WordPress detection error: {str(e)}")

    return wp_info

# ---------------------- Advanced Ads Detection ----------------------

def detect_ads(domain: str) -> Dict[str, Any]:
    ads_result = {
        "ad_networks": [],
        "analytics_tools": [],
        "tracking_scripts": [],
        "social_media_pixels": []
    }
    
    try:
        html = safe_fetch(f"https://{domain}")
        if not html:
            return {"error": "Unable to scan website"}
        
        soup = BeautifulSoup(html, 'html.parser')
        
        # Comprehensive ad network patterns
        ad_patterns = {
            "Google Ads": [
                r"googlesyndication\.com",
                r"doubleclick\.net",
                r"googleadservices\.com",
                r"adsbygoogle",
                r"pagead2\.googlesyndication",
                r"googleads\.g\.doubleclick\.net"
            ],
            "Google AdSense": [
                r"pagead2\.googlesyndication\.com",
                r"adsense\.google\.com",
                r"googleads\.g\.doubleclick\.net"
            ],
            "Amazon Associates": [
                r"amazon-adsystem\.com",
                r"assoc-amazon\.com"
            ],
            "Media.net": [
                r"media\.net",
                r"contextual\.media\.net"
            ],
            "Propeller Ads": [
                r"propellerads\.com"
            ],
            "Adsterra": [
                r"adstera\.com"
            ],
            "Monetag": [
                r"monetag\.com"
            ]
        }
        
        # Analytics and tracking patterns
        analytics_patterns = {
            "Google Analytics": [
                r"google-analytics\.com",
                r"ga\([\"']",
                r"gtag\([\"']",
                r"googletagmanager\.com/gtag/js",
                r"analytics\.google\.com"
            ],
            "Google Tag Manager": [
                r"googletagmanager\.com/gtm\.js",
                r"googletagmanager\.com/ns\.html"
            ],
            "Facebook Pixel": [
                r"connect\.facebook\.net",
                r"fbq\([\"']",
                r"facebook\.com/tr\?",
                r"facebook\.com/tr/"
            ],
            "Microsoft Clarity": [
                r"clarity\.ms"
            ],
            "Hotjar": [
                r"hotjar\.com"
            ],
            "Mixpanel": [
                r"mixpanel\.com"
            ],
            "Amplitude": [
                r"amplitude\.com"
            ]
        }
        
        # Social media pixels
        social_pixels = {
            "Facebook Pixel": r"facebook\.com/tr",
            "LinkedIn Insight Tag": r"linkedin\.com/li\.js",
            "Twitter Pixel": r"tpxl\.com",
            "Pinterest Tag": r"ct\.pinterest\.com",
            "TikTok Pixel": r"tiktok\.com/i18n/pixel",
            "Snapchat Pixel": r"snapchat\.com/sc-pixel"
        }
        
        # Check all scripts
        all_scripts = []
        
        # External scripts
        for script in soup.find_all('script', src=True):
            all_scripts.append(script['src'])
        
        # Inline scripts
        for script in soup.find_all('script'):
            if script.string:
                all_scripts.append(script.string)
        
        # Check images and iframes too
        for img in soup.find_all('img', src=True):
            all_scripts.append(img['src'])
        
        for iframe in soup.find_all('iframe', src=True):
            all_scripts.append(iframe['src'])
        
        # Detect ad networks
        detected_ads = set()
        for network, patterns in ad_patterns.items():
            for pattern in patterns:
                for script in all_scripts:
                    if isinstance(script, str) and re.search(pattern, script, re.IGNORECASE):
                        detected_ads.add(network)
                        break
        
        # Detect analytics
        detected_analytics = set()
        for tool, patterns in analytics_patterns.items():
            for pattern in patterns:
                for script in all_scripts:
                    if isinstance(script, str) and re.search(pattern, script, re.IGNORECASE):
                        detected_analytics.add(tool)
                        break
        
        # Detect social pixels
        detected_pixels = set()
        for platform, pattern in social_pixels.items():
            for script in all_scripts:
                if isinstance(script, str) and re.search(pattern, script, re.IGNORECASE):
                    detected_pixels.add(platform)
                    break
        
        # Update results
        ads_result["ad_networks"] = list(detected_ads)
        ads_result["analytics_tools"] = list(detected_analytics)
        ads_result["social_media_pixels"] = list(detected_pixels)
        
        # Combine all for tracking scripts
        all_tracking = list(detected_ads) + list(detected_analytics) + list(detected_pixels)
        ads_result["tracking_scripts"] = all_tracking
        
    except Exception as e:
        logger.error(f"Ads detection failed: {str(e)}")
        ads_result["error"] = f"Ads detection failed: {str(e)}"
    
    return ads_result

# ---------------------- Security Audit ----------------------

def audit_security(domain: str) -> Dict[str, str]:
    security = {
        "SSL Certificate": "Invalid",
        "HSTS": "Not Found",
        "X-Frame-Options": "Not Found",
        "X-Content-Type-Options": "Not Found",
        "Content-Security-Policy": "Not Found",
        "Referrer-Policy": "Not Found",
    }

    try:
        # SSL Certificate check
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE

        with socket.create_connection((domain, 443), timeout=10) as sock:
            with context.wrap_socket(sock, server_hostname=domain) as ssock:
                cert = ssock.getpeercert()
                if cert:
                    security["SSL Certificate"] = "Valid"
                    # Check certificate expiration
                    not_after = cert.get('notAfter', '')
                    if not_after:
                        exp_date = datetime.strptime(not_after, '%b %d %H:%M:%S %Y %Z')
                        days_until_expiry = (exp_date - datetime.now()).days
                        security["SSL Expiry"] = f"{days_until_expiry} days"

        # Security headers check
        response = session.get(f"https://{domain}", timeout=10, verify=False)
        headers = response.headers

        security_headers = {
            "Strict-Transport-Security": "HSTS",
            "X-Frame-Options": "X-Frame-Options",
            "X-Content-Type-Options": "X-Content-Type-Options",
            "Content-Security-Policy": "Content-Security-Policy",
            "Referrer-Policy": "Referrer-Policy",
        }

        for header, key in security_headers.items():
            if headers.get(header):
                security[key] = "Present"
            else:
                security[key] = "Not Found"

    except Exception as e:
        logger.warning(f"Security audit issue: {str(e)}")

    return security

# ---------------------- Performance Analysis ----------------------

def analyze_performance(domain: str) -> Dict[str, Any]:
    try:
        start_time = time.time()
        response = session.get(f"https://{domain}", timeout=15, verify=False)
        load_time = time.time() - start_time
        
        page_size = len(response.content) / 1024  # KB
        header_size = len(str(response.headers).encode('utf-8')) / 1024  # KB
        
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
            "Page Size": f"{page_size:.1f} KB",
            "Headers Size": f"{header_size:.1f} KB",
            "Total Size": f"{page_size + header_size:.1f} KB",
            "Score": score,
            "Status": response.status_code,
        }
    except Exception as e:
        logger.warning(f"Performance analysis failed: {str(e)}")
        return {
            "Load Time": "Failed to measure",
            "Page Size": "Unknown",
            "Headers Size": "Unknown",
            "Total Size": "Unknown",
            "Score": "Unknown",
            "Status": "Unknown",
        }

# ---------------------- Routes ----------------------

@app.get("/")
def home():
    return {"message": "Domain Audit API", "version": "2.5", "status": "active"}

@app.get("/audit/{domain}")
def audit_domain(domain: str):
    start_time = time.time()
    domain = normalize_domain(domain)
    
    if not domain or len(domain) < 3:
        return JSONResponse({"error": "Invalid domain"}, status_code=400)

    try:
        # Get DNS records in parallel (conceptually)
        mx_records = get_mx_records(domain)
        txt_records = get_txt_records(domain)
        
        results = {
            "Domain": domain,
            "Domain Info": get_whois_info(domain),
            "Hosting": get_hosting_info(domain),
            "Email Setup": {
                "Provider": detect_email_provider(mx_records, txt_records),
                "MX Records": mx_records,
                "TXT Records": txt_records,
                "Contact Emails": extract_emails(domain),
            },
            "Website Tech": detect_tech_stack(domain),
            "WordPress": detect_wordpress(domain),
            "Advertising": detect_ads(domain),
            "Security": audit_security(domain),
            "Performance": analyze_performance(domain),
            "Audit Date": datetime.now().strftime("%B %d, %Y at %I:%M %p"),
            "Processing Time": f"{time.time() - start_time:.2f}s"
        }

        return JSONResponse(results)
    
    except Exception as e:
        logger.error(f"Audit failed for {domain}: {str(e)}")
        return JSONResponse({"error": f"Audit failed: {str(e)}"}, status_code=500)

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

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
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
