import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Shield, Server, Cpu, Zap, Globe } from "lucide-react";

const FeaturesSection = () => {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState("Hosting");
  const [hoveredFeature, setHoveredFeature] = useState(null);

  const features = [
    { name: "Hosting", icon: Server },
    { name: "Email Setup", icon: Mail },
    { name: "CMS & Theme", icon: Cpu },
    { name: "Security", icon: Shield },
    { name: "Performance", icon: Zap },
    { name: "Technology Stack", icon: Globe },
  ];

  const featureContent = {
    Hosting: {
      icon: <Server size={36} color="#6d28d9" />,
      title: "Hosting Insights",
      details:
        "Your site runs on AWS Lightsail — optimized for uptime, DNS performance, and scalability.",
      stat: "Next Renewal: 23 Jan 2026",
    },
    "Email Setup": {
      icon: <Mail size={36} color="#6d28d9" />,
      title: "Email Configuration",
      details:
        "MX verified with Google Workspace. SPF, DKIM, and DMARC are fully configured for reliability.",
      stat: "Deliverability: 99/100",
    },
    "CMS & Theme": {
      icon: <Cpu size={36} color="#6d28d9" />,
      title: "CMS & Theme Details",
      details:
        "WordPress 6.4 with Astra Pro — SEO-ready, lightweight, and responsive across all devices.",
      stat: "Theme: Astra Pro 3.2.1",
    },
    Security: {
      icon: <Shield size={36} color="#6d28d9" />,
      title: "Security Overview",
      details:
        "SSL and DNSSEC active. All major headers validated with no critical vulnerabilities detected.",
      stat: "Last Scan: 12 Oct 2025",
    },
    Performance: {
      icon: <Zap size={36} color="#6d28d9" />,
      title: "Performance Metrics",
      details:
        "Average load time: 1.8s | Global optimization: 93/100 | Core Web Vitals: Excellent.",
      stat: "Speed Grade: A",
    },
    "Technology Stack": {
      icon: <Globe size={36} color="#6d28d9" />,
      title: "Tech Stack Analysis",
      details:
        "React, Node.js, Cloudflare CDN, and Google Analytics detected. Fully optimized backend stack.",
      stat: "Stack Health: Stable",
    },
  };

  const styles = {
    section: {
      backgroundColor: "#fafafa",
      fontFamily: "'Inter', sans-serif",
      padding: "60px 6%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "60px",
    },

    // ─── Top Section ───
    topRow: {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
      maxWidth: "1100px",
      textAlign: "left",
    },
    topLeft: {
      flex: "0 0 50%",
      minWidth: "280px",
    },
    h1: {
      fontSize: "2rem",
      fontWeight: 700,
      color: "#0f172a",
      lineHeight: 1.2,
      marginBottom: "0.75rem",
    },
    p: {
      fontSize: "0.95rem",
      color: "#475569",
      lineHeight: 1.5,
      maxWidth: "90%",
    },
    topRight: {
      flex: "0 0 50%",
      minWidth: "240px",
      display: "flex",
      justifyContent: "flex-end",
      marginTop: "1rem",
    },
    button: {
      backgroundColor: "#6d28d9",
      color: "#fff",
      padding: "12px 26px",
      borderRadius: "10px",
      fontWeight: 600,
      fontSize: "0.95rem",
      border: "none",
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 10px rgba(109, 40, 217, 0.25)",
    },

    // ─── Bottom Section ───
    bottomRow: {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "space-between",
      alignItems: "stretch",
      width: "100%",
      maxWidth: "1100px",
      gap: "30px",
    },
    bottomLeft: {
      flex: "1 1 280px",
      display: "flex",
      flexDirection: "column",
      borderTop: "1px solid #e2e8f0",
      paddingTop: "10px",
    },
    menuItem: (active) => ({
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "14px 0",
      borderBottom: "1px solid #e2e8f0",
      fontSize: "0.95rem",
      fontWeight: active ? 600 : 500,
      color: active ? "#6d28d9" : "#1e293b",
      cursor: "pointer",
      transition: "all 0.25s ease",
    }),
    bottomRight: {
      flex: "1 1 280px",
      backgroundColor: "#fff",
      border: "1px solid #000",
      borderRadius: "14px",
      padding: "26px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      boxShadow: "0 6px 18px rgba(0, 0, 0, 0.05)",
      minHeight: "250px",
    },
    iconBox: {
      backgroundColor: "#f3e8ff",
      borderRadius: "10px",
      width: "60px",
      height: "60px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "16px",
    },
    cardTitle: {
      fontSize: "1.25rem",
      fontWeight: 700,
      color: "#0f172a",
      marginBottom: "6px",
    },
    cardText: {
      fontSize: "0.95rem",
      color: "#475569",
      lineHeight: 1.5,
      marginBottom: "6px",
    },
    stat: {
      fontSize: "0.9rem",
      color: "#6b7280",
      fontWeight: 500,
      marginTop: "4px",
    },

    // ─── Responsive Adjustments ───
    "@media (max-width: 768px)": {
      section: { padding: "40px 5%" },
      h1: { fontSize: "1.6rem" },
      p: { fontSize: "0.9rem" },
      topRow: { flexDirection: "column", textAlign: "center" },
      topRight: { justifyContent: "center" },
      bottomRow: { flexDirection: "column" },
      bottomRight: { minHeight: "220px" },
    },
  };

  return (
    <section style={styles.section}>
      {/* ─── Header Section ─── */}
      <div style={styles.topRow}>
        <div style={styles.topLeft}>
          <h1 style={styles.h1}>Complete Domain Intelligence for Teams</h1>
          <p style={styles.p}>
            Audit, analyze, and secure your domain infrastructure using precise
            monitoring tools designed for scalability.
          </p>
        </div>

        <div style={styles.topRight}>
          <button
            style={styles.button}
            onClick={() => navigate("/")}
            onMouseOver={(e) => (e.target.style.background = "#5b21b6")}
            onMouseOut={(e) => (e.target.style.background = "#6d28d9")}
          >
            Explore Dashboard
          </button>
        </div>
      </div>

      {/* ─── Menu + Right Card ─── */}
      <div style={styles.bottomRow}>
        {/* Left Menu */}
        <div style={styles.bottomLeft}>
          {features.map((f) => {
            const isActive = activeFeature === f.name;
            const isHovered = hoveredFeature === f.name;
            const Icon = f.icon;

            return (
              <div
                key={f.name}
                style={styles.menuItem(isActive)}
                onClick={() => setActiveFeature(f.name)}
                onMouseEnter={() => setHoveredFeature(f.name)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <Icon
                  size={18}
                  color={isActive || isHovered ? "#6d28d9" : "#000"}
                />
                {f.name}
              </div>
            );
          })}
        </div>

        {/* Right Content Card */}
        <div style={styles.bottomRight}>
          <div style={styles.iconBox}>{featureContent[activeFeature].icon}</div>
          <h3 style={styles.cardTitle}>{featureContent[activeFeature].title}</h3>
          <p style={styles.cardText}>{featureContent[activeFeature].details}</p>
          <div style={styles.stat}>{featureContent[activeFeature].stat}</div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
