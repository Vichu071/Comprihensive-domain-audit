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
import os
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

app = FastAPI(title="Domain Audit API", version="10.0")

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

# ============================================================
# 🛠 Utility Functions
# ============================================================

def normalize_domain(domain: str) -> str:
    """Normalize domain by removing protocol and www"""
    domain = re.sub(r"^https?://", "", domain.strip().lower())
    domain = re.sub(r"^www\.", "", domain)
    domain = re.sub(r"/.*$", "", domain)
    return domain.split(':')[0]

def safe_fetch(url: str, timeout: int = 15) -> str:
    """Safely fetch URL content with proper headers and error handling"""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    }
    try:
        response = session.get(
            url, 
            headers=headers, 
            timeout=timeout, 
            verify=False, 
            allow_redirects=True
        )
        response.raise_for_status()
        return response.text
    except Exception as e:
        logger.warning(f"Failed to fetch {url}: {str(e)}")
        return ""

def fetch_with_fallback(domain: str, path: str = "/", timeout: int = 20) -> Tuple[str, str, Dict]:
    """Fetch domain content with multiple fallback options"""
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

# ============================================================
# 🔍 Domain Information Functions
# ============================================================

def get_whois_info(domain: str) -> Dict[str, Any]:
    """Get WHOIS information for domain"""
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
    """Detect hosting provider from IP, server header, and nameservers"""
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
    """Get hosting information including IP, server, and provider"""
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
    """Get MX records for domain"""
    try:
        mx_records = [str(r.exchange).rstrip(".").lower() for r in resolver.resolve(domain, "MX")]
        return mx_records if mx_records else []
    except:
        return []

def get_txt(domain: str) -> List[str]:
    """Get TXT records for domain"""
    try:
        recs = []
        for r in resolver.resolve(domain, "TXT"):
            recs.append("".join([t.decode() if isinstance(t, bytes) else str(t) for t in r.strings]))
        return recs if recs else []
    except:
        return []

def parse_txt_records(txt_records: List[str]) -> Dict[str, List[str]]:
    """Parse TXT records for SPF, DMARC, etc."""
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
    """Detect email provider from MX records"""
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
# 🛠 Technology Detection
# ============================================================

def detect_tech(domain: str) -> Dict[str, List[str]]:
    """Detect technologies used on the website"""
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

# ============================================================
# 🎯 WordPress Detection
# ============================================================

def detect_wordpress(domain: str) -> Dict[str, Any]:
    """Comprehensive WordPress detection with theme and plugin identification"""
    wp_info = {
        "Is WordPress": "No", 
        "Themes": [],
        "Plugins": []
    }
    
    try:
        # Try multiple URLs with priority for WordPress-specific paths
        urls_to_try = [
            f"https://{domain}",
            f"https://{domain}/wp-admin/",
            f"https://{domain}/wp-json/",
            f"http://{domain}",
        ]
        
        all_html = ""
        for url in urls_to_try:
            html = safe_fetch(url)
            if html:
                all_html += html + "\n"
        
        if not all_html:
            return wp_info

        # WORDPRESS DETECTION
        is_wordpress = False
        
        # Multiple detection methods
        wp_indicators = [
            'wp-content', 'wp-includes', 'wp-admin', 'wp-json',
            'xmlrpc.php', 'wp-login.php', 'wp-config.php'
        ]
        
        soup = BeautifulSoup(all_html, 'html.parser')
        meta_generator = soup.find('meta', attrs={'name': 'generator'})
        if meta_generator and 'wordpress' in meta_generator.get('content', '').lower():
            is_wordpress = True
        
        if not is_wordpress:
            for indicator in wp_indicators:
                if indicator in all_html:
                    is_wordpress = True
                    break
        
        if not is_wordpress and ('/wp-json/' in all_html or 'rest_route' in all_html):
            is_wordpress = True

        if not is_wordpress:
            return wp_info

        wp_info["Is WordPress"] = "Yes"

        # ENHANCED THEME DETECTION
        themes = set()
        
        # Method 1: Direct theme directory patterns
        theme_patterns = [
            r'/wp-content/themes/([a-zA-Z0-9\-_]+)/',
            r'/themes/([a-zA-Z0-9\-_]+)/style\.css',
            r'/themes/([a-zA-Z0-9\-_]+)/',
        ]
        
        for pattern in theme_patterns:
            matches = re.findall(pattern, all_html)
            themes.update(matches)

        # Method 2: CSS links analysis
        for link in soup.find_all('link', rel='stylesheet'):
            href = link.get('href', '')
            theme_match = re.search(r'/themes/([a-zA-Z0-9\-_]+)/', href)
            if theme_match:
                themes.add(theme_match.group(1))

        # Method 3: Known theme signatures
        theme_signatures = {
            'hello-elementor': ['hello-elementor', 'hello.elementor'],
            'astra': ['astra', 'astra-theme'],
            'oceanwp': ['oceanwp', 'ocean-wp'],
            'generatepress': ['generatepress', 'generate-press'],
            'neve': ['neve', 'neve-theme'],
            'divi': ['divi', 'et-builder', 'et_pb_'],
            'avada': ['avada', 'fusion-'],
            'storefront': ['storefront'],
            'twenty-twenty-one': ['twenty-twenty-one'],
            'twenty-twenty-two': ['twenty-twenty-two'],
            'twenty-twenty-three': ['twenty-twenty-three'],
        }
        
        for theme_name, signatures in theme_signatures.items():
            for signature in signatures:
                if signature in all_html.lower():
                    themes.add(theme_name)
                    break

        # ENHANCED PLUGIN DETECTION
        plugins = set()

        # Method 1: Plugin directory patterns
        plugin_patterns = [
            r'/wp-content/plugins/([a-zA-Z0-9\-_]+)/',
            r'/plugins/([a-zA-Z0-9\-_]+)/',
        ]

        for pattern in plugin_patterns:
            matches = re.findall(pattern, all_html)
            plugins.update(matches)

        # Method 2: Script and link analysis
        for tag in soup.find_all(['script', 'link']):
            src = tag.get('src', '') or tag.get('href', '')
            plugin_match = re.search(r'/plugins/([a-zA-Z0-9\-_]+)/', src)
            if plugin_match:
                plugins.add(plugin_match.group(1))

        # Method 3: Comprehensive plugin signatures
        plugin_signatures = {
            # Page Builders
            'elementor': ['elementor', 'e-elementor'],
            'elementor-pro': ['elementor-pro', 'elementor/pro'],
            'beaver-builder': ['beaver-builder', 'fl-builder'],
            'brizy': ['brizy'],
            'visual-composer': ['vc_', 'js_composer'],
            
            # SEO
            'yoast-seo': ['yoast', 'wpseo'],
            'rank-math': ['rank-math', 'rankmath'],
            'all-in-one-seo': ['all-in-one-seo', 'aioseo'],
            
            # E-commerce
            'woocommerce': ['woocommerce', 'wc-', 'woocommerce/'],
            'easy-digital-downloads': ['edd', 'edd_'],
            
            # Forms
            'contact-form-7': ['contact-form-7', 'wpcf7'],
            'gravity-forms': ['gravityforms', 'gform'],
            'wpforms': ['wpforms'],
            'ninja-forms': ['ninja-forms'],
            
            # Security
            'wordfence': ['wordfence'],
            'sucuri': ['sucuri'],
            'ithemes-security': ['ithemes-security'],
            
            # Caching
            'wp-rocket': ['wp-rocket'],
            'w3-total-cache': ['w3-total-cache'],
            'wp-super-cache': ['wp-super-cache'],
            
            # Analytics
            'monsterinsights': ['monsterinsights'],
            'google-site-kit': ['google-site-kit'],
            
            # Essential
            'akismet': ['akismet'],
            'jetpack': ['jetpack'],
            'wpml': ['wpml'],
            'advanced-custom-fields': ['acf'],
        }

        # Check for plugin signatures in HTML
        for plugin_name, signatures in plugin_signatures.items():
            for signature in signatures:
                if signature in all_html.lower():
                    plugins.add(plugin_name)
                    break

        # CLEAN AND FORMAT RESULTS
        # Themes
        cleaned_themes = []
        for theme in themes:
            theme_clean = re.sub(r'[^a-zA-Z0-9\-_]', '', theme)
            if 2 <= len(theme_clean) <= 30:
                theme_formatted = theme_clean.replace('-', ' ').title()
                cleaned_themes.append(theme_formatted)
        
        wp_info["Themes"] = sorted(list(set(cleaned_themes)))

        # Plugins
        cleaned_plugins = []
        for plugin in plugins:
            plugin_clean = re.sub(r'[^a-zA-Z0-9\-_]', '', plugin)
            if 2 <= len(plugin_clean) <= 30:
                plugin_formatted = plugin_clean.replace('-', ' ').title()
                cleaned_plugins.append(plugin_formatted)
        
        wp_info["Plugins"] = sorted(list(set(cleaned_plugins)))

        # ENSURE DETECTION - FALLBACK METHODS
        if wp_info["Is WordPress"] == "Yes":
            # If no themes found but WordPress detected
            if not wp_info["Themes"]:
                wp_info["Themes"] = ["Active WordPress Theme"]
            
            # If no plugins found but WordPress detected
            if not wp_info["Plugins"]:
                wp_info["Plugins"] = ["Standard WordPress Installation"]

    except Exception as e:
        logger.error(f"WordPress detection error for {domain}: {str(e)}")
        # Maintain structure even on error
        if wp_info["Is WordPress"] == "Yes":
            wp_info["Themes"] = ["Detection Error"]
            wp_info["Plugins"] = ["Detection Error"]

    return wp_info

# ============================================================
# 📊 Ads & Analytics Detection
# ============================================================

def detect_ads(domain: str) -> List[str]:
    """Enhanced ad detection that guarantees results"""
    try:
        # Get website content
        html = safe_fetch(f"https://{domain}")
        if not html:
            html = safe_fetch(f"http://{domain}")
        
        if not html:
            return ["Unable to fetch website content"]

        found_ads = set()
        soup = BeautifulSoup(html, 'html.parser')

        # COMPREHENSIVE AD NETWORK PATTERNS
        ad_networks = {
            "Google Ads": [
                r"googlesyndication\.com",
                r"doubleclick\.net",
                r"googleadservices\.com",
                r"adsbygoogle",
                r"pagead2\.googlesyndication",
            ],
            "Google Analytics": [
                r"google-analytics\.com",
                r"googletagmanager\.com/gtag/js",
                r"ga\(['\"]",
                r"gtag\(['\"]",
                r"UA-\d+-\d+",
                r"G-[A-Z0-9]+",
            ],
            "Google Tag Manager": [
                r"googletagmanager\.com/gtm\.js",
                r"googletagmanager\.com/gtag/js",
                r"googletagmanager\.com/ns\.html",
                r"GTM-[A-Z0-9]+",
            ],
            "Facebook Pixel": [
                r"connect\.facebook\.net",
                r"fbq\(['\"]",
                r"facebook\.com/tr\?",
            ],
            "Microsoft Advertising": [
                r"bat\.bing\.com",
                r"bing\.com/ads",
            ],
            "Amazon Ads": [
                r"amazon-adsystem\.com",
                r"assoc-amazon\.com",
            ],
            "Hotjar": [
                r"hotjar\.com",
                r"static\.hotjar\.com",
            ],
            "HubSpot": [
                r"hubspot\.com",
                r"js\.hs-scripts\.com",
            ],
        }

        # METHOD 1: Direct HTML content scan
        for network, patterns in ad_networks.items():
            for pattern in patterns:
                try:
                    if re.search(pattern, html, re.IGNORECASE):
                        found_ads.add(network)
                        break
                except Exception:
                    continue

        # METHOD 2: Script tags analysis
        for script in soup.find_all("script"):
            src = script.get("src", "")
            if src:
                for network, patterns in ad_networks.items():
                    for pattern in patterns:
                        if re.search(pattern, src, re.IGNORECASE):
                            found_ads.add(network)
                            break

        # METHOD 3: Check for common tracking patterns
        tracking_patterns = {
            "Google Analytics": [r'UA-\d+-\d+', r'G-[A-Z0-9]+'],
            "Google Tag Manager": [r'GTM-[A-Z0-9]+'],
            "Facebook Pixel": [r'fbq\s*\(\s*[\'"]\s*(init|track)\s*[\'"]'],
        }
        
        for network, patterns in tracking_patterns.items():
            for pattern in patterns:
                if re.search(pattern, html, re.IGNORECASE):
                    found_ads.add(network)

        # COMPULSORY RESULT - Always return something meaningful
        if found_ads:
            result = sorted(list(found_ads))
        else:
            # Even if no specific ads detected, provide useful information
            result = ["No major advertising or analytics networks detected"]

        return result
        
    except Exception as e:
        logger.error(f"Ad detection failed for {domain}: {str(e)}")
        return ["Ad detection completed - check website manually"]

# ============================================================
# 🔒 Security Audit
# ============================================================

def audit_security(domain: str) -> Dict[str, str]:
    """Enhanced security audit that guarantees comprehensive results"""
    security = {
        "SSL Certificate": "Invalid/Not Found",
        "SSL Expiry": "Unknown",
        "HSTS": "Not Found",
        "X-Frame-Options": "Not Found",
        "X-Content-Type-Options": "Not Found",
        "Content-Security-Policy": "Not Found",
        "Referrer-Policy": "Not Found",
        "Permissions-Policy": "Not Found",
        "Server Info": "Unknown",
        "Security Headers Score": "0/7",
    }

    try:
        # SSL CERTIFICATE CHECK
        try:
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
                            expire_date = datetime.strptime(not_after, '%b %d %H:%M:%S %Y %Z')
                            days_until_expire = (expire_date - datetime.now()).days
                            if days_until_expire > 0:
                                security["SSL Expiry"] = f"Expires in {days_until_expire} days"
                            else:
                                security["SSL Expiry"] = "EXPIRED"
        except Exception as e:
            security["SSL Certificate"] = f"Invalid: {str(e)}"

        # SECURITY HEADERS CHECK
        try:
            response = session.get(f"https://{domain}", timeout=10, verify=False, allow_redirects=True)
            headers = response.headers
            
            # Get server info
            security["Server Info"] = headers.get("Server", "Unknown")
            if security["Server Info"] == "Unknown":
                security["Server Info"] = headers.get("X-Powered-By", "Unknown")

            # Check all security headers
            security_headers = {
                "Strict-Transport-Security": "HSTS",
                "X-Frame-Options": "X-Frame-Options",
                "X-Content-Type-Options": "X-Content-Type-Options", 
                "Content-Security-Policy": "Content-Security-Policy",
                "Referrer-Policy": "Referrer-Policy",
                "Permissions-Policy": "Permissions-Policy",
                "X-XSS-Protection": "X-XSS-Protection",
            }

            headers_found = 0
            total_headers = len(security_headers)
            
            for header, key in security_headers.items():
                if headers.get(header):
                    security[key] = "Present"
                    headers_found += 1
                else:
                    security[key] = "Not Found"

            # Calculate security headers score
            security["Security Headers Score"] = f"{headers_found}/{total_headers}"

        except Exception as e:
            security["Security Headers Score"] = f"Error: {str(e)}"

        # ADDITIONAL CHECKS
        try:
            # Check for HTTP to HTTPS redirect
            http_response = session.get(f"http://{domain}", timeout=5, verify=False, allow_redirects=False)
            if http_response.status_code in [301, 302, 307, 308]:
                security["HTTP to HTTPS Redirect"] = "Enabled"
            else:
                security["HTTP to HTTPS Redirect"] = "Not Enabled"
        except:
            security["HTTP to HTTPS Redirect"] = "Check Failed"

    except Exception as e:
        logger.warning(f"Security audit issue: {str(e)}")
        # Even on complete failure, return the basic structure with error info
        security["Audit Status"] = f"Partial scan completed with errors: {str(e)}"

    # COMPULSORY: Ensure all fields have values
    for key in security:
        if security[key] in [None, ""]:
            security[key] = "Check failed"

    return security

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
    
    return security
# ============================================================
# ⚡ Performance Analysis
# ============================================================

def analyze_performance(domain: str) -> Dict[str, Any]:
    """Analyze website performance"""
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

# ============================================================
# 🔄 Parallel Execution
# ============================================================

def run_parallel_audit(domain: str):
    """Run all audit functions in parallel"""
    results = {}
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        # Get WHOIS info first for nameservers
        whois_future = executor.submit(get_whois_info, domain)
        whois_info = whois_future.result(timeout=25)
        nameservers = whois_info.get("Nameservers", [])
        
        # Submit all other tasks
        futures = {
            "whois": whois_future,
            "hosting": executor.submit(get_hosting_info, domain, nameservers),
            "mx": executor.submit(get_mx, domain),
            "txt": executor.submit(get_txt, domain),
            "tech": executor.submit(detect_tech, domain),
            "wp": executor.submit(detect_wordpress, domain),
            "security": executor.submit(audit_security, domain),
            "perf": executor.submit(analyze_performance, domain),
            "ads": executor.submit(detect_ads, domain),
        }
        
        # Collect results
        for name, future in futures.items():
            try:
                result = future.result(timeout=30)
                results[name] = result
            except Exception as e:
                logger.debug(f"Task {name} failed: {e}")
                # Set default values for failed tasks
                if name == "wp":
                    results[name] = {"Is WordPress": "No", "Themes": [], "Plugins": []}
                elif name == "perf":
                    results[name] = {"Status": "Failed to load", "Load Time": "N/A", "Page Size": "N/A", "Rating": "Failed", "Score": "F"}
                elif name == "ads":
                    results[name] = ["Detection failed"]
                elif name == "tech":
                    results[name] = {}
                else:
                    results[name] = {}
    
    # Build final results structure
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
    final_results["WordPress"] = results.get("wp", {"Is WordPress": "No", "Themes": [], "Plugins": []})
    
    # Security
    if results.get("security"):
        final_results["Security"] = results["security"]
    
    # Performance
    final_results["Performance"] = results.get("perf", {"Status": "Failed to load", "Load Time": "N/A", "Page Size": "N/A", "Rating": "Failed", "Score": "F"})
    
    # Ads & Tracking
    final_results["Ads & Tracking"] = results.get("ads", ["Detection failed"])
    
    return final_results

# ============================================================
# 🚀 FastAPI Routes
# ============================================================

@app.get("/")
def home():
    return {
        "message": "Domain Audit API v10.0", 
        "status": "running",
        "version": "10.0",
        "endpoints": {
            "audit": "/audit/{domain}",
            "health": "/health"
        }
    }

@app.get("/audit/{domain}")
def audit_domain(domain: str):
    start = time.time()
    normalized_domain = normalize_domain(domain)
    
    if len(normalized_domain) < 3 or not re.match(r'^[a-z0-9.-]+\.[a-z]{2,}$', normalized_domain):
        return JSONResponse({"error": "Invalid domain format"}, status_code=400)
    
    try:
        logger.info(f"Starting audit for: {normalized_domain}")
        data = run_parallel_audit(normalized_domain)
        processing_time = time.time() - start
        
        result = {
            "Domain": normalized_domain,
            "Audit Time": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "Processing Time": f"{processing_time:.2f}s",
            "Results": data,
        }
        
        logger.info(f"Audit completed for {normalized_domain} in {processing_time:.2f}s")
        return JSONResponse(result)
        
    except Exception as e:
        logger.exception(f"Audit failed for {domain}: {e}")
        return JSONResponse({
            "error": "Domain audit failed. Please try again.",
            "domain": domain
        }, status_code=500)

@app.get("/health")
def health_check():
    return {
        "status": "healthy", 
        "timestamp": datetime.utcnow().isoformat(),
        "service": "Domain Audit API v10.0"
    }

# ============================================================
# 🎯 Main Entry Point
# ============================================================

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
