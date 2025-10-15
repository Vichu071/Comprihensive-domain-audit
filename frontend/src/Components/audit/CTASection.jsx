import React from "react";
import { motion } from "framer-motion";

const CTASection = () => {
  return (
    <>
      <style jsx>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");

        section {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6rem 2rem;
          background: #ffffff;
          font-family: "Inter", sans-serif;
          color: #1a202c;
        }

        .cta-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          max-width: 1200px;
          width: 100%;
          align-items: stretch;
        }

        /* LEFT SIDE - IMPROVED STYLING */
        .cta-graphic {
          position: relative;
          border: 1px solid #f1f5f9;
          border-radius: 24px;
          background: linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%);
          background-image: 
            radial-gradient(circle at 25% 25%, rgba(167, 139, 250, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(99, 102, 241, 0.08) 0%, transparent 50%);
          box-shadow: 
            0 8px 40px rgba(126, 34, 206, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 500px;
          overflow: hidden;
        }

        /* Glow background - improved */
        .glow-bg {
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle at center, rgba(167, 139, 250, 0.15) 0%, transparent 70%);
          z-index: 0;
          filter: blur(40px);
        }

        /* Center text (brand) - smaller and improved */
        .brand-center {
          position: absolute;
          z-index: 10;
          font-weight: 800;
          font-size: 1.8rem;
          color: transparent;
          background: linear-gradient(135deg, #7e22ce 0%, #6366f1 100%);
          -webkit-background-clip: text;
          background-clip: text;
          letter-spacing: -0.5px;
          text-shadow: 0 2px 10px rgba(126, 34, 206, 0.15);
        }

        /* Orbits container */
        .orbit-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .orbit {
          position: absolute;
          border-radius: 50%;
          border: 1px dashed rgba(99, 102, 241, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .orbit-outer {
          width: 420px;
          height: 420px;
        }

        .orbit-inner {
          width: 260px;
          height: 260px;
          border-style: solid;
          border-color: rgba(99, 102, 241, 0.15);
        }

        /* Floating badges - improved styling */
        .badge {
          position: absolute;
          width: 70px;
          height: 70px;
          background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
          border-radius: 18px;
          box-shadow: 
            0 4px 20px rgba(0, 0, 0, 0.08),
            0 2px 4px rgba(0, 0, 0, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.75rem;
          color: #4f46e5;
          z-index: 5;
          border: 1px solid rgba(255, 255, 255, 0.8);
          transition: all 0.3s ease;
        }

        .badge:hover {
          transform: scale(1.05);
          box-shadow: 
            0 6px 25px rgba(0, 0, 0, 0.12),
            0 3px 6px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }

        /* RIGHT SIDE - IMPROVED TYPOGRAPHY */
        .cta-content {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .cta-content h2 {
          color: #6366f1;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.9rem;
          margin-bottom: 0.75rem;
          letter-spacing: 1px;
        }

        .cta-content h3 {
          font-size: 2.2rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 1.25rem;
          line-height: 1.25;
          letter-spacing: -0.5px;
        }

        .cta-content p {
          color: #4b5563;
          font-size: 1.05rem;
          margin-bottom: 2.5rem;
          line-height: 1.7;
          max-width: 600px;
          font-weight: 400;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 2rem;
        }

        .feature h4 {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 600;
          color: #111827;
          font-size: 1.05rem;
          margin-bottom: 0.5rem;
        }

        .feature p {
          font-size: 0.95rem;
          color: #6b7280;
          line-height: 1.6;
          margin-bottom: 0;
          font-weight: 400;
        }

        /* Responsive Design */
        @media (max-width: 992px) {
          .cta-container {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 3rem;
          }
          .cta-content h3 {
            font-size: 2rem;
          }
          .cta-content p {
            font-size: 1rem;
            margin: 0 auto 2rem;
          }
          .cta-graphic {
            margin-bottom: 2rem;
            min-height: 400px;
          }
          .features-grid {
            text-align: left;
          }
        }

        @media (max-width: 768px) {
          section {
            padding: 4rem 1.5rem;
          }
          .cta-content h3 {
            font-size: 1.8rem;
          }
          .brand-center {
            font-size: 1.6rem;
          }
        }

        @media (max-width: 600px) {
          .orbit-outer {
            width: 300px;
            height: 300px;
          }
          .orbit-inner {
            width: 200px;
            height: 200px;
          }
          .badge {
            width: 60px;
            height: 60px;
            font-size: 0.7rem;
            border-radius: 14px;
          }
          .features-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }
      `}</style>

      <section>
        <div className="cta-container">
          {/* LEFT SIDE */}
          <div className="cta-graphic">
            <div className="glow-bg"></div>

            {/* Center Brand */}
            <div className="brand-center">EngagePro</div>

            <div className="orbit-container">
              {/* Outer Orbit */}
              <motion.div
                className="orbit orbit-outer"
                animate={{ rotate: 360 }}
                transition={{ duration: 25, ease: "linear", repeat: Infinity }}
              >
                <motion.div 
                  className="badge"
                  style={{ 
                    top: "-35px", 
                    left: "calc(50% - 35px)"
                  }}
                >
                  Hosting
                </motion.div>
                <motion.div 
                  className="badge"
                  style={{ 
                    top: "calc(50% - 35px)", 
                    right: "-35px"
                  }}
                >
                  DNS
                </motion.div>
                <motion.div 
                  className="badge"
                  style={{ 
                    bottom: "-35px", 
                    left: "calc(50% - 35px)"
                  }}
                >
                  SSL
                </motion.div>
                <motion.div 
                  className="badge"
                  style={{ 
                    top: "calc(50% - 35px)", 
                    left: "-35px"
                  }}
                >
                  Expiry
                </motion.div>
              </motion.div>

              {/* Inner Orbit */}
              <motion.div
                className="orbit orbit-inner"
                animate={{ rotate: -360 }}
                transition={{ duration: 18, ease: "linear", repeat: Infinity }}
              >
                <motion.div 
                  className="badge"
                  style={{ 
                    top: "-35px", 
                    left: "calc(50% - 35px)"
                  }}
                >
                  Tech
                </motion.div>
                <motion.div 
                  className="badge"
                  style={{ 
                    top: "calc(50% - 35px)", 
                    right: "-35px"
                  }}
                >
                  WP
                </motion.div>
                <motion.div 
                  className="badge"
                  style={{ 
                    bottom: "-35px", 
                    left: "calc(50% - 35px)"
                  }}
                >
                  Email
                </motion.div>
                <motion.div 
                  className="badge"
                  style={{ 
                    top: "calc(50% - 35px)", 
                    left: "-35px"
                  }}
                >
                  Perf
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="cta-content">
            <h2>DOMAIN AUDIT TOOL</h2>
            <h3>Deep Intelligence for Every Website</h3>
            <p>
              Instantly analyze any domain — from hosting details and SSL security
              to technology stack, WordPress version, theme, email setup, and load
              performance. Discover vulnerabilities, outdated tools, and optimization
              insights within seconds.
            </p>

            <div className="features-grid">
              <div className="feature">
                <h4>🧠 Smart Tech Detection</h4>
                <p>Identify CMS platforms, frameworks, and integrations running behind any domain in real time.</p>
              </div>

              <div className="feature">
                <h4>⚙️ Hosting & SSL Insights</h4>
                <p>Uncover hosting providers, DNS records, and SSL configurations with instant accuracy.</p>
              </div>

              <div className="feature">
                <h4>🛡️ Security & Updates</h4>
                <p>Detect outdated WordPress versions, themes, or plugins — and uncover possible security gaps.</p>
              </div>

              <div className="feature">
                <h4>🚀 Load & Performance</h4>
                <p>Measure page speed, uptime, and optimization metrics that directly impact SEO and user trust.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default CTASection;
