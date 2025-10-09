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

app = FastAPI(title="Domain Audit API", version="2.3")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# DNS Resolver
resolver = dns.resolver.Resolver()
resolver.nameservers = ["8.8.8.8", "1.1.1.1"]

# Requests session
session = requests.Session()
retries = Retry(total=3, backoff_factor=0.5, status_forcelist=[500, 502, 503, 504])
session.mount("http://", HTTPAdapter(max_retries=retries))
session.mount("https://", HTTPAdapter(max_retries=retries))

# ---------------------- Utility Functions ----------------------

def safe_fetch(url: str, timeout: int = 10) -> str:
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
    return domain.split("/")[0]

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
        }
    except Exception as e:
        logger.error(f"WHOIS failed: {str(e)}")
        return {"Registrar": "Unknown", "Created Date": "Unknown", "Expiry Date": "Unknown", "Name Servers": ["Unknown"]}

# ---------------------- Hosting Details ----------------------

def get_hosting_info(domain: str) -> Dict[str, Any]:
    try:
        ip = socket.gethostbyname(domain)

        try:
            response = session.head(f"https://{domain}", timeout=5, verify=False)
            server = response.headers.get("Server", "Unknown")
        except:
            server = "Unknown"

        provider = "Unknown"
        if "cloudflare" in server.lower():
            provider = "Cloudflare"
        elif "nginx" in server.lower():
            provider = "Nginx"
        elif "apache" in server.lower():
            provider = "Apache"

        return {"IP Address": ip, "Server": server, "Hosting Provider": provider}
    except Exception as e:
        logger.error(f"Hosting info failed: {str(e)}")
        return {"IP Address": "Unknown", "Server": "Unknown", "Hosting Provider": "Unknown"}

# ---------------------- Email Detection ----------------------

def get_mx_records(domain: str) -> List[str]:
    try:
        mx_records = []
        answers = resolver.resolve(domain, "MX")
        for rdata in answers:
            mx_records.append(str(rdata.exchange).rstrip("."))
        return mx_records
    except:
        return []

def detect_email_provider(mx_records: List[str]) -> str:
    for mx in mx_records:
        mx_lower = mx.lower()
        if "google" in mx_lower:
            return "Google Workspace"
        elif "outlook" in mx_lower or "protection.outlook" in mx_lower:
            return "Microsoft 365"
        elif "zoho" in mx_lower:
            return "Zoho Mail"
        elif "yahoo" in mx_lower:
            return "Yahoo Mail"
    return "Custom" if mx_records else "Unknown"

def extract_emails(domain: str) -> List[str]:
    try:
        html = safe_fetch(f"https://{domain}")
        emails = re.findall(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", html)
        return list(set(emails))[:5]  # Remove duplicates and limit to 5
    except:
        return []

# ---------------------- Technology Detection ----------------------

def detect_tech_stack(domain: str) -> Dict[str, List[str]]:
    try:
        return builtwith.parse(f"https://{domain}") or {}
    except:
        return {}

# ---------------------- WordPress Detection ----------------------

def detect_wordpress(domain: str) -> Dict[str, Any]:
    wp_info = {"Is WordPress": "No", "Version": "Not Detected", "Theme": "Not Detected"}
    
    try:
        # Try multiple URLs to detect WordPress
        urls_to_try = [
            f"https://{domain}",
            f"https://{domain}/wp-admin/",
            f"https://{domain}/wp-login.php",
            f"https://{domain}/feed/",
        ]
        
        html = ""
        for url in urls_to_try:
            html = safe_fetch(url)
            if html:
                break
        
        if not html:
            return wp_info

        # Enhanced WordPress signatures
        wp_signatures = [
            "wp-content", "wp-includes", "wp-json", "wordpress", "wp-admin", 
            "wp-embed", "xmlrpc.php", "wp-config", "wp-mail.php", "wp-load.php"
        ]
        
        wp_count = sum(1 for sig in wp_signatures if sig in html.lower())
        
        # Check for WordPress meta tags
        soup = BeautifulSoup(html, "html.parser")
        meta_generator = soup.find("meta", attrs={"name": "generator"})
        if meta_generator and "wordpress" in meta_generator.get("content", "").lower():
            wp_count += 3  # Strong indicator
            
        # Check for WordPress REST API
        if 'wp-json' in html.lower() or 'rest_route' in html.lower():
            wp_count += 2
            
        # Check for common WordPress classes
        wp_classes = ['wp-block', 'menu-item', 'widget_', 'sidebar-']
        for wp_class in wp_classes:
            if wp_class in html:
                wp_count += 1

        if wp_count >= 2:
            wp_info["Is WordPress"] = "Yes"

            # Enhanced version detection
            version_patterns = [
                r"wordpress[^>]*?([0-9]+\.[0-9]+\.[0-9]+)",
                r"wp-embed-min\.js\?ver=([0-9]+\.[0-9]+\.[0-9]+)",
                r'content="wordpress ([0-9]+\.[0-9]+\.[0-9]+)"',
                r"ver=([0-9]+\.[0-9]+\.[0-9]+)[^>]*wp-includes",
                r"wp-includes/js/wp-embed\.js\?ver=([0-9]+\.[0-9]+\.[0-9]+)",
            ]

            for pattern in version_patterns:
                match = re.search(pattern, html, re.IGNORECASE)
                if match:
                    wp_info["Version"] = match.group(1)
                    break

            # Check meta generator for version
            if wp_info["Version"] == "Not Detected" and meta_generator:
                content = meta_generator.get("content", "")
                ver_match = re.search(r"([0-9]+\.[0-9]+(?:\.[0-9]+)?)", content)
                if ver_match:
                    wp_info["Version"] = ver_match.group(1)

            # Enhanced theme detection
            theme_patterns = [
                r"/wp-content/themes/([^/\"']+)/",
                r"themes/([^/\"']+)/style\.css",
                r'theme-?name["\']*:["\']*([^"\'\)\s]+)',
                r"template[\"']?:\s*[\"']([^\"']+)[\"']",
                r"stylesheet[\"']?:\s*[\"']([^\"']+)[\"']",
            ]

            theme_candidates = set()
            for pattern in theme_patterns:
                theme_matches = re.findall(pattern, html, re.IGNORECASE)
                for theme_match in theme_matches:
                    if len(theme_match) > 2 and not any(x in theme_match.lower() for x in ['http', 'www', '.com']):
                        theme_name = re.sub(r'[^a-zA-Z0-9\-_]', '', theme_match)
                        if theme_name:
                            theme_candidates.add(theme_name.title())
            
            if theme_candidates:
                # Prefer longer theme names (more specific)
                wp_info["Theme"] = max(theme_candidates, key=len)

            # Try to detect theme from stylesheet links
            if wp_info["Theme"] == "Not Detected":
                for link in soup.find_all("link", rel="stylesheet"):
                    href = link.get("href", "")
                    theme_match = re.search(r"/themes/([^/]+)/", href)
                    if theme_match:
                        theme_name = theme_match.group(1)
                        wp_info["Theme"] = theme_name.title()
                        break

    except Exception as e:
        logger.error(f"WordPress detection error: {str(e)}")

    return wp_info

# ---------------------- Ads Detection ----------------------

def detect_ads(domain: str) -> List[str]:
    try:
        html = safe_fetch(f"https://{domain}")
        if not html:
            return ["Unable to scan website"]

        found_ads = set()
        soup = BeautifulSoup(html, "html.parser")

        # Enhanced ad network patterns
        ad_networks = {
            "Google Ads": [
                r"googlesyndication\.com",
                r"doubleclick\.net",
                r"googleadservices\.com",
                r"adsbygoogle",
                r"pagead2\.googlesyndication",
                r"googleads\.g\.doubleclick\.net",
            ],
            "Google Analytics": [
                r"google-analytics\.com",
                r"googletagmanager\.com/gtag/js",
                r"ga\([\"']",
                r"gtag\([\"']",
            ],
            "Google Tag Manager": [
                r"googletagmanager\.com/gtm\.js",
                r"googletagmanager\.com/gtag/js",
                r"googletagmanager\.com/ns\.html",
            ],
            "Facebook Pixel": [
                r"connect\.facebook\.net",
                r"fbq\([\"']",
                r"facebook\.com/tr\?",
                r"facebook\.com/tr/",
            ],
            "Microsoft Advertising": [
                r"bat\.bing\.com",
                r"bing\.com/ads",
                r"c\.bing\.com",
            ],
            "Amazon Ads": [
                r"amazon-adsystem\.com",
                r"assoc-amazon\.com",
            ],
            "LinkedIn Insight": [
                r"linkedin\.com/li\.js",
                r"linkedin\.com/px\.",
                r"snap\.licdn\.com/li\.lm",
            ],
            "Twitter Ads": [
                r"ads-twitter\.com",
                r"analytics\.twitter\.com",
                r"platform\.twitter\.com/widgets",
            ],
            "Pinterest Tag": [
                r"ct\.pinterest\.com",
                r"pinterest\.com/tag",
            ],
            "TikTok Pixel": [
                r"tiktok\.com/i18n/pixel",
                r"analytics\.tiktok\.com",
            ],
            "AdSense": [
                r"pagead2\.googlesyndication\.com",
                r"googleads\.g\.doubleclick\.net",
            ],
            "Media.net": [
                r"contextual\.media\.net",
                r"media\.net",
            ],
            "Propeller Ads": [
                r"propellerads\.com",
                r"go\.propellerads\.com",
            ],
            "Revcontent": [
                r"revcontent\.com",
                r"trends\.revcontent\.com",
            ],
            "Taboola": [
                r"taboola\.com",
                r"cdn\.taboola\.com",
            ],
            "Outbrain": [
                r"outbrain\.com",
                r"widgets\.outbrain\.com",
            ],
        }

        # Check HTML content
        for network, patterns in ad_networks.items():
            for pattern in patterns:
                if re.search(pattern, html, re.IGNORECASE):
                    found_ads.add(network)
                    break

        # Check script tags
        for script in soup.find_all("script", src=True):
            src = script["src"]
            for network, patterns in ad_networks.items():
                for pattern in patterns:
                    if re.search(pattern, src, re.IGNORECASE):
                        found_ads.add(network)
                        break

        # Check iframe tags
        for iframe in soup.find_all("iframe", src=True):
            src = iframe["src"]
            for network, patterns in ad_networks.items():
                for pattern in patterns:
                    if re.search(pattern, src, re.IGNORECASE):
                        found_ads.add(network)
                        break

        # Check for common ad-related class names and IDs
        ad_indicators = [
            'ad-container', 'ad-wrapper', 'ad-unit', 'adsbygoogle', 
            'banner-ad', 'ad_banner', 'advertisement', 'advert',
            'doubleclick', 'google_ads', 'ad-slot', 'ad-placeholder'
        ]
        
        for element in soup.find_all(True, class_=True):
            classes = element.get('class', [])
            for ad_class in ad_indicators:
                if any(ad_class in str(cls).lower() for cls in classes):
                    # Try to determine which ad network
                    html_str = str(element)
                    for network, patterns in ad_networks.items():
                        for pattern in patterns:
                            if re.search(pattern, html_str, re.IGNORECASE):
                                found_ads.add(network)
                                break

        # Check for data attributes commonly used by ads
        for element in soup.find_all(attrs={"data-ad-client": True}):
            found_ads.add("Google Ads (AdSense)")

        for element in soup.find_all(attrs={"data-ad-slot": True}):
            found_ads.add("Google Ads (AdSense)")

        return list(found_ads) if found_ads else ["No advertising networks detected"]
        
    except Exception as e:
        logger.error(f"Ad detection failed: {str(e)}")
        return ["Ad detection failed"]

# ---------------------- Security Audit ----------------------

def audit_security(domain: str) -> Dict[str, str]:
    security = {
        "SSL Certificate": "Invalid",
        "HSTS": "Not Found",
        "X-Frame-Options": "Not Found",
        "X-Content-Type-Options": "Not Found",
        "Content-Security-Policy": "Not Found",
    }

    try:
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE

        with socket.create_connection((domain, 443), timeout=5) as sock:
            with context.wrap_socket(sock, server_hostname=domain) as ssock:
                cert = ssock.getpeercert()
                if cert:
                    security["SSL Certificate"] = "Valid"

        response = session.get(f"https://{domain}", timeout=5, verify=False)
        headers = response.headers

        if headers.get("Strict-Transport-Security"):
            security["HSTS"] = "Present"
        if headers.get("X-Frame-Options"):
            security["X-Frame-Options"] = "Present"
        if headers.get("X-Content-Type-Options"):
            security["X-Content-Type-Options"] = "Present"
        if headers.get("Content-Security-Policy"):
            security["Content-Security-Policy"] = "Present"

    except Exception as e:
        logger.warning(f"Security audit issue: {str(e)}")

    return security

# ---------------------- Performance Analysis ----------------------

def analyze_performance(domain: str) -> Dict[str, Any]:
    try:
        start_time = time.time()
        response = session.get(f"https://{domain}", timeout=10, verify=False)
        load_time = time.time() - start_time
        page_size = len(response.content) / 1024  # KB

        if load_time < 1.5:
            score = "Excellent"
        elif load_time < 3.0:
            score = "Good"
        elif load_time < 5.0:
            score = "Average"
        else:
            score = "Poor"

        return {
            "Load Time": f"{load_time:.2f}s",
            "Page Size": f"{page_size:.1f} KB",
            "Score": score,
            "Status": response.status_code,
        }
    except Exception as e:
        logger.warning(f"Performance analysis failed: {str(e)}")
        return {
            "Load Time": "Failed to measure",
            "Page Size": "Unknown",
            "Score": "Unknown",
            "Status": "Unknown",
        }

# ---------------------- Routes ----------------------

@app.get("/")
def home():
    return {"message": "Domain Audit API", "version": "2.3"}

@app.get("/audit/{domain}")
def audit_domain(domain: str):
    domain = normalize_domain(domain)
    if not domain:
        return JSONResponse({"error": "Invalid domain"}, status_code=400)

    logger.info(f"Starting audit for domain: {domain}")
    
    mx_records = get_mx_records(domain)

    results = {
        "Domain": domain,
        "Domain Info": get_whois_info(domain),
        "Hosting": get_hosting_info(domain),
        "Email Setup": {
            "Provider": detect_email_provider(mx_records),
            "MX Records": mx_records,
            "Contact Emails": extract_emails(domain),
        },
        "Website Tech": detect_tech_stack(domain),
        "WordPress": detect_wordpress(domain),
        "Ads Running": detect_ads(domain),
        "Security": audit_security(domain),
        "Performance": analyze_performance(domain),
        "Audit Date": datetime.now().strftime("%B %d, %Y at %I:%M %p"),
    }

    logger.info(f"Completed audit for domain: {domain}")
    return JSONResponse(results)

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)