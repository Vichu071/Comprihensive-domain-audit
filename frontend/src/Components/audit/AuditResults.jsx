import React, { useState, useRef, useEffect } from "react";
import {
  FiActivity,
  FiZap,
  FiShield,
  FiTrendingUp,
  FiLayers,
  FiMail,
  FiDownload,
  FiHome,
  FiGlobe,
  FiServer,
  FiCode,
  FiEye,
  FiCheck,
  FiX,
  FiCalendar,
  FiCpu,
  FiGlobe
} from "react-icons/fi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function AuditResults({ results = {}, onNewAudit }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobile, setIsMobile] = useState(false);
  const reportRef = useRef(null);

  const tabs = [
    { id: "overview", label: "Overview", icon: <FiActivity /> },
    { id: "domain", label: "Domain Info", icon: <FiGlobe /> },
    { id: "hosting", label: "Hosting", icon: <FiServer /> },
    { id: "email", label: "Email", icon: <FiMail /> },
    { id: "technology", label: "Tech Stack", icon: <FiCode /> },
    { id: "wordpress", label: "WordPress", icon: <FiTrendingUp /> },
    { id: "performance", label: "Performance", icon: <FiZap /> },
    { id: "security", label: "Security", icon: <FiShield /> },
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
    pdf.save(`${results.Domain || "audit"}-report.pdf`);
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 880);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Status component for boolean values
  const Status = ({ value, positiveLabel = "Yes", negativeLabel = "No" }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end" }}>
      {value === "Yes" || value === "Valid" || value === true ? (
        <>
          <FiCheck style={{ color: "#10B981" }} />
          <span style={{ color: "#10B981", fontWeight: 600 }}>{positiveLabel}</span>
        </>
      ) : (
        <>
          <FiX style={{ color: "#EF4444" }} />
          <span style={{ color: "#EF4444", fontWeight: 600 }}>{negativeLabel}</span>
        </>
      )}
    </div>
  );

  // Row component for key-value pairs
  const Row = ({ label, value, children, status }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 0",
        borderBottom: "1px dashed rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ color: "#374151", fontWeight: 600, flex: 1 }}>{label}</div>
      <div style={{ color: "#111827", fontWeight: 500, textAlign: "right", flex: 1 }}>
        {status ? (
          <Status value={value} />
        ) : children || (value !== undefined && value !== null && value !== "Unknown" ? value.toString() : "—")}
      </div>
    </div>
  );

  // List component for arrays
  const ListRow = ({ label, items, emptyMessage = "None detected" }) => (
    <div style={{ padding: "12px 0", borderBottom: "1px dashed rgba(0,0,0,0.08)" }}>
      <div style={{ color: "#374151", fontWeight: 600, marginBottom: "8px" }}>{label}</div>
      <div style={{ color: "#111827" }}>
        {items && items.length > 0 && !(items.length === 1 && items[0] === "Unknown") ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {items.map((item, index) => (
              <span
                key={index}
                style={{
                  background: "#F3F4F6",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  border: "1px solid #E5E7EB",
                }}
              >
                {item}
              </span>
            ))}
          </div>
        ) : (
          <span style={{ color: "#6B7280", fontStyle: "italic" }}>{emptyMessage}</span>
        )}
      </div>
    </div>
  );

  // Technology stack display
  const TechStack = ({ tech }) => (
    <div style={{ padding: "12px 0", borderBottom: "1px dashed rgba(0,0,0,0.08)" }}>
      <div style={{ color: "#374151", fontWeight: 600, marginBottom: "12px" }}>Technologies</div>
      {tech && Object.keys(tech).length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {Object.entries(tech).map(([category, technologies]) => (
            <div key={category}>
              <div style={{ 
                fontSize: "14px", 
                fontWeight: 600, 
                color: "#4B5563", 
                marginBottom: "6px",
                textTransform: "capitalize"
              }}>
                {category.replace(/-/g, ' ')}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {technologies.map((techItem, index) => (
                  <span
                    key={index}
                    style={{
                      background: "linear-gradient(90deg,#6c00ff,#2575fc)",
                      color: "white",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                  >
                    {techItem}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <span style={{ color: "#6B7280", fontStyle: "italic" }}>No technologies detected</span>
      )}
    </div>
  );

  // Score badge component
  const ScoreBadge = ({ score }) => {
    if (!score) return null;
    
    const getColor = () => {
      if (score === "Excellent") return "#10B981";
      if (score === "Good") return "#3B82F6";
      if (score === "Average") return "#F59E0B";
      return "#EF4444";
    };

    return (
      <span
        style={{
          background: getColor(),
          color: "white",
          padding: "6px 12px",
          borderRadius: "20px",
          fontWeight: 700,
          fontSize: "13px",
          display: "inline-block",
        }}
      >
        {score}
      </span>
    );
  };

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
              {results?.Domain || "No domain"}
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
              {results["Audit Time"] && (
                <div style={{ color: "#6B7280", fontSize: "14px" }}>
                  Audited: {new Date(results["Audit Time"]).toLocaleDateString()}
                </div>
              )}
            </div>
            
            <div className="section">
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <>
                  <Row label="Domain" value={results.Domain} />
                  <Row label="Performance Score">
                    {results.Performance?.Score && <ScoreBadge score={results.Performance.Score} />}
                  </Row>
                  <Row label="Processing Time" value={results["Processing Time"]} />
                  <Row label="Hosting Provider" value={results.Hosting?.Provider} />
                  <Row label="Email Provider" value={results.Email?.Provider} />
                  <Row label="WordPress Detected" value={results.WordPress?.["Is WordPress"]} status />
                  <Row label="SSL Status" value={results.Security?.SSL} status positiveLabel="Valid" negativeLabel="Invalid" />
                </>
              )}

              {/* Domain Info Tab */}
              {activeTab === "domain" && results["Domain Info"] && (
                <>
                  <Row label="Registrar" value={results["Domain Info"].Registrar} />
                  <Row label="Creation Date" value={results["Domain Info"].Created} />
                  <Row label="Expiry Date" value={results["Domain Info"].Expiry} />
                  <ListRow label="Name Servers" items={results["Domain Info"].Nameservers} />
                </>
              )}

              {/* Hosting Tab */}
              {activeTab === "hosting" && results.Hosting && (
                <>
                  <Row label="IP Address" value={results.Hosting.IP} />
                  <Row label="Server" value={results.Hosting.Server} />
                  <Row label="Hosting Provider" value={results.Hosting.Provider} />
                </>
              )}

              {/* Email Tab */}
              {activeTab === "email" && results.Email && (
                <>
                  <Row label="Email Provider" value={results.Email.Provider} />
                  <ListRow label="MX Records" items={results.Email.MX} />
                  <ListRow label="TXT Records" items={results.Email.TXT} />
                </>
              )}

              {/* Technology Tab */}
              {activeTab === "technology" && results["Tech Stack"] && (
                <TechStack tech={results["Tech Stack"]} />
              )}

              {/* WordPress Tab */}
              {activeTab === "wordpress" && results.WordPress && (
                <>
                  <Row label="WordPress Detected" value={results.WordPress["Is WordPress"]} status />
                  <Row label="Version" value={results.WordPress.Version} />
                  <Row label="Theme" value={results.WordPress.Theme} />
                  <ListRow label="Plugins" items={results.WordPress.Plugins} />
                </>
              )}

              {/* Performance Tab */}
              {activeTab === "performance" && results.Performance && (
                <>
                  <Row label="Performance Score">
                    {results.Performance.Score && <ScoreBadge score={results.Performance.Score} />}
                  </Row>
                  <Row label="Load Time" value={results.Performance["Load Time"]} />
                  <Row label="Page Size" value={results.Performance.Size} />
                  <Row label="Status" value={results.Performance.Status} />
                  {results.Performance.URL && (
                    <Row label="Tested URL">
                      <a 
                        href={results.Performance.URL} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: "#2563EB", textDecoration: "none" }}
                      >
                        {results.Performance.URL}
                      </a>
                    </Row>
                  )}
                </>
              )}

              {/* Security Tab */}
              {activeTab === "security" && results.Security && (
                <>
                  <Row label="SSL Status" value={results.Security.SSL} status positiveLabel="Valid" negativeLabel="Invalid" />
                  <Row label="SSL Expiry" value={results.Security.Expiry} />
                  <Row label="TLS Version" value={results.Security.TLS} />
                  <Row label="HSTS Enabled" value={results.Security.HSTS} status />
                  <Row label="Content Security Policy" value={results.Security.CSP} status />
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
