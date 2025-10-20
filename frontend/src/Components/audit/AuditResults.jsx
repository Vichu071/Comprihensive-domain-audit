import React, { useState, useEffect, useRef } from "react";
import {
  FiActivity, FiGlobe, FiServer, FiMail, FiCode,
  FiTrendingUp, FiZap, FiShield, FiEye, FiHome, FiDownload
} from "react-icons/fi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function AuditResults({ results = {}, onNewAudit }) {
  const [activeTab, setActiveTab] = useState("overview");
  const reportRef = useRef(null);

  const payload = results?.Results || results || {};
  const domain = results?.Domain || payload?.Domain || "";

  const domainInfo = payload["Domain Info"] || {};
  const hosting = payload.Hosting || {};
  const email = payload.Email || {};
  const tech = payload["Tech Stack"] || {};
  const wordpress = payload.WordPress || {};
  const security = payload.Security || {};
  const performance = payload.Performance || {};
  const ads = payload.Ads || {};

  const exportPDF = async () => {
    if (!reportRef.current) return;
    const originalShadow = reportRef.current.style.boxShadow;
    reportRef.current.style.boxShadow = "none";
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      const pdf = new jsPDF("p", "pt", "a4");
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 595.28;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`${domain || "audit"}-report.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      reportRef.current.style.boxShadow = originalShadow;
    }
  };

  const Row = ({ label, value }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "14px 18px",
        borderBottom: "1px solid #f0f0f0",
        alignItems: "center",
        background: "#fcfcfc",
        borderRadius: 8,
        marginBottom: 8,
      }}
    >
      <div style={{ color: "#4B5563", fontWeight: 600 }}>{label}</div>
      <div style={{ color: "#111827", fontWeight: 500 }}>{value || "—"}</div>
    </div>
  );

  const ListRow = ({ label, items }) => (
    <div style={{ padding: "14px 18px", borderBottom: "1px solid #f0f0f0" }}>
      <div style={{ color: "#4B5563", fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {Array.isArray(items) && items.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {items.map((item, i) => (
            <span
              key={i}
              style={{
                background: "#F3F4F6",
                padding: "6px 10px",
                borderRadius: 6,
                fontSize: 13,
                color: "#111827",
              }}
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <span style={{ color: "#9CA3AF" }}>None</span>
      )}
    </div>
  );

  return (
    <>
      <style>{`
        .audit-page {
          display: flex;
          gap: 40px;
          background: #f9f9ff;
          min-height: 100vh;
          padding: 80px 60px;
          justify-content: center;
        }
        .sidebar {
          width: 280px;
          background: linear-gradient(180deg, #160423, #2b0636);
          border-radius: 20px;
          padding: 36px 26px;
          color: #fff;
          display: flex;
          flex-direction: column;
          justify-content: start;
          box-shadow: 0 8px 40px rgba(0,0,0,0.25);
        }
        .menu-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          border: none;
          background: transparent;
          color: #d1d5db;
          font-weight: 600;
          padding: 12px 14px;
          border-radius: 10px;
          cursor: pointer;
          transition: 0.2s;
          text-align: left;
        }
        .menu-btn:hover { background: rgba(255,255,255,0.1); }
        .menu-btn.active {
          background: linear-gradient(90deg, #6c00ff, #2575fc);
          color: white;
        }
        .report {
          flex: 1;
          max-width: 880px;
          background: white;
          border-radius: 24px;
          padding: 50px;
          box-shadow: 0 6px 40px rgba(0,0,0,0.05);
          height: fit-content;
        }
        .btn-action {
          display: flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(90deg, #6c00ff, #2575fc);
          border: none;
          color: white;
          font-weight: 600;
          padding: 10px 16px;
          border-radius: 10px;
          cursor: pointer;
          transition: 0.2s;
        }
        .btn-action:hover {
          opacity: 0.9;
        }
        @media (max-width: 900px) {
          .audit-page { flex-direction: column; padding: 30px 20px; align-items: center; }
          .sidebar { width: 100%; flex-direction: row; flex-wrap: wrap; justify-content: center; }
          .report { padding: 30px 20px; width: 100%; }
        }
      `}</style>

      <div className="audit-page">
        <aside className="sidebar">
          <div>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: "linear-gradient(135deg, #6c00ff, #2575fc)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 800, marginBottom: 16
            }}>EP</div>

            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>EngagePro Audit</div>
            <div style={{ fontSize: 13, color: "#bbb", marginBottom: 24 }}>{domain || "No domain"}</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                ["overview", FiActivity, "Overview"],
                ["domain", FiGlobe, "Domain Details"],
                ["hosting", FiServer, "Hosting"],
                ["email", FiMail, "Email Setup"],
                ["technology", FiCode, "Technology"],
                ["wordpress", FiTrendingUp, "WordPress"],
                ["performance", FiZap, "Performance"],
                ["security", FiShield, "Security"],
                ["ads", FiEye, "Ads & Trackers"],
              ].map(([key, Icon, label]) => (
                <button
                  key={key}
                  className={`menu-btn ${activeTab === key ? "active" : ""}`}
                  onClick={() => setActiveTab(key)}
                >
                  <Icon /> {label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="report" ref={reportRef}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 30, flexWrap: "wrap", gap: 10
          }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button className="btn-action" onClick={onNewAudit}><FiHome /> New Audit</button>
              <button className="btn-action" onClick={exportPDF}><FiDownload /> Export PDF</button>
            </div>
          </div>

          <div className="section">
            {activeTab === "overview" && (
              <>
                <Row label="Domain" value={domain} />
                <Row label="Hosting Provider" value={hosting.Provider} />
                <Row label="Email Provider" value={email.Provider} />
                <Row label="WordPress Detected" value={wordpress["Is WordPress"]} />
                <Row label="SSL Status" value={security.SSL} />
              </>
            )}
            {activeTab === "domain" && (
              <>
                <Row label="Registrar" value={domainInfo.Registrar} />
                <Row label="Created" value={domainInfo.Created} />
                <Row label="Expiry" value={domainInfo.Expiry} />
                <ListRow label="Nameservers" items={domainInfo.Nameservers} />
              </>
            )}
            {activeTab === "hosting" && (
              <>
                <Row label="IP" value={hosting.IP} />
                <Row label="Server" value={hosting.Server} />
                <Row label="Provider" value={hosting.Provider} />
              </>
            )}
            {activeTab === "email" && (
              <>
                <Row label="Provider" value={email.Provider} />
                <ListRow label="MX" items={email.MX} />
                <ListRow label="TXT" items={email.TXT} />
              </>
            )}
            {activeTab === "technology" && (
              <>
                {Object.entries(tech).map(([key, val]) => (
                  <ListRow key={key} label={key} items={val} />
                ))}
              </>
            )}
            {activeTab === "wordpress" && (
              <>
                <Row label="Is WordPress" value={wordpress["Is WordPress"]} />
                <Row label="Version" value={wordpress.Version} />
                <Row label="Theme" value={wordpress.Theme} />
                <ListRow label="Plugins" items={wordpress.Plugins} />
              </>
            )}
            {activeTab === "performance" && (
              <>
                <Row label="Load Time" value={performance["Load Time"]} />
                <Row label="Size" value={performance.Size} />
                <Row label="Score" value={performance.Score} />
                <Row label="URL" value={performance.URL} />
              </>
            )}
            {activeTab === "security" && (
              <>
                <Row label="SSL" value={security.SSL} />
                <Row label="TLS" value={security.TLS} />
                <Row label="Expiry" value={security.Expiry} />
                <Row label="HSTS" value={security.HSTS} />
                <Row label="CSP" value={security.CSP} />
              </>
            )}
            {activeTab === "ads" && (
              <>
                <ListRow label="Ad Networks" items={ads.ad_networks || []} />
                <ListRow label="Analytics" items={ads.analytics || []} />
                <ListRow label="Tracking Scripts" items={ads.tracking_scripts_found || []} />
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
} 
