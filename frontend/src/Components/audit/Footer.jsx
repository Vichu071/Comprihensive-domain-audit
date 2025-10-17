import React from "react";
import { motion } from "framer-motion";
import { FiLinkedin, FiTwitter, FiGithub, FiArrowUp } from "react-icons/fi";

const Footer = () => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const scrollToSection = (id) => {
    const element = document.querySelector(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <style jsx>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");

        .footer {
          background: radial-gradient(
              circle at top left,
              rgba(100, 0, 255, 0.2),
              transparent 60%
            ),
            radial-gradient(
              circle at bottom right,
              rgba(0, 200, 255, 0.2),
              transparent 60%
            ),
            linear-gradient(180deg, #0b011a 0%, #120331 50%, #0b011a 100%);
          color: #cbd5e1;
          padding: 4rem 2rem 2rem;
          font-family: "Inter", sans-serif;
          position: relative;
          overflow: hidden;
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 3rem;
        }

        .footer h3 {
          color: #ffffff;
          font-weight: 600;
          font-size: 1.1rem;
          margin-bottom: 1rem;
        }

        .footer p {
          line-height: 1.6;
          color: #a1a1b5;
          font-size: 0.9rem;
        }

        .footer a {
          color: #a1a1b5;
          text-decoration: none;
          font-size: 0.9rem;
          display: block;
          margin-bottom: 0.6rem;
          transition: color 0.3s ease;
        }

        .footer a:hover {
          color: #00d4ff;
        }

        .footer-logo {
          font-size: 1.6rem;
          font-weight: 700;
          background: linear-gradient(45deg, #ffffff, #00d4ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 1rem;
        }

        .social-icons {
          display: flex;
          gap: 0.8rem;
          margin-top: 1rem;
        }

        .social-icons a {
          color: #cbd5e1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .social-icons a:hover {
          color: #00d4ff;
          transform: scale(1.1);
          border-color: rgba(0, 212, 255, 0.5);
        }

        .divider {
          height: 1px;
          margin: 2rem 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(0, 212, 255, 0.3),
            transparent
          );
        }

        .bottom-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          font-size: 0.85rem;
          color: #94a3b8;
        }

        .scroll-top-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(0, 212, 255, 0.3);
          border-radius: 50%;
          width: 36px;
          height: 36px;
          color: #00d4ff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .scroll-top-btn:hover {
          transform: scale(1.1);
          background-color: rgba(0, 212, 255, 0.15);
        }

        @media (max-width: 768px) {
          .footer-container {
            text-align: center;
          }
          .social-icons {
            justify-content: center;
          }
          .bottom-bar {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>

      <footer className="footer">
        <div className="footer-container">
          {/* Brand Column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="footer-logo">EngagePro Tool</div>
            <p>
              The ultimate AI-powered domain audit tool delivering insights on
              technology stacks, SEO, and performance to strengthen your
              website’s presence.
            </p>
            <div className="social-icons">
              <a href="#" aria-label="GitHub">
                <FiGithub />
              </a>
              <a href="#" aria-label="Twitter">
                <FiTwitter />
              </a>
              <a href="#" aria-label="LinkedIn">
                <FiLinkedin />
              </a>
            </div>
          </motion.div>

          {/* Company */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <h3>Company</h3>
            <a href="#about" onClick={() => scrollToSection("#about")}>
              About Us
            </a>
            <a href="#careers" onClick={() => scrollToSection("#careers")}>
              Careers
            </a>
            <a href="#blog" onClick={() => scrollToSection("#blog")}>
              Blog
            </a>
            <a href="#contact" onClick={() => scrollToSection("#contact")}>
              Contact
            </a>
          </motion.div>

          {/* Platform */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h3>Platform</h3>
            <a href="#features" onClick={() => scrollToSection("#features")}>
              Features
            </a>
            <a href="#security" onClick={() => scrollToSection("#security")}>
              Security
            </a>
            <a href="#insights" onClick={() => scrollToSection("#insights")}>
              Insights
            </a>
            <a href="#status" onClick={() => scrollToSection("#status")}>
              System Status
            </a>
          </motion.div>

          {/* Resources */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <h3>Resources</h3>
            <a href="#docs" onClick={() => scrollToSection("#docs")}>
              Documentation
            </a>
            <a href="#api" onClick={() => scrollToSection("#api")}>
              API Access
            </a>
            <a href="#support" onClick={() => scrollToSection("#support")}>
              Help Center
            </a>
            <a href="#privacy" onClick={() => scrollToSection("#privacy")}>
              Privacy Policy
            </a>
          </motion.div>
        </div>

        <div className="divider"></div>

        {/* Bottom Bar */}
        <div className="bottom-bar">
          <div>
            Powered by <span style={{ color: "#00d4ff" }}>Erproots</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <span>© 2025 EngagePositive. All rights reserved.</span>
            <button className="scroll-top-btn" onClick={scrollToTop}>
              <FiArrowUp />
            </button>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
