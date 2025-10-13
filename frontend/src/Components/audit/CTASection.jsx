import React from 'react'
import { motion } from 'framer-motion'

const CTASection = ({ onAudit }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        duration: 0.8
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  }

  const floatAnimation = {
    y: [-10, 10, -10],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }

  const pulseGlow = {
    scale: [1, 1.05, 1],
    boxShadow: [
      "0 0 0 0 rgba(102, 126, 234, 0.4)",
      "0 0 0 20px rgba(102, 126, 234, 0)",
      "0 0 0 0 rgba(102, 126, 234, 0)"
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeOut"
    }
  }

  const scrollToHero = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const proFeatures = [
    "Advanced Technology Detection",
    "Competitive Analysis Reports", 
    "Historical Data & Trends",
    "API Access",
    "Priority Support",
    "Custom Reporting",
    "Bulk Domain Analysis",
    "White-label Reports"
  ]

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

        .audit-button {
          padding: 1.2rem 3rem;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          border-radius: 16px;
          font-size: 1.2rem;
          font-weight: 600;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          transition: all 0.3s ease;
        }

        .audit-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 25px rgba(102, 126, 234, 0.3);
        }

        .pro-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.8) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 24px;
          padding: 2.5rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
        }

        .pro-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #667eea, #764ba2);
        }

        .feature-item {
          display: flex;
          align-items: center;
          padding: 0.5rem 0;
          color: #475569;
          font-weight: 500;
        }

        .checkmark {
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .checkmark::before {
          content: '✓';
          color: white;
          font-size: 12px;
          font-weight: bold;
        }

        .price-tag {
          font-size: 3rem;
          font-weight: 800;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 1rem 0;
        }

        .pro-button {
          width: 100%;
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 1.5rem;
        }

        .pro-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        /* Mobile Styles */
        @media (max-width: 768px) {
          .audit-button {
            padding: 1rem 2rem;
            font-size: 1.1rem;
            width: 100%;
            max-width: 300px;
          }

          .pro-card {
            padding: 1.5rem;
            border-radius: 20px;
          }

          .price-tag {
            font-size: 2.5rem;
          }

          .feature-item {
            font-size: 0.9rem;
            padding: 0.4rem 0;
          }

          .checkmark {
            width: 18px;
            height: 18px;
            margin-right: 10px;
          }

          .pro-button {
            padding: 0.9rem 1.5rem;
            font-size: 1rem;
          }
        }

        @media (max-width: 480px) {
          .audit-button {
            padding: 0.9rem 1.5rem;
            font-size: 1rem;
            border-radius: 12px;
          }

          .pro-card {
            padding: 1.25rem;
            border-radius: 16px;
          }

          .price-tag {
            font-size: 2rem;
          }

          .feature-item {
            font-size: 0.85rem;
          }

          .checkmark {
            width: 16px;
            height: 16px;
            margin-right: 8px;
          }

          .checkmark::before {
            font-size: 10px;
          }
        }
      `}</style>

      <section
        style={{
          padding: '4rem 0',
          background: 'radial-gradient(circle at 50% 50%, rgba(102, 126, 234, 0.05) 0%, transparent 50%), linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          fontFamily: "'Inter', sans-serif",
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background Elements - Reduced on mobile */}
        <motion.div
          animate={floatAnimation}
          style={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            filter: 'blur(20px)'
          }}
        />
        <motion.div
          animate={floatAnimation}
          transition={{ delay: 1 }}
          style={{
            position: 'absolute',
            bottom: '30%',
            right: '15%',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
            filter: 'blur(25px)'
          }}
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 1rem',
            position: 'relative',
            zIndex: 2
          }}
        >
          {/* Main Heading */}
          <motion.div variants={itemVariants}>
            <motion.h2
              style={{
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                fontWeight: '800',
                marginBottom: '1.5rem',
                color: '#1a202c',
                lineHeight: '1.1',
                letterSpacing: '-0.02em',
                padding: '0 0.5rem'
              }}
            >
              Ready to{' '}
              <span className="gradient-text" style={{ display: 'block', marginTop: '0.5rem' }}>
                Transform Your Digital Presence?
              </span>
            </motion.h2>
          </motion.div>

          {/* Subheading */}
          <motion.div variants={itemVariants}>
            <motion.p
              style={{
                fontSize: 'clamp(1rem, 3vw, 1.3rem)',
                color: '#64748b',
                marginBottom: '3rem',
                lineHeight: '1.6',
                maxWidth: '600px',
                margin: '0 auto 3rem auto',
                padding: '0 1rem'
              }}
            >
              Start with our free audit or unlock advanced features with Pro for comprehensive insights.
            </motion.p>
          </motion.div>

          {/* CTA Button */}
          <motion.div variants={itemVariants}>
            <motion.button
              whileHover={{ 
                scale: 1.05,
                y: -2
              }}
              whileTap={{ scale: 0.98 }}
              animate={pulseGlow}
              className="audit-button"
              onClick={scrollToHero}
              style={{
                marginBottom: '3rem'
              }}
            >
              Start Your Free Audit Now
            </motion.button>
          </motion.div>

          {/* Pro Features Pricing */}
          <motion.div
            variants={itemVariants}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
              gap: '2rem',
              alignItems: 'start',
              maxWidth: '900px',
              margin: '0 auto'
            }}
          >
            {/* Free Plan */}
            <motion.div
              className="pro-card"
              whileHover={{ y: -5 }}
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.7) 100%)'
              }}
            >
              <h3 style={{ 
                fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', 
                fontWeight: '700', 
                marginBottom: '1rem',
                color: '#1a202c'
              }}>
                Free Plan
              </h3>
              <div style={{ 
                fontSize: 'clamp(1.75rem, 5vw, 2rem)', 
                fontWeight: '800', 
                color: '#64748b',
                margin: '1rem 0'
              }}>
                $0
              </div>
              <p style={{ 
                color: '#64748b', 
                marginBottom: '2rem',
                fontSize: 'clamp(0.9rem, 3vw, 1rem)'
              }}>
                Perfect for getting started
              </p>
              
              <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
                <div className="feature-item">
                  <div className="checkmark" />
                  Basic Technology Stack Analysis
                </div>
                <div className="feature-item">
                  <div className="checkmark" />
                  Essential Security Check
                </div>
                <div className="feature-item">
                  <div className="checkmark" />
                  Performance Overview
                </div>
                <div className="feature-item">
                  <div className="checkmark" />
                  5 Audits per Month
                </div>
              </div>

              <motion.button
                className="audit-button"
                onClick={scrollToHero}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%',
                  background: 'rgba(102, 126, 234, 0.1)',
                  color: '#667eea',
                  border: '2px solid #667eea',
                  fontSize: 'clamp(1rem, 3vw, 1.1rem)'
                }}
              >
                Get Started Free
              </motion.button>
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              className="pro-card"
              whileHover={{ y: -5 }}
              style={{
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                border: '2px solid rgba(102, 126, 234, 0.2)'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                padding: '0.4rem 0.8rem',
                borderRadius: '20px',
                fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                fontWeight: '600'
              }}>
                MOST POPULAR
              </div>

              <h3 style={{ 
                fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', 
                fontWeight: '700', 
                marginBottom: '1rem',
                color: '#1a202c'
              }}>
                Pro Plan
              </h3>
              <div className="price-tag" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)' }}>
                $29<span style={{ fontSize: 'clamp(0.8rem, 2.5vw, 1rem)', color: '#64748b' }}>/month</span>
              </div>
              <p style={{ 
                color: '#64748b', 
                marginBottom: '2rem',
                fontSize: 'clamp(0.9rem, 3vw, 1rem)'
              }}>
                Advanced features for professionals
              </p>
              
              <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
                {proFeatures.map((feature, index) => (
                  <div key={index} className="feature-item">
                    <div className="checkmark" />
                    {feature}
                  </div>
                ))}
              </div>

              <button className="pro-button" style={{ fontSize: 'clamp(1rem, 3vw, 1.1rem)' }}>
                Upgrade to Pro
              </button>
            </motion.div>
          </motion.div>

          {/* Bottom CTA */}
          <motion.div
            variants={itemVariants}
            style={{
              marginTop: '3rem',
              padding: '1.5rem 1rem',
              color: '#64748b',
              fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)'
            }}
          >
            <p style={{ margin: 0, lineHeight: '1.5' }}>
              No credit card required for free plan • Cancel anytime • 30-day money-back guarantee
            </p>
          </motion.div>
        </motion.div>
      </section>
    </>
  )
}

export default CTASection
