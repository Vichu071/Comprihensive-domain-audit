import React, { useState, useRef, useEffect } from "react";
import {
  FiActivity,
  FiZap,
  FiShield,
  FiTrendingUp,
  FiLayers,
  FiMail,
  FiRefreshCw,
  FiPrinter,
  FiDownload,
  FiHome,
  FiGlobe,
  FiCalendar,
  FiServer,
  FiCode,
  FiEye,
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiInfo
} from "react-icons/fi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function AuditResults({ results = {}, onNewAudit }) {
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
    heightLeft -= pageHeight;
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

  // Helper function to display status with icons
  const Status = ({ valid, label }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {valid ? <FiCheck style={{ color: "#10B981" }} /> : <FiX style={{ color: "#EF4444" }} />}
      <span>{label}</span>
    </div>
  );

  const Row = ({ label, value, children }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "12px 0",
        borderBottom: "1px dashed rgba(0,0,0,0.08)",
        alignItems: "flex-start",
      }}
    >
      <div style={{ color: "#374151", fontWeight: 600, flex: 1 }}>{label}</div>
      <div style={{ color: "#111827", fontWeight: 500, flex: 1, textAlign: "right" }}>
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
            {items.map((item, index) => (
              <span
                key={index}
                style={{
                  background: "#F3F4F6",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              >
                {item}
              </span>
            ))}
          </div>
        ) : (
          "None detected"
        )}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        body { margin: 0; font-family: 'Inter', sans-serif; }
        .page {
          background: linear-gradient(180deg,#1b0538 0%,#0d011a 100%);
          min-height: 100vh;
          padding: 140px 20px 60px;
          box-sizing: border-box;
        }
        .wrap {
          max-width: 1300px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 32px;
        }
        .sidebar {
          background: rgba(255,255,255,0.05);
          border-radius: 16px;
          padding: 20px;
          color: #e5e7eb;
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 10px 40px rgba(0,0,0,0.4);
          position: sticky;
          top: 40px;
          height: fit-content;
        }
        .logo {
          background: linear-gradient(90deg,#6c00ff,#2575fc);
          color: white;
          font-weight: 800;
          font-size: 22px;
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display:flex;
          align-items:center;
          justify-content:center;
          margin-bottom: 16px;
        }
        .menu { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
        .menu-btn {
          display: flex; align-items: center; gap: 12px;
          background: transparent;
          color: #d1d5db;
          border: none;
          padding: 12px 14px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.25s;
        }
        .menu-btn:hover { background: rgba(255,255,255,0.08); color: white; }
        .menu-btn.active {
          background: linear-gradient(90deg,#6c00ff,#2575fc);
          color: white;
          box-shadow: 0 8px 20px rgba(108,0,255,0.3);
        }
        .report {
          background: #fff;
          border-radius: 16px;
          padding: 48px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.1);
          color: #0b1220;
          min-height: 600px;
        }
        .report h2 {
          font-size: 26px;
          font-weight: 800;
          margin-bottom: 20px;
          color: #0b1220;
        }
        .section {
          background: #fafafa;
          padding: 28px;
          border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.05);
          margin-bottom: 28px;
        }
        .score-badge {
          background: linear-gradient(90deg,#6c00ff,#2575fc);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 14px;
          display: inline-block;
        }
        @media (max-width: 880px) {
          .wrap { grid-template-columns: 1fr; }
          .sidebar { position: relative; top: 0; display: flex; flex-wrap: wrap; justify-content: center; }
          .menu { flex-direction: row; flex-wrap: wrap; justify-content: center; }
          .report { padding: 24px; }
        }
      `}</style>

      <div className="page">
        <div className="wrap">
          <aside className="sidebar">
            <div className="logo">EP</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "white" }}>
              EngagePro Audit
            </div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 12 }}>
              {results?.domain || "No domain"}
            </div>

            <div className="menu">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`menu-btn ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <button className="menu-btn" onClick={onNewAudit}>
                <FiHome /> New Audit
              </button>
              <button className="menu-btn" onClick={exportPDF}>
                <FiDownload /> Export PDF
              </button>
            </div>
          </aside>

          <main className="report" ref={reportRef}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2>{tabs.find((t) => t.id === activeTab)?.label}</h2>
              {results.audit_date && (
                <div style={{ color: "#6B7280", fontSize: "14px" }}>
                  Audited: {new Date(results.audit_date).toLocaleDateString()}
                </div>
              )}
            </div>
            
            <div className="section">
              {activeTab === "overview" && (
                <>
                  <Row label="Domain" value={results.domain} />
                  <Row label="Overall Score">
                    {results.performance?.score && (
                      <span className="score-badge">{results.performance.score}</span>
                    )}
                  </Row>
                  <Row label="Processing Time" value={results.processing_time_seconds ? `${results.processing_time_seconds}s` : "—"} />
                  <Row label="Hosting Provider" value={results.hosting?.hosting_provider} />
                  <Row label="Email Provider" value={results.email?.provider} />
                  <Row label="WordPress Detected">
                    {results.wordpress?.is_wp ? "Yes" : "No"}
                  </Row>
                  <Row label="SSL Status">
                    {results.security?.ssl_valid ? (
                      <Status valid={true} label="Valid" />
                    ) : (
                      <Status valid={false} label="Invalid/Missing" />
                    )}
                  </Row>
                </>
              )}

              {activeTab === "domain" && results.domain_details && (
                <>
                  <Row label="Registrar" value={results.domain_details.registrar} />
                  <Row label="Creation Date" value={results.domain_details.creation_date} />
                  <Row label="Expiry Date" value={results.domain_details.expiry_date} />
                  <Row label="Updated Date" value={results.domain_details.updated_date} />
                  <ListRow label="Name Servers" items={results.domain_details.name_servers} />
                </>
              )}

              {activeTab === "hosting" && results.hosting && (
                <>
                  <ListRow label="IP Addresses" items={results.hosting.ips} />
                  <Row label="Server" value={results.hosting.server} />
                  <Row label="X-Powered-By" value={results.hosting.x_powered_by} />
                  <Row label="Hosting Provider" value={results.hosting.hosting_provider} />
                  <Row label="Reverse Hostname" value={results.hosting.reverse_hostname} />
                  <ListRow label="Resolver Nameservers" items={results.hosting.resolver} />
                </>
              )}

              {activeTab === "email" && results.email && (
                <>
                  <Row label="Email Provider" value={results.email.provider} />
                  <ListRow label="MX Records" items={results.email.mx} />
                  <ListRow label="TXT Records" items={results.email.txt} />
                  <ListRow label="Found Email Addresses" items={results.email.found_emails} />
                </>
              )}

              {activeTab === "technology" && results.technology && (
                <>
                  {Object.entries(results.technology).map(([category, technologies]) => (
                    <ListRow key={category} 
                      label={category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} 
                      items={technologies} 
                    />
                  ))}
                  {Object.keys(results.technology).length === 0 && (
                    <div style={{ textAlign: "center", color: "#6B7280", padding: "20px" }}>
                      No technologies detected
                    </div>
                  )}
                </>
              )}

              {activeTab === "wordpress" && results.wordpress && (
                <>
                  <Row label="WordPress Detected">
                    {results.wordpress.is_wp ? "Yes" : "No"}
                  </Row>
                  <Row label="Version" value={results.wordpress.version} />
                  <Row label="Theme" value={results.wordpress.theme} />
                  <ListRow label="Plugins" items={results.wordpress.plugins} />
                </>
              )}

              {activeTab === "performance" && results.performance && (
                <>
                  <Row label="Performance Score">
                    {results.performance.score && (
                      <span className="score-badge">{results.performance.score}</span>
                    )}
                  </Row>
                  <Row label="Load Time" value={results.performance.load_time} />
                  <Row label="Page Size" value={results.performance.page_size_kb ? `${results.performance.page_size_kb} KB` : "—"} />
                </>
              )}

              {activeTab === "security" && results.security && (
                <>
                  <Row label="SSL Valid">
                    {results.security.ssl_valid ? (
                      <Status valid={true} label="Valid" />
                    ) : (
                      <Status valid={false} label="Invalid/Missing" />
                    )}
                  </Row>
                  <Row label="SSL Expiry" value={results.security.ssl_expiry} />
                  <Row label="TLS Version" value={results.security.tls_version} />
                  <Row label="HSTS" value={results.security.headers?.hsts ? "Enabled" : "Disabled"} />
                  <Row label="X-Frame-Options" value={results.security.headers?.x_frame_options} />
                  <Row label="X-Content-Type-Options" value={results.security.headers?.x_content_type_options} />
                  <Row label="Content-Security-Policy" value={results.security.headers?.csp ? "Enabled" : "Disabled"} />
                  <Row label="Referrer-Policy" value={results.security.headers?.referrer_policy} />
                </>
              )}

              {activeTab === "ads" && results.ads && (
                <>
                  <ListRow label="Ad Networks" items={results.ads.ad_networks} />
                  <ListRow label="Analytics Tools" items={results.ads.analytics} />
                  <ListRow label="Tracking Scripts" items={results.ads.tracking_scripts_found} />
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
