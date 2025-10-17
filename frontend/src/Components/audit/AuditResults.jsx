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
    { id: "domain", label: "Domain Details", icon: <FiGlobe /> },
    { id: "hosting", label: "Hosting", icon: <FiServer /> },
    { id: "email", label: "Email Setup", icon: <FiMail /> },
    { id: "technology", label: "Technology", icon: <FiCode /> },
    { id: "wordpress", label: "WordPress", icon: <FiTrendingUp /> },
    { id: "performance", label: "Performance", icon: <FiZap /> },
    { id: "security", label: "Security", icon: <FiShield /> },
    { id: "ads", label: "Ads & Trackers", icon: <FiEye /> },
  ];

  // Extract results data - handle both direct results and nested Results object
  const auditData = results.Results || results;

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

      pdf.save(`${auditData.domain || "audit"}-report.pdf`);
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
    if (!auditData || Object.keys(auditData).length === 0) {
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
            <Row label="Domain" value={auditData.domain} />
            <Row label="Overall Score">
              {auditData.performance?.score && (
                <span className="score-badge">{auditData.performance.score}</span>
              )}
            </Row>
            <Row label="Processing Time" value={auditData.processing_time_seconds ? `${auditData.processing_time_seconds}s` : "—"} />
            <Row label="Hosting Provider" value={auditData.hosting?.hosting_provider} />
            <Row label="Email Provider" value={auditData.email?.provider} />
            <Row label="WordPress Detected">
              {auditData.wordpress?.is_wp ? "Yes" : "No"}
            </Row>
            <Row label="SSL Status">
              {auditData.security?.ssl_valid ? (
                <Status valid={true} label="Valid" />
              ) : (
                <Status valid={false} label="Invalid/Missing" />
              )}
            </Row>
          </>
        );

      case "domain":
        return auditData.domain_details ? (
          <>
            <Row label="Registrar" value={auditData.domain_details.registrar} />
            <Row label="Creation Date" value={auditData.domain_details.creation_date} />
            <Row label="Expiry Date" value={auditData.domain_details.expiry_date} />
            <Row label="Updated Date" value={auditData.domain_details.updated_date} />
            <ListRow label="Name Servers" items={auditData.domain_details.name_servers} />
          </>
        ) : (
          <div style={{ textAlign: "center", color: "#6B7280", padding: "20px" }}>
            No domain details available
          </div>
        );

      case "hosting":
        return auditData.hosting ? (
          <>
            <ListRow label="IP Addresses" items={auditData.hosting.ips} />
            <Row label="Server" value={auditData.hosting.server} />
            <Row label="X-Powered-By" value={auditData.hosting.x_powered_by} />
            <Row label="Hosting Provider" value={auditData.hosting.hosting_provider} />
            <Row label="Reverse Hostname" value={auditData.hosting.reverse_hostname} />
            <ListRow label="Resolver Nameservers" items={auditData.hosting.resolver} />
          </>
        ) : (
          <div style={{ textAlign: "center", color: "#6B7280", padding: "20px" }}>
            No hosting information available
          </div>
        );

      case "email":
        return auditData.email ? (
          <>
            <Row label="Email Provider" value={auditData.email.provider} />
            <ListRow label="MX Records" items={auditData.email.mx} />
            <ListRow label="TXT Records" items={auditData.email.txt} />
            <ListRow label="Found Email Addresses" items={auditData.email.found_emails} />
          </>
        ) : (
          <div style={{ textAlign: "center", color: "#6B7280", padding: "20px" }}>
            No email information available
          </div>
        );

      case "technology":
        return auditData.technology && Object.keys(auditData.technology).length > 0 ? (
          <>
            {Object.entries(auditData.technology).map(([category, technologies]) => (
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
        return auditData.wordpress ? (
          <>
            <Row label="WordPress Detected">
              {auditData.wordpress.is_wp ? "Yes" : "No"}
            </Row>
            <Row label="Version" value={auditData.wordpress.version} />
            <Row label="Theme" value={auditData.wordpress.theme} />
            <ListRow label="Plugins" items={auditData.wordpress.plugins} />
          </>
        ) : (
          <div style={{ textAlign: "center", color: "#6B7280", padding: "20px" }}>
            No WordPress information available
          </div>
        );

      case "performance":
        return auditData.performance ? (
          <>
            <Row label="Performance Score">
              {auditData.performance.score && (
                <span className="score-badge">{auditData.performance.score}</span>
              )}
            </Row>
            <Row label="Load Time" value={auditData.performance.load_time} />
            <Row label="Page Size" value={auditData.performance.page_size_kb ? `${auditData.performance.page_size_kb} KB` : "—"} />
            <Row label="Final URL" value={auditData.performance.url} />
          </>
        ) : (
          <div style={{ textAlign: "center", color: "#6B7280", padding: "20px" }}>
            No performance data available
          </div>
        );

      case "security":
        return auditData.security ? (
          <>
            <Row label="SSL Valid">
              {auditData.security.ssl_valid ? (
                <Status valid={true} label="Valid" />
              ) : (
                <Status valid={false} label="Invalid/Missing" />
              )}
            </Row>
            <Row label="SSL Expiry" value={auditData.security.ssl_expiry} />
            <Row label="TLS Version" value={auditData.security.tls_version} />
            <Row label="HSTS">
              {auditData.security.headers?.hsts ? "Enabled" : "Disabled"}
            </Row>
            <Row label="X-Frame-Options" value={auditData.security.headers?.x_frame_options} />
            <Row label="X-Content-Type-Options" value={auditData.security.headers?.x_content_type_options} />
            <Row label="Content-Security-Policy">
              {auditData.security.headers?.csp ? "Enabled" : "Disabled"}
            </Row>
            <Row label="Referrer-Policy" value={auditData.security.headers?.referrer_policy} />
          </>
        ) : (
          <div style={{ textAlign: "center", color: "#6B7280", padding: "20px" }}>
            No security information available
          </div>
        );

      case "ads":
        return auditData.ads ? (
          <>
            <ListRow label="Ad Networks" items={auditData.ads.ad_networks} />
            <ListRow label="Analytics Tools" items={auditData.ads.analytics} />
            <ListRow label="Tracking Scripts" items={auditData.ads.tracking_scripts_found} />
          </>
        ) : (
          <div style={{ textAlign: "center", color: "#6B7280", padding: "20px" }}>
            No ad tracking information available
          </div>
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
              {auditData?.domain || "No domain"}
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
              {auditData.audit_date && (
                <div style={{ 
                  color: "#6B7280", 
                  fontSize: isMobile ? "12px" : "14px",
                  alignSelf: isMobile ? "flex-end" : "center"
                }}>
                  Audited: {new Date(auditData.audit_date).toLocaleDateString()}
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
