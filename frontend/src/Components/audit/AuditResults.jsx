import React, { useState, useRef, useEffect } from "react";
import {
  FiActivity,
  FiZap,
  FiShield,
  FiTrendingUp,
  FiLayers,
  FiMail,
  FiRefreshCw,
  FiDownload,
  FiHome,
  FiGlobe,
  FiServer,
  FiCode,
  FiEye,
  FiCheck,
  FiX,
} from "react-icons/fi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function AuditResults({ domain, onNewAudit }) {
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const reportRef = useRef(null);

  // ✅ Fetch results from your Render FastAPI backend
  useEffect(() => {
    if (!domain) return;
    setLoading(true);
    setError("");
    fetch(`https://comprihensive-audit-backend.onrender.com/audit?domain=${domain}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch audit data");
        return res.json();
      })
      .then((data) => {
        console.log("✅ Audit results:", data);
        setResults(data);
      })
      .catch((err) => {
        console.error(err);
        setError("Unable to fetch audit data. Please try again later.");
      })
      .finally(() => setLoading(false));
  }, [domain]);

  // ✅ Export PDF
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
    pdf.save(`${domain || "audit"}-report.pdf`);
  };

  // ✅ UI Helpers
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
      }}
    >
      <div style={{ color: "#374151", fontWeight: 600, flex: 1 }}>{label}</div>
      <div style={{ color: "#111827", fontWeight: 500, flex: 1, textAlign: "right" }}>
        {children || value || "—"}
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
              <span
                key={i}
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

  return (
    <>
      <style>{`
        body { margin: 0; font-family: 'Inter', sans-serif; }
        .page {
          background: linear-gradient(180deg,#1b0538 0%,#0d011a 100%);
          min-height: 100vh;
          padding: 140px 20px 60px;
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
          display:flex;align-items:center;justify-content:center;
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
        .section {
          background: #fafafa;
          padding: 28px;
          border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.05);
        }
        @media (max-width: 880px) {
          .wrap { grid-template-columns: 1fr; }
          .sidebar { position: relative; top: 0; }
          .report { padding: 24px; }
        }
      `}</style>

      <div className="page">
        <div className="wrap">
          <aside className="sidebar">
            <div className="logo">EP</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "white" }}>EngagePro Audit</div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 12 }}>
              {results?.domain || domain || "No domain"}
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
            {loading && <p>Fetching audit results...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
            {!loading && results && (
              <div className="section">
                {activeTab === "overview" && (
                  <>
                    <Row label="Domain" value={results.domain} />
                    <Row label="Hosting" value={results.hosting?.hosting_provider} />
                    <Row label="Email" value={results.email?.provider} />
                    <Row label="SSL">
                      <Status valid={results.security?.ssl_valid} label={results.security?.ssl_valid ? "Valid" : "Invalid"} />
                    </Row>
                  </>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
