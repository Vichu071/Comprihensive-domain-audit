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
                Real-time SSL tracking with predictive renewal alerts and
                quantum-safe certificate suggestions.
              </p>
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>🧠 AI Threat Prediction</h3>
              <p style={styles.cardText}>
                EngagePro anticipates vulnerabilities before they appear —
                leveraging pattern recognition for proactive defense.
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
                Visualize your domain’s DNS propagation and optimize global
                routing using EngagePro’s resolver intelligence.
              </p>
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>🛰️ Real-Time Routing Monitor</h3>
              <p style={styles.cardText}>
                Monitor and reroute downtime automatically with intelligent
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
                Analyze uptime, SEO, and performance trends using machine-learning-backed analytics.
              </p>
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>💡 Optimization Suggestions</h3>
              <p style={styles.cardText}>
                EngagePro offers smart, actionable improvements to boost your
                site speed, visibility, and engagement.
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
                The next evolution of EngagePro will unify analytics, automation,
                and AI forecasting for seamless domain intelligence.
              </p>
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>🔮 Predictive Domain Strategy</h3>
              <p style={styles.cardText}>
                Coming soon — a module that predicts domain trends and
                recommends strategic actions automatically.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section style={styles.section}>
      {/* ===== Tabs ===== */}
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
              <span style={styles.icon}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== Dashboard ===== */}
      <div style={styles.dashboard}>
        <div style={styles.dashboardInner}>
          <h2 style={styles.sectionTitle}>EngagePro Insights Dashboard</h2>
          <p style={styles.subtitle}>
            “Empowering digital performance — one domain at a time.”
          </p>
          {renderContent()}
        </div>
      </div>
    </section>
  );
};

/* ===============================
   PREMIUM RESPONSIVE STYLING
=============================== */
const styles = {
  section: {
    background:
      "linear-gradient(180deg, #2b0069 0%, #40189b 50%, #1a084b 100%)",
    padding: "5rem 1rem 6rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontFamily: "'Inter', sans-serif",
  },
  menuWrapper: {
    width: "100%",
    overflowX: "auto",
    marginBottom: "2rem",
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
    boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
    flexWrap: "nowrap",
  },
  menuButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.25)",
    color: "#f1f1f1",
    padding: "0.6rem 1rem",
    borderRadius: "2rem",
    cursor: "pointer",
    fontWeight: 500,
    fontSize: "0.9rem",
    transition: "all 0.3s ease",
    whiteSpace: "nowrap",
  },
  activeTab: {
    background: "#fff",
    color: "#1a084b",
    boxShadow: "0 4px 15px rgba(255,255,255,0.3)",
    transform: "scale(1.05)",
  },
  icon: {
    fontSize: "1rem",
  },
  dashboard: {
    width: "90%",
    maxWidth: "1100px",
    background: "rgba(255,255,255,0.12)",
    borderRadius: "2rem",
    padding: "2rem",
    boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
  },
  dashboardInner: {
    background: "#ffffff",
    borderRadius: "1.5rem",
    padding: "2.5rem",
    boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
  },
  sectionTitle: {
    textAlign: "center",
    fontSize: "2rem",
    fontWeight: 700,
    marginBottom: "0.5rem",
    color: "#111",
  },
  subtitle: {
    textAlign: "center",
    color: "#555",
    marginBottom: "2rem",
    fontStyle: "italic",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "1.5rem",
  },
  card: {
    background: "#f9fafb",
    borderRadius: "1rem",
    padding: "1.5rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
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
  "@media (maxWidth: 768px)": {
    sectionTitle: { fontSize: "1.6rem" },
    menuContainer: { gap: "0.5rem" },
    cardTitle: { fontSize: "1rem" },
    cardText: { fontSize: "0.9rem" },
  },
};

export default AuditVisualization;
