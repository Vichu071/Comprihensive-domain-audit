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

  const StatusRow = ({ label, value }) => {
    const getStatusColor = (val) => {
      if (val === "Yes" || val === "Valid" || val === "Excellent" || val === "Good" || val === "Success") 
        return "#10B981";
      if (val === "No" || val === "Invalid" || val === "Failed" || val === "Very Slow") 
        return "#EF4444";
      if (val === "Average" || val === "Slow") 
        return "#F59E0B";
      return "#6B7280";
    };

    return (
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
        <div style={{ 
          color: getStatusColor(value),
          fontWeight: 600,
          fontSize: "14px"
        }}>
          {value || "—"}
        </div>
      </div>
    );
  };

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
        <span style={{ color: "#9CA3AF" }}>None detected</span>
      )}
    </div>
  );

  const ObjectListRow = ({ label, items }) => (
    <div style={{ padding: "14px 18px", borderBottom: "1px solid #f0f0f0" }}>
      <div style={{ color: "#4B5563", fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {items && Object.keys(items).length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Object.entries(items).map(([key, value], i) => (
            <div key={i}>
              <div style={{ fontWeight: 600, marginBottom: 4, color: "#374151" }}>
                {key}:
              </div>
              {Array.isArray(value) ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {value.map((item, j) => (
                    <span
                      key={j}
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
                <span style={{ color: "#111827" }}>{value}</span>
              )}
            </div>
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

  const ScoreBadge = ({ score, label }) => {
    const getScoreColor = (score) => {
      if (score === "A") return "#10B981";
      if (score === "B") return "#34D399";
      if (score === "C") return "#F59E0B";
      if (score === "D") return "#F97316";
      if (score === "F") return "#EF4444";
      return "#6B7280";
    };

    return (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 8,
        padding: "8px 12px",
        background: "#F8FAFC",
        borderRadius: 8,
        marginBottom: 8
      }}>
        <div style={{ color: "#4B5563", fontWeight: 600, fontSize: "14px" }}>{label}</div>
        <div style={{
          background: getScoreColor(score),
          color: "white",
          padding: "4px 8px",
          borderRadius: 6,
          fontSize: "12px",
          fontWeight: "bold",
          minWidth: "20px",
          textAlign: "center"
        }}>
          {score || "N/A"}
        </div>
      </div>
    );
  };

  // Helper function to render object data dynamically
  const renderObjectData = (data, sectionTitle) => {
    if (!data || Object.keys(data).length === 0) {
      return (
        <div style={{ 
          padding: "20px", 
          textAlign: "center", 
          color: "#6B7280",
          background: "#F9FAFB",
          borderRadius: "8px"
        }}>
          No data available for {sectionTitle}
        </div>
      );
    }

    return Object.entries(data).map(([key, value]) => {
      // Format the key for display
      const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, str => str.toUpperCase());
      
      if (Array.isArray(value)) {
        return <ListRow key={key} label={formattedKey} items={value} />;
      } else if (typeof value === 'object' && value !== null) {
        return <ObjectListRow key={key} label={formattedKey} items={value} />;
      } else {
        // Check if this should be a status row
        const statusKeys = ['Detected', 'SSL', 'Status', 'Rating', 'Score'];
        const isStatus = statusKeys.some(statusKey => key.includes(statusKey));
        
        if (isStatus) {
          return <StatusRow key={key} label={formattedKey} value={value} />;
        } else {
          return <Row key={key} label={formattedKey} value={value} />;
        }
      }
    });
  };

  // Helper function to render technology data
  const renderTechnologyData = (techData) => {
    if (!techData || Object.keys(techData).length === 0) {
      return (
        <div style={{ 
          padding: "20px", 
          textAlign: "center", 
          color: "#6B7280",
          background: "#F9FAFB",
          borderRadius: "8px"
        }}>
          No technology detected
        </div>
      );
    }

    return Object.entries(techData).map(([category, items]) => {
      const formattedCategory = category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return <TechCategoryRow key={category} label={formattedCategory} items={items} />;
    });
  };

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
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }
        .metric-card {
          background: #F8FAFC;
          padding: 16px;
          border-radius: 8px;
          border-left: 4px solid #6c00ff;
        }
        .metric-value {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 4px;
        }
        .metric-label {
          font-size: 12px;
          color: #6B7280;
          font-weight: 600;
        }
        @media (max-width: 900px) {
          .audit-page { flex-direction: column; padding: 30px 20px; align-items: center; }
          .sidebar { width: 100%; flex-direction: row; flex-wrap: wrap; justify-content: center; }
          .report { padding: 30px 20px; width: 100%; }
          .metrics-grid { grid-template-columns: 1fr; }
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
                <Row label="Domain" value={results.Domain} />
                <Row label="Audit Time" value={results["Audit Time"]} />
                <Row label="Processing Time" value={results["Processing Time"]} />
                
                <div className="section-title">Quick Summary</div>
                {renderObjectData({
                  Registrar: domainInfo.Registrar,
                  "Hosting Provider": hosting.Provider,
                  "Email Provider": email.Provider,
                  "WordPress Detected": wordpress.Detected,
                  "SSL Status": security.SSL,
                  "Performance Rating": performance.Rating
                })}
              </>
            )}

            {/* DOMAIN INFO TAB */}
            {activeTab === "domain" && (
              <>
                <div className="section-title">Domain Information</div>
                {renderObjectData(domainInfo)}
              </>
            )}

            {/* HOSTING TAB */}
            {activeTab === "hosting" && (
              <>
                <div className="section-title">Hosting Information</div>
                {renderObjectData(hosting)}
              </>
            )}

            {/* EMAIL TAB */}
            {activeTab === "email" && (
              <>
                <div className="section-title">Email Configuration</div>
                {renderObjectData(email)}
              </>
            )}

            {/* TECHNOLOGY TAB */}
            {activeTab === "technology" && (
              <>
                <div className="section-title">Technology Stack</div>
                {renderTechnologyData(technology)}
              </>
            )}

            {/* WORDPRESS TAB */}
            {activeTab === "wordpress" && (
              <>
                <div className="section-title">WordPress Analysis</div>
                {renderObjectData(wordpress)}
              </>
            )}

            {/* PERFORMANCE TAB */}
            {activeTab === "performance" && (
              <>
                <div className="section-title">Performance Metrics</div>
                {performance.Status === "Failed to load" ? (
                  <div style={{ 
                    padding: "20px", 
                    textAlign: "center", 
                    color: "#EF4444",
                    background: "#FEF2F2",
                    borderRadius: "8px"
                  }}>
                    Failed to load performance data
                  </div>
                ) : (
                  <>
                    <div className="metrics-grid">
                      {performance["Load Time"] && (
                        <div className="metric-card">
                          <div className="metric-value">{performance["Load Time"]}</div>
                          <div className="metric-label">LOAD TIME</div>
                        </div>
                      )}
                      {performance["Page Size"] && (
                        <div className="metric-card">
                          <div className="metric-value">{performance["Page Size"]}</div>
                          <div className="metric-label">PAGE SIZE</div>
                        </div>
                      )}
                      {performance.Score && (
                        <div className="metric-card">
                          <div className="metric-value">{performance.Score}</div>
                          <div className="metric-label">PERFORMANCE SCORE</div>
                        </div>
                      )}
                      {performance.Rating && (
                        <div className="metric-card">
                          <div className="metric-value">{performance.Rating}</div>
                          <div className="metric-label">RATING</div>
                        </div>
                      )}
                    </div>
                    {renderObjectData(performance)}
                  </>
                )}
              </>
            )}

            {/* SECURITY TAB */}
            {activeTab === "security" && (
              <>
                <div className="section-title">Security Analysis</div>
                {renderObjectData(security)}
              </>
            )}

            {/* TRACKING TAB */}
            {activeTab === "tracking" && (
              <>
                <div className="section-title">Tracking & Analytics</div>
                {renderObjectData(tracking)}
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
