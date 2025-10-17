import React, { useState } from "react";
import {
  FiActivity,
  FiServer,
  FiMail,
  FiShield,
  FiTrendingUp,
  FiLayers,
} from "react-icons/fi";

const API_BASE = "https://comprihensive-audit-backend.onrender.com";

const AuditResults = () => {
  const [domain, setDomain] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAudit = async () => {
    if (!domain.trim()) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await fetch(`${API_BASE}/audit/${domain}`);
      const result = await res.json();
      if (res.ok && result.Results) {
        setData(result);
      } else {
        setError(result.error || "Failed to fetch audit data");
      }
    } catch (err) {
      setError("Unable to connect to audit API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="audit-wrapper">
      <style>{`
        .audit-wrapper {
          min-height: 100vh;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 4rem 1rem;
          font-family: "Inter", sans-serif;
        }
        .audit-container {
          max-width: 900px;
          width: 100%;
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 6px 25px rgba(0,0,0,0.08);
          padding: 2rem;
        }
        h1 {
          text-align: center;
          font-size: 2rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 2rem;
        }
        .input-area {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: center;
          justify-content: center;
          margin-bottom: 2rem;
        }
        .input-area input {
          width: 100%;
          max-width: 400px;
          padding: 0.75rem 1rem;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .input-area input:focus {
          border-color: #2563eb;
        }
        .input-area button {
          background: #2563eb;
          color: white;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .input-area button:hover {
          background: #1d4ed8;
        }
        .error {
          color: #dc2626;
          text-align: center;
          font-weight: 500;
          margin-bottom: 1rem;
        }
        .spinner {
          display: flex;
          justify-content: center;
          padding: 2rem;
        }
        .spinner div {
          border: 3px solid #93c5fd;
          border-top: 3px solid #2563eb;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .results {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .domain-info {
          text-align: center;
          color: #334155;
        }
        .domain-info h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
          margin-top: 0.25rem;
        }
        .section {
          background: #f1f5f9;
          border-radius: 12px;
          padding: 1.25rem;
          box-shadow: inset 0 2px 5px rgba(0,0,0,0.04);
        }
        .section-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .section-header h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1e3a8a;
        }
        .section-content {
          color: #334155;
          font-size: 0.95rem;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.75rem;
        }
        strong {
          color: #111827;
        }
        @media (max-width: 640px) {
          .audit-container {
            padding: 1.5rem;
          }
          h1 {
            font-size: 1.6rem;
          }
          .input-area input {
            max-width: 100%;
          }
        }
      `}</style>

      <div className="audit-container">
        <h1>🌐 Comprehensive Domain Audit</h1>

        {/* Input Section */}
        <div className="input-area">
          <input
            type="text"
            placeholder="Enter domain (e.g. example.com)"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
          <button onClick={handleAudit} disabled={loading}>
            {loading ? "Analyzing..." : "Run Audit"}
          </button>
        </div>

        {/* Error Message */}
        {error && <div className="error">⚠️ {error}</div>}

        {/* Loading Spinner */}
        {loading && (
          <div className="spinner">
            <div></div>
          </div>
        )}

        {/* Results Display */}
        {data && !loading && (
          <div className="results">
            <div className="domain-info">
              <p>Domain:</p>
              <h2>{data.Domain}</h2>
              <p className="time">Processed in {data["Processing Time"]}</p>
            </div>

            <Section
              icon={<FiActivity />}
              title="Domain Info"
              content={data.Results["Domain Info"]}
            />
            <Section
              icon={<FiServer />}
              title="Hosting Info"
              content={data.Results["Hosting"]}
            />
            <Section
              icon={<FiMail />}
              title="Email Setup"
              content={data.Results["Email"]}
            />
            <Section
              icon={<FiLayers />}
              title="Technology Stack"
              content={data.Results["Tech Stack"]}
            />
            <Section
              icon={<FiTrendingUp />}
              title="WordPress Info"
              content={data.Results["WordPress"]}
            />
            <Section
              icon={<FiShield />}
              title="Security Audit"
              content={data.Results["Security"]}
            />
            <Section
              icon={<FiTrendingUp />}
              title="Performance"
              content={data.Results["Performance"]}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const Section = ({ icon, title, content }) => (
  <div className="section">
    <div className="section-header">
      <span style={{ color: "#2563eb", fontSize: "1.2rem" }}>{icon}</span>
      <h3>{title}</h3>
    </div>
    <div className="section-content">
      {content &&
        Object.entries(content).map(([key, value]) => (
          <div key={key}>
            <strong>{key}:</strong>{" "}
            {Array.isArray(value) ? value.join(", ") : String(value || "-")}
          </div>
        ))}
    </div>
  </div>
);

export default AuditResults;
