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
    { id: "domain", label: "Domain Info", icon: <FiGlobe /> },
    { id: "hosting", label: "Hosting", icon: <FiServer /> },
    { id: "email", label: "Email", icon: <FiMail /> },
    { id: "technology", label: "Technology", icon: <FiCode /> },
    { id: "wordpress", label: "WordPress", icon: <FiTrendingUp /> },
    { id: "performance", label: "Performance", icon: <FiZap /> },
    { id: "security", label: "Security", icon: <FiShield /> },
  ];

  // Extract the actual results from the backend response
  const backendData = results.Results || {};
  const domainInfo = backendData["Domain Info"] || {};
  const hostingInfo = backendData.Hosting || {};
  const emailInfo = backendData.Email || {};
  const techStack = backendData["Tech Stack"] || {};
  const wordpressInfo = backendData.WordPress || {};
  const securityInfo = backendData.Security || {};
  const performanceInfo = backendData.Performance || {};

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 880);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const exportPDF = async () => {
    if (!reportRef.current) return;
    
    const originalStyle = reportRef.current.style.boxShadow;
    reportRef.current.style.boxShadow = 'none';
    
    try {
      const canvas = await html2canvas(reportRef.current, { 
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgWidth = 190;
      const pageHeight = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 5;

      pdf.addImage(canvas, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 15;
        pdf.addPage();
        pdf.addImage(canvas, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${results.Domain || "audit"}-report.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
    } finally {
      reportRef.current.style.boxShadow = originalStyle;
    }
  };

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
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? "4px" : "0"
      }}
    >
      <div style={{ 
        color: "#374151", 
        fontWeight: 600, 
        flex: 1,
        fontSize: isMobile ? "14px" : "inherit"
      }}>
        {label}
      </div>
      <div style={{ 
        color: "#111827", 
        fontWeight: 500, 
        flex: 1, 
        textAlign: isMobile ? "left" : "right",
        fontSize: isMobile ? "14px" : "inherit",
        wordBreak: "break-word"
      }}>
        {children || (value !== undefined && value !== null ? value.toString() : "—")}
      </div>
    </div>
  );

  const ListRow = ({ label, items }) => (
    <div style={{ 
      padding: "12px 0", 
      borderBottom: "1px dashed rgba(0,0,0,0.08)",
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      gap: isMobile ? "8px" : "0"
    }}>
      <div style={{ 
        color: "#374151", 
        fontWeight: 600, 
        marginBottom: isMobile ? "4px" : "8px",
        flex: 1,
        fontSize: isMobile ? "14px" : "inherit"
      }}>
        {label}
      </div>
      <div style={{ 
        color: "#111827", 
        flex: 1,
        fontSize: isMobile ? "14px" : "inherit"
      }}>
        {items && items.length > 0 ? (
          <div style={{ 
            display: "flex", 
            flexWrap: "wrap", 
            gap: "6px",
            justifyContent: isMobile ? "flex-start" : "flex-end"
          }}>
            {items.map((item, index) => (
              <span
                key={index}
                style={{
                  background: "#F3F4F6",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  display: "inline-block"
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

  const renderTabContent = () => {
    if (!results || Object.keys(results).length === 0) {
      return (
        <div style={{ 
          textAlign: "center", 
          padding: "40px", 
          color: "#6B7280",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px"
        }}>
          <FiAlertTriangle size={48} />
          <div>
            <div style={{ fontWeight: 600, marginBottom: "8px" }}>No Audit Data</div>
            <div>Please run a domain audit first to see the results.</div>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "overview":
        return (
          <>
            <Row label="Domain" value={results.Domain} />
            <Row label="Overall Score">
              {performanceInfo.Score && (
                <span className="score-badge">{performanceInfo.Score}</span>
              )}
            </Row>
            <Row label="Processing Time" value={results["Processing Time"]} />
            <Row label="Hosting Provider" value={hostingInfo.Provider} />
            <Row label="Email Provider" value={emailInfo.Provider} />
            <Row label="WordPress Detected">
              {wordpressInfo["Is WordPress"] === "Yes" ? "Yes" : "No"}
            </Row>
            <Row label="SSL Status">
              {securityInfo.SSL === "Valid" ? (
                <Status valid={true} label="Valid" />
              ) : (
                <Status valid={false} label="Invalid/Missing" />
              )}
            </Row>
          </>
        );

      case "domain":
        return (
          <>
            <Row label="Registrar" value={domainInfo.Registrar} />
            <Row label="Creation Date" value={domainInfo.Created} />
            <Row label="Expiry Date" value={domainInfo.Expiry} />
            <ListRow label="Name Servers" items={domainInfo.Nameservers} />
          </>
        );

      case "hosting":
        return (
          <>
            <Row label="IP Address" value={hostingInfo.IP} />
            <Row label="Server" value={hostingInfo.Server} />
            <Row label="Hosting Provider" value={hostingInfo.Provider} />
          </>
        );

      case "email":
        return (
          <>
            <Row label="Email Provider" value={emailInfo.Provider} />
            <ListRow label="MX Records" items={emailInfo.MX} />
            <ListRow label="TXT Records" items={emailInfo.TXT} />
          </>
        );

      case "technology":
        return Object.keys(techStack).length > 0 ? (
          <>
            {Object.entries(techStack).map(([category, technologies]) => (
              <ListRow 
                key={category} 
                label={category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} 
                items={technologies} 
              />
            ))}
          </>
        ) : (
          <div style={{ textAlign: "center", color: "#6B7280", padding: "20px" }}>
            No technologies detected
          </div>
        );

      case "wordpress":
        return (
          <>
            <Row label="WordPress Detected">
              {wordpressInfo["Is WordPress"] === "Yes" ? "Yes" : "No"}
            </Row>
            <Row label="Version" value={wordpressInfo.Version} />
            <Row label="Theme" value={wordpressInfo.Theme} />
            <ListRow label="Plugins" items={wordpressInfo.Plugins} />
          </>
        );

      case "performance":
        return (
          <>
            <Row label="Performance Score">
              {performanceInfo.Score && (
                <span className="score-badge">{performanceInfo.Score}</span>
              )}
            </Row>
            <Row label="Load Time" value={performanceInfo["Load Time"]} />
            <Row label="Page Size" value={performanceInfo.Size} />
            <Row label="Status" value={performanceInfo.Status} />
            {performanceInfo.URL && (
              <Row label="Final URL" value={performanceInfo.URL} />
            )}
          </>
        );

      case "security":
        return (
          <>
            <Row label="SSL Status">
              {securityInfo.SSL === "Valid" ? (
                <Status valid={true} label="Valid" />
              ) : securityInfo.SSL === "Unavailable" ? (
                <Status valid={false} label="Unavailable" />
              ) : (
                <span>{securityInfo.SSL}</span>
              )}
            </Row>
            <Row label="SSL Expiry" value={securityInfo.Expiry} />
            <Row label="TLS Version" value={securityInfo.TLS} />
            <Row label="HSTS">
              {securityInfo.HSTS === "Yes" ? "Enabled" : "Disabled"}
            </Row>
            <Row label="Content Security Policy">
              {securityInfo.CSP === "Yes" ? "Enabled" : "Disabled"}
            </Row>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <style>{`
        body { margin: 0; font-family: 'Inter', sans-serif; background: #f8fafc; }
        .page {
          background: linear-gradient(180deg,#1b0538 0%,#0d011a 100%);
          min-height: 100vh;
          padding: 120px 16px 40px;
          box-sizing: border-box;
        }
        .wrap {
          max-width: 1300px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 24px;
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
          font-size: 14px;
          width: 100%;
          text-align: left;
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
          padding: 32px;
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
          padding: 24px;
          border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.05);
          margin-bottom: 24px;
        }
        .score-badge {
          background: linear-gradient(90deg,#6c00ff,#2575fc);
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 13px;
          display: inline-block;
        }
        
        /* Mobile Styles */
        @media (max-width: 880px) {
          .page { padding: 100px 12px 20px; }
          .wrap { 
            grid-template-columns: 1fr; 
            gap: 16px;
          }
          .sidebar { 
            position: relative; 
            top: 0; 
            padding: 16px;
          }
          .menu { 
            flex-direction: row; 
            flex-wrap: wrap; 
            justify-content: center;
            gap: 6px;
          }
          .menu-btn {
            flex: 1;
            min-width: 140px;
            justify-content: center;
            padding: 10px 12px;
            font-size: 13px;
          }
          .report { 
            padding: 20px; 
            min-height: 400px;
          }
          .section {
            padding: 16px;
            margin-bottom: 16px;
          }
          .report h2 {
            font-size: 22px;
            margin-bottom: 16px;
          }
        }
        
        @media (max-width: 480px) {
          .menu-btn {
            min-width: 120px;
            font-size: 12px;
            padding: 8px 10px;
          }
          .report { 
            padding: 16px; 
          }
          .section {
            padding: 12px;
          }
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
              {results.Domain || "No domain"}
            </div>

            <div className="menu">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`menu-btn ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon} 
                  {!isMobile && tab.label}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <button className="menu-btn" onClick={onNewAudit}>
                <FiHome /> {!isMobile && "New Audit"}
              </button>
              <button className="menu-btn" onClick={exportPDF}>
                <FiDownload /> {!isMobile && "Export PDF"}
              </button>
            </div>
          </aside>

          <main className="report" ref={reportRef}>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              marginBottom: "24px",
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? "12px" : "0",
              alignItems: isMobile ? "flex-start" : "center"
            }}>
              <h2>{tabs.find((t) => t.id === activeTab)?.label}</h2>
              {results["Audit Time"] && (
                <div style={{ 
                  color: "#6B7280", 
                  fontSize: isMobile ? "12px" : "14px",
                  alignSelf: isMobile ? "flex-end" : "center"
                }}>
                  Audited: {results["Audit Time"]}
                </div>
              )}
            </div>
            
            <div className="section">
              {renderTabContent()}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
