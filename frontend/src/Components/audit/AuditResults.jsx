// AuditResults.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  FiActivity, FiGlobe, FiServer, FiMail, FiCode, FiTrendingUp, FiZap, FiShield,
  FiDownload, FiHome, FiCheck, FiX, FiAlertTriangle, FiEye
} from "react-icons/fi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function AuditResults({ results = {}, onNewAudit }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobile, setIsMobile] = useState(false);
  const reportRef = useRef(null);

  // Backend may store nested object at `results.Results` or the user passed already normalized object.
  const payload = results?.Results ? results.Results : results || {};
  const domain = results?.Domain || payload?.Domain || "";

  // Extract consistent keys (try multiple possible keys as different backend versions existed)
  const domainInfo = payload["Domain Info"] || payload.domain_details || {};
  const hosting = payload.Hosting || payload.hosting || {};
  const email = payload.Email || payload.email || {};
  const tech = payload["Tech Stack"] || payload.technology || {};
  const wordpress = payload.WordPress || payload.wordpress || {};
  const security = payload.Security || payload.security || {};
  const performance = payload.Performance || payload.performance || {};
  const ads = payload.Ads || payload.ads || {};

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 880);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const exportPDF = async () => {
    if (!reportRef.current) return;
    const original = reportRef.current.style.boxShadow;
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
      reportRef.current.style.boxShadow = original;
    }
  };

  const Row = ({ label, value, children, alignRight }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px dashed rgba(0,0,0,0.08)", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 6 : 0 }}>
      <div style={{ color: "#374151", fontWeight: 600 }}>{label}</div>
      <div style={{ color: "#111827", textAlign: isMobile ? "left" : "right" }}>{children ?? (value !== undefined && value !== null ? String(value) : "—")}</div>
    </div>
  );

  const ListRow = ({ label, items }) => (
    <div style={{ padding: "12px 0", borderBottom: "1px dashed rgba(0,0,0,0.08)" }}>
      <div style={{ color: "#374151", fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div>
        {items && Array.isArray(items) && items.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: isMobile ? "flex-start" : "flex-end" }}>
            {items.map((it, i) => <span key={i} style={{ background: "#F3F4F6", padding: "6px 10px", borderRadius: 8, color: "#111" }}>{String(it)}</span>)}
          </div>
        ) : <span style={{ color: "#6B7280" }}>None detected</span>}
      </div>
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
        .page { display: flex; gap: 24px; }
        .sidebar { width: 280px; border-radius: 14px; padding: 20px; background: linear-gradient(180deg,#1a0526,#2b0636); color: #e6e6f0; box-shadow: 0 10px 40px rgba(0,0,0,0.4); }
        .logo { width:56px; height:56px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-weight:800; background: linear-gradient(90deg,#6c00ff,#2575fc); color:#fff; margin-bottom:12px; }
        .menu-btn { display:flex; gap:10px; align-items:center; background:transparent; color:#d1d5db; border:none; padding:10px 12px; border-radius:10px; cursor:pointer; text-align:left; width:100%; font-weight:600; }
        .menu-btn.active { background: linear-gradient(90deg,#6c00ff,#2575fc); color:white; }
        .report { flex:1; background:white; border-radius:14px; padding:32px; color:#0b1220; box-shadow: 0 20px 60px rgba(0,0,0,0.08); }
        .section { background:#fafafa; padding:20px; border-radius:10px; border:1px solid rgba(0,0,0,0.04); }
        .score-badge { background: linear-gradient(90deg,#6c00ff,#2575fc); color:white; padding:6px 12px; border-radius:16px; font-weight:700; }
        @media (max-width: 880px) {
          .page { flex-direction: column; padding: 12px; }
          .sidebar { width:100%; display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
        }
      `}</style>

      <div style={{ display: "flex", gap: 24 }}>
        <aside className="sidebar">
          <div className="logo">EP</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>EngagePro Audit</div>
          <div style={{ fontSize: 13, color: "#aab3c6", marginBottom: 12 }}>{domain || "No domain"}</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button className={`menu-btn ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}><FiActivity /> <span style={{ marginLeft: 6 }}>Overview</span></button>
            <button className={`menu-btn ${activeTab === "domain" ? "active" : ""}`} onClick={() => setActiveTab("domain")}><FiGlobe /> <span style={{ marginLeft: 6 }}>Domain Details</span></button>
            <button className={`menu-btn ${activeTab === "hosting" ? "active" : ""}`} onClick={() => setActiveTab("hosting")}><FiServer /> <span style={{ marginLeft: 6 }}>Hosting</span></button>
            <button className={`menu-btn ${activeTab === "email" ? "active" : ""}`} onClick={() => setActiveTab("email")}><FiMail /> <span style={{ marginLeft: 6 }}>Email Setup</span></button>
            <button className={`menu-btn ${activeTab === "technology" ? "active" : ""}`} onClick={() => setActiveTab("technology")}><FiCode /> <span style={{ marginLeft: 6 }}>Technology</span></button>
            <button className={`menu-btn ${activeTab === "wordpress" ? "active" : ""}`} onClick={() => setActiveTab("wordpress")}><FiTrendingUp /> <span style={{ marginLeft: 6 }}>WordPress</span></button>
            <button className={`menu-btn ${activeTab === "performance" ? "active" : ""}`} onClick={() => setActiveTab("performance")}><FiZap /> <span style={{ marginLeft: 6 }}>Performance</span></button>
            <button className={`menu-btn ${activeTab === "security" ? "active" : ""}`} onClick={() => setActiveTab("security")}><FiShield /> <span style={{ marginLeft: 6 }}>Security</span></button>
            <button className={`menu-btn ${activeTab === "ads" ? "active" : ""}`} onClick={() => setActiveTab("ads")}><FiEye /> <span style={{ marginLeft: 6 }}>Ads & Trackers</span></button>
          </div>

          <div style={{ marginTop: 18, display: "flex", gap: 8, flexDirection: "column" }}>
            <button onClick={onNewAudit} className="menu-btn"><FiHome /> <span style={{ marginLeft: 6 }}>New Audit</span></button>
            <button onClick={exportPDF} className="menu-btn"><FiDownload /> <span style={{ marginLeft: 6 }}>Export PDF</span></button>
          </div>
        </aside>

        <main className="report" ref={reportRef}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
            <h2 style={{ margin: 0 }}>{activeTab === "overview" ? "Overview" : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
            <div style={{ color: "#6B7280" }}>{results["Audit Time"] || ""} {results["Processing Time"] ? `• ${results["Processing Time"]}` : ""}</div>
          </div>

          <div className="section">
            {/* Overview */}
            {activeTab === "overview" && (
              <>
                <Row label="Domain" value={domain} />
                <Row label="Processing Time" value={results["Processing Time"]} />
                <Row label="Hosting Provider" value={hosting?.Provider || hosting?.hosting_provider || "—"} />
                <Row label="Email Provider" value={email?.Provider || email?.provider || "—"} />
                <Row label="WordPress Detected" value={(wordpress && (wordpress["Is WordPress"] || wordpress.is_wp || wordpress["Is WordPress"] === "Yes")) ? "Yes" : "No"} />
                <Row label="SSL Status">
                  {security?.SSL === "Valid" ? <Status ok={true} yesLabel="Valid" /> : (security?.SSL === "Unavailable" ? <Status ok={false} noLabel="Unavailable" /> : <span>{security?.SSL || "—"}</span>)}
                </Row>
              </>
            )}

            {/* Domain */}
            {activeTab === "domain" && (
              <>
                <Row label="Registrar" value={domainInfo?.Registrar || domainInfo?.registrar || "—"} />
                <Row label="Created" value={domainInfo?.Created || domainInfo?.creation_date || "—"} />
                <Row label="Expiry" value={domainInfo?.Expiry || domainInfo?.expiry || "—"} />
                <ListRow label="Nameservers" items={domainInfo?.Nameservers || domainInfo?.nameservers || []} />
              </>
            )}

            {/* Hosting */}
            {activeTab === "hosting" && (
              <>
                <Row label="IP" value={hosting?.IP || hosting?.ip || hosting?.ips || "—"} />
                <Row label="Server" value={hosting?.Server || hosting?.server || "—"} />
                <Row label="Provider" value={hosting?.Provider || hosting?.provider || "—"} />
              </>
            )}

            {/* Email */}
            {activeTab === "email" && (
              <>
                <Row label="Provider" value={email?.Provider || email?.provider || "—"} />
                <ListRow label="MX" items={email?.MX || email?.mx || []} />
                <ListRow label="TXT" items={email?.TXT || email?.txt || []} />
              </>
            )}

            {/* Technology */}
            {activeTab === "technology" && (
              <>
                {Object.keys(tech || {}).length ? Object.entries(tech).map(([k, v]) => <ListRow key={k} label={k} items={v} />) : <div style={{ color: "#6B7280" }}>No technologies detected</div>}
              </>
            )}

            {/* WordPress */}
            {activeTab === "wordpress" && (
              <>
                <Row label="Is WordPress" value={wordpress?.["Is WordPress"] || wordpress?.is_wp || "No"} />
                <Row label="Version" value={wordpress?.Version || wordpress?.version || "Unknown"} />
                <Row label="Theme" value={wordpress?.Theme || wordpress?.theme || "Unknown"} />
                <ListRow label="Plugins" items={wordpress?.Plugins || wordpress?.plugins || []} />
              </>
            )}

            {/* Performance */}
            {activeTab === "performance" && (
              <>
                <Row label="Load Time" value={performance?.["Load Time"] || performance?.load_time || "—"} />
                <Row label="Size" value={performance?.Size || performance?.size || "—"} />
                <Row label="Score" value={performance?.Score || performance?.score || "—"} />
                <Row label="URL" value={performance?.URL || performance?.url || "—"} />
              </>
            )}

            {/* Security */}
            {activeTab === "security" && (
              <>
                <Row label="SSL" value={security?.SSL || "—"} />
                <Row label="TLS" value={security?.TLS || security?.tls || "—"} />
                <Row label="Expiry" value={security?.Expiry || security?.expiry || "—"} />
                <Row label="HSTS" value={security?.HSTS === "Yes" ? "Enabled" : "Disabled"} />
                <Row label="CSP" value={security?.CSP === "Yes" ? "Enabled" : "Disabled"} />
              </>
            )}

            {/* Ads */}
            {activeTab === "ads" && (
              <>
                <ListRow label="Ad Networks" items={ads?.ad_networks || ads?.adNetworks || []} />
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
