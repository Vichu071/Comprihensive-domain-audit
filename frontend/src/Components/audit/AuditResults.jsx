import React, { useState, useRef, useEffect } from "react";
import {
  FiActivity, FiZap, FiShield, FiTrendingUp, FiLayers, FiMail,
  FiDownload, FiHome, FiGlobe, FiServer, FiCode, FiEye, FiCheck, FiX
} from "react-icons/fi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const API_BASE = "https://comprihensive-audit-backend.onrender.com";

export default function AuditResults() {
  const [domain, setDomain] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobile, setIsMobile] = useState(false);
  const reportRef = useRef(null);

  const tabs = [
    { id: "overview", label: "Overview", icon: <FiActivity /> },
    { id: "domain", label: "Domain Details", icon: <FiGlobe /> },
    { id: "hosting", label: "Hosting", icon: <FiServer /> },
    { id: "email", label: "Email Setup", icon: <FiMail /> },
    { id: "technology", label: "Technology", icon: <FiCode /> },
    { id: "wordpress", label: "WordPress", icon: <FiTrendingUp /> },
    { id: "performance", label: "Performance", icon: <FiZap /> },
    { id: "security", label: "Security", icon: <FiShield /> },
    { id: "ads", label: "Ads & Trackers", icon: <FiEye /> },
  ];

  // 🔹 Fetch audit results
  const handleAudit = async () => {
    if (!domain.trim()) return;
    setLoading(true);
    setError("");
    setResults(null);
    try {
      const res = await fetch(`${API_BASE}/audit/${domain}`);
      const data = await res.json();
      if (res.ok && data.Results) {
        // Flatten structure for display
        setResults({
          domain: data.Domain,
          processing_time_seconds: data["Processing Time"],
          ...data.Results
        });
      } else {
        setError(data.error || "Failed to fetch audit results.");
      }
    } catch {
      setError("Unable to connect to the audit API.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Export as PDF
  const exportPDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2 });
    const pdf = new jsPDF("p", "pt", "a4");
    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 595.28;
    const pageHeight = 841.89;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    pdf.save(`${results.domain || "audit"}-report.pdf`);
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 880);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const Status = ({ valid, label }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {valid ? <FiCheck style={{ color: "#10B981" }} /> : <FiX style={{ color: "#EF4444" }} />}
      <span>{label}</span>
    </div>
  );

  const Row = ({ label, value, children }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px dashed rgba(0,0,0,0.08)" }}>
      <div style={{ color: "#374151", fontWeight: 600 }}>{label}</div>
      <div style={{ color: "#111827", fontWeight: 500, textAlign: "right" }}>
        {children || (value !== undefined && value !== null ? value.toString() : "—")}
      </div>
    </div>
  );

  const ListRow = ({ label, items }) => (
    <div style={{ padding: "12px 0", borderBottom: "1px dashed rgba(0,0,0,0.08)" }}>
      <div style={{ color: "#374151", fontWeight: 600, marginBottom: "8px" }}>{label}</div>
      <div style={{ color: "#111827" }}>
        {items && items.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {items.map((item, i) => (
              <span key={i} style={{ background: "#F3F4F6", padding: "4px 8px", borderRadius: "6px", fontSize: "14px" }}>
                {item}
              </span>
            ))}
          </div>
        ) : "None detected"}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        body { font-family: 'Inter', sans-serif; }
        .page {
          background: linear-gradient(180deg,#1b0538 0%,#0d011a 100%);
          min-height: 100vh; padding: 120px 20px 60px;
        }
        .wrap { max-width: 1300px; margin: 0 auto; display: grid; grid-template-columns: 280px 1fr; gap: 32px; }
        .sidebar {
          background: rgba(255,255,255,0.05); border-radius: 16px; padding: 20px;
          color: #e5e7eb; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 10px 40px rgba(0,0,0,0.4);
        }
        .menu-btn { display: flex; align-items: center; gap: 12px; background: transparent; color: #d1d5db;
          border: none; padding: 10px 14px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: 0.25s; }
        .menu-btn:hover { background: rgba(255,255,255,0.08); color: white; }
        .menu-btn.active { background: linear-gradient(90deg,#6c00ff,#2575fc); color: white; }
        .report { background: #fff; border-radius: 16px; padding: 36px; box-shadow: 0 20px 60px rgba(0,0,0,0.1); }
        @media (max-width: 880px) {
          .wrap { grid-template-columns: 1fr; }
          .report { padding: 24px; }
        }
      `}</style>

      <div className="page">
        <div className="max-w-2xl mx-auto mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">🌐 Comprehensive Domain Audit</h1>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Enter domain (e.g. example.com)"
              className="px-4 py-3 rounded-lg border border-gray-300 w-full sm:w-auto"
            />
            <button
              onClick={handleAudit}
              disabled={loading}
              className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Analyzing..." : "Run Audit"}
            </button>
          </div>
          {error && <div className="text-red-400 mt-3 font-medium">{error}</div>}
        </div>

        {results && (
          <div className="wrap">
            <aside className="sidebar">
              <div style={{ fontWeight: 800, fontSize: 18, color: "white", marginBottom: 12 }}>EngagePro Audit</div>
              <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>{results.domain}</div>

              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`menu-btn ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}

              <div style={{ marginTop: 20 }}>
                <button className="menu-btn" onClick={() => setResults(null)}>
                  <FiHome /> New Audit
                </button>
                <button className="menu-btn" onClick={exportPDF}>
                  <FiDownload /> Export PDF
                </button>
              </div>
            </aside>

            <main className="report" ref={reportRef}>
              <h2 className="text-2xl font-bold mb-4 capitalize">{activeTab}</h2>
              <div className="section">
                {/* 🟣 Overview */}
                {activeTab === "overview" && (
                  <>
                    <Row label="Domain" value={results.domain} />
                    <Row label="Processing Time" value={results.processing_time_seconds} />
                    <Row label="Hosting Provider" value={results.hosting?.hosting_provider} />
                    <Row label="Email Provider" value={results.email?.provider} />
                    <Row label="WordPress Detected" value={results.wordpress?.is_wp ? "Yes" : "No"} />
                    <Row label="SSL Valid">
                      <Status valid={results.security?.ssl_valid} label={results.security?.ssl_valid ? "Valid" : "Invalid"} />
                    </Row>
                  </>
                )}

                {/* Other Tabs */}
                {activeTab === "domain" && results["Domain Info"] && (
                  <>
                    <Row label="Registrar" value={results["Domain Info"].registrar} />
                    <Row label="Created" value={results["Domain Info"].creation_date} />
                    <ListRow label="Name Servers" items={results["Domain Info"].name_servers} />
                  </>
                )}

                {activeTab === "hosting" && results.Hosting && (
                  <>
                    <ListRow label="IP Addresses" items={results.Hosting.ips} />
                    <Row label="Server" value={results.Hosting.server} />
                    <Row label="Provider" value={results.Hosting.hosting_provider} />
                  </>
                )}

                {activeTab === "email" && results.Email && (
                  <>
                    <Row label="Provider" value={results.Email.provider} />
                    <ListRow label="MX Records" items={results.Email.mx} />
                  </>
                )}

                {activeTab === "technology" && results["Tech Stack"] && (
                  <>
                    {Object.entries(results["Tech Stack"]).map(([cat, items]) => (
                      <ListRow key={cat} label={cat} items={items} />
                    ))}
                  </>
                )}

                {activeTab === "wordpress" && results.WordPress && (
                  <>
                    <Row label="Version" value={results.WordPress.version} />
                    <ListRow label="Plugins" items={results.WordPress.plugins} />
                  </>
                )}

                {activeTab === "performance" && results.Performance && (
                  <>
                    <Row label="Load Time" value={results.Performance.load_time} />
                    <Row label="Page Size" value={`${results.Performance.page_size_kb} KB`} />
                  </>
                )}

                {activeTab === "security" && results.Security && (
                  <>
                    <Row label="SSL Valid">
                      <Status valid={results.Security.ssl_valid} label={results.Security.ssl_valid ? "Valid" : "Invalid"} />
                    </Row>
                    <Row label="TLS Version" value={results.Security.tls_version} />
                  </>
                )}

                {activeTab === "ads" && results.Ads && (
                  <>
                    <ListRow label="Analytics Tools" items={results.Ads.analytics} />
                    <ListRow label="Ad Networks" items={results.Ads.ad_networks} />
                  </>
                )}
              </div>
            </main>
          </div>
        )}
      </div>
    </>
  );
}
