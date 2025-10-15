import React, { useState, useEffect, useRef } from "react";

const HeroSection = ({ onAudit, loading }) => {
  const [domain, setDomain] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const examples = ["example.com", "engagepro.ai", "google.com", "yourbrand.io", "mysite.tech"];
  const currentExample = useRef(0);
  const charIndex = useRef(0);
  const deleting = useRef(false);

  // Animate placeholder typing
  useEffect(() => {
    const typeEffect = () => {
      const current = examples[currentExample.current];
      if (!deleting.current) {
        setPlaceholder(current.slice(0, charIndex.current + 1));
        charIndex.current++;
        if (charIndex.current === current.length + 5) deleting.current = true;
      } else {
        setPlaceholder(current.slice(0, charIndex.current - 1));
        charIndex.current--;
        if (charIndex.current === 0) {
          deleting.current = false;
          currentExample.current = (currentExample.current + 1) % examples.length;
        }
      }
    };
    const interval = setInterval(typeEffect, 150);
    return () => clearInterval(interval);
  }, []);

  // Initialize particles
  useEffect(() => {
    const count = window.innerWidth < 600 ? 25 : 60;
    particles.current = Array.from({ length: count }).map(() => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 2 + 1,
      speedY: Math.random() * -0.1 - 0.02, // slower speed
      alpha: Math.random() * 0.4 + 0.3,
    }));
  }, []);

  // Animate particles
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current.forEach((p) => {
        p.y += p.speedY;
        if (p.y < -10) p.y = canvas.height + 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ffffff";
        ctx.fill();
      });
      requestAnimationFrame(animate);
    };

    animate();
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (domain.trim()) onAudit(domain.trim());
  };

  return (
    <section className="hero">
      <canvas ref={canvasRef} className="hero-canvas"></canvas>

      <div className="hero-content">
        <h1 className="hero-title">
          Explore the <span>DNA</span> of Any Domain
        </h1>
        <p className="hero-subtitle">
          EngagePro — AI that audits hosting, tech stack, email setup,
          WordPress, security, and performance in real time.
        </p>

        <form onSubmit={handleSubmit} className="domain-form">
          <div className={`input-container ${domain.length > 0 ? "active-glow" : ""}`}>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder={placeholder}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !domain.trim()}>
              {loading ? "Analyzing..." : "Analyze"}
            </button>
          </div>
        </form>

        <div className="scrolling-text">
          <div className="scrolling-track">
            {[
              "WHOIS Data",
              "Tech Stack",
              "Security Headers",
              "Email Setup",
              "Performance Metrics",
              "Hosting Details",
              "SSL & Expiry",
            ].map((item, i) => (
              <span key={i} className="scroll-item">
                {item} •
              </span>
            ))}
            {[
              "WHOIS Data",
              "Tech Stack",
              "Security Headers",
              "Email Setup",
              "Performance Metrics",
              "Hosting Details",
              "SSL & Expiry",
            ].map((item, i) => (
              <span key={`r${i}`} className="scroll-item">
                {item} •
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Curved bottom edge with spacing */}
      <div className="hero-bottom-curve">
        <svg
          viewBox="0 0 1440 320"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            fill="#ffffff"
            d="M0,288L48,266.7C96,245,192,203,288,197.3C384,192,480,224,576,224C672,224,768,192,864,181.3C960,171,1056,181,1152,186.7C1248,192,1344,192,1392,186.7L1440,181.3V320H0Z"
          ></path>
        </svg>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');

        .hero {
          position: relative;
          overflow: hidden;
          color: #fff;
          text-align: center;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: radial-gradient(circle at bottom, #1a0072, #2b0066 40%, #0a0020 100%);
          background-attachment: fixed;
          padding-bottom: 6rem; /* extra bottom spacing */
        }

        .hero::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 40px 40px;
          opacity: 0.4;
        }

        .hero-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
        }

        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 900px;
          width: 100%;
          padding: 1rem;
        }

        .hero-title {
          font-size: 3.8rem;
          font-weight: 800;
          color: #fff;
          margin-bottom: 1rem;
        }

        .hero-title span {
          background: linear-gradient(90deg, #6a5eff, #b44cff, #ff6bd6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: #d7d7f3;
          max-width: 700px;
          margin: 0 auto 2rem;
        }

        .domain-form {
          display: flex;
          justify-content: center;
          margin-bottom: 2rem;
        }

        .input-container {
          display: flex;
          align-items: center;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          backdrop-filter: blur(10px);
          border-radius: 50px;
          padding: 0.8rem 1rem;
          width: 100%;
          max-width: 600px;
          transition: all 0.3s ease;
        }

        .input-container.active-glow {
          box-shadow: 0 0 25px rgba(138, 90, 255, 0.3);
          border-color: rgba(255,255,255,0.4);
        }

        .input-container input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 1.1rem;
          color: #fff;
          background: transparent;
          padding: 0.6rem;
        }

        .input-container input::placeholder {
          color: rgba(255,255,255,0.7);
        }

        .input-container button {
          background: linear-gradient(90deg, #6a5eff, #b44cff, #ff6bd6);
          border: none;
          color: #fff;
          padding: 0.8rem 1.6rem;
          border-radius: 50px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .input-container button:hover {
          transform: scale(1.05);
          box-shadow: 0 0 20px rgba(138, 90, 255, 0.4);
        }

        .scrolling-text {
          width: 100%;
          overflow: hidden;
          margin-top: 1rem;
        }

        .scrolling-track {
          display: flex;
          white-space: nowrap;
          animation: scrollLeft 25s linear infinite;
        }

        .scroll-item {
          font-size: 1rem;
          opacity: 0.8;
          margin: 0 1.2rem;
          color: #cfd3ff;
        }

        .hero-bottom-curve {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          overflow: hidden;
          line-height: 0;
        }

        .hero-bottom-curve svg {
          display: block;
          width: calc(100% + 1.3px);
          height: 130px;
        }

        @keyframes scrollLeft {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        @media (max-width: 768px) {
          .hero-title { font-size: 2.5rem; }
          .hero-subtitle { font-size: 1.05rem; }
          .input-container { flex-direction: column; border-radius: 20px; }
          .input-container button { width: 100%; margin-top: 0.6rem; }
          .scroll-item { font-size: 0.9rem; margin: 0 0.6rem; }
          .hero-bottom-curve svg { height: 90px; }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
