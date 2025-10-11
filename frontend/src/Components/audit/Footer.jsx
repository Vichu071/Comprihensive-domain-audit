import React from 'react'
import { motion } from 'framer-motion'
import { FiGithub, FiTwitter, FiLinkedin, FiMail, FiArrowUp } from 'react-icons/fi'

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const footerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  }

  const socialIconVariants = {
    rest: { scale: 1 },
    hover: { 
      scale: 1.2,
      color: "#00d4ff",
      transition: {
        duration: 0.3
      }
    }
  }

  return (
    <>
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        .footer-link {
          position: relative;
          overflow: hidden;
        }
        
        .footer-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 1px;
          background: linear-gradient(90deg, #00d4ff, #0099ff);
          transition: width 0.3s ease;
        }
        
        .footer-link:hover::after {
          width: 100%;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        
        .floating-emoji {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>

      <motion.footer
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={footerVariants}
        style={{
          background: 'linear-gradient(135deg, #000d1a 0%, #001a33 50%, #000d1a 100%)',
          color: 'white',
          padding: '3rem 0 2rem',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: "'Inter', sans-serif"
        }}
      >
        {/* Background Elements */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(0, 212, 255, 0.1) 0%, transparent 50%)',
        }} />
        
        <div style={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: '100px',
          height: '100px',
          background: 'rgba(0, 212, 255, 0.05)',
          borderRadius: '50%',
          filter: 'blur(20px)'
        }} />

        <div className="container" style={{ 
          position: 'relative', 
          zIndex: 2,
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem'
        }}>
          {/* Main Footer Content */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2.5rem',
            marginBottom: '2.5rem'
          }}>
            {/* Brand Column */}
            <motion.div variants={itemVariants}>
              <motion.div
                style={{
                  fontSize: '1.5rem', // Reduced from 2rem
                  fontWeight: '700',
                  fontFamily: "'Inter', sans-serif",
                  background: 'linear-gradient(45deg, #ffffff, #00d4ff, #0099ff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '1rem',
                  cursor: 'pointer',
                  letterSpacing: '-0.5px'
                }}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                EngagePositive
              </motion.div>
              <motion.p 
                variants={itemVariants}
                style={{ 
                  color: '#94a3b8', 
                  lineHeight: '1.6',
                  marginBottom: '1.5rem',
                  maxWidth: '280px',
                  fontSize: '0.9rem'
                }}
              >
                Your ultimate domain analysis tool for comprehensive security insights, technology stack discovery, and performance optimization.
              </motion.p>
              
              {/* Social Links */}
              <motion.div 
                variants={itemVariants}
                style={{ display: 'flex', gap: '0.8rem' }}
              >
                {[
                  { icon: <FiGithub size={18} />, label: 'GitHub' },
                  { icon: <FiTwitter size={18} />, label: 'Twitter' },
                  { icon: <FiLinkedin size={18} />, label: 'LinkedIn' },
                  { icon: <FiMail size={18} />, label: 'Email' }
                ].map((social, index) => (
                  <motion.a
                    key={social.label}
                    href="#"
                    variants={socialIconVariants}
                    initial="rest"
                    whileHover="hover"
                    animate="rest"
                    style={{
                      color: '#cbd5e1',
                      textDecoration: 'none',
                      padding: '0.5rem',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '40px',
                      height: '40px'
                    }}
                    aria-label={social.label}
                  >
                    {social.icon}
                  </motion.a>
                ))}
              </motion.div>
            </motion.div>

            {/* Quick Links */}
            <motion.div variants={itemVariants}>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                marginBottom: '1.2rem',
                color: 'white',
                fontFamily: "'Inter', sans-serif"
              }}>
                Quick Links
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                {['Features', 'Analytics', 'Security', 'Performance', 'Pricing'].map((link) => (
                  <motion.a
                    key={link}
                    href={`#${link.toLowerCase()}`}
                    className="footer-link"
                    style={{
                      color: '#94a3b8',
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      transition: 'color 0.3s ease',
                      width: 'fit-content'
                    }}
                    whileHover={{ color: '#00d4ff', x: 5 }}
                  >
                    {link}
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Features */}
            <motion.div variants={itemVariants}>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                marginBottom: '1.2rem',
                color: 'white',
                fontFamily: "'Inter', sans-serif"
              }}>
                Features
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                {['WHOIS Analysis', 'Tech Stack', 'Security Audit', 'Email Setup', 'Performance Check', 'Ads Detection'].map((feature) => (
                  <motion.span
                    key={feature}
                    style={{
                      color: '#94a3b8',
                      fontSize: '0.9rem',
                      transition: 'color 0.3s ease',
                      cursor: 'pointer'
                    }}
                    whileHover={{ color: '#00d4ff' }}
                  >
                    {feature}
                  </motion.span>
                ))}
              </div>
            </motion.div>

            {/* Contact Info */}
            <motion.div variants={itemVariants}>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                marginBottom: '1.2rem',
                color: 'white',
                fontFamily: "'Inter', sans-serif"
              }}>
                Get In Touch
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <motion.div 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  whileHover={{ color: '#00d4ff' }}
                >
                  <FiMail size={16} style={{ color: '#00d4ff' }} />
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                    hello@engagepositive.com
                  </span>
                </motion.div>
                <motion.div 
                  style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.5' }}
                  whileHover={{ color: '#00d4ff' }}
                >
                  Always here to help you analyze domains better!
                </motion.div>
                <motion.div 
                  className="floating-emoji"
                  style={{ fontSize: '1.5rem', marginTop: '0.3rem' }}
                >
                  🌟
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Divider */}
          <motion.div
            variants={itemVariants}
            style={{
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.3), transparent)',
              margin: '1.5rem 0'
            }}
          />

          {/* Bottom Bar */}
          <motion.div
            variants={itemVariants}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                &copy; 2025 EngagePositive. Made with 
              </span>
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                style={{ color: '#ef4444', fontSize: '1rem' }}
              >
                ❤️
              </motion.span>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                for the digital world
              </span>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <motion.a
                href="#privacy"
                style={{ color: '#94a3b8', fontSize: '0.85rem', textDecoration: 'none' }}
                whileHover={{ color: '#00d4ff' }}
              >
                Privacy Policy
              </motion.a>
              <motion.a
                href="#terms"
                style={{ color: '#94a3b8', fontSize: '0.85rem', textDecoration: 'none' }}
                whileHover={{ color: '#00d4ff' }}
              >
                Terms of Service
              </motion.a>
              
              {/* Scroll to Top Button */}
              <motion.button
                onClick={scrollToTop}
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(0, 212, 255, 0.2)' }}
                whileTap={{ scale: 0.9 }}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#00d4ff',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
                aria-label="Scroll to top"
              >
                <FiArrowUp />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.footer>
    </>
  )
}

export default Footer