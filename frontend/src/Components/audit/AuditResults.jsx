import React, { useState, useEffect, useRef } from "react";
import {
  FiActivity, FiGlobe, FiServer, FiMail, FiCode,
  FiTrendingUp, FiZap, FiShield, FiEye, FiHome, FiDownload,
  FiMenu, FiX
} from "react-icons/fi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function AuditResults({ results = {}, onNewAudit }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const reportRef = useRef(null);

  // Extract data from the new backend structure
  const payload = results?.Results || results || {};
  const domain = results?.Domain || payload?.Domain || "";

  const domainInfo = payload["Domain Info"] || {};
  const hosting = payload.Hosting || {};
  const email = payload.Email || {};
  const tech = payload.Technology || {};
  const wordpress = payload.WordPress || {};
  const security = payload.Security || {};
  const performance = payload.Performance || {};
  const tracking = payload.Tracking || {};

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const Row = ({ label, value }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: isMobile ? "16px 12px" : "18px 20px",
        borderBottom: "1px solid #f0f0f0",
        alignItems: "flex-start",
        background: "#fcfcfc",
        borderRadius: 8,
        marginBottom: 12,
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? "6px" : "0",
      }}
    >
      <div style={{ 
        color: "#4B5563", 
        fontWeight: 600,
        fontSize: isMobile ? "15px" : "16px",
        minWidth: isMobile ? "100%" : "140px"
      }}>
        {label}
      </div>
      <div style={{ 
        color: "#111827", 
        fontWeight: 500,
        fontSize: isMobile ? "14px" : "15px",
        textAlign: isMobile ? "left" : "right",
        wordBreak: "break-word",
        flex: 1
      }}>
        {value || "—"}
      </div>
    </div>
  );

  const ListRow = ({ label, items }) => (
    <div style={{ 
      padding: isMobile ? "16px 12px" : "18px 20px", 
      borderBottom: "1px solid #f0f0f0",
      marginBottom: 12,
      background: "#fcfcfc",
      borderRadius: 8
    }}>
      <div style={{ 
        color: "#4B5563", 
        fontWeight: 600, 
        marginBottom: 8,
        fontSize: isMobile ? "15px" : "16px"
      }}>
        {label}
      </div>
      {Array.isArray(items) && items.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {items.map((item, i) => (
            <span
              key={i}
              style={{
                background: "#F3F4F6",
                padding: "6px 12px",
                borderRadius: 6,
                fontSize: isMobile ? "13px" : "14px",
                color: "#111827",
                border: "1px solid #E5E7EB"
              }}
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <span style={{ color: "#9CA3AF", fontSize: isMobile ? "14px" : "15px" }}>
          None detected
        </span>
      )}
    </div>
  );

  const ObjectRow = ({ label, items }) => (
    <div style={{ 
      padding: isMobile ? "16px 12px" : "18px 20px", 
      borderBottom: "1px solid #f0f0f0",
      marginBottom: 12,
      background: "#fcfcfc",
      borderRadius: 8
    }}>
      <div style={{ 
        color: "#4B5563", 
        fontWeight: 600, 
        marginBottom: 8,
        fontSize: isMobile ? "15px" : "16px"
      }}>
        {label}
      </div>
      {items && Object.keys(items).length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Object.entries(items).map(([key, value]) => (
            <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ 
                fontSize: isMobile ? "13px" : "14px", 
                fontWeight: 600, 
                color: "#6B7280" 
              }}>
                {key}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Array.isArray(value) ? (
                  value.map((item, i) => (
                    <span
                      key={i}
                      style={{
                        background: "#F3F4F6",
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: isMobile ? "12px" : "13px",
                        color: "#111827",
                        lineHeight: 1.2,
                        border: "1px solid #E5E7EB"
                      }}
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <span
                    style={{
                      background: "#F3F4F6",
                      padding: "4px 8px",
                      borderRadius: 4,
                      fontSize: isMobile ? "12px" : "13px",
                      color: "#111827",
                      border: "1px solid #E5E7EB"
                    }}
                  >
                    {value}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <span style={{ color: "#9CA3AF", fontSize: isMobile ? "14px" : "15px" }}>
          None detected
        </span>
      )}
    </div>
  );

  const tabs = [
    ["overview", FiActivity, "Overview"],
    ["domain", FiGlobe, "Domain"],
    ["hosting", FiServer, "Hosting"],
    ["email", FiMail, "Email"],
    ["technology", FiCode, "Technology"],
    ["wordpress", FiTrendingUp, "WordPress"],
    ["performance", FiZap, "Performance"],
    ["security", FiShield, "Security"],
    ["tracking", FiEye, "Tracking"],
  ];

  return (
    <>
      <style>{`
        .audit-page {
          display: flex;
          gap: 24px;
          background: #f9f9ff;
          min-height: 100vh;
          padding: 30px 24px;
          justify-content: center;
          align-items: flex-start;
        }
        
        .sidebar {
          width: 280px;
          background: linear-gradient(180deg, #160423, #2b0636);
          border-radius: 16px;
          padding: 28px 20px;
          color: #fff;
          display: flex;
          flex-direction: column;
          justify-content: start;
          box-shadow: 0 8px 40px rgba(0,0,0,0.25);
          position: sticky;
          top: 30px;
          height: fit-content;
          max-height: calc(100vh - 60px);
          overflow-y: auto;
        }
        
        .sidebar-mobile {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(180deg, #160423, #2b0636);
          z-index: 1000;
          padding: 24px;
          overflow-y: auto;
        }
        
        .menu-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          border: none;
          background: transparent;
          color: #d1d5db;
          font-weight: 600;
          padding: 14px 16px;
          border-radius: 10px;
          cursor: pointer;
          transition: 0.2s;
          text-align: left;
          font-size: 15px;
          width: 100%;
        }
        
        .menu-btn:hover { background: rgba(255,255,255,0.1); }
        .menu-btn.active {
          background: linear-gradient(90deg, #6c00ff, #2575fc);
          color: white;
        }
        
        .report {
          flex: 1;
          max-width: 900px;
          background: white;
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 6px 40px rgba(0,0,0,0.05);
          height: fit-content;
          min-height: 600px;
        }
        
        .btn-action {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(90deg, #6c00ff, #2575fc);
          border: none;
          color: white;
          font-weight: 600;
          padding: 12px 18px;
          border-radius: 10px;
          cursor: pointer;
          transition: 0.2s;
          font-size: 14px;
          flex-shrink: 0;
        }
        
        .btn-action:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        
        .mobile-header {
          display: none;
          justify-content: space-between;
          align-items: center;
          padding: 20px 16px;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        
        .mobile-menu-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(90deg, #6c00ff, #2575fc);
          border: none;
          color: white;
          padding: 10px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
        }
        
        .close-sidebar {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 18px;
        }
        
        .mobile-tabs {
          display: none;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 14px 16px;
          gap: 8px;
          overflow-x: auto;
          position: sticky;
          top: 73px;
          z-index: 90;
        }
        
        .mobile-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          white-space: nowrap;
          cursor: pointer;
          flex-shrink: 0;
        }
        
        .mobile-tab.active {
          background: linear-gradient(90deg, #6c00ff, #2575fc);
          color: white;
          border-color: #6c00ff;
        }
        
        .button-group {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        /* Mobile Styles */
        @media (max-width: 900px) {
          .audit-page { 
            flex-direction: column; 
            padding: 0;
            gap: 0;
            background: white;
          }
          
          .sidebar { 
            display: none;
          }
          
          .report { 
            padding: 24px 16px; 
            width: 100%;
            max-width: 100%;
            border-radius: 0;
            box-shadow: none;
            min-height: calc(100vh - 140px);
          }
          
          .mobile-header {
            display: flex;
          }
          
          .mobile-tabs {
            display: flex;
          }
        }
        
        @media (max-width: 480px) {
          .report {
            padding: 20px 12px;
          }
          
          .mobile-tabs {
            padding: 12px 12px;
          }
          
          .mobile-tab {
            padding: 8px 12px;
            font-size: 12px;
          }
          
          .btn-action {
            padding: 10px 14px;
            font-size: 13px;
          }
          
          .button-group {
            gap: 8px;
          }
        }
        
        /* Scrollbar styling */
        .sidebar::-webkit-scrollbar {
          width: 6px;
        }
        
        .sidebar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
        }
        
        .sidebar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.3);
          border-radius: 3px;
        }
        
        .sidebar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.5);
        }
      `}</style>

      {/* Mobile Header */}
      {isMobile && (
        <div className="mobile-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #6c00ff, #2575fc)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 800, color: "white"
            }}>EP</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>EngagePro Audit</div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>{domain || "No domain"}</div>
            </div>
          </div>
          
          <button 
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
          >
            <FiMenu /> Menu
          </button>
        </div>
      )}

      {/* Mobile Tabs */}
      {isMobile && (
        <div className="mobile-tabs">
          {tabs.map(([key, Icon, label]) => (
            <button
              key={key}
              className={`mobile-tab ${activeTab === key ? "active" : ""}`}
              onClick={() => handleTabChange(key)}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div className="sidebar-mobile">
          <button 
            className="close-sidebar"
            onClick={() => setSidebarOpen(false)}
          >
            <FiX />
          </button>
          
          <div style={{ paddingTop: "40px" }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16,
              background: "linear-gradient(135deg, #6c00ff, #2575fc)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 800, marginBottom: 16, marginLeft: "auto", marginRight: "auto"
            }}>EP</div>

            <div style={{ 
              fontSize: 20, fontWeight: 700, 
              marginBottom: 4, textAlign: "center" 
            }}>EngagePro Audit</div>
            <div style={{ 
              fontSize: 14, color: "#bbb", 
              marginBottom: 30, textAlign: "center" 
            }}>{domain || "No domain"}</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {tabs.map(([key, Icon, label]) => (
                <button
                  key={key}
                  className={`menu-btn ${activeTab === key ? "active" : ""}`}
                  onClick={() => handleTabChange(key)}
                >
                  <Icon /> {label}
                </button>
              ))}
            </div>
            
            <div style={{ 
              marginTop: "auto", 
              paddingTop: "30px",
              display: "flex", 
              flexDirection: "column", 
              gap: "12px" 
            }}>
              <button className="btn-action" onClick={onNewAudit}>
                <FiHome /> New Audit
              </button>
              <button className="btn-action" onClick={exportPDF}>
                <FiDownload /> Export PDF
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="audit-page">
        {/* Desktop Sidebar */}
        {!isMobile && (
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
                {tabs.map(([key, Icon, label]) => (
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
            
            <div style={{ 
              marginTop: "auto", 
              paddingTop: "20px",
              display: "flex", 
              flexDirection: "column", 
              gap: "12px" 
            }}>
              <button className="btn-action" onClick={onNewAudit}>
                <FiHome /> New Audit
              </button>
              <button className="btn-action" onClick={exportPDF}>
                <FiDownload /> Export PDF
              </button>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="report" ref={reportRef}>
          {!isMobile && (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 32,
              flexWrap: "wrap",
              gap: 16,
              paddingBottom: 16,
              borderBottom: "1px solid #f0f0f0"
            }}>
              <h2 style={{ 
                fontSize: 26, 
                fontWeight: 700, 
                color: "#111827",
                margin: 0
              }}>
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report
              </h2>

              <div className="button-group">
                <button className="btn-action" onClick={onNewAudit}>
                  <FiHome /> New Audit
                </button>
                <button className="btn-action" onClick={exportPDF}>
                  <FiDownload /> Export PDF
                </button>
              </div>
            </div>
          )}

          <div className="section" style={{ marginTop: isMobile ? 8 : 0 }}>
            {activeTab === "overview" && (
              <>
                <Row label="Domain" value={domain} />
                <Row label="Hosting Provider" value={hosting.Provider} />
                <Row label="Email Provider" value={email.Provider} />
                <Row label="WordPress Detected" value={wordpress.Detected} />
                <Row label="SSL Status" value={security.SSL} />
                <Row label="Performance Rating" value={performance.Rating} />
              </>
            )}
            {activeTab === "domain" && (
              <>
                <Row label="Registrar" value={domainInfo.Registrar} />
                <Row label="Created Date" value={domainInfo.Created} />
                <Row label="Expiry Date" value={domainInfo.Expiry} />
                <Row label="Last Updated" value={domainInfo.Updated} />
                <ListRow label="Nameservers" items={domainInfo.Nameservers} />
                <ObjectRow label="DNS Records" items={domainInfo["DNS Records"]} />
              </>
            )}
            {activeTab === "hosting" && (
              <>
                <Row label="IP Address" value={hosting["IP Address"]} />
                <Row label="Server" value={hosting.Server} />
                <Row label="Provider" value={hosting.Provider} />
                <Row label="Location" value={hosting.Location} />
                <Row label="CDN" value={hosting.CDN} />
              </>
            )}
            {activeTab === "email" && (
              <>
                <Row label="Provider" value={email.Provider} />
                <ListRow label="MX Records" items={email["MX Records"]} />
                <ObjectRow label="DNS Records" items={email["DNS Records"]} />
                <Row label="SPF Record" value={email.SPF} />
                <Row label="DMARC Record" value={email.DMARC} />
              </>
            )}
            {activeTab === "technology" && (
              <>
                {Object.entries(tech).map(([key, val]) => (
                  <ListRow 
                    key={key} 
                    label={key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                    items={val} 
                  />
                ))}
              </>
            )}
            {activeTab === "wordpress" && (
              <>
                <Row label="Detected" value={wordpress.Detected} />
                <Row label="Version" value={wordpress.Version} />
                <Row label="Theme" value={wordpress.Theme} />
                <Row label="Active Plugins Count" value={wordpress.Plugins?.length} />
                <ListRow label="Plugins" items={wordpress.Plugins} />
                <Row label="WP-Admin Accessible" value={wordpress["WP-Admin"]} />
              </>
            )}
            {activeTab === "performance" && (
              <>
                <Row label="Load Time" value={performance["Load Time"]} />
                <Row label="Page Size" value={performance["Page Size"]} />
                <Row label="Requests" value={performance.Requests} />
                <Row label="Rating" value={performance.Rating} />
                <Row label="First Contentful Paint" value={performance["First Contentful Paint"]} />
                <Row label="Largest Contentful Paint" value={performance["Largest Contentful Paint"]} />
              </>
            )}
            {activeTab === "security" && (
              <>
                <Row label="SSL Certificate" value={security.SSL} />
                <Row label="TLS Version" value={security.TLS} />
                <Row label="Expires" value={security.Expires} />
                <Row label="HSTS" value={security.HSTS} />
                <Row label="Security Headers" value={security.Headers} />
                <ListRow label="Vulnerabilities" items={security.Vulnerabilities} />
              </>
            )}
            {activeTab === "tracking" && (
              <>
                <ListRow label="Ad Networks" items={tracking["Ad Networks"]} />
                <ListRow label="Analytics Tools" items={tracking.Analytics} />
                <ListRow label="Tracking Scripts" items={tracking["Tracking Scripts"]} />
                <ListRow label="Social Media Trackers" items={tracking["Social Media"]} />
                <ListRow label="Marketing Tools" items={tracking.Marketing} />
                <ObjectRow label="Cookies" items={tracking.Cookies} />
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
