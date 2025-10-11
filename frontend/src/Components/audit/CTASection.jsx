import React, { useState } from 'react'
import { motion } from 'framer-motion'

const CTASection = ({ onAudit }) => {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        duration: 0.8
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  const handleAudit = async (e) => {
    e.preventDefault()
    if (!domain.trim()) return

    setLoading(true)
    try {
      await onAudit(domain)
    } catch (error) {
      console.error('Audit failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .domain-input {
          width: 100%;
          max-width: 400px;
          padding: 1rem 1.5rem;
          font-size: 1.1rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          outline: none;
          transition: all 0.3s ease;
          background: white;
        }

        .domain-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
        }

        .domain-input::placeholder {
          color: #94a3b8;
        }

        .audit-button {
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .audit-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        .audit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <section
        style={{
          padding: '5rem 0',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          fontFamily: "'Inter', sans-serif",
          textAlign: 'center',
          borderTop: '1px solid rgba(0,0,0,0.05)'
        }}
      >
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '0 2rem'
          }}
        >
          <motion.h2
            variants={itemVariants}
            style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              marginBottom: '1rem',
              color: '#1a202c',
              lineHeight: '1.2'
            }}
          >
            Ready to Start Your{' '}
            <span className="gradient-text">Domain Audit?</span>
          </motion.h2>

          <motion.p
            variants={itemVariants}
            style={{
              fontSize: '1.2rem',
              color: '#64748b',
              marginBottom: '2.5rem',
              lineHeight: '1.6'
            }}
          >
            Get instant insights into any website's technology stack, security, and performance metrics.
          </motion.p>

          <motion.form
            variants={itemVariants}
            onSubmit={handleAudit}
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: '2rem'
            }}
          >
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Enter domain (e.g., google.com)"
              className="domain-input"
              disabled={loading}
              style={{
                minWidth: '300px'
              }}
            />
            <motion.button
              type="submit"
              whileHover={!loading ? { scale: 1.05 } : {}}
              whileTap={!loading ? { scale: 0.95 } : {}}
              className="audit-button"
              disabled={loading || !domain.trim()}
              style={{
                background: loading ? '#94a3b8' : 'linear-gradient(135deg, #667eea, #764ba2)'
              }}
            >
              {loading ? (
                <>
                  <div className="loading-spinner" />
                  Analyzing...
                </>
              ) : (
                'Start Free Audit'
              )}
            </motion.button>
          </motion.form>

          <motion.div
            variants={itemVariants}
            style={{
              marginTop: '2rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '2rem',
              flexWrap: 'wrap',
              fontSize: '0.9rem',
              color: '#64748b'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#10b981' }}>✓</span> No credit card required
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#3b82f6' }}>⚡</span> Instant results
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#8b5cf6' }}>🔒</span> Secure & private
            </span>
          </motion.div>

          {/* Additional Features */}
          <motion.div
            variants={itemVariants}
            style={{
              marginTop: '3rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '2rem',
              textAlign: 'left'
            }}
          >
            <div style={{ padding: '1.5rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem', color: '#6366f1' }}>🔍</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1a202c' }}>Technology Stack</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Discover all technologies used by any website</p>
            </div>

            <div style={{ padding: '1.5rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem', color: '#10b981' }}>🛡️</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1a202c' }}>Security Audit</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Check SSL certificates and security headers</p>
            </div>

            <div style={{ padding: '1.5rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem', color: '#f59e0b' }}>🚀</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1a202c' }}>Performance</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Measure load times and performance metrics</p>
            </div>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            variants={itemVariants}
            style={{
              marginTop: '3rem',
              padding: '2rem',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#64748b' }}>
              Trusted by developers and businesses worldwide
            </h3>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '3rem', flexWrap: 'wrap', fontSize: '0.9rem', color: '#94a3b8' }}>
              <span>✓ 10,000+ Audits Completed</span>
              <span>✓ 99.9% Uptime</span>
              <span>✓ Real-time Results</span>
            </div>
          </motion.div>
        </motion.div>
      </section>
    </>
  )
}

export default CTASection