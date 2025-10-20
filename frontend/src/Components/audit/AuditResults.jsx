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

  // Map the JSON structure to match your component
  const payload = results?.Results || results || {};
  const domain = results?.Domain || payload?.Domain || "";

  // Map all sections from the JSON response
  const domainInfo = payload["Domain Info"] || {};
  const hosting = payload.Hosting || {};
  const email = payload.Email || {};
  const technology = payload.Technology || {};
  const wordpress = payload.WordPress || {};
  const security = payload.Security || {};
  const performance = payload.Performance || {};
  const tracking = payload.Tracking || {};

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

  // Helper Components
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

  const ObjectListRow = ({ label, items }) => (
    <div style={{ padding: "14px 18px", borderBottom: "1px solid #f0f0f0" }}>
      <div style={{ color: "#4B5563", fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {items && Object.keys(items).length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {Object.entries(items).map(([key, value], i) => (
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
              {key}: {Array.isArray(value) ? value.join(", ") : value}
            </span>
          ))}
        </div>
      ) : (
        <span style={{ color: "#9CA3AF" }}>None</span>
      )}
    </div>
  );

  const TechCategoryRow = ({ label, items }) => (
    <div style={{ padding: "14px 18px", borderBottom: "1px solid #f0f0f0" }}>
      <div style={{ color: "#4B5563", fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {Array.isArray(items) && items.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {items.map((item, i) => (
            <span
              key={i}
              style={{
                background: "#E0E7FF",
                padding: "6px 10px",
                borderRadius: 6,
                fontSize: 13,
                color: "#3730A3",
                fontWeight: 500,
              }}
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <span style={{ color: "#9CA3AF" }}>None detected</span>
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
        .section-title {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin: 20px 0 10px 0;
          padding-bottom: 8px;
          border-bottom: 2px solid #E5E7EB;
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

            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Domain Audit</div>
            <div style={{ fontSize: 13, color: "#bbb", marginBottom: 24 }}>{domain || "No domain"}</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                ["overview", FiActivity, "Overview"],
                ["domain", FiGlobe, "Domain Info"],
                ["hosting", FiServer, "Hosting"],
                ["email", FiMail, "Email"],
                ["technology", FiCode, "Technology"],
                ["wordpress", FiTrendingUp, "WordPress"],
                ["performance", FiZap, "Performance"],
                ["security", FiShield, "Security"],
                ["tracking", FiEye, "Tracking"],
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
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Audit Results
            </h2>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button className="btn-action" onClick={onNewAudit}><FiHome /> New Audit</button>
              <button className="btn-action" onClick={exportPDF}><FiDownload /> Export PDF</button>
            </div>
          </div>

          <div className="section">
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <>
                <div className="section-title">Domain Overview</div>
                <Row label="Domain" value={domain} />
                <Row label="Audit Time" value={results["Audit Time"]} />
                <Row label="Processing Time" value={results["Processing Time"]} />
                
                <div className="section-title">Quick Summary</div>
                <Row label="Registrar" value={domainInfo.Registrar} />
                <Row label="Hosting Provider" value={hosting.Provider} />
                <Row label="Email Provider" value={email.Provider} />
                <Row label="WordPress Detected" value={wordpress.Detected} />
                <Row label="SSL Status" value={security.SSL} />
                <Row label="Performance Rating" value={performance.Rating} />
              </>
            )}

            {/* DOMAIN INFO TAB */}
            {activeTab === "domain" && (
              <>
                <div className="section-title">Domain Registration Details</div>
                <Row label="Registrar" value={domainInfo.Registrar} />
                <Row label="Created Date" value={domainInfo.Created} />
                <Row label="Expiry Date" value={domainInfo.Expiry} />
                <Row label="Domain Status" value={domainInfo.Status || "Active"} />
                
                <div className="section-title">DNS Configuration</div>
                <ListRow label="Nameservers" items={domainInfo.Nameservers} />
                
                {domainInfo["DNS Records"] && (
                  <>
                    <div className="section-title">DNS Records</div>
                    <ObjectListRow label="All DNS Records" items={domainInfo["DNS Records"]} />
                  </>
                )}
              </>
            )}

            {/* HOSTING TAB */}
            {activeTab === "hosting" && (
              <>
                <div className="section-title">Hosting Information</div>
                <Row label="IP Address" value={hosting["IP Address"]} />
                <Row label="Server" value={hosting.Server} />
                <Row label="Provider" value={hosting.Provider} />
                <Row label="CDN" value={hosting.CDN || "Not Detected"} />
                
                {hosting["IP Addresses"] && (
                  <ListRow label="All IP Addresses" items={hosting["IP Addresses"]} />
                )}
                
                {hosting.Infrastructure && (
                  <ListRow label="Infrastructure Stack" items={hosting.Infrastructure} />
                )}
              </>
            )}

            {/* EMAIL TAB */}
            {activeTab === "email" && (
              <>
                <div className="section-title">Email Configuration</div>
                <Row label="Email Provider" value={email.Provider} />
                
                <div className="section-title">Mail Exchange Records</div>
                <ListRow label="MX Records" items={email["MX Records"]} />
                
                {email["DNS Records"] && (
                  <>
                    <div className="section-title">DNS Security Records</div>
                    <ObjectListRow label="Email Security Records" items={email["DNS Records"]} />
                  </>
                )}
              </>
            )}

            {/* TECHNOLOGY TAB */}
            {activeTab === "technology" && (
              <>
                <div className="section-title">Technology Stack</div>
                
                {technology["javascript-frameworks"] && (
                  <TechCategoryRow label="JavaScript Frameworks" items={technology["javascript-frameworks"]} />
                )}
                
                {technology["web-servers"] && (
                  <TechCategoryRow label="Web Servers" items={technology["web-servers"]} />
                )}
                
                {technology["cms"] && (
                  <TechCategoryRow label="Content Management Systems" items={technology["cms"]} />
                )}
                
                {technology["programming-languages"] && (
                  <TechCategoryRow label="Programming Languages" items={technology["programming-languages"]} />
                )}
                
                {technology["tag-managers"] && (
                  <TechCategoryRow label="Tag Managers" items={technology["tag-managers"]} />
                )}
                
                {technology["css-frameworks"] && (
                  <TechCategoryRow label="CSS Frameworks" items={technology["css-frameworks"]} />
                )}
                
                {Object.keys(technology).filter(key => 
                  !["javascript-frameworks", "web-servers", "cms", "programming-languages", "tag-managers", "css-frameworks"].includes(key)
                ).map(key => (
                  <TechCategoryRow key={key} label={key.replace(/-/g, ' ').toUpperCase()} items={technology[key]} />
                ))}
              </>
            )}

            {/* WORDPRESS TAB */}
            {activeTab === "wordpress" && (
              <>
                <div className="section-title">WordPress Detection</div>
                <Row label="WordPress Detected" value={wordpress.Detected} />
                <Row label="Confidence Level" value={wordpress.Confidence} />
                <Row label="WordPress Version" value={wordpress.Version} />
                <Row label="Active Theme" value={wordpress.Theme} />
                
                {wordpress.Plugins && (
                  <>
                    <div className="section-title">Installed Plugins</div>
                    <ListRow label={`Plugins (${wordpress.Plugins.length})`} items={wordpress.Plugins} />
                  </>
                )}
                
                {wordpress["Security_Issues"] && (
                  <>
                    <div className="section-title">Security Issues</div>
                    <ListRow label="Identified Issues" items={wordpress["Security_Issues"]} />
                  </>
                )}
              </>
            )}

            {/* PERFORMANCE TAB */}
            {activeTab === "performance" && (
              <>
                <div className="section-title">Performance Metrics</div>
                <Row label="Load Time" value={performance["Load Time"]} />
                <Row label="Page Size" value={performance["Page Size"]} />
                <Row label="Performance Rating" value={performance.Rating} />
                <Row label="Performance Score" value={performance.Score} />
                <Row label="Status Code" value={performance["Status_Code"]} />
                
                <div className="section-title">Content Analysis</div>
                <Row label="Images Count" value={performance["Images_Count"]} />
                <Row label="Scripts Count" value={performance["Scripts_Count"]} />
                <Row label="Stylesheets Count" value={performance["Stylesheets_Count"]} />
              </>
            )}

            {/* SECURITY TAB */}
            {activeTab === "security" && (
              <>
                <div className="section-title">SSL/TLS Security</div>
                <Row label="SSL Certificate" value={security.SSL} />
                <Row label="TLS Version" value={security.TLS} />
                <Row label="Certificate Expiry" value={security.Expires} />
                
                {security["Certificate_Info"] && (
                  <>
                    <div className="section-title">Certificate Details</div>
                    <ObjectListRow label="Certificate Information" items={security["Certificate_Info"]} />
                  </>
                )}
                
                {security["Security_Headers"] && (
                  <>
                    <div className="section-title">Security Headers</div>
                    <ObjectListRow label="HTTP Security Headers" items={security["Security_Headers"]} />
                  </>
                )}
                
                {security["Security Headers"] && Array.isArray(security["Security Headers"]) && (
                  <ListRow label="Active Security Headers" items={security["Security Headers"]} />
                )}
              </>
            )}

            {/* TRACKING TAB */}
            {activeTab === "tracking" && (
              <>
                <div className="section-title">Analytics & Tracking</div>
                
                {tracking.Analytics && (
                  <ListRow label="Analytics Services" items={tracking.Analytics} />
                )}
                
                {tracking["Ad Networks"] && (
                  <ListRow label="Advertising Networks" items={tracking["Ad Networks"]} />
                )}
                
                {tracking["Social_Media"] && (
                  <ListRow label="Social Media Integrations" items={tracking["Social_Media"]} />
                )}
                
                {tracking.Trackers && (
                  <ListRow label="Tracking Scripts" items={tracking.Trackers} />
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
