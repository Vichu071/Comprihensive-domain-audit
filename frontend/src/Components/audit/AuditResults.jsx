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
} from "react-icons/fi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function AuditResults({ results = {}, onNewAudit }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobile, setIsMobile] = useState(false);
  const reportRef = useRef(null);

  // Extract backend JSON fields properly
  const data = results?.Results || {};
  const domainInfo = data["Domain Info"] || {};
  const hosting = data["Hosting"] || {};
  const email = data["Email"] || {};
  const tech = data["Tech Stack"] || {};
  const wordpress = data["WordPress"] || {};
  const security = data["Security"] || {};
  const performance = data["Performance"] || {};
  const ads = data["Ads"] || {};

  const tabs = [
    { id: "overview", label: "Overview", icon: <FiActivity /> },
    { id: "domain", label: "Domain Details", icon: <FiGlobe /> },
    { id: "hosting", label: "Hosting", icon: <FiServer /> },
    { id: "email", label: "Email Setup", icon: <FiMail /> },
    { id: "technology", label: "Technology", icon: <FiCode /> },
    { id: "wordpress", label: "WordPress", icon: <FiTrendingUp /> },
    { id: "performance", label: "Performance", icon: <FiZap /> },
    { id: "security", label: "Security", icon: <FiShield /> },
  ];

  // PDF Export
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
    pdf.save(`${results.Domain || "audit"}-report.pdf`);
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 880);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Components
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
        padding: "10px 0",
        borderBottom: "1px dashed rgba(0,0,0,0.08)",
        alignItems: "flex-start",
        flexWrap: "wrap",
      }}
    >
      <div style={{ color: "#374151", fontWeight: 600, flex: 1 }}>{label}</div>
      <div style={{ color: "#111827", fontWeight: 500, flex: 1, textAlign: "right", wordBreak: "break-word" }}>
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
          padding: 120px 20px 60px;
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
          padding: 40px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.1);
          color: #0b1220;
          min-height: 600px;
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
            <div style={{ fontWeight: 800, fontSize: 18, color: "white" }}>EngagePro Audit</div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 12 }}>
              {results.Domain || "No domain"}
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
            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 20 }}>
              {tabs.find((t) => t.id === activeTab)?.label}
            </h2>

            <div className="section">
              {/* OVERVIEW */}
              {activeTab === "overview" && (
                <>
                  <Row label="Domain" value={results.Domain} />
                  <Row label="Audit Time" value={results["Audit Time"]} />
                  <Row label="Processing Time" value={results["Processing Time"]} />
                  <Row label="Hosting Provider" value={hosting.Provider} />
                  <Row label="Email Provider" value={email.Provider} />
                  <Row label="WordPress Detected" value={wordpress["Is WordPress"]} />
                  <Row label="SSL Status" value={security.SSL} />
                  <Row label="Performance Score">
                    <span className="score-badge">{performance.Score}</span>
                  </Row>
                </>
              )}

              {/* DOMAIN DETAILS */}
              {activeTab === "domain" && (
                <>
                  <Row label="Registrar" value={domainInfo.Registrar} />
                  <Row label="Created" value={domainInfo.Created} />
                  <Row label="Expiry" value={domainInfo.Expiry} />
                  <ListRow label="Nameservers" items={domainInfo.Nameservers} />
                </>
              )}

              {/* HOSTING */}
              {activeTab === "hosting" && (
                <>
                  <Row label="IP" value={hosting.IP} />
                  <Row label="Server" value={hosting.Server} />
                  <Row label="Provider" value={hosting.Provider} />
                </>
              )}

              {/* EMAIL */}
              {activeTab === "email" && (
                <>
                  <Row label="Email Provider" value={email.Provider} />
                  <ListRow label="MX Records" items={email.MX} />
                  <ListRow label="TXT Records" items={email.TXT} />
                </>
              )}

              {/* TECHNOLOGY */}
              {activeTab === "technology" && (
                <>
                  {Object.entries(tech).map(([key, items]) => (
                    <ListRow key={key} label={key} items={items} />
                  ))}
                </>
              )}

              {/* WORDPRESS */}
              {activeTab === "wordpress" && (
                <>
                  <Row label="Is WordPress" value={wordpress["Is WordPress"]} />
                  <Row label="Version" value={wordpress.Version} />
                  <Row label="Theme" value={wordpress.Theme} />
                  <ListRow label="Plugins" items={wordpress.Plugins} />
                </>
              )}

              {/* PERFORMANCE */}
              {activeTab === "performance" && (
                <>
                  <Row label="Status" value={performance.Status} />
                  <Row label="Score">
                    <span className="score-badge">{performance.Score}</span>
                  </Row>
                  <Row label="Load Time" value={performance["Load Time"]} />
                  <Row label="Page Size" value={performance.Size} />
                  <Row label="URL" value={performance.URL} />
                </>
              )}

              {/* SECURITY */}
              {activeTab === "security" && (
                <>
                  <Row label="SSL" value={security.SSL} />
                  <Row label="TLS" value={security.TLS} />
                  <Row label="Expiry" value={security.Expiry} />
                  <Row label="HSTS" value={security.HSTS} />
                  <Row label="CSP" value={security.CSP} />
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
