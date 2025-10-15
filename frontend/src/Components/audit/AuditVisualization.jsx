import React, { useState } from "react";
import {
  FaRocket,
  FaLock,
  FaGlobe,
  FaChartLine,
  FaLightbulb,
} from "react-icons/fa";

const AuditVisualization = () => {
  const [activeTab, setActiveTab] = useState("performance");

  const tabs = [
    { key: "performance", label: "Performance", icon: <FaRocket /> },
    { key: "security", label: "Security", icon: <FaLock /> },
    { key: "dns", label: "DNS", icon: <FaGlobe /> },
    { key: "insights", label: "Insights", icon: <FaChartLine /> },
    { key: "future", label: "What's Next", icon: <FaLightbulb /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "performance":
        return (
          <div style={styles.grid}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>🚀 Lightning-Speed Optimization</h3>
              <p style={styles.cardText}>
                EngagePro AI enhances your website’s performance with adaptive
                caching and smart compression to deliver ultra-fast loading times.
              </p>
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>📈 Smart Resource Balancing</h3>
              <p style={styles.cardText}>
                Automatically distributes traffic load across regions — ensuring
                your users get the best response wherever they are.
              </p>
            </div>
          </div>
        );
      case "security":
        return (
          <div style={styles.grid}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>🔒 Adaptive SSL Monitoring</h3>
              <p style={styles.cardText}>
                Get real-time SSL tracking with predictive renewal alerts and
                quantum-safe certificate suggestions.
              </p>
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>🧠 AI Threat Prediction</h3>
              <p style={styles.cardText}>
                EngagePro anticipates vulnerabilities before they appear — using
                behavioral pattern recognition for proactive defense.
              </p>
            </div>
          </div>
        );
      case "dns":
        return (
          <div style={styles.grid}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>🌐 Smart DNS Insights</h3>
              <p style={styles.cardText}>
                Instantly visualize your domain’s global DNS propagation and
                optimize route efficiency using EngagePro’s resolver AI.
              </p>
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>🛰️ Real-Time Routing Monitor</h3>
              <p style={styles.cardText}>
                Track and reroute downtime automatically through intelligent
                failover systems for zero interruption.
              </p>
            </div>
          </div>
        );
      case "insights":
        return (
          <div style={styles.grid}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>📊 Deep Domain Intelligence</h3>
              <p style={styles.cardText}>
                From traffic spikes to uptime trends — analyze domain health and
                performance with machine learning-backed insights.
              </p>
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>💡 Optimization Suggestions</h3>
              <p style={styles.cardText}>
                EngagePro gives actionable steps to enhance your SEO, reduce
                latency, and boost conversions.
              </p>
            </div>
          </div>
        );
      case "future":
        return (
          <div style={styles.grid}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>🌟 EngagePro Next Vision</h3>
              <p style={styles.cardText}>
                We're building the future of AI-driven domain intelligence — a
                single ecosystem connecting analytics, automation, and growth.
              </p>
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>🔮 Predictive Domain Strategy</h3>
              <p style={styles.cardText}>
                Coming soon: a module that forecasts domain performance shifts
                and helps plan your digital evolution.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={styles.section}>
      {/* ===== Menu Tabs ===== */}
      <div style={styles.menuWrapper}>
        <div style={styles.menuContainer}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                ...styles.menuButton,
                ...(activeTab === tab.key ? styles.activeTab : {}),
              }}
            >
              {tab.icon}
              <span style={{ marginLeft: "6px" }}>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== Dashboard Area ===== */}
      <div style={styles.dashboard}>
        <div style={styles.dashboardInner}>
          <h2 style={styles.sectionTitle}>EngagePro Insights Dashboard</h2>
          <p style={styles.subtitle}>
            "Empowering digital performance — one domain at a time."
          </p>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

/* ===============================
   PREMIUM INLINE STYLES
=============================== */
const styles = {
  section: {
    position: "relative",
    background:
      "linear-gradient(180deg, #1a084b 0%, #220e74 50%, #0a043c 100%)",
    padding: "5rem 1rem 6rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  menuWrapper: {
    position: "relative",
    zIndex: 2,
    marginBottom: "2rem",
    width: "100%",
    overflowX: "auto",
    display: "flex",
    justifyContent: "center",
  },
  menuContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "1rem",
    padding: "0.75rem 1rem",
    background: "rgba(255, 255, 255, 0.08)",
    borderRadius: "2rem",
    backdropFilter: "blur(10px)",
    boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
    flexWrap: "nowrap",
  },
  menuButton: {
    display: "flex",
    alignItems: "center",
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.3)",
    color: "#ffffffcc",
    padding: "0.6rem 1.2rem",
    borderRadius: "2rem",
    cursor: "pointer",
    fontWeight: 500,
    fontSize: "0.9rem",
    transition: "all 0.3s ease",
    whiteSpace: "nowrap",
  },
  activeTab: {
    background: "#ffffff",
    color: "#111",
    boxShadow: "0 4px 12px rgba(255,255,255,0.25)",
  },
  dashboard: {
    width: "90%",
    maxWidth: "1000px",
    background: "rgba(255,255,255,0.12)",
    borderRadius: "2rem",
    padding: "2rem",
    boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
  },
  dashboardInner: {
    background: "#fff",
    borderRadius: "1.5rem",
    padding: "2.5rem",
    boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
  },
  sectionTitle: {
    textAlign: "center",
    fontSize: "2rem",
    fontWeight: 700,
    marginBottom: "0.5rem",
    color: "#1a1a2e",
  },
  subtitle: {
    textAlign: "center",
    color: "#4b5563",
    marginBottom: "2rem",
    fontStyle: "italic",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "1.5rem",
  },
  card: {
    background: "#f9fafb",
    borderRadius: "1rem",
    padding: "1.5rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    transition: "transform 0.3s ease",
  },
  cardTitle: {
    fontSize: "1.2rem",
    fontWeight: 600,
    marginBottom: "0.75rem",
    color: "#1f2937",
  },
  cardText: {
    fontSize: "0.95rem",
    lineHeight: "1.6",
    color: "#374151",
  },
};

export default AuditVisualization;
