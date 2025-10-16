import React from "react";

const Contact = () => {
  const handleRedirect = () => {
    const hero = document.getElementById("hero");
    if (hero) {
      hero.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.location.href = "/#hero";
    }
  };

  return (
    <>
      <style>{`
        .contact-section {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #6a11cb, #2575fc);
          border-radius: 12px; /* cleaner square style */
          margin: 60px auto;
          padding: 80px 20px;
          color: #fff;
          text-align: center;
          max-width: 1100px;
          width: 90%;
          font-family: 'Poppins', Arial, sans-serif;
          box-shadow: 0 10px 35px rgba(0,0,0,0.25);
        }

        .contact-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px);
          background-size: 30px 30px;
          animation: floatBg 12s ease-in-out infinite;
          z-index: 0;
        }

        .contact-content {
          position: relative;
          z-index: 1;
        }

        .contact-section h2 {
          color: #fff; /* ensure heading is white */
          font-size: 40px;
          font-weight: 700;
          margin-bottom: 16px;
          line-height: 1.3;
        }

        .contact-section p {
          font-size: 17px;
          font-weight: 400;
          margin-bottom: 32px;
          color: #fff;
          line-height: 1.6;
          max-width: 720px;
          margin-left: auto;
          margin-right: auto;
        }

        .contact-btn {
          background: #fff;
          color: #6a11cb;
          font-weight: 600;
          font-size: 16px;
          border: none;
          padding: 14px 36px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 8px 22px rgba(255, 255, 255, 0.25);
        }

        .contact-btn:hover {
          background: #6a11cb;
          color: #fff;
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.25);
        }

        @keyframes floatBg {
          0% { background-position: 0 0; }
          50% { background-position: 20px 20px; }
          100% { background-position: 0 0; }
        }

        @media (max-width: 768px) {
          .contact-section {
            padding: 60px 16px;
            border-radius: 10px;
          }
          .contact-section h2 {
            font-size: 28px;
          }
          .contact-section p {
            font-size: 15px;
          }
          .contact-btn {
            padding: 12px 28px;
            font-size: 15px;
          }
        }

        @media (max-width: 480px) {
          .contact-section {
            padding: 50px 12px;
            border-radius: 8px;
          }
          .contact-section h2 {
            font-size: 24px;
          }
          .contact-section p {
            font-size: 14px;
          }
        }
      `}</style>

      <section className="contact-section" id="contact">
        <div className="contact-content">
          <h2>Analyze Your Domain’s Strength Instantly</h2>
          <p>
            Use our AI-powered Domain Audit Tool to uncover insights into performance, SEO, and visibility — 
            empowering you to make smarter digital decisions in seconds.
          </p>
          <button className="contact-btn" onClick={handleRedirect}>
            Try Free Audit
          </button>
        </div>
      </section>
    </>
  );
};

export default Contact;
