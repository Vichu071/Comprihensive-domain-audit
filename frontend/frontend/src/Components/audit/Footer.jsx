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

        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          /* Footer padding */
          footer {
            padding: 2rem 0 1.5rem !important;
          }

          /* Container padding */
          .container {
            padding: 0 1rem !important;
          }

          /* Grid layout - single column on mobile */
          .footer-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
            text-align: center;
          }

          /* Brand section */
          .brand-section {
            text-align: center !important;
            margin: 0 auto;
          }

          .brand-section p {
            margin: 1rem auto !important;
            max-width: 100% !important;
          }

          /* Social links */
          .social-links {
            justify-content: center !important;
            margin-top: 1rem;
          }

          /* Section headings */
          .section-heading {
            font-size: 1.1rem !important;
            margin-bottom: 1rem !important;
            text-align: center;
          }

          /* Links and features columns */
          .links-column,
          .features-column,
          .contact-column {
            text-align: center;
          }

          .links-column div,
          .features-column div {
            align-items: center !important;
          }

          /* Contact info */
          .contact-info {
            align-items: center !important;
            text-align: center;
          }

          /* Bottom bar */
          .bottom-bar {
            flex-direction: column !important;
            gap: 1rem !important;
            text-align: center;
          }

          /* Legal links */
          .legal-links {
            justify-content: center !important;
            gap: 1rem !important;
          }

          /* Scroll to top button */
          .scroll-top {
            margin-top: 0.5rem;
          }

          /* Background elements - reduce on mobile */
          .background-element {
            display: none;
          }
        }

        @media (max-width: 480px) {
          /* Extra small devices */
          footer {
            padding: 1.5rem 0 1rem !important;
          }

          .container {
            padding: 0 0.8rem !important;
          }

          .footer-grid {
            gap: 1.5rem !important;
          }

          .brand-section {
            font-size: 1.3rem !important;
          }

          .section-heading {
            font-size: 1rem !important;
          }

          /* Social links size */
          .social-links a {
            width: 36px !important;
            height: 36px !important;
          }

          /* Legal links stack vertically */
          .legal-links {
            flex-direction: column;
            gap: 0.5rem !important;
          }

          /* Copyright text */
          .copyright {
            font-size: 0.8rem !important;
            line-height: 1.4 !important;
          }
        }

        /* Tablet responsive styles */
        @media (min-width: 769px) and (max-width: 1024px) {
          .footer-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 2rem !important;
          }

          .brand-section {
            grid-column: 1 / -1;
            text-align: center;
          }

          .brand-section p {
            margin: 1rem auto !important;
          }

          .social-links {
            justify-content: center !important;
          }
        }

        /* Large desktop adjustments */
        @media (min-width: 1440px) {
          footer {
            padding: 4rem 0 2.5rem !important;
          }

          .footer-grid {
            gap: 3rem !important;
          }
        }

        /* Touch device optimizations */
        @media (max-width: 768px) {
          /* Increase touch targets */
          .footer-link,
          .social-links a,
          .scroll-top {
            min-height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          /* Simplify hover effects for touch */
          .footer-link:hover::after {
            width: 0;
          }

          /* Active state for touch feedback */
          .footer-link:active,
          .social-links a:active {
            transform: scale(0.95);
            color: #00d4ff !important;
          }

          .scroll-top:active {
            transform: scale(0.9);
          }

          /* Reduce animations for performance */
          .floating-emoji {
            animation: none;
          }
        }

        /* Improve readability on small screens */
        @media (max-width: 768px) {
          .footer-link {
            line-height: 1.5;
          }

          .brand-section p {
            line-height: 1.6;
          }
        }

        /* Prevent horizontal scrolling */
        @media (max-width: 768px) {
          .footer-grid {
            width: 100%;
            box-sizing: border-box;
          }
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
        <div className="background-element" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(0, 212, 255, 0.1) 0%, transparent 50%)',
        }} />
        
        <div className="background-element" style={{
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
          <div className="footer-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2.5rem',
            marginBottom: '2.5rem'
          }}>
            {/* Brand Column */}
            <motion.div variants={itemVariants} className="brand-section">
              <motion.div
                style={{
                  fontSize: '1.5rem',
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
                className="social-links"
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
            <motion.div variants={itemVariants} className="links-column">
              <h3 className="section-heading" style={{
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
            <motion.div variants={itemVariants} className="features-column">
              <h3 className="section-heading" style={{
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
            <motion.div variants={itemVariants} className="contact-column">
              <h3 className="section-heading" style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                marginBottom: '1.2rem',
                color: 'white',
                fontFamily: "'Inter', sans-serif"
              }}>
                Get In Touch
              </h3>
              <div className="contact-info" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
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
            className="bottom-bar"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div className="copyright" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
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

            <div className="legal-links" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
                className="scroll-top"
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