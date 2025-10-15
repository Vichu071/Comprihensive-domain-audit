import React, { useState, useEffect, useRef } from 'react';

const HeroSection = ({ onAudit, loading }) => {
  const [domain, setDomain] = useState('');
  const canvasRef = useRef(null);
  const particles = useRef([]);

  // Initialize particles
  useEffect(() => {
    const temp = Array.from({ length: 50 }).map(() => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 4 + 1,
      speedX: (Math.random() - 0.5) * 0.1, // slower speed
      speedY: (Math.random() - 0.5) * 0.1, // slower speed
    }));
    particles.current = temp;
  }, []);

  // Animate particles
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.current.forEach(p => {
        // Move particle
        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap around edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Glow reacts to typing
        const glowFactor = domain ? 1.3 : 1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(138, 43, 226, ${0.2 * glowFactor})`;
        ctx.shadowBlur = 8 * glowFactor; // softer glow
        ctx.shadowColor = 'rgba(138, 43, 226, 0.5)';
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };
    animate();

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [domain]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (domain.trim()) onAudit(domain.trim());
  };

  return (
    <section className="hero">
      <canvas ref={canvasRef} className="hero-canvas"></canvas>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@300;400;500;600;700&display=swap');

        .hero {
          position: relative;
          overflow: hidden;
          color: #fff;
          text-align: center;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding-top: 120px;
          font-family: 'Inter Tight', sans-serif;
          background: linear-gradient(135deg, #1b0032, #3a006e, #0a0011);
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
          padding: 0 1rem;
        }

        .hero-title {
          font-size: 4rem;
          font-weight: 700;
          line-height: 1.1;
          color: #fff;
          margin-bottom: 1rem;
        }

        .hero-subtitle {
          font-size: 1.3rem;
          color: #ddd;
          max-width: 700px;
          margin: 0 auto 2rem;
        }

        .scrolling-text {
          width: 100%;
          overflow: hidden;
          margin-bottom: 3rem;
        }

        .scrolling-track {
          display: flex;
          white-space: nowrap;
          animation: scrollLeft 20s linear infinite;
        }

        .scroll-item {
          font-size: 1rem;
          font-weight: 500;
          letter-spacing: 0.5px;
          opacity: 0.8;
          margin: 0 1rem;
        }

        @keyframes scrollLeft {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        .domain-form {
          display: flex;
          justify-content: center;
          margin-top: 2rem;
        }

        .input-container {
          display: flex;
          align-items: center;
          background: #ffffff;
          border-radius: 15px;
          padding: 1rem 1.5rem;
          width: 100%;
          max-width: 600px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          transition: all 0.3s ease;
        }

        .input-container input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 1.2rem;
          color: #050009;
          font-weight: 500;
          background: transparent;
        }

        .input-container input::placeholder {
          color: #888;
        }

        .input-container button {
          background: #6a0dad;
          border: none;
          color: #fff;
          padding: 0.8rem 2rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          margin-left: 1rem;
          transition: all 0.3s ease;
        }

        .input-container button:hover {
          background: #7a1fcc;
        }
      `}</style>

      <div className="hero-content">
        <h1 className="hero-title">
          Complete <span>Domain Analysis</span> Tool
        </h1>
        <p className="hero-subtitle">
          Get deep insights — WHOIS, Tech Stack, Security, Email, and Performance.
        </p>

        <div className="scrolling-text">
          <div className="scrolling-track">
            {['WHOIS Data', 'Tech Stack', 'Security Headers', 'Email Setup', 'Performance Metrics'].map((item, i) => (
              <span key={i} className="scroll-item">{item} •</span>
            ))}
            {['WHOIS Data', 'Tech Stack', 'Security Headers', 'Email Setup', 'Performance Metrics'].map((item, i) => (
              <span key={`r${i}`} className="scroll-item">{item} •</span>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="domain-form">
          <div className="input-container">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Enter domain (e.g., example.com)"
              disabled={loading}
            />
            <button type="submit" disabled={loading || !domain.trim()}>
              {loading ? 'Auditing...' : 'Start Audit'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default HeroSection;
