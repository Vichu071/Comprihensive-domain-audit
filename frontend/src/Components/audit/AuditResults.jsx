// AuditResults.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  FiActivity, FiGlobe, FiServer, FiMail, FiCode, FiTrendingUp,
  FiZap, FiShield, FiDownload, FiHome, FiCheck, FiX, FiEye
} from "react-icons/fi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function AuditResults({ results = {}, onNewAudit }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobile, setIsMobile] = useState(false);
  const reportRef = useRef(null);

  const payload = results?.Results ? results.Results : results || {};
  const domain = results?.Domain || payload?.Domain || "";

  const domainInfo = payload["Domain Info"] || {};
  const hosting = payload.Hosting || {};
  const email = payload.Email || {};
  const tech = payload["Tech Stack"] || {};
  const wordpress = payload.WordPress || {};
  const security = payload.Security || {};
  const performance = payload.Performance || {};
  const ads = payload.Ads || {};

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 880);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const exportPDF = async () => {
    if (!reportRef.current) return;
    const originalShadow = reportRef.current.style.boxShadow;
    reportRef.current.style.boxShadow = "none";
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "pt", "a4");
      const imgWidth = 595.28;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= 841.89;
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= 841.89;
      }
      pdf.save(`${domain || "audit"}-report.pdf`);
    } catch (e) {
      console.error("PDF export error:", e);
    } finally {
      reportRef.current.style.boxShadow = originalShadow;
    }
  };

  const Row = ({ label, value, children }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "12px 0",
        borderBottom: "1px dashed rgba(0,0,0,0.08)",
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? 6 : 0,
      }}
    >
      <div style={{ color: "#374151", fontWeight: 600 }}>{label}</div>
      <div style={{ color: "#111827", textAlign: isMobile ? "left" : "right" }}>
        {children ?? (value ? String(value) : "—")}
      </div>
    </div>
  );

  const ListRow = ({ label, items }) => (
    <div style={{ padding: "12px 0", borderBottom: "1px dashed rgba(0,0,0,0.08)" }}>
      <div style={{ color: "#374151", fontWeight: 600, marginBottom: 8 }}>{label}</div>
      {items?.length ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: isMobile ? "flex-start" : "flex-end",
          }}
        >
          {items.map((it, i) => (
            <span
              key={i}
              style={{
                background: "#F3F4F6",
                padding: "6px 10px",
                borderRadius: 8,
                color: "#111",
              }}
            >
              {String(it)}
            </span>
          ))}
        </div>
      ) : (
        <span style={{ color: "#6B7280" }}>None detected</span>
      )}
    </div>
  );

  const Status = ({ ok, yesLabel = "Yes", noLabel = "No" }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
      {ok ? <FiCheck style={{ color: "#10B981" }} /> : <FiX style={{ color: "#EF4444" }} />}
      <span>{ok ? yesLabel : noLabel}</span>
    </div>
  );

  return (
    <>
      <style>{`
        .page {
          display: flex;
          gap: 32px;
          justify-content: center;
          align-items: flex-start;
          padding: 60px 20px 80px;
          background: #f9fafb;
          min-height: 100vh;
        }
        .sidebar {
          width: 240px;
          border-radius: 16px;
          padding: 20px;
          background: linear-gradient(180deg,#1a0526,#2b0636);
          color: #e6e6f0;
          box-shadow: 0 10px 30px rgba(0,0,0,0.35);
          flex-shrink: 0;
          position: sticky;
          top: 20px;
          height: fit-content;
        }
        .logo {
          width:60px; height:60px;
          border-radius:12px;
          display:flex; align-items:center; justify-content:center;
          font-weight:800;
          background: linear-gradient(90deg,#6c00ff,#2575fc);
          color:#fff;
          margin-bottom:16px;
          font-size: 20px;
        }
        .menu-btn {
          display:flex; gap:10px; align-items:center;
          background:transparent;
          color:#d1d5db;
          border:none;
          padding:10px 12px;
          border-radius:10px;
          cursor:pointer;
          text-align:left;
          width:100%;
          font-weight:600;
          transition: all 0.3s ease;
        }
        .menu-btn:hover {
          background:rgba(255,255,255,0.08);
        }
        .menu-btn.active {
          background: linear-gradient(90deg,#6c00ff,#2575fc);
          color:white;
        }
        .report {
          flex:1;
          max-width: 900px;
          background:white;
          border-radius:16px;
          padding:36px 32px;
          color:#0b1220;
          box-shadow: 0 12px 40px rgba(0,0,0,0.08);
        }
        .section {
          background:#fafafa;
          padding:20px 24px;
          border-radius:12px;
          border:1px solid rgba(0,0,0,0.05);
          min-height: 400px;
        }
        @media (max-width: 880px) {
          .page {
            flex-direction: column;
            padding: 20px;
          }
          .sidebar {
            width:100%;
            display:flex;
            flex-wrap:wrap;
            justify-content:center;
            position:static;
          }
          .report {
            max-width:100%;
            padding:24px 20px;
          }
        }
      `}</style>

      <div className="page">
        <aside className="sidebar">
          <div className="logo">EP</div>
          <div style={{ fontSize: 17, fontWeight: 800 }}>EngagePro Audit</div>
          <div style={{ fontSize: 13, color: "#aab3c6", marginBottom: 14 }}>{domain || "No domain"}</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              ["overview", "Overview", <FiActivity />],
              ["domain", "Domain", <FiGlobe />],
              ["hosting", "Hosting", <FiServer />],
              ["email", "Email", <FiMail />],
              ["technology", "Technology", <FiCode />],
              ["wordpress", "WordPress", <FiTrendingUp />],
              ["performance", "Performance", <FiZap />],
              ["security", "Security", <FiShield />],
              ["ads", "Ads", <FiEye />],
            ].map(([key, label, icon]) => (
              <button
                key={key}
                className={`menu-btn ${activeTab === key ? "active" : ""}`}
                onClick={() => setActiveTab(key)}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={onNewAudit} className="menu-btn"><FiHome /> New Audit</button>
            <button onClick={exportPDF} className="menu-btn"><FiDownload /> Export PDF</button>
          </div>
        </aside>

        <main className="report" ref={reportRef}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 22 }}>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
            <div style={{ color: "#6B7280", fontSize: 13 }}>
              {results["Audit Time"] || ""} {results["Processing Time"] ? `• ${results["Processing Time"]}` : ""}
            </div>
          </div>

          <div className="section">
            {activeTab === "overview" && (
              <>
                <Row label="Domain" value={domain} />
                <Row label="Processing Time" value={results["Processing Time"]} />
                <Row label="Hosting Provider" value={hosting?.Provider || "—"} />
                <Row label="Email Provider" value={email?.Provider || "—"} />
                <Row label="WordPress Detected" value={wordpress?.["Is WordPress"] || "No"} />
                <Row label="SSL Status">
                  {security?.SSL === "Valid"
                    ? <Status ok={true} yesLabel="Valid" />
                    : <Status ok={false} noLabel={security?.SSL || "Unavailable"} />}
                </Row>
              </>
            )}

            {activeTab === "domain" && (
              <>
                <Row label="Registrar" value={domainInfo?.Registrar} />
                <Row label="Created" value={domainInfo?.Created} />
                <Row label="Expiry" value={domainInfo?.Expiry} />
                <ListRow label="Nameservers" items={domainInfo?.Nameservers || []} />
              </>
            )}

            {activeTab === "hosting" && (
              <>
                <Row label="IP" value={hosting?.IP} />
                <Row label="Server" value={hosting?.Server} />
                <Row label="Provider" value={hosting?.Provider} />
              </>
            )}

            {activeTab === "email" && (
              <>
                <Row label="Provider" value={email?.Provider} />
                <ListRow label="MX" items={email?.MX || []} />
                <ListRow label="TXT" items={email?.TXT || []} />
              </>
            )}

            {activeTab === "technology" && (
              <>
                {Object.keys(tech).length
                  ? Object.entries(tech).map(([k, v]) => <ListRow key={k} label={k} items={v} />)
                  : <div style={{ color: "#6B7280" }}>No technologies detected</div>}
              </>
            )}

            {activeTab === "wordpress" && (
              <>
                <Row label="Is WordPress" value={wordpress?.["Is WordPress"]} />
                <Row label="Version" value={wordpress?.Version} />
                <Row label="Theme" value={wordpress?.Theme} />
                <ListRow label="Plugins" items={wordpress?.Plugins || []} />
              </>
            )}

            {activeTab === "performance" && (
              <>
                <Row label="Load Time" value={performance?.["Load Time"]} />
                <Row label="Size" value={performance?.Size} />
                <Row label="Score" value={performance?.Score} />
                <Row label="URL" value={performance?.URL} />
              </>
            )}

            {activeTab === "security" && (
              <>
                <Row label="SSL" value={security?.SSL} />
                <Row label="TLS" value={security?.TLS} />
                <Row label="Expiry" value={security?.Expiry} />
                <Row label="HSTS" value={security?.HSTS === "Yes" ? "Enabled" : "Disabled"} />
                <Row label="CSP" value={security?.CSP === "Yes" ? "Enabled" : "Disabled"} />
              </>
            )}

            {activeTab === "ads" && (
              <>
                <ListRow label="Ad Networks" items={ads?.ad_networks || []} />
                <ListRow label="Analytics" items={ads?.analytics || []} />
                <ListRow label="Tracking Scripts" items={ads?.tracking_scripts_found || []} />
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
