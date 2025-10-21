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

def detect_wordpress(domain: str) -> Dict[str, Any]:
    wp_info = {
        "Is WordPress": "No", 
        "Theme": "Not Detected",
        "Plugins": []
    }
    
    try:
        # Try multiple URLs with priority for WordPress-specific paths
        urls_to_try = [
            f"https://{domain}/wp-login.php",
            f"https://{domain}/wp-admin/",
            f"https://{domain}/readme.html",
            f"https://{domain}/wp-json/",
            f"https://{domain}/feed/",
            f"https://{domain}/sitemap.xml",
            f"https://{domain}/robots.txt",
            f"https://{domain}",
            f"http://{domain}/wp-login.php",
            f"http://{domain}/wp-admin/",
            f"http://{domain}",
        ]
        
        all_html = ""
        for url in urls_to_try:
            html = safe_fetch(url)
            if html:
                all_html += html + "\n"  # Combine all HTML content
        
        if not all_html:
            return wp_info

        # WORDPRESS DETECTION - MULTIPLE RELIABLE METHODS
        is_wordpress = False
        wp_indicators_found = []
        
        # Method 1: WordPress meta generator tag (Strongest indicator)
        soup = BeautifulSoup(all_html, 'html.parser')
        meta_generator = soup.find('meta', attrs={'name': 'generator'})
        if meta_generator and 'wordpress' in meta_generator.get('content', '').lower():
            is_wordpress = True
            wp_indicators_found.append("Meta Generator")
        
        # Method 2: Essential WordPress directories
        essential_dirs = ['wp-content', 'wp-includes', 'wp-admin']
        for dir in essential_dirs:
            if dir in all_html:
                is_wordpress = True
                wp_indicators_found.append(f"{dir} directory")
                break
        
        # Method 3: WordPress REST API
        if '/wp-json/' in all_html or 'rest_route' in all_html:
            is_wordpress = True
            wp_indicators_found.append("REST API")
        
        # Method 4: WordPress core files
        core_files = ['xmlrpc.php', 'wp-login.php', 'wp-config.php']
        for file in core_files:
            if file in all_html:
                is_wordpress = True
                wp_indicators_found.append(f"{file} file")
                break
        
        # Method 5: WordPress-specific classes
        wp_classes = ['wp-block-', 'menu-item-', 'widget_', 'sidebar-', 'wp-caption']
        for wp_class in wp_classes:
            if wp_class in all_html:
                is_wordpress = True
                wp_indicators_found.append(f"{wp_class} class")
                break

        if not is_wordpress:
            return wp_info

        wp_info["Is WordPress"] = "Yes"

        # COMPULSORY THEME DETECTION - MULTIPLE METHODS
        theme_candidates = set()
        
        # Method 1: Theme directory patterns in URLs
        theme_patterns = [
            r'/wp-content/themes/([^/"\']+)/',
            r'/themes/([^/"\']+)/style\.css',
            r'/themes/([^/"\']+)/',
            r'wp-content/themes/([^/"\']+)/',
        ]
        
        for pattern in theme_patterns:
            matches = re.findall(pattern, all_html, re.IGNORECASE)
            for match in matches:
                if len(match) > 1:
                    theme_name = re.sub(r'[^a-zA-Z0-9\-_\.]', '', match)
                    if 2 <= len(theme_name) <= 50:  # Reasonable theme name length
                        theme_candidates.add(theme_name)
        
        # Method 2: Stylesheet links analysis
        for link in soup.find_all('link', rel='stylesheet'):
            href = link.get('href', '')
            # Multiple patterns for theme detection in CSS links
            patterns = [
                r'/themes/([^/]+)/',
                r'wp-content/themes/([^/]+)/',
                r'theme=(.+?)&',
                r'ver=.+?/([^/]+)/style',
            ]
            for pattern in patterns:
                theme_match = re.search(pattern, href, re.IGNORECASE)
                if theme_match:
                    theme_name = theme_match.group(1)
                    if 2 <= len(theme_name) <= 50:
                        theme_candidates.add(theme_name)
        
        # Method 3: Script tags analysis for theme data
        for script in soup.find_all('script'):
            script_content = script.string or ""
            # Look for theme data in JavaScript
            theme_patterns_js = [
                r'theme[\"\' ]*:[\"\' ]*[\"\' ]([^\"\',]+)[\"\']',
                r'theme_name[\"\' ]*:[\"\' ]*[\"\' ]([^\"\',]+)[\"\']',
                r'template[\"\' ]*:[\"\' ]*[\"\' ]([^\"\',]+)[\"\']',
                r'stylesheet[\"\' ]*:[\"\' ]*[\"\' ]([^\"\',]+)[\"\']',
            ]
            for pattern in theme_patterns_js:
                matches = re.findall(pattern, script_content, re.IGNORECASE)
                for match in matches:
                    if 2 <= len(match) <= 50:
                        theme_candidates.add(match)
        
        # Method 4: Meta tags for theme
        for meta in soup.find_all('meta'):
            content = meta.get('content', '')
            if 'theme' in content.lower() or 'template' in content.lower():
                theme_match = re.search(r'([a-zA-Z0-9\-_\.]+theme[a-zA-Z0-9\-_\.]*)', content, re.IGNORECASE)
                if theme_match:
                    theme_candidates.add(theme_match.group(1))
        
        # Method 5: Body classes for theme
        body = soup.find('body')
        if body:
            body_classes = body.get('class', [])
            for cls in body_classes:
                if 'theme' in cls.lower() and len(cls) > 5:
                    theme_candidates.add(cls.replace('theme-', '').replace('-theme', ''))
        
        # FINAL THEME SELECTION
        if theme_candidates:
            # Filter out common false positives
            filtered_themes = []
            for theme in theme_candidates:
                theme_lower = theme.lower()
                # Exclude common non-theme strings
                if not any(exclude in theme_lower for exclude in [
                    'http', 'https', 'www.', '.com', '.org', '.net', 
                    'wp-content', 'wp-includes', 'javascript', 'function',
                    'undefined', 'null', 'true', 'false'
                ]) and len(theme) >= 2:
                    filtered_themes.append(theme)
            
            if filtered_themes:
                # Choose the most likely theme (usually the one that appears most or is longest)
                wp_info["Theme"] = max(filtered_themes, key=len).title()
            else:
                wp_info["Theme"] = "Detected but cannot identify name"
        else:
            wp_info["Theme"] = "WordPress theme detected but name not found"

        # COMPULSORY PLUGIN DETECTION - COMPREHENSIVE METHODS
        plugins = set()
        
        # Method 1: Plugin directory patterns
        plugin_patterns = [
            r'/wp-content/plugins/([^/"\']+)/',
            r'plugins/([^/"\']+)/',
            r'wp-content/plugins/([^/]+)/',
            r'/plugins/([^/]+)/',
        ]
        
        for pattern in plugin_patterns:
            plugin_matches = re.findall(pattern, all_html, re.IGNORECASE)
            for plugin in plugin_matches:
                if len(plugin) > 2:
                    plugin_name = re.sub(r'[^a-zA-Z0-9\-_]', '', plugin)
                    if plugin_name and 2 <= len(plugin_name) <= 50:
                        plugins.add(plugin_name)
        
        # Method 2: Script and link tags analysis
        for tag in soup.find_all(['script', 'link', 'img']):
            src = tag.get('src', '') or tag.get('href', '')
            if src:
                # Look for plugins in asset URLs
                plugin_match = re.search(r'/plugins/([^/]+)/', src)
                if plugin_match:
                    plugin_name = plugin_match.group(1)
                    if 2 <= len(plugin_name) <= 50:
                        plugins.add(plugin_name)
        
        # Method 3: Comprehensive known plugin detection
        known_plugins = {
            # SEO & Marketing
            'yoast-seo': ['yoast', 'wpseo', 'yoast-seo'],
            'all-in-one-seo': ['all-in-one-seo', 'aioseo'],
            'rank-math': ['rank-math', 'rankmath'],
            'google-site-kit': ['google-site-kit', 'googlesitekit'],
            
            # E-commerce
            'woocommerce': ['woocommerce', 'wc-', 'woo-'],
            'easy-digital-downloads': ['edd-', 'easy-digital-downloads'],
            
            # Page Builders
            'elementor': ['elementor'],
            'divi-builder': ['et-builder', 'et_pb', 'divi'],
            'beaver-builder': ['beaver-builder', 'fl-builder'],
            'visual-composer': ['vc_', 'js_composer'],
            'brizy': ['brizy'],
            
            # Forms
            'contact-form-7': ['contact-form-7', 'wpcf7'],
            'gravity-forms': ['gravityforms', 'gform'],
            'wpforms': ['wpforms'],
            'ninja-forms': ['ninja-forms'],
            
            # Security
            'wordfence': ['wordfence'],
            'sucuri': ['sucuri'],
            'ithemes-security': ['ithemes-security', 'better-wp-security'],
            
            # Caching & Performance
            'wp-rocket': ['wp-rocket', 'rocket-'],
            'w3-total-cache': ['w3-total-cache', 'w3tc'],
            'wp-super-cache': ['wp-super-cache'],
            'autoptimize': ['autoptimize'],
            
            # Analytics
            'monsterinsights': ['monsterinsights'],
            'google-analytics-dashboard': ['gadwp'],
            
            # Backup
            'updraftplus': ['updraftplus'],
            'backwpup': ['backwpup'],
            
            # Social & Sharing
            'sharethis': ['sharethis'],
            'add-to-any': ['add-to-any'],
            'social-warfare': ['social-warfare'],
            
            # Images & Media
            'smush': ['smush', 'wp-smush'],
            'imagify': ['imagify'],
            'envira-gallery': ['envira-gallery'],
            
            # Membership
            'memberpress': ['memberpress'],
            'restrict-content': ['restrict-content'],
            
            # LMS
            'learnpress': ['learnpress'],
            'learndash': ['learndash'],
            'lifterlms': ['lifterlms'],
            
            # Other Popular
            'akismet': ['akismet'],
            'jetpack': ['jetpack'],
            'wpml': ['wpml'],
            'polylang': ['polylang'],
            'redux-framework': ['redux-framework'],
            'advanced-custom-fields': ['acf'],
            'custom-post-type-ui': ['cpt-ui'],
        }
        
        for plugin_name, indicators in known_plugins.items():
            for indicator in indicators:
                if indicator in all_html.lower():
                    plugins.add(plugin_name)
                    break
        
        # Method 4: Plugin-specific classes and IDs
        plugin_classes = [
            ('woocommerce', 'woocommerce'),
            ('elementor', 'elementor'),
            ('divi-builder', 'et_pb'),
            ('avada', 'fusion'),
            ('visual-composer', 'vc_'),
            ('revslider', 'rev_slider'),
            ('wpml', 'wpml'),
            ('contact-form-7', 'wpcf7'),
            ('gravity-forms', 'gform'),
        ]
        
        for plugin_name, class_pattern in plugin_classes:
            if class_pattern in all_html:
                plugins.add(plugin_name)
        
        # Method 5: Check for plugin comments
        plugin_comments = re.findall(r'Plugin Name:\s*([^\n]+)', all_html)
        plugins.update([p.strip().lower() for p in plugin_comments])
        
        # Filter and clean plugin names
        filtered_plugins = []
        for plugin in plugins:
            plugin_clean = re.sub(r'[^a-zA-Z0-9\-_]', '', plugin)
            if 2 <= len(plugin_clean) <= 50:
                filtered_plugins.append(plugin_clean)
        
        wp_info["Plugins"] = sorted(list(set(filtered_plugins)))
        
        # If no plugins detected but it's WordPress, add a note
        if not wp_info["Plugins"] and wp_info["Is WordPress"] == "Yes":
            wp_info["Plugins"] = ["No specific plugins detected (may be using minimal plugins)"]

    except Exception as e:
        logger.error(f"WordPress detection error for {domain}: {str(e)}")
        # Even if there's an error, return basic structure
        if wp_info["Is WordPress"] == "Yes":
            wp_info["Theme"] = "Detection failed"
            wp_info["Plugins"] = ["Detection failed"]

    return wp_info
    
def detect_ads(domain: str) -> List[str]:
    """Enhanced ad detection that guarantees results."""
    try:
        # Try multiple URLs to ensure we get content
        urls_to_try = [
            f"https://{domain}",
            f"https://{domain}/",
            f"http://{domain}",
            f"http://{domain}/",
        ]
        
        html = ""
        for url in urls_to_try:
            html = safe_fetch(url)
            if html:
                break
        
        if not html:
            return ["Unable to fetch website content"]

        found_ads = set()
        soup = BeautifulSoup(html, "html.parser")

        # COMPREHENSIVE AD NETWORK PATTERNS
        ad_networks = {
            "Google Ads": [
                r"googlesyndication\.com", r"doubleclick\.net", r"googleadservices\.com",
                r"adsbygoogle", r"pagead2\.googlesyndication", r"googleads\.g\.doubleclick\.net",
                r"www\.googletagservices\.com", r"ad\.doubleclick\.net",
            ],
            "Google AdSense": [
                r"pagead2\.googlesyndication\.com", r"googleads\.g\.doubleclick\.net",
                r"ads\..*\.google\.com", r"googleadservices\.com/pagead/",
            ],
            "Google Analytics": [
                r"google-analytics\.com", r"googletagmanager\.com/gtag/js",
                r"ga\(['\"]", r"gtag\(['\"]", r"UA-\d+-\d+", r"G-[A-Z0-9]+",
            ],
            "Google Tag Manager": [
                r"googletagmanager\.com/gtm\.js", r"googletagmanager\.com/gtag/js",
                r"googletagmanager\.com/ns\.html", r"GTM-[A-Z0-9]+",
            ],
            "Facebook Pixel": [
                r"connect\.facebook\.net", r"fbq\(['\"]", r"facebook\.com/tr",
                r"fbclid=", r"pixel\.facebook\.com",
            ],
            "Microsoft Advertising": [
                r"bat\.bing\.com", r"bing\.com/ads", r"c\.bing\.com", r"batbing\.com",
            ],
            "Amazon Ads": [
                r"amazon-adsystem\.com", r"assoc-amazon\.com", r"fls\.amazon\.com",
            ],
            "LinkedIn Insight": [
                r"linkedin\.com/li\.js", r"linkedin\.com/px\.", r"snap\.licdn\.com/li\.lm",
                r"platform\.linkedin\.com/in\.js",
            ],
            "Twitter Ads": [
                r"ads-twitter\.com", r"analytics\.twitter\.com",
                r"platform\.twitter\.com/widgets", r"twq\(",
            ],
            "Pinterest Tag": [r"ct\.pinterest\.com", r"pinterest\.com/tag", r"pinimg\.com/ct/"],
            "TikTok Pixel": [r"tiktok\.com/i18n/pixel", r"analytics\.tiktok\.com", r"tiktok\.com/analytics"],
            "Media.net": [r"contextual\.media\.net", r"media\.net"],
            "Propeller Ads": [r"propellerads\.com", r"go\.propellerads\.com"],
            "Revcontent": [r"revcontent\.com", r"trends\.revcontent\.com"],
            "Taboola": [r"taboola\.com", r"cdn\.taboola\.com"],
            "Outbrain": [r"outbrain\.com", r"widgets\.outbrain\.com"],
            "AdRoll": [r"adroll\.com", r"d\.adroll\.com"],
            "Criteo": [r"criteo\.com", r"static\.criteo\.net"],
            "Hotjar": [r"hotjar\.com", r"static\.hotjar\.com"],
            "Mixpanel": [r"mixpanel\.com", r"cdn\.mixpanel\.com"],
            "HubSpot": [r"hubspot\.com", r"js\.hs-scripts\.com", r"track\.hubspot\.com"],
            "Google Fonts": [r"fonts\.googleapis\.com", r"fonts\.gstatic\.com"],
            "Cloudflare Analytics": [r"cloudflareinsights\.com", r"static\.cloudflareinsights\.com"],
        }

        # METHOD 1: Direct HTML scan
        for network, patterns in ad_networks.items():
            for pattern in patterns:
                try:
                    if re.search(pattern, html, re.IGNORECASE):
                        found_ads.add(network)
                        break
                except Exception:
                    continue

        # METHOD 2: Script tags
        for script in soup.find_all("script"):
            src = script.get("src", "")
            script_content = script.string or ""
            for network, patterns in ad_networks.items():
                for pattern in patterns:
                    if (src and re.search(pattern, src, re.IGNORECASE)) or \
                       (script_content and re.search(pattern, script_content, re.IGNORECASE)):
                        found_ads.add(network)
                        break

        # METHOD 3: Iframes
        for iframe in soup.find_all("iframe"):
            src = iframe.get("src", "")
            for network, patterns in ad_networks.items():
                if any(re.search(pattern, src, re.IGNORECASE) for pattern in patterns):
                    found_ads.add(network)

        # METHOD 4: Images (tracking pixels)
        for img in soup.find_all("img"):
            src = img.get("src", "")
            for network, patterns in ad_networks.items():
                if any(re.search(pattern, src, re.IGNORECASE) for pattern in patterns):
                    found_ads.add(network)

        # METHOD 5: Links
        for link in soup.find_all("link"):
            href = link.get("href", "")
            for network, patterns in ad_networks.items():
                if any(re.search(pattern, href, re.IGNORECASE) for pattern in patterns):
                    found_ads.add(network)

        # METHOD 6: Meta tags
        for meta in soup.find_all("meta"):
            content = meta.get("content", "")
            for network, patterns in ad_networks.items():
                if any(re.search(pattern, content, re.IGNORECASE) for pattern in patterns):
                    found_ads.add(network)

        # METHOD 7: Data attributes
        ad_attrs = [
            'data-ad-client', 'data-ad-slot', 'data-ad-format',
            'data-ad-layout', 'data-ad-region', 'data-ad-unit',
            'data-google-analytics', 'data-ga', 'data-gtm',
            'data-facebook-pixel', 'data-pixel',
        ]
        for attr in ad_attrs:
            if soup.find(attrs={attr: True}):
                if 'google' in attr:
                    found_ads.add("Google AdSense")
                elif 'gtm' in attr:
                    found_ads.add("Google Tag Manager")
                elif 'ga' in attr or 'analytics' in attr:
                    found_ads.add("Google Analytics")
                elif 'facebook' in attr or 'pixel' in attr:
                    found_ads.add("Facebook Pixel")

        # METHOD 8: Class and ID indicators
        ad_indicators = [
            'ad-container', 'ad-wrapper', 'ad-unit', 'adsbygoogle',
            'banner-ad', 'advertisement', 'doubleclick', 'ad-slot',
            'gtm-', 'ga-', 'facebook-pixel', 'tracking', 'analytics',
            'remarketing', 'conversion', 'pixel'
        ]
        for element in soup.find_all(True, class_=True):
            classes = " ".join(element.get("class", []))
            if any(ind in classes.lower() for ind in ad_indicators):
                found_ads.add("Advertising/analytics detected")

        # METHOD 9: Tracking patterns
        tracking_patterns = {
            "Google Analytics": [r'UA-\d+-\d+', r'G-[A-Z0-9]+'],
            "Google Tag Manager": [r'GTM-[A-Z0-9]+'],
            "Facebook Pixel": [r'fbq\s*\(\s*[\'"]\s*(init|track)\s*[\'"]'],
        }
        for network, patterns in tracking_patterns.items():
            for pattern in patterns:
                if re.search(pattern, html, re.IGNORECASE):
                    found_ads.add(network)

        # FINAL OUTPUT
        if found_ads:
            return sorted(list(found_ads))
        else:
            external_scripts = [
                s.get("src", "") for s in soup.find_all("script", src=True)
                if s.get("src") and domain not in s.get("src")
            ]
            if len(external_scripts) > 3:
                return [f"Multiple external scripts detected ({len(external_scripts)}) - may include analytics"]
            elif external_scripts:
                return [f"External scripts detected ({len(external_scripts)}) - may include tracking"]
            else:
                return ["No major advertising or analytics networks detected"]

    except Exception as e:
        logger.error(f"Ad detection failed for {domain}: {str(e)}")
        return ["Ad detection completed with errors - check website manually"]

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
