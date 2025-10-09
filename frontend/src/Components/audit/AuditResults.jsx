import React, { useState } from 'react';
import { FiGlobe, FiMail, FiZap, FiStar, FiTrendingUp, FiShield, FiLayers, FiServer, FiCalendar, FiCheck, FiX, FiArrowLeft } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const ProgressBar = ({ label, value, color = '#3b82f6' }) => {
  const numericValue = parseFloat(value) || 0;
  return (
    <div style={{ margin: '1rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>{label}</span>
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color }}>{value}</span>
      </div>
      <div style={{ width: '100%', height: '8px', background: '#f3f4f6', borderRadius: '10px', overflow: 'hidden' }}>
        <motion.div 
          initial={{ width: 0 }} 
          animate={{ width: `${Math.min(numericValue * 20, 100)}%` }} 
          transition={{ duration: 1 }}
          style={{ height: '100%', background: color, borderRadius: '10px' }}
        />
      </div>
    </div>
  );
};

const InfoCard = ({ title, value, icon, color = '#3b82f6' }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} 
    animate={{ opacity: 1, y: 0 }}
    style={{
      background: 'white',
      padding: '1.5rem',
      borderRadius: '12px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      border: `1px solid ${color}20`,
      textAlign: 'center',
      flex: 1,
      minWidth: '140px'
    }}
  >
    <div style={{ fontSize: '1.8rem', color, marginBottom: '0.5rem' }}>{icon}</div>
    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>{title}</div>
    <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>{value}</div>
  </motion.div>
);

const StatusIndicator = ({ status, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
    <div style={{ 
      width: '12px', 
      height: '12px', 
      borderRadius: '50%', 
      background: status === 'good' ? '#10b981' : status === 'warning' ? '#f59e0b' : '#ef4444' 
    }} />
    <span style={{ fontSize: '0.9rem', color: '#374151' }}>{label}</span>
  </div>
);

const AuditCard = ({ title, icon, children, color = '#3b82f6' }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    style={{
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      padding: '2rem',
      marginBottom: '1.5rem'
    }}
  >
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      marginBottom: '1.5rem',
      paddingBottom: '1rem',
      borderBottom: `2px solid ${color}20`
    }}>
      <div style={{ fontSize: '1.5rem', color, marginRight: '0.75rem' }}>{icon}</div>
      <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#1f2937' }}>{title}</h3>
    </div>
    <div>{children}</div>
  </motion.div>
);

const AuditResults = ({ results, onNewAudit }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!results) {
    return (
      <section style={{ 
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            textAlign: 'center',
            background: 'white',
            padding: '3rem',
            borderRadius: '20px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            maxWidth: '500px'
          }}
        >
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            color: 'white',
            margin: '0 auto 1.5rem'
          }}>
            🔍
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1f2937', marginBottom: '1rem' }}>
            No Results Found
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
            No audit results to display. Please run a domain audit first.
          </p>
          {onNewAudit && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNewAudit}
              style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '10px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Start New Audit
            </motion.button>
          )}
        </motion.div>
      </section>
    );
  }

  const { 
    Domain, 
    'Domain Info': domainInfo, 
    Hosting, 
    'Email Setup': email, 
    'Website Tech': tech, 
    WordPress, 
    'Ads Running': ads, 
    Security, 
    Performance, 
    'Audit Date': auditDate 
  } = results;

  const isWordPress = WordPress?.['Is WordPress'] === 'Yes';
  const hasSSL = Security?.['SSL Certificate'] === 'Valid';
  const techCount = Object.values(tech || {}).reduce((acc, curr) => acc + (Array.isArray(curr) ? curr.length : 0), 0);

  return (
    <>
      <style jsx>{`
        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          /* Section padding */
          section {
            padding: 1rem 0.5rem !important;
          }

          /* Header adjustments */
          .audit-header {
            padding: 1.5rem !important;
            margin-bottom: 1.5rem !important;
          }

          .audit-header h1 {
            font-size: 1.8rem !important;
            line-height: 1.2 !important;
          }

          .audit-header p {
            font-size: 1rem !important;
            margin-bottom: 1.5rem !important;
          }

          /* Info cards grid */
          .info-cards-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.8rem !important;
          }

          .info-card {
            padding: 1rem !important;
            min-width: auto !important;
          }

          .info-card > div:first-child {
            font-size: 1.4rem !important;
            margin-bottom: 0.3rem !important;
          }

          .info-card > div:nth-child(2) {
            font-size: 0.9rem !important;
          }

          .info-card > div:nth-child(3) {
            font-size: 0.8rem !important;
          }

          /* Tab navigation */
          .tab-navigation {
            overflow-x: auto !important;
            padding-bottom: 0.5rem;
            margin-bottom: 1.5rem !important;
            flex-wrap: nowrap !important;
            gap: 0.5rem !important;
          }

          .tab-button {
            padding: 0.6rem 1rem !important;
            font-size: 0.8rem !important;
            white-space: nowrap;
          }

          /* Audit cards */
          .audit-card {
            padding: 1.5rem !important;
            margin-bottom: 1rem !important;
            border-radius: 12px !important;
          }

          .audit-card h3 {
            font-size: 1.2rem !important;
          }

          /* Domain info grid */
          .domain-info-grid {
            gap: 0.8rem !important;
          }

          .domain-info-item {
            padding: 0.8rem !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.3rem !important;
          }

          .domain-info-item span:first-child {
            font-size: 0.8rem !important;
          }

          .domain-info-item span:last-child {
            font-size: 0.9rem !important;
            word-break: break-word;
          }

          /* Technology tags */
          .tech-tags {
            gap: 0.3rem !important;
          }

          .tech-tag {
            padding: 0.3rem 0.6rem !important;
            font-size: 0.7rem !important;
          }

          /* WordPress grid */
          .wordpress-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }

          .wordpress-item {
            padding: 1rem !important;
          }

          /* Email configuration */
          .email-section {
            gap: 1rem !important;
          }

          .email-record {
            padding: 0.6rem !important;
            font-size: 0.8rem !important;
          }

          /* Ads detection */
          .ads-tags {
            gap: 0.3rem !important;
          }

          .ads-tag {
            padding: 0.3rem 0.6rem !important;
            font-size: 0.7rem !important;
          }

          /* New audit button */
          .new-audit-button {
            position: relative !important;
            top: auto !important;
            right: auto !important;
            margin: 0 auto 1.5rem auto !important;
            display: block !important;
          }

          /* Footer */
          .audit-footer {
            margin-top: 2rem !important;
            padding: 1.5rem !important;
            font-size: 0.8rem !important;
          }
        }

        @media (max-width: 480px) {
          /* Extra small devices */
          section {
            padding: 0.5rem 0.3rem !important;
          }

          .audit-header {
            padding: 1.2rem !important;
          }

          .audit-header h1 {
            font-size: 1.5rem !important;
          }

          .info-cards-grid {
            grid-template-columns: 1fr !important;
            gap: 0.6rem !important;
          }

          .info-card {
            padding: 0.8rem !important;
          }

          .tab-button {
            padding: 0.5rem 0.8rem !important;
            font-size: 0.75rem !important;
          }

          .audit-card {
            padding: 1.2rem !important;
          }

          .audit-card h3 {
            font-size: 1.1rem !important;
          }
        }

        /* Tablet responsive styles */
        @media (min-width: 769px) and (max-width: 1024px) {
          section {
            padding: 1.5rem 1rem !important;
          }

          .audit-header {
            padding: 2rem !important;
          }

          .info-cards-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 1rem !important;
          }

          .wordpress-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }

          .new-audit-button {
            right: 1rem !important;
          }
        }

        /* Large desktop adjustments */
        @media (min-width: 1440px) {
          section {
            padding: 3rem 2rem !important;
          }

          .audit-header {
            padding: 3rem !important;
          }

          .info-cards-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }

        /* Touch device optimizations */
        @media (max-width: 768px) {
          /* Increase touch targets */
          .tab-button,
          .new-audit-button,
          .tech-tag,
          .ads-tag {
            min-height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          /* Simplify hover effects for touch */
          .tab-button:hover,
          .new-audit-button:hover {
            transform: none !important;
          }

          /* Active state for touch feedback */
          .tab-button:active,
          .new-audit-button:active {
            transform: scale(0.95) !important;
          }

          /* Reduce animations for performance */
          .audit-card {
            animation: none;
          }
        }

        /* Improve readability on small screens */
        @media (max-width: 768px) {
          .domain-info-item span:last-child {
            line-height: 1.4;
          }

          .tech-tag,
          .ads-tag {
            line-height: 1.3;
          }
        }

        /* Prevent horizontal scrolling */
        @media (max-width: 768px) {
          .tab-navigation {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>

      <section style={{ 
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
        minHeight: '100vh', 
        padding: '2rem 1rem',
        position: 'relative'
      }}>
        
        {/* New Audit Button */}
        {onNewAudit && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNewAudit}
            className="new-audit-button"
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '10px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              zIndex: 10,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            <FiArrowLeft size={16} />
            New Audit
          </motion.button>
        )}

        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="audit-header"
            style={{ 
              background: 'white',
              borderRadius: '20px',
              padding: '2.5rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
              marginBottom: '2rem',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 800, 
              marginBottom: '0.5rem',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Domain Analysis Complete
            </h1>
            <p style={{ fontSize: '1.2rem', color: '#6b7280', marginBottom: '2rem' }}>
              Analysis for <strong style={{ color: '#3b82f6' }}>{Domain}</strong>
            </p>

            {/* Quick Stats */}
            <div className="info-cards-grid" style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginTop: '2rem'
            }}>
              <InfoCard 
                title="Technologies" 
                value={techCount} 
                icon={<FiLayers />}
                color="#6366f1"
              />
              <InfoCard 
                title="SSL" 
                value={hasSSL ? 'Valid' : 'Invalid'} 
                icon={<FiShield />}
                color={hasSSL ? '#10b981' : '#ef4444'}
              />
              <InfoCard 
                title="Performance" 
                value={Performance?.Score || 'Unknown'} 
                icon={<FiTrendingUp />}
                color="#f59e0b"
              />
              <InfoCard 
                title="WordPress" 
                value={isWordPress ? 'Yes' : 'No'} 
                icon={<FiStar />}
                color={isWordPress ? '#f59e0b' : '#6b7280'}
              />
            </div>
          </motion.div>

          {/* Navigation Tabs */}
          <div className="tab-navigation" style={{ 
            display: 'flex', 
            gap: '1rem', 
            marginBottom: '2rem',
            flexWrap: 'wrap'
          }}>
            {['overview', 'hosting', 'technology', 'wordpress', 'email', 'ads', 'security', 'performance'].map(tab => (
              <motion.button
                key={tab}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab)}
                className="tab-button"
                style={{
                  padding: '0.8rem 1.5rem',
                  background: activeTab === tab ? '#3b82f6' : 'white',
                  color: activeTab === tab ? 'white' : '#374151',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  fontSize: '0.9rem'
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Domain Information */}
                <AuditCard title="Domain Registration" icon={<FiGlobe />} color="#3b82f6">
                  <div className="domain-info-grid" style={{ display: 'grid', gap: '1rem' }}>
                    {Object.entries(domainInfo || {}).map(([key, value]) => (
                      <div key={key} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        background: '#f8fafc',
                        borderRadius: '10px'
                      }}>
                        <span style={{ color: '#6b7280', fontWeight: 500 }}>{key}</span>
                        <span style={{ fontWeight: 600, color: '#1f2937' }}>
                          {Array.isArray(value) ? value.join(', ') : value}
                        </span>
                      </div>
                    ))}
                  </div>
                </AuditCard>
              </motion.div>
            )}

            {activeTab === 'hosting' && (
              <motion.div
                key="hosting"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <AuditCard title="Hosting Information" icon={<FiServer />} color="#8b5cf6">
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {Object.entries(Hosting || {}).map(([key, value]) => (
                      <div key={key} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        background: '#f8fafc',
                        borderRadius: '10px'
                      }}>
                        <span style={{ color: '#6b7280', fontWeight: 500 }}>{key}</span>
                        <span style={{ fontWeight: 600, color: '#1f2937' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </AuditCard>
              </motion.div>
            )}

            {activeTab === 'technology' && (
              <motion.div
                key="technology"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <AuditCard title="Technology Stack" icon={<FiZap />} color="#6366f1">
                  {Object.keys(tech || {}).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                      No technology data detected
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {Object.entries(tech).map(([category, technologies]) => (
                        <div key={category}>
                          <h4 style={{ 
                            marginBottom: '0.8rem', 
                            color: '#374151', 
                            fontWeight: 600,
                            fontSize: '1.1rem'
                          }}>
                            {category}
                          </h4>
                          <div className="tech-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {technologies.map((techItem, index) => (
                              <motion.span
                                key={index}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className="tech-tag"
                                style={{
                                  background: '#e0f2fe',
                                  color: '#0369a1',
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '20px',
                                  fontSize: '0.8rem',
                                  fontWeight: 500
                                }}
                              >
                                {techItem}
                              </motion.span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </AuditCard>
              </motion.div>
            )}

            {activeTab === 'wordpress' && (
              <motion.div
                key="wordpress"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <AuditCard title="WordPress Analysis" icon={<FiStar />} color="#f59e0b">
                  <div className="wordpress-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    <div style={{ 
                      padding: '1.5rem', 
                      background: isWordPress ? '#f0fdf4' : '#fef2f2',
                      borderRadius: '12px',
                      border: `2px solid ${isWordPress ? '#10b981' : '#ef4444'}20`,
                      textAlign: 'center'
                    }}>
                      <div style={{ 
                        fontSize: '2rem', 
                        color: isWordPress ? '#10b981' : '#ef4444',
                        marginBottom: '1rem'
                      }}>
                        {isWordPress ? <FiCheck /> : <FiX />}
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>
                        WordPress
                      </div>
                      <div style={{ color: isWordPress ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                        {isWordPress ? 'Detected' : 'Not Detected'}
                      </div>
                    </div>

                    {isWordPress && (
                      <>
                        <div style={{ 
                          padding: '1.5rem', 
                          background: '#f8fafc',
                          borderRadius: '12px',
                          border: '1px solid #e5e7eb',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.5rem' }}>
                            Version
                          </div>
                          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1f2937' }}>
                            {WordPress.Version}
                          </div>
                        </div>

                        <div style={{ 
                          padding: '1.5rem', 
                          background: '#f8fafc',
                          borderRadius: '12px',
                          border: '1px solid #e5e7eb',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.5rem' }}>
                            Theme
                          </div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', wordBreak: 'break-word' }}>
                            {WordPress.Theme}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </AuditCard>
              </motion.div>
            )}

            {activeTab === 'email' && (
              <motion.div
                key="email"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <AuditCard title="Email Configuration" icon={<FiMail />} color="#8b5cf6">
                  <div className="email-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                      <h4 style={{ marginBottom: '0.8rem', color: '#374151', fontWeight: 600 }}>Email Provider</h4>
                      <div style={{ 
                        padding: '1rem', 
                        background: '#f8fafc', 
                        borderRadius: '10px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <span style={{ color: '#374151', fontWeight: 600, fontSize: '1.1rem' }}>
                          {email?.Provider}
                        </span>
                      </div>
                    </div>

                    {email?.['MX Records']?.length > 0 && (
                      <div>
                        <h4 style={{ marginBottom: '0.8rem', color: '#374151', fontWeight: 600 }}>MX Records</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {email['MX Records'].map((record, index) => (
                            <div key={index} className="email-record" style={{ 
                              padding: '0.75rem', 
                              background: '#f0fdf4',
                              borderRadius: '8px',
                              border: '1px solid #bbf7d0',
                              fontSize: '0.9rem',
                              color: '#065f46'
                            }}>
                              {record}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {email?.['Contact Emails']?.length > 0 && (
                      <div>
                        <h4 style={{ marginBottom: '0.8rem', color: '#374151', fontWeight: 600 }}>
                          Contact Emails ({email['Contact Emails'].length})
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {email['Contact Emails'].map((emailAddr, index) => (
                            <motion.span
                              key={index}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 }}
                              style={{
                                background: '#e0e7ff',
                                color: '#4f46e5',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                fontWeight: 500
                              }}
                            >
                              {emailAddr}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </AuditCard>
              </motion.div>
            )}

            {activeTab === 'ads' && (
              <motion.div
                key="ads"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <AuditCard title="Advertising Networks" icon={<FiZap />} color="#ef4444">
                  {ads && ads.length > 0 && !ads[0].includes('Unable to scan') && !ads[0].includes('No advertising') ? (
                    <div>
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '1rem', 
                        background: '#fef2f2',
                        borderRadius: '10px',
                        marginBottom: '1.5rem',
                        border: '1px solid #fecaca'
                      }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#dc2626' }}>
                          {ads.length} Advertising Network{ads.length > 1 ? 's' : ''} Detected
                        </div>
                      </div>
                      <div className="ads-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {ads.map((ad, index) => (
                          <motion.span
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="ads-tag"
                            style={{
                              background: '#fee2e2',
                              color: '#dc2626',
                              padding: '0.4rem 0.8rem',
                              borderRadius: '20px',
                              fontSize: '0.8rem',
                              fontWeight: 500
                            }}
                          >
                            {ad}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                    <div style={{ 
                      width: '80px', 
                      height: '80px', 
                      background: '#f0fdf4',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      color: '#10b981',
                      margin: '0 auto 1.5rem'
                    }}>
                      ✓
                    </div>
                    <h4 style={{ fontSize: '1.3rem', fontWeight: 600, color: '#059669', marginBottom: '0.5rem' }}>
                      No Ads Detected
                    </h4>
                    <p>No advertising networks were detected on this website.</p>
                  </div>
                )}
                </AuditCard>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <AuditCard title="Security Assessment" icon={<FiShield />} color="#10b981">
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {Object.entries(Security || {}).map(([key, value]) => (
                      <StatusIndicator 
                        key={key} 
                        status={value === 'Valid' || value === 'Present' ? 'good' : 'warning'} 
                        label={`${key}: ${value}`} 
                      />
                    ))}
                  </div>
                </AuditCard>
              </motion.div>
            )}

            {activeTab === 'performance' && (
              <motion.div
                key="performance"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <AuditCard title="Performance Metrics" icon={<FiTrendingUp />} color="#f59e0b">
                  <ProgressBar label="Load Time" value={Performance?.['Load Time']} color="#f59e0b" />
                  <ProgressBar label="Page Size" value={Performance?.['Page Size']} color="#3b82f6" />
                  <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151' }}>Performance Score</div>
                    <div style={{ 
                      fontSize: '2rem', 
                      fontWeight: 700, 
                      color: Performance?.Score === 'Excellent' ? '#10b981' : 
                            Performance?.Score === 'Good' ? '#3b82f6' : 
                            Performance?.Score === 'Average' ? '#f59e0b' : '#ef4444',
                      marginTop: '0.5rem' 
                    }}>
                      {Performance?.Score}
                    </div>
                  </div>
                </AuditCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer with Audit Date */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.5 }}
            className="audit-footer"
            style={{ 
              textAlign: 'center', 
              marginTop: '3rem', 
              padding: '2rem', 
              color: '#6b7280', 
              fontSize: '0.9rem',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}
          >
            Report generated on <strong>{auditDate || new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</strong>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default AuditResults;