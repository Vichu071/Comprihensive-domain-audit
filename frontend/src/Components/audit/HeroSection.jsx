import React, { useState, useEffect } from 'react'

const HeroSection = ({ onAudit, loading }) => {
  const [domain, setDomain] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 })

  useEffect(() => {
    setIsVisible(true)
    
    // Mouse move effect for interactive background
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e
      const x = (clientX / window.innerWidth) * 100
      const y = (clientY / window.innerHeight) * 100
      setGlowPosition({ x, y })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (domain.trim()) {
      onAudit(domain.trim())
    }
  }

  return (
    <>
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(138, 43, 226, 0.3); }
          50% { box-shadow: 0 0 30px rgba(138, 43, 226, 0.6); }
        }
        
        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translateY(30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .float-animation {
          animation: float 3s ease-in-out infinite;
        }
        
        .glow-animation {
          animation: glow 2s ease-in-out infinite;
        }
        
        .slide-in {
          animation: slideIn 0.8s ease-out forwards;
        }
        
        .loading {
          width: 20px;
          height: 20px;
          border: 2px solid transparent;
          border-top: 2px solid #8a2be2;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .feature-card {
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .feature-card:hover {
          transform: translateY(-5px) scale(1.05);
          background: rgba(138, 43, 226, 0.1);
        }
        
        .input-glow:focus {
          box-shadow: 0 0 20px rgba(138, 43, 226, 0.5);
          border-color: #8a2be2;
        }
      `}</style>

      <section style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0a0a0a 100%)',
        color: 'white',
        padding: '6rem 0',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center'
      }}>
        {/* Animated Background Elements */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at ${glowPosition.x}% ${glowPosition.y}%, rgba(138, 43, 226, 0.1) 0%, transparent 50%)`,
          transition: 'all 0.3s ease-out'
        }} />
        
        {/* Floating particles */}
        <div className="float-animation" style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '4px',
          height: '4px',
          background: '#8a2be2',
          borderRadius: '50%',
          boxShadow: '0 0 10px #8a2be2'
        }} />
        <div className="float-animation" style={{
          position: 'absolute',
          top: '60%',
          right: '15%',
          width: '6px',
          height: '6px',
          background: '#8a2be2',
          borderRadius: '50%',
          boxShadow: '0 0 15px #8a2be2',
          animationDelay: '1.5s'
        }} />
        <div className="float-animation" style={{
          position: 'absolute',
          bottom: '30%',
          left: '20%',
          width: '3px',
          height: '3px',
          background: '#8a2be2',
          borderRadius: '50%',
          boxShadow: '0 0 8px #8a2be2',
          animationDelay: '2.5s'
        }} />

        <div className="container" style={{
          position: 'relative',
          zIndex: 2,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s ease-out'
        }}>
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: 'bold',
            marginBottom: '1.5rem',
            lineHeight: '1.2',
            background: 'linear-gradient(45deg, #ffffff, #8a2be2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s ease-out 0.2s'
          }}>
            Complete Domain Analysis Tool
          </h1>
          
          <p style={{
            fontSize: '1.25rem',
            marginBottom: '3rem',
            maxWidth: '600px',
            margin: '0 auto 3rem',
            opacity: isVisible ? 0.9 : 0,
            lineHeight: '1.6',
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s ease-out 0.4s'
          }}>
            Get comprehensive insights into any domain - WHOIS data, technology stack, 
            email configuration, security headers, and performance metrics.
          </p>
          
          <form onSubmit={handleSubmit} style={{
            maxWidth: '500px',
            margin: '0 auto',
            display: 'flex',
            gap: '0.5rem',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s ease-out 0.6s'
          }}>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Enter domain (e.g., example.com)"
              className="input-glow"
              style={{
                flex: 1,
                color: '#000',
                fontSize: '1.1rem',
                padding: '1rem',
                border: '2px solid #333',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.95)',
                transition: 'all 0.3s ease'
              }}
              disabled={loading}
            />
            <button 
              type="submit" 
              className={`glow-animation ${loading ? 'loading-state' : ''}`}
              disabled={loading || !domain.trim()}
              style={{
                padding: '1rem 2rem',
                fontSize: '1.1rem',
                whiteSpace: 'nowrap',
                background: loading ? '#4a1a8c' : 'linear-gradient(45deg, #8a2be2, #6a0dad)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: loading ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading && domain.trim()) {
                  e.target.style.transform = 'scale(1.05)'
                  e.target.style.background = 'linear-gradient(45deg, #9b30ff, #7a1fcc)'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && domain.trim()) {
                  e.target.style.transform = 'scale(1)'
                  e.target.style.background = 'linear-gradient(45deg, #8a2be2, #6a0dad)'
                }
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="loading"></div>
                  Auditing...
                </span>
              ) : (
                'Start Audit'
              )}
            </button>
          </form>

          <div style={{
            marginTop: '4rem',
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            flexWrap: 'wrap',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s ease-out 0.8s'
          }}>
            {[
              { title: 'WHOIS', desc: 'Domain Info' },
              { title: 'Tech', desc: 'Stack Analysis' },
              { title: 'Security', desc: 'Headers Check' },
              { title: 'Email', desc: 'Configuration' }
            ].map((feature, index) => (
              <div 
                key={feature.title}
                className="feature-card"
                style={{
                  textAlign: 'center',
                  padding: '1.5rem 1rem',
                  borderRadius: '12px',
                  background: 'rgba(138, 43, 226, 0.05)',
                  border: '1px solid rgba(138, 43, 226, 0.2)',
                  minWidth: '140px',
                  animationDelay: `${1 + index * 0.1}s`
                }}
              >
                <div style={{ 
                  fontSize: '2rem', 
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #8a2be2, #ffffff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {feature.title}
                </div>
                <div style={{ 
                  opacity: 0.8,
                  marginTop: '0.5rem'
                }}>
                  {feature.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default HeroSection
