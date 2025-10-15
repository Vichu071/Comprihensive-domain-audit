import React, { useState, useEffect } from "react";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const menus = ["Dashboard", "Features", "Pricing", "Docs", "Contact"];

  return (
    <>
      <style jsx>{`
        @import url("https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap");

        nav {
          position: fixed;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 1200px;
          z-index: 999;
          font-family: "Outfit", sans-serif;
          background: ${isScrolled
            ? "rgba(255, 255, 255, 0.95)"
            : "transparent"};
          border-radius: ${isScrolled ? "50px" : "0"};
          box-shadow: ${isScrolled
            ? "0 10px 25px rgba(0, 0, 0, 0.08)"
            : "none"};
          transition: all 0.6s ease;
          padding: ${isScrolled ? "0.7rem 2rem" : "1.5rem 3rem"};
          margin-top: ${isScrolled ? "15px" : "0"};
          backdrop-filter: ${isScrolled ? "blur(10px)" : "none"};
        }

        .nav-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
        }

        .brand {
          font-size: 1.4rem;
          font-weight: 700;
          letter-spacing: 0.4px;
          background: ${isScrolled
            ? "linear-gradient(90deg, #7b2ff7, #f107a3)"
            : "linear-gradient(90deg, #ffffff, #f1f1f1)"};
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          transition: all 0.6s ease;
          opacity: ${isScrolled ? "0" : "1"};
          transform: ${isScrolled ? "translateY(-10px)" : "translateY(0)"};
        }

        .quote {
          position: absolute;
          left: 2rem;
          font-size: 1.05rem;
          font-weight: 500;
          color: ${isScrolled ? "rgba(123, 47, 247, 0.9)" : "transparent"};
          opacity: ${isScrolled ? "1" : "0"};
          transition: all 0.6s ease;
          transform: ${isScrolled ? "translateY(0)" : "translateY(10px)"};
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 2rem;
          transition: all 0.3s ease;
        }

        .nav-link {
          color: ${isScrolled ? "#333" : "#fff"};
          text-decoration: none;
          font-weight: 500;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          position: relative;
        }

        .nav-link::after {
          content: "";
          position: absolute;
          bottom: -4px;
          left: 50%;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #7b2ff7, #f107a3);
          transform: translateX(-50%);
          transition: width 0.3s ease;
        }

        .nav-link:hover::after {
          width: 100%;
        }

        .nav-link:hover {
          color: ${isScrolled ? "#7b2ff7" : "#fff"};
        }

        .cta-btn {
          background: ${isScrolled
            ? "linear-gradient(90deg, #7b2ff7, #f107a3)"
            : "rgba(255,255,255,0.15)"};
          color: #fff;
          border: none;
          border-radius: 40px;
          padding: 0.5rem 1.3rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          border: ${isScrolled ? "none" : "1px solid rgba(255,255,255,0.4)"};
        }

        .cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(123, 47, 247, 0.3);
        }

        /* Hamburger */
        .hamburger {
          display: none;
          flex-direction: column;
          cursor: pointer;
          gap: 5px;
          z-index: 1001;
        }

        .hamburger span {
          width: 25px;
          height: 2px;
          background: ${isScrolled ? "#333" : "#fff"};
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        /* Mobile Menu */
        .mobile-menu {
          display: none;
          flex-direction: column;
          align-items: center;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 20px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          position: absolute;
          top: 70px;
          right: 2rem;
          padding: 1rem 2rem;
          transition: all 0.4s ease;
          animation: fadeIn 0.4s ease;
        }

        .mobile-link {
          color: #333;
          text-decoration: none;
          margin: 0.6rem 0;
          font-weight: 500;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 900px) {
          .nav-links {
            display: none;
          }
          .hamburger {
            display: flex;
          }
          .mobile-menu {
            display: ${menuOpen ? "flex" : "none"};
          }
          .quote {
            left: 1rem;
            font-size: 0.9rem;
          }
          nav {
            padding: ${isScrolled ? "0.6rem 1.5rem" : "1.2rem 1.5rem"};
          }
          .brand {
            font-size: 1.3rem;
          }
        }

        @media (max-width: 500px) {
          .brand {
            font-size: 1.15rem;
          }
          .cta-btn {
            padding: 0.4rem 1rem;
          }
          .quote {
            font-size: 0.85rem;
          }
        }
      `}</style>

      <nav>
        <div className="nav-container">
          <div className="quote">Empower Your Domain</div>

          <div className="brand">EngagePro</div>

          <div className="nav-links">
            {menus.map((menu) => (
              <a href={`#${menu.toLowerCase()}`} key={menu} className="nav-link">
                {menu}
              </a>
            ))}
            <button className="cta-btn">Run Audit</button>
          </div>

          <div
            className="hamburger"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>

          <div className="mobile-menu">
            {menus.map((menu) => (
              <a
                href={`#${menu.toLowerCase()}`}
                key={menu}
                className="mobile-link"
                onClick={() => setMenuOpen(false)}
              >
                {menu}
              </a>
            ))}
            <button className="cta-btn" onClick={() => setMenuOpen(false)}>
              Run Audit
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
