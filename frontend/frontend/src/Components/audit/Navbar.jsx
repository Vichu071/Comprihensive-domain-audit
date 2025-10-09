import React, { useState, useEffect } from "react";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      const sections = ["home", "features", "cta", "contact"];
      const current = sections.find((section) => {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });

      if (current) setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (sectionId) => {
    setActiveSection(sectionId);
    setIsMobileMenuOpen(false);
    const el = document.getElementById(sectionId);
    if (el) {
      const offsetTop = el.offsetTop - 80;
      window.scrollTo({ top: offsetTop, behavior: "smooth" });
    }
  };

  const navItems = [
    { id: "home", label: "Home" },
    { id: "features", label: "Features" },
    { id: "cta", label: "Get Started" },
    { id: "contact", label: "Contact" },
  ];

  return (
    <>
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

        .nav-link {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .nav-link::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #b066ff, #8a2be2);
          transition: all 0.3s ease;
          transform: translateX(-50%);
        }

        .nav-link:hover::after,
        .nav-link.active::after {
          width: 100%;
        }

        .mobile-menu {
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-20px);
          }
        }

        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          /* Navbar container */
          nav {
            padding: 0.6rem 0 !important;
          }

          /* Logo size reduction */
          nav > div > div:first-child {
            font-size: 1.3rem !important;
          }

          /* Desktop nav hide */
          .desktop-nav {
            display: none !important;
          }

          /* Mobile menu button adjustments */
          .mobile-menu-btn {
            display: flex !important;
            width: 32px !important;
            height: 32px !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
            gap: 4px !important;
          }

          /* Hamburger animation */
          .hamburger-active span:nth-child(1) {
            transform: rotate(45deg) translate(6px, 6px) !important;
          }

          .hamburger-active span:nth-child(2) {
            opacity: 0 !important;
          }

          .hamburger-active span:nth-child(3) {
            transform: rotate(-45deg) translate(6px, -6px) !important;
          }

          /* Mobile menu styling */
          .mobile-menu {
            position: fixed !important;
            top: 60px !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            background: rgba(10, 5, 25, 0.98) !important;
            backdrop-filter: blur(30px) !important;
            border-top: 1px solid rgba(138, 43, 226, 0.3) !important;
            padding: 2rem 0 !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: flex-start !important;
            gap: 1.5rem !important;
            height: calc(100vh - 60px) !important;
            overflow-y: auto !important;
            z-index: 999;
          }

          /* Mobile menu links */
          .mobile-menu a {
            font-size: 1.3rem !important;
            padding: 1rem 2rem !important;
            width: 80%;
            text-align: center;
            border-radius: 12px !important;
            border: 1px solid rgba(138, 43, 226, 0.3);
            transition: all 0.3s ease;
          }

          .mobile-menu a:hover {
            background: rgba(138, 43, 226, 0.2) !important;
            transform: translateY(-2px);
          }

          /* Container padding adjustment */
          nav > div {
            padding: 0 1rem !important;
          }

          /* Spacer adjustment for mobile */
          .nav-spacer {
            height: 60px !important;
          }
        }

        /* Tablet responsive styles */
        @media (min-width: 769px) and (max-width: 1024px) {
          /* Navbar container */
          nav {
            padding: 0.7rem 0 !important;
          }

          /* Logo size adjustment */
          nav > div > div:first-child {
            font-size: 1.5rem !important;
          }

          /* Desktop nav adjustments */
          .desktop-nav {
            gap: 1.5rem !important;
          }

          .desktop-nav a {
            font-size: 0.95rem !important;
            padding: 0.5rem 0.8rem !important;
          }

          /* Container padding */
          nav > div {
            padding: 0 1.2rem !important;
          }

          /* Hide mobile menu button on tablet */
          .mobile-menu-btn {
            display: none !important;
          }
        }

        /* Small mobile devices */
        @media (max-width: 480px) {
          /* Further reduce logo size */
          nav > div > div:first-child {
            font-size: 1.2rem !important;
          }

          /* Mobile menu links adjustment */
          .mobile-menu a {
            font-size: 1.2rem !important;
            padding: 0.9rem 1.5rem !important;
            width: 85%;
          }

          /* Container padding */
          nav > div {
            padding: 0 0.8rem !important;
          }

          /* Mobile menu button size */
          .mobile-menu-btn {
            width: 30px !important;
            height: 30px !important;
          }
        }

        /* Large desktop adjustments */
        @media (min-width: 1440px) {
          .desktop-nav {
            gap: 2.5rem !important;
          }

          .desktop-nav a {
            font-size: 1.1rem !important;
          }
        }

        /* Touch device optimizations */
        @media (max-width: 768px) {
          /* Increase touch targets */
          .mobile-menu-btn,
          .mobile-menu a,
          nav > div > div:first-child {
            min-height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          /* Smooth transitions */
          .mobile-menu-btn span {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          /* Active state feedback */
          .mobile-menu a:active {
            transform: scale(0.98);
            background: rgba(138, 43, 226, 0.25) !important;
          }
        }

        /* Prevent horizontal scrolling */
        @media (max-width: 768px) {
          html, body {
            overflow-x: hidden;
          }

          nav {
            width: 100%;
            box-sizing: border-box;
          }
        }

        /* Enhanced hover effects for desktop */
        @media (min-width: 769px) {
          .desktop-nav a:hover {
            color: #b066ff !important;
            transform: translateY(-1px);
          }

          nav > div > div:first-child:hover {
            transform: scale(1.05);
          }
        }

        @media (min-width: 769px) {
          .mobile-menu-btn {
            display: none !important;
          }
        }
      `}</style>

      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: isScrolled
            ? "rgba(10, 5, 25, 0.95)"
            : "rgba(10, 5, 25, 0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: isScrolled
            ? "1px solid rgba(138, 43, 226, 0.2)"
            : "1px solid rgba(255,255,255,0.1)",
          padding: "0.8rem 0",
          transition: "all 0.4s ease",
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Logo */}
          <div
            style={{
              fontSize: "1.6rem",
              fontWeight: "700",
              background: "linear-gradient(135deg, #b066ff, #8a2be2)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              cursor: "pointer",
              letterSpacing: "0.5px",
              transition: "all 0.3s ease",
              padding: "0.5rem 0",
            }}
            onClick={() => handleNavClick("home")}
          >
            EngagePro
          </div>

          {/* Desktop Nav */}
          <div
            className="desktop-nav"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2rem",
            }}
          >
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`nav-link ${activeSection === item.id ? "active" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.id);
                }}
                style={{
                  color:
                    activeSection === item.id
                      ? "#b066ff"
                      : "rgba(255,255,255,0.9)",
                  textDecoration: "none",
                  fontWeight: activeSection === item.id ? "600" : "500",
                  fontSize: "1rem",
                  transition: "all 0.3s ease",
                  padding: "0.5rem 0",
                }}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Mobile Hamburger */}
          <button
            className={`hamburger mobile-menu-btn ${isMobileMenuOpen ? "hamburger-active" : ""}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              flexDirection: "column",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0.5rem",
              width: "32px",
              height: "32px",
              justifyContent: "center",
              alignItems: "center",
              gap: "4px",
              transition: "all 0.3s ease",
              display: "none"
            }}
          >
            <span style={{
              display: "block",
              width: "100%",
              height: "2px",
              background: "white",
              borderRadius: "2px",
              transition: "all 0.3s ease",
            }}></span>
            <span style={{
              display: "block",
              width: "100%",
              height: "2px",
              background: "white",
              borderRadius: "2px",
              transition: "all 0.3s ease",
            }}></span>
            <span style={{
              display: "block",
              width: "100%",
              height: "2px",
              background: "white",
              borderRadius: "2px",
              transition: "all 0.3s ease",
            }}></span>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div
            className="mobile-menu"
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "rgba(10, 5, 25, 0.98)",
              backdropFilter: "blur(25px)",
              borderTop: "1px solid rgba(138, 43, 226, 0.2)",
              padding: "2rem 0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1.5rem",
            }}
          >
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.id);
                }}
                style={{
                  color:
                    activeSection === item.id
                      ? "#b066ff"
                      : "rgba(255,255,255,0.9)",
                  textDecoration: "none",
                  fontWeight: "500",
                  fontSize: "1.2rem",
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  background:
                    activeSection === item.id
                      ? "rgba(138, 43, 226, 0.15)"
                      : "transparent",
                  transition: "all 0.3s ease",
                }}
              >
                {item.label}
              </a>
            ))}
          </div>
        )}
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="nav-spacer" style={{ height: "70px" }} />
    </>
  );
};

export default Navbar;