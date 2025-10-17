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
} from "react-icons/fi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function AuditResults({ results = {}, onNewAudit }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobile, setIsMobile] = useState(false);
  const reportRef = useRef(null);

  const tabs = [
    { id: "overview", label: "Overview", icon: <FiActivity /> },
    { id: "domain", label: "Domain Details", icon: <FiCalendar /> },
    { id: "hosting", label: "Hosting", icon: <FiLayers /> },
    { id: "email", label: "Email Setup", icon: <FiMail /> },
    { id: "technology", label: "Technology", icon: <FiZap /> },
    { id: "wordpress", label: "WordPress", icon: <FiTrendingUp /> },
    { id: "performance", label: "Performance", icon: <FiTrendingUp /> },
    { id: "security", label: "Security", icon: <FiShield /> },
    { id: "ads", label: "Ads & Trackers", icon: <FiZap /> },
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

  const Row = ({ label, value }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: "1px dashed rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ color: "#374151", fontWeight: 600 }}>{label}</div>
      <div style={{ color: "#111827", fontWeight: 700 }}>
        {value || "—"}
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
            <h2>{tabs.find((t) => t.id === activeTab)?.label}</h2>
            <div className="section">
              {activeTab === "overview" && (
                <>
                  <Row label="Domain" value={results.domain} />
                  <Row label="Score" value={results.score} />
                  <Row label="Hosting" value={results.hosting} />
                  <Row label="Email" value={results.email} />
                </>
              )}
              {activeTab === "domain" && results.domain_info && (
                <>
                  <Row label="Registrar" value={results.domain_info.registrar} />
                  <Row label="Creation" value={results.domain_info.creation_date} />
                  <Row label="Expiry" value={results.domain_info.expiry_date} />
                </>
              )}
              {activeTab === "hosting" && (
                <>
                  <Row label="Provider" value={results.hosting_provider} />
                  <Row label="IP" value={results.ip_address} />
                </>
              )}
              {activeTab === "email" && (
                <>
                  <Row label="Email Provider" value={results.email_provider} />
                </>
              )}
              {activeTab === "technology" && (
                <>
                  <Row
                    label="Tech Stack"
                    value={Array.isArray(results.technologies) ? results.technologies.join(", ") : results.technologies}
                  />
                </>
              )}
              {activeTab === "wordpress" && results.wordpress && (
                <>
                  <Row label="Theme" value={results.wordpress.theme} />
                  <Row
                    label="Plugins"
                    value={Array.isArray(results.wordpress.plugins) ? results.wordpress.plugins.join(", ") : results.wordpress.plugins}
                  />
                </>
              )}
              {activeTab === "performance" && results.performance && (
                <>
                  <Row label="Speed Score" value={results.performance.speed_score} />
                  <Row label="Load Time" value={results.performance.load_time} />
                </>
              )}
              {activeTab === "security" && results.security && (
                <>
                  <Row label="SSL" value={results.security.ssl_status} />
                  <Row label="HSTS" value={results.security.hsts_enabled ? "Enabled" : "Disabled"} />
                </>
              )}
              {activeTab === "ads" && results.ads && (
                <>
                  <Row label="Ads" value={results.ads.ads_list?.join(", ")} />
                  <Row label="Trackers" value={results.ads.trackers?.join(", ")} />
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
