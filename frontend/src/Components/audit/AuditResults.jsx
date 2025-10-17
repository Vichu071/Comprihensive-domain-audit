import React, { useState } from "react";
import { FiActivity, FiServer, FiMail, FiShield, FiTrendingUp, FiLayers } from "react-icons/fi";

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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-16 px-4">
      <div className="max-w-4xl w-full bg-white shadow-xl rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          🌐 Comprehensive Domain Audit
        </h1>

        {/* Input Section */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <input
            type="text"
            placeholder="Enter domain (e.g. example.com)"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="flex-1 w-full sm:w-auto px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            onClick={handleAudit}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Run Audit"}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-red-600 text-center mb-6 font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Results Display */}
        {data && !loading && (
          <div className="space-y-8">
            <div className="text-center">
              <p className="text-gray-600">Domain:</p>
              <h2 className="text-xl font-semibold text-gray-900">
                {data.Domain}
              </h2>
              <p className="text-sm text-gray-500">
                Processed in {data["Processing Time"]}
              </p>
            </div>

            {/* WHOIS */}
            <Section icon={<FiActivity />} title="Domain Info" content={data.Results["Domain Info"]} />

            {/* Hosting */}
            <Section icon={<FiServer />} title="Hosting Info" content={data.Results["Hosting"]} />

            {/* Email */}
            <Section icon={<FiMail />} title="Email Setup" content={data.Results["Email"]} />

            {/* Tech Stack */}
            <Section icon={<FiLayers />} title="Technology Stack" content={data.Results["Tech Stack"]} />

            {/* WordPress */}
            <Section icon={<FiTrendingUp />} title="WordPress Info" content={data.Results["WordPress"]} />

            {/* Security */}
            <Section icon={<FiShield />} title="Security Audit" content={data.Results["Security"]} />

            {/* Performance */}
            <Section icon={<FiTrendingUp />} title="Performance" content={data.Results["Performance"]} />
          </div>
        )}
      </div>
    </div>
  );
};

const Section = ({ icon, title, content }) => (
  <div className="bg-gray-100 rounded-xl p-6 shadow-inner">
    <div className="flex items-center mb-4 space-x-2">
      <span className="text-blue-600 text-xl">{icon}</span>
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
    </div>
    <div className="text-gray-700 text-sm grid grid-cols-1 sm:grid-cols-2 gap-2">
      {content && Object.entries(content).map(([k, v]) => (
        <div key={k}>
          <strong>{k}:</strong> {Array.isArray(v) ? v.join(", ") : String(v || "-")}
        </div>
      ))}
    </div>
  </div>
);

export default AuditResults;
