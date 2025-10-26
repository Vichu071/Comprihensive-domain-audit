from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import dns.resolver
import whois
import requests
from bs4 import BeautifulSoup
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

app = FastAPI(title="Domain Audit API", version="12.0")

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
# 🔧 Utility Functions
# ============================================================

def normalize_domain(domain: str) -> str:
    domain = re.sub(r"^https?://", "", domain.strip().lower())
    domain = re.sub(r"^www\.", "", domain)
    domain = re.sub(r"/.*$", "", domain)
    return domain.split(':')[0]

def fetch_with_fallback(domain: str, path: str = "/", timeout: int = 20) -> Tuple[str, str, Dict]:
    user_agents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    ]
    for proto in ("https", "http"):
        url = f"{proto}://{domain}{path}"
        for ua in user_agents:
            try:
                resp = session.get(url, headers={"User-Agent": ua}, timeout=timeout, verify=False, allow_redirects=True)
                if resp.status_code == 200:
                    return resp.text, url, dict(resp.headers)
            except Exception:
                continue
    return "", "", {}

# ============================================================
# 🌐 DOMAIN & HOSTING SECTION
# ============================================================

def get_whois_info(domain: str) -> Dict[str, Any]:
    info = {}
    try:
        w = whois.whois(domain)
        
        if w.registrar:
            info["Registrar"] = w.registrar

        def safe_date(d):
            if isinstance(d, list):
                d = d[0]
            if isinstance(d, datetime):
                return d.strftime("%Y-%m-%d")
            return None

        if w.creation_date:
            info["Created"] = safe_date(w.creation_date)
        if w.expiration_date:
            expiry_date = safe_date(w.expiration_date)
            info["Expiry"] = expiry_date
            if expiry_date:
                expiry_dt = datetime.strptime(expiry_date, "%Y-%m-%d")
                days_until_expiry = (expiry_dt - datetime.now()).days
                info["Expiry Status"] = f"{days_until_expiry} days remaining"
                
        if w.name_servers:
            info["Nameservers"] = [ns.rstrip('.').upper() for ns in w.name_servers if ns]
            
    except Exception as e:
        logger.debug(f"WHOIS failed: {e}")
    return info

def detect_hosting_provider(ip: str, server: str = "", nameservers: List[str] = None) -> Optional[str]:
    if not ip:
        return None
    text = f"{ip} {server} {' '.join(nameservers or [])}".lower()
    
    providers = {
        "cloudflare": "Cloudflare", "aws": "AWS", "amazon": "AWS",
        "google": "Google Cloud", "gws": "Google Cloud", "google cloud": "Google Cloud",
        "azure": "Microsoft Azure", "microsoft": "Microsoft Azure",
        "digitalocean": "DigitalOcean", "do": "DigitalOcean",
        "siteground": "SiteGround", "godaddy": "GoDaddy",
        "bluehost": "Bluehost", "hostgator": "HostGator",
        "namecheap": "Namecheap", "dreamhost": "DreamHost",
        "linode": "Linode", "akamai": "Akamai",
        "fastly": "Fastly", "heroku": "Heroku",
        "netlify": "Netlify", "vercel": "Vercel",
        "nginx": "Nginx", "apache": "Apache", "litespeed": "LiteSpeed"
    }
    
    for k, v in providers.items():
        if k in text:
            return v
    return "Unknown Hosting Provider"

def get_hosting_details(domain: str, nameservers: List[str] = None) -> Dict[str, Any]:
    data = {}
    try:
        # Get IP address
        try:
            ip = str(resolver.resolve(domain, "A")[0])
        except:
            ip = socket.gethostbyname(domain)
        data["IP Address"] = ip
        
        # Get server information from headers
        html, url, headers = fetch_with_fallback(domain)
        if headers:
            server = headers.get("Server", "").split('/')[0]
            if server:
                data["Web Server"] = server
                
        # Detect hosting provider
        provider = detect_hosting_provider(ip, data.get("Web Server", ""), nameservers)
        if provider:
            data["Hosting Provider"] = provider
            
    except Exception as e:
        logger.debug(f"Hosting lookup failed: {e}")
    return data

# ============================================================
# 📧 EMAIL SETUP SECTION
# ============================================================

def get_mx_records(domain: str) -> List[str]:
    try:
        mx_records = []
        for r in resolver.resolve(domain, "MX"):
            mx_records.append(str(r.exchange).rstrip(".").lower())
        return mx_records
    except:
        return []

def get_txt_records(domain: str) -> List[str]:
    try:
        recs = []
        for r in resolver.resolve(domain, "TXT"):
            recs.append("".join([t.decode() if isinstance(t, bytes) else str(t) for t in r.strings]))
        return recs
    except:
        return []

def detect_email_provider(mx_records: List[str]) -> str:
    if not mx_records:
        return "No email service detected"
        
    mx_domains = " ".join(mx_records).lower()
    
    email_providers = {
        "google.com": "Google Workspace",
        "googlemail.com": "Google Workspace", 
        "aspmx.l.google.com": "Google Workspace",
        "outlook.com": "Microsoft 365",
        "protection.outlook.com": "Microsoft 365",
        "mail.protection.outlook.com": "Microsoft 365",
        "zoho.com": "Zoho Mail",
        "zoho.in": "Zoho Mail",
        "yahoo.com": "Yahoo Mail",
        "amazon.com": "Amazon SES",
        "sendgrid.net": "SendGrid",
        "mailchimp": "Mailchimp",
        "mandrillapp.com": "Mailchimp",
        "sparkpostmail.com": "SparkPost"
    }
    
    for domain, provider in email_providers.items():
        if domain in mx_domains:
            return provider
            
    return "Custom Email Service"

def check_spf(txt_records: List[str]) -> str:
    for record in txt_records:
        if record.startswith("v=spf1"):
            if "~all" in record.lower() or "-all" in record.lower():
                return "Valid"
            return "Found"
    return "Not Found"

def get_email_setup(domain: str) -> Dict[str, Any]:
    email_info = {}
    
    # MX Records
    mx_records = get_mx_records(domain)
    if mx_records:
        email_info["MX Records"] = mx_records
        email_info["Provider"] = detect_email_provider(mx_records)
    else:
        email_info["MX Records"] = "No MX records found"
        email_info["Provider"] = "No email service detected"
    
    # SPF Check
    txt_records = get_txt_records(domain)
    email_info["SPF"] = check_spf(txt_records)
    
    return email_info

# ============================================================
# 🛠 TECHNOLOGY & BUILT WITH SECTION
# ============================================================

def detect_wordpress_details(html: str, domain: str) -> Dict[str, Any]:
    wp_info = {}
    
    if not html:
        return wp_info
        
    # WordPress Version
    version_match = re.search(r'content="WordPress\s*([\d.]+)"', html, re.IGNORECASE)
    if version_match:
        wp_info["Version"] = version_match.group(1)
    
    # Theme detection
    theme_matches = re.findall(r'/wp-content/themes/([^/"\']+)/', html, re.IGNORECASE)
    if theme_matches:
        wp_info["Theme"] = theme_matches[0].replace("-", " ").title()
        
    # Plugin detection
    wp_info["Plugins"] = detect_wordpress_plugins(html)
    
    return wp_info

def detect_wordpress_plugins(html: str) -> List[str]:
    if not html:
        return []
        
    html_lower = html.lower()
    found = set()
    
    # Common WordPress plugins with their signatures
    plugins = {
        "Yoast SEO": ["yoast", "wpseo"],
        "Elementor": ["elementor"],
        "WooCommerce": ["woocommerce", "wc-"],
        "Contact Form 7": ["contact-form-7", "wpcf7"],
        "WP Rocket": ["wp-rocket"],
        "LiteSpeed Cache": ["litespeed"],
        "Jetpack": ["jetpack"],
        "Akismet": ["akismet"],
        "Wordfence": ["wordfence"],
        "All in One SEO": ["all-in-one-seo-pack"],
        "Gravity Forms": ["gravityforms"],
        "Advanced Custom Fields": ["advanced custom fields", "acf"],
        "WPML": ["wpml"],
        "Visual Composer": ["visual-composer", "js_composer"],
        "Divi Builder": ["divi-builder", "et-builder"],
        "BuddyPress": ["buddypress"],
        "Sg Cachepress": ["siteground"],
        "W3 Total Cache": ["w3-total-cache"],
        "WP Super Cache": ["wp-super-cache"]
    }
    
    for plugin_name, patterns in plugins.items():
        if any(pattern in html_lower for pattern in patterns):
            found.add(plugin_name)
            
    # Detect from plugin directories
    plugin_dirs = re.findall(r'/wp-content/plugins/([^/"]+)/', html_lower)
    for plugin_dir in plugin_dirs:
        if len(plugin_dir) > 2:  # Avoid short false positives
            plugin_name = plugin_dir.replace("-", " ").title()
            found.add(plugin_name)
        
    return sorted(found)

def detect_shopify_details(html: str) -> Dict[str, Any]:
    shopify_info = {}
    
    if not html:
        return shopify_info
        
    html_lower = html.lower()
    
    # Theme detection
    theme_match = re.search(r'theme\s*:\s*"([^"]+)"', html_lower)
    if theme_match:
        shopify_info["Theme"] = theme_match.group(1).title()
    else:
        theme_asset = re.search(r'/themes/([^/]+)/assets/', html_lower)
        if theme_asset:
            shopify_info["Theme"] = theme_asset.group(1).title()
            
    return shopify_info

def detect_tools_and_technologies(html: str) -> Dict[str, List[str]]:
    tools = {
        "Analytics": [],
        "Marketing": [],
        "CDN": [],
        "JavaScript": [],
        "CSS": []
    }
    
    if not html:
        return tools
        
    html_lower = html.lower()
    
    # Analytics Services
    analytics_services = {
        "Google Analytics": ["google-analytics.com", "gtag(", "ga.js", "analytics.js"],
        "Google Tag Manager": ["googletagmanager.com"],
        "Facebook Pixel": ["facebook.net", "fbq(", "connect.facebook.net"],
        "Hotjar": ["hotjar.com", "static.hotjar.com"],
        "Microsoft Clarity": ["clarity.ms"],
        "Yandex Metrica": ["yandex.ru/metrika", "mc.yandex.ru"]
    }
    
    # Marketing Tools
    marketing_tools = {
        "Mailchimp": ["mailchimp", "list-manage.com"],
        "HubSpot": ["hubspot", "hs-scripts.com"],
        "ConvertKit": ["convertkit", "ck.page"],
        "ActiveCampaign": ["activehosted.com"],
        "Intercom": ["intercom", "widget.intercom.io"],
        "Drift": ["drift", "js.driftt.com"]
    }
    
    # CDN
    cdns = {
        "Cloudflare": ["cloudflare"],
        "CloudFront": ["cloudfront"],
        "Akamai": ["akamai"],
        "Fastly": ["fastly"]
    }
    
    # JavaScript Frameworks
    js_frameworks = {
        "React": ["react", "reactjs"],
        "Vue.js": ["vue", "vuejs"],
        "Angular": ["angular"],
        "jQuery": ["jquery"],
        "Next.js": ["next", "__next"],
        "Nuxt.js": ["nuxt", "_nuxt"]
    }
    
    # CSS Frameworks
    css_frameworks = {
        "Bootstrap": ["bootstrap"],
        "Tailwind CSS": ["tailwind"],
        "Foundation": ["foundation"],
        "Bulma": ["bulma"]
    }
    
    # Check for analytics
    for service, patterns in analytics_services.items():
        if any(pattern in html_lower for pattern in patterns):
            tools["Analytics"].append(service)
    
    # Check for marketing tools
    for tool, patterns in marketing_tools.items():
        if any(pattern in html_lower for pattern in patterns):
            tools["Marketing"].append(tool)
    
    # Check for CDNs
    for cdn, patterns in cdns.items():
        if any(pattern in html_lower for pattern in patterns):
            tools["CDN"].append(cdn)
            
    # Check for JS frameworks
    for framework, patterns in js_frameworks.items():
        if any(pattern in html_lower for pattern in patterns):
            tools["JavaScript"].append(framework)
            
    # Check for CSS frameworks
    for framework, patterns in css_frameworks.items():
        if any(pattern in html_lower for pattern in patterns):
            tools["CSS"].append(framework)
    
    # Clean up empty categories
    return {k: v for k, v in tools.items() if v}

def detect_cms_technology(domain: str) -> Dict[str, Any]:
    html, url, headers = fetch_with_fallback(domain)
    tech_data = {"CMS": "Not Detected", "Tools": {}}
    
    if not html:
        return tech_data
        
    html_lower = html.lower()
    
    # WordPress Detection
    if any(x in html_lower for x in ["wp-content", "wp-includes", "wp-json", "wp-admin", "wordpress"]):
        tech_data["CMS"] = "WordPress"
        wp_details = detect_wordpress_details(html, domain)
        tech_data.update(wp_details)
        
    # Shopify Detection
    elif any(x in html_lower for x in ["cdn.shopify.com", "myshopify.com", "shopify"]):
        tech_data["CMS"] = "Shopify"
        shopify_details = detect_shopify_details(html)
        tech_data.update(shopify_details)
        
    # Joomla
    elif "joomla" in html_lower or "com_content" in html_lower:
        tech_data["CMS"] = "Joomla"
        
    # Drupal
    elif "drupal" in html_lower or "sites/all/modules" in html_lower:
        tech_data["CMS"] = "Drupal"
        
    # Wix
    elif "wix.com" in html_lower or "wixstatic.com" in html_lower:
        tech_data["CMS"] = "Wix"
        
    # Squarespace
    elif "squarespace" in html_lower:
        tech_data["CMS"] = "Squarespace"
        
    # Webflow
    elif "webflow" in html_lower:
        tech_data["CMS"] = "Webflow"
        
    # Magento
    elif "magento" in html_lower or "mage-" in html_lower:
        tech_data["CMS"] = "Magento"
    
    # Detect tools and technologies
    tools_data = detect_tools_and_technologies(html)
    if tools_data:
        tech_data["Tools"] = tools_data
    
    return tech_data

# ============================================================
# 🔐 SECURITY SECTION
# ============================================================

def audit_security(domain: str) -> Dict[str, Any]:
    security = {
        "SSL Certificate": "Invalid",
        "TLS Version": "Unknown",
        "Certificate Expiry": "Unknown"
    }
    
    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((domain, 443), timeout=10) as sock:
            with ctx.wrap_socket(sock, server_hostname=domain) as ssock:
                cert = ssock.getpeercert()
                if cert:
                    security["SSL Certificate"] = "Valid"
                    security["TLS Version"] = ssock.version()
                    
                    # Certificate expiry
                    expiry = datetime.strptime(cert["notAfter"], '%b %d %H:%M:%S %Y %Z')
                    days_until_expiry = (expiry - datetime.utcnow()).days
                    security["Certificate Expiry"] = f"{expiry.strftime('%Y-%m-%d')} ({days_until_expiry} days remaining)"
                    
    except Exception as e:
        logger.debug(f"SSL check failed: {e}")
    
    return security

# ============================================================
# 📊 ADS & ANALYTICS SECTION
# ============================================================

def detect_ads_analytics(domain: str) -> Dict[str, List[str]]:
    data = {
        "Analytics": [],
        "Ad Networks": [],
        "Marketing Tools": []
    }
    
    html, _, _ = fetch_with_fallback(domain)
    if not html:
        return data
        
    html_lower = html.lower()
    
    # Analytics Services
    analytics_services = {
        "Google Analytics": ["google-analytics.com", "gtag(", "ga.js", "analytics.js"],
        "Google Tag Manager": ["googletagmanager.com"],
        "Facebook Pixel": ["facebook.net", "fbq(", "connect.facebook.net"],
        "Hotjar": ["hotjar.com", "static.hotjar.com"],
        "Microsoft Clarity": ["clarity.ms"],
        "Yandex Metrica": ["yandex.ru/metrika", "mc.yandex.ru"],
        "Adobe Analytics": ["omniture.com", "adobe-analytics"]
    }
    
    # Ad Networks
    ad_networks = {
        "Google AdSense": ["googlesyndication.com", "pagead2.googlesyndication.com"],
        "Google Ad Manager": ["doubleclick.net", "googleadservices.com"],
        "Amazon Ads": ["amazon-adsystem.com"],
        "Media.net": ["media.net"],
        "Propeller Ads": ["propellerads.com"],
        "AdRoll": ["adroll.com"],
        "Taboola": ["taboola.com"],
        "Outbrain": ["outbrain.com"]
    }
    
    # Marketing Tools
    marketing_tools = {
        "Mailchimp": ["mailchimp", "list-manage.com"],
        "HubSpot": ["hubspot", "hs-scripts.com"],
        "ConvertKit": ["convertkit", "ck.page"],
        "ActiveCampaign": ["activehosted.com"],
        "Intercom": ["intercom", "widget.intercom.io"],
        "Drift": ["drift", "js.driftt.com"],
        "LiveChat": ["livechatinc.com"],
        "Zendesk": ["zendesk.com"]
    }
    
    # Check for analytics
    for service, patterns in analytics_services.items():
        if any(pattern in html_lower for pattern in patterns):
            data["Analytics"].append(service)
    
    # Check for ad networks
    for network, patterns in ad_networks.items():
        if any(pattern in html_lower for pattern in patterns):
            data["Ad Networks"].append(network)
    
    # Check for marketing tools
    for tool, patterns in marketing_tools.items():
        if any(pattern in html_lower for pattern in patterns):
            data["Marketing Tools"].append(tool)
    
    # Remove empty categories
    return {k: v for k, v in data.items() if v}

# ============================================================
# ⚡ PERFORMANCE SECTION
# ============================================================

def analyze_performance(domain: str) -> Dict[str, Any]:
    performance = {}
    
    # Multiple load tests for better accuracy
    load_times = []
    page_sizes = []
    
    for i in range(3):  # Test 3 times
        start_time = time.time()
        html, url, headers = fetch_with_fallback(domain)
        load_time = time.time() - start_time
        
        if html:
            load_times.append(load_time)
            page_sizes.append(len(html.encode()) / 1024)  # KB
    
    if not load_times:
        performance["Status"] = "Failed to load"
        performance["Rating"] = "F"
        return performance
    
    # Calculate averages
    avg_load_time = round(sum(load_times) / len(load_times), 2)
    avg_page_size = round(sum(page_sizes) / len(page_sizes), 1)
    
    performance["Load Time"] = f"{avg_load_time}s"
    performance["Page Size"] = f"{avg_page_size} KB"
    
    # Enhanced rating system
    if avg_load_time < 1.0:
        performance["Rating"] = "A+"
        performance["Grade"] = "Excellent"
    elif avg_load_time < 2.0:
        performance["Rating"] = "A"
        performance["Grade"] = "Good"
    elif avg_load_time < 3.0:
        performance["Rating"] = "B"
        performance["Grade"] = "Average"
    elif avg_load_time < 4.0:
        performance["Rating"] = "C"
        performance["Grade"] = "Below Average"
    else:
        performance["Rating"] = "F"
        performance["Grade"] = "Poor"
    
    # Performance insights
    insights = []
    if avg_load_time > 3.0:
        insights.append("Slow loading time - consider optimization")
    if avg_page_size > 1000:
        insights.append("Large page size - optimize images and assets")
    if avg_page_size > 3000:
        insights.append("Very large page - significant optimization needed")
    
    if insights:
        performance["Insights"] = insights
    
    return performance

# ============================================================
# 🚀 PARALLEL RUNNER
# ============================================================

def run_parallel_audit(domain: str):
    results = {}
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        # Start all audits in parallel
        futures = {
            "whois": executor.submit(get_whois_info, domain),
            "hosting": executor.submit(get_hosting_details, domain, []),
            "email": executor.submit(get_email_setup, domain),
            "technology": executor.submit(detect_cms_technology, domain),
            "security": executor.submit(audit_security, domain),
            "ads_analytics": executor.submit(detect_ads_analytics, domain),
            "performance": executor.submit(analyze_performance, domain)
        }
        
        # Collect results
        for name, future in futures.items():
            try:
                results[name] = future.result(timeout=30)
            except Exception as e:
                logger.debug(f"{name} audit failed: {e}")
                results[name] = {}
    
    # Update hosting with nameservers from whois for better provider detection
    if "whois" in results and "Nameservers" in results["whois"]:
        nameservers = results["whois"]["Nameservers"]
        results["hosting"] = get_hosting_details(domain, nameservers)
    
    return results

# ============================================================
# 🧩 ROUTES
# ============================================================

@app.get("/")
def home():
    return {"message": "Domain Audit API v12.0", "status": "running"}

@app.get("/audit/{domain}")
def audit_domain(domain: str):
    start_time = time.time()
    normalized_domain = normalize_domain(domain)
    
    if len(normalized_domain) < 3 or not re.match(r'^[a-z0-9.-]+\.[a-z]{2,}$', normalized_domain):
        return JSONResponse({"error": "Invalid domain format"}, status_code=400)
    
    try:
        logger.info(f"Auditing {normalized_domain}")
        audit_results = run_parallel_audit(normalized_domain)
        
        # Structure the final response with clean sections
        final_response = {
            "Domain": normalized_domain,
            "Audit Time": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "Processing Time": f"{round(time.time() - start_time, 2)}s",
            "Results": {
                "🏷️ Domain Information": audit_results.get("whois", {}),
                "🌐 Hosting Details": audit_results.get("hosting", {}),
                "📧 Email Setup": audit_results.get("email", {}),
                "🛠️ Built With": audit_results.get("technology", {}),
                "🔐 Security": audit_results.get("security", {}),
                "📊 Ads & Analytics": audit_results.get("ads_analytics", {}),
                "⚡ Performance": audit_results.get("performance", {})
            }
        }
        
        return JSONResponse(final_response)
        
    except Exception as e:
        logger.exception(f"Audit failed for {domain}: {e}")
        return JSONResponse({"error": "Domain audit failed"}, status_code=500)

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
