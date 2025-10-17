import React, { useState, useEffect } from 'react'
import Navbar from './Components/audit/Navbar'
import HeroSection from './Components/audit/HeroSection'
import AuditVisualization from './Components/audit/AuditVisualization'
import AuditResults from './Components/audit/AuditResults'
import FeaturesSection from './Components/audit/FeaturesSection'
import CTASection from './Components/audit/CTASection'
import Contact from './Components/audit/Contact'
import Footer from './Components/audit/Footer'
import './App.css'

function App() {
  const [auditResults, setAuditResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState('')

  const simulateProgress = () => {
    setProgress(0)
    setCurrentStep(0)

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 10
      })
      setCurrentStep(prev => Math.min(prev + 1, 9))
    }, 800)

    return interval
  }

  const handleAudit = async (domain) => {
    setLoading(true)
    setError('')
    setAuditResults(null)
    const progressInterval = simulateProgress()

    try {
      // Updated to use your Render backend URL
      const response = await fetch(`https://comprihensive-audit-backend.onrender.com/audit/${domain}`)
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }
      const data = await response.json()

      setProgress(100)
      setCurrentStep(9)
      setTimeout(() => {
        setAuditResults(data)
        setLoading(false)
      }, 800)
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to connect to the backend. Please ensure the backend is running.')
      setLoading(false)
    } finally {
      clearInterval(progressInterval)
    }
  }

  const handleNewAudit = () => {
    setAuditResults(null)
    setProgress(0)
    setCurrentStep(0)
    setError('')
  }

  return (
    <div className="App" style={{ fontFamily: 'Inter, sans-serif', color: '#1e293b', background: '#fff' }}>
      <Navbar />

      {/* Hero section */}
      {!loading && !auditResults && (
        <>
          <HeroSection onAudit={handleAudit} loading={loading} />
        </>
      )}

      {/* Minimal Mountain Explorer Loader */}
      {loading && <MinimalMountainExplorer progress={progress} currentStep={currentStep} />}

      {/* Error display */}
      {error && !loading && (
        <div
          style={{
            background: '#fee2e2',
            color: '#dc2626',
            border: '1px solid #fecaca',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            margin: '2rem auto',
            maxWidth: '600px',
            textAlign: 'center',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Audit Failed</div>
          {error}
          <button
            onClick={handleNewAudit}
            style={{
              marginTop: '1rem',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Audit results */}
      {auditResults && !loading && <AuditResults results={auditResults} onNewAudit={handleNewAudit} />}

      {/* Static sections */}
      {!auditResults && !loading && !error && (
        <>
          <FeaturesSection />
          <AuditVisualization />
          <CTASection onAudit={handleAudit} />
          <Contact />
        </>
      )}

      <Footer />
    </div>
  )
}

/* ==========================
   MINIMAL MOUNTAIN EXPLORER LOADER
========================== */
const MinimalMountainExplorer = ({ progress, currentStep }) => {
  const [isWalking, setIsWalking] = useState(false)
  const [characterPosition, setCharacterPosition] = useState(0)

  const mountains = [
    { label: "Domain", height: 80, baseWidth: 100, color: "#3B82F6", position: 8 },
    { label: "Hosting", height: 120, baseWidth: 140, color: "#8B5CF6", position: 20 },
    { label: "Email", height: 90, baseWidth: 110, color: "#06B6D4", position: 32 },
    { label: "Tech", height: 110, baseWidth: 130, color: "#10B981", position: 44 },
    { label: "WordPress", height: 85, baseWidth: 100, color: "#F59E0B", position: 56 },
    { label: "Security", height: 130, baseWidth: 150, color: "#EF4444", position: 68 },
    { label: "Performance", height: 100, baseWidth: 130, color: "#6366F1", position: 80 },
    { label: "Analysis", height: 115, baseWidth: 140, color: "#14B8A6", position: 92 },
    { label: "Report", height: 75, baseWidth: 90, color: "#84CC16", position: 104 }
  ]

  // Walking animation
  useEffect(() => {
    const walkInterval = setInterval(() => {
      setIsWalking(prev => !prev)
    }, 500)
    return () => clearInterval(walkInterval)
  }, [])

  // Smooth character movement
  useEffect(() => {
    const targetPosition = mountains[currentStep]?.position || 0
    setCharacterPosition(targetPosition)
  }, [currentStep, mountains])

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #0f172a 0%, #1e3a8a 30%, #3b82f6 70%, #60a5fa 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: '80px', // Space for navbar
        paddingBottom: '2rem',
        fontFamily: '"Inter", sans-serif',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Sun */}
      <div
        style={{
          position: 'absolute',
          top: '60px',
          right: '8%',
          width: '70px',
          height: '70px',
          background: 'radial-gradient(circle, #fef3c7 0%, #f59e0b 70%)',
          borderRadius: '50%',
          boxShadow: '0 0 50px #f59e0b, 0 0 100px rgba(245, 158, 11, 0.5)',
          animation: 'pulseSun 8s ease-in-out infinite',
          zIndex: 1
        }}
      />

      {/* Moon */}
      <div
        style={{
          position: 'absolute',
          top: '100px',
          left: '10%',
          width: '50px',
          height: '50px',
          background: 'radial-gradient(circle, #f8fafc 0%, #cbd5e1 70%)',
          borderRadius: '50%',
          boxShadow: '0 0 40px rgba(248, 250, 252, 0.8), 0 0 80px rgba(248, 250, 252, 0.4)',
          animation: 'floatMoon 12s ease-in-out infinite',
          zIndex: 1
        }}
      >
        {/* Moon craters */}
        <div style={{
          position: 'absolute',
          top: '15px',
          left: '20px',
          width: '8px',
          height: '8px',
          background: '#94a3b8',
          borderRadius: '50%',
          opacity: 0.6
        }} />
        <div style={{
          position: 'absolute',
          top: '30px',
          left: '10px',
          width: '5px',
          height: '5px',
          background: '#94a3b8',
          borderRadius: '50%',
          opacity: 0.5
        }} />
        <div style={{
          position: 'absolute',
          top: '25px',
          right: '15px',
          width: '6px',
          height: '6px',
          background: '#94a3b8',
          borderRadius: '50%',
          opacity: 0.7
        }} />
      </div>

      {/* Clouds */}
      <div
        style={{
          position: 'absolute',
          top: '80px',
          left: '-100px',
          width: '120px',
          height: '40px',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '50px',
          boxShadow: '20px 15px 0 0 rgba(255,255,255,0.9)',
          animation: 'moveCloud 25s linear infinite',
          zIndex: 2
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '140px',
          right: '-80px',
          width: '100px',
          height: '35px',
          background: 'rgba(255,255,255,0.85)',
          borderRadius: '40px',
          animation: 'moveCloud 30s linear infinite 5s',
          zIndex: 2
        }}
      />

      {/* Birds */}
      <div
        style={{
          position: 'absolute',
          top: '120px',
          left: '15%',
          fontSize: '24px',
          opacity: 0.7,
          animation: 'flyBird 18s linear infinite',
          zIndex: 2
        }}
      >
        🕊️
      </div>
      <div
        style={{
          position: 'absolute',
          top: '80px',
          right: '25%',
          fontSize: '20px',
          opacity: 0.6,
          animation: 'flyBird 15s linear infinite 3s',
          zIndex: 2
        }}
      >
        🕊️
      </div>

      {/* Transparent Game Container */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '2rem',
          width: 'min(90%, 800px)',
          height: '300px',
          position: 'relative',
          zIndex: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Mountain Scene */}
        <div
          style={{
            position: 'relative',
            height: '100%',
            width: '100%',
            background: 'transparent',
            borderRadius: '12px',
            overflow: 'hidden'
          }}
        >
          {/* Ground */}
          <div
            style={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              right: '0',
              height: '40px',
              background: 'linear-gradient(180deg, #166534, #15803d)',
              borderTop: '3px solid #22c55e',
              zIndex: 4
            }}
          />

          {/* Mountains */}
          {mountains.map((mountain, index) => (
            <div
              key={index}
              style={{
                position: 'absolute',
                bottom: '40px',
                left: `${mountain.position}%`,
                transform: 'translateX(-50%)',
                zIndex: currentStep >= index ? 5 : 3,
                opacity: currentStep >= index ? 1 : 0.3,
                transition: 'all 1.2s ease'
              }}
            >
              {/* Mountain Body */}
              <div
                style={{
                  width: '0',
                  height: '0',
                  borderLeft: `${mountain.baseWidth / 2}px solid transparent`,
                  borderRight: `${mountain.baseWidth / 2}px solid transparent`,
                  borderBottom: `${mountain.height}px solid ${mountain.color}`,
                  filter: `drop-shadow(0 4px 8px ${mountain.color}40)`
                }}
              >
                {/* Snow Cap */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: `${mountain.baseWidth * 0.6}px`,
                    height: '15px',
                    background: 'linear-gradient(180deg, #f0f9ff, #e0f2fe)',
                    borderRadius: '50%',
                    boxShadow: '0 2px 4px rgba(255,255,255,0.5)'
                  }}
                />
                
                {/* Mountain Texture */}
                <div
                  style={{
                    position: 'absolute',
                    top: '30%',
                    left: '30%',
                    width: '20px',
                    height: '8px',
                    background: 'rgba(0,0,0,0.1)',
                    borderRadius: '4px',
                    transform: 'rotate(45deg)'
                  }}
                />
              </div>

              {/* Mountain Label */}
              <div
                style={{
                  position: 'absolute',
                  top: `${mountain.height + 10}px`,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  color: mountain.color,
                  background: 'rgba(255,255,255,0.9)',
                  padding: '2px 8px',
                  borderRadius: '8px',
                  whiteSpace: 'nowrap',
                  opacity: currentStep === index ? 1 : 0,
                  transition: 'opacity 0.5s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  zIndex: 6
                }}
              >
                {mountain.label}
              </div>
            </div>
          ))}

          {/* Explorer Character */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              left: `${characterPosition}%`,
              transform: `translateX(-50%) translateY(${isWalking ? '-5px' : '0px'})`,
              transition: 'left 1.8s cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 10
            }}
          >
            {/* Character Body */}
            <div
              style={{
                width: '24px',
                height: '36px',
                background: 'linear-gradient(180deg, #7c3aed, #5b21b6)',
                borderRadius: '6px 6px 3px 3px',
                position: 'relative',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
              }}
            >
              {/* Head */}
              <div
                style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '20px',
                  height: '20px',
                  background: '#fbbf24',
                  borderRadius: '50%',
                  border: '2px solid #f59e0b'
                }}
              >
                {/* Explorer Hat */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '22px',
                    height: '6px',
                    background: '#dc2626',
                    borderRadius: '10px 10px 2px 2px'
                  }}
                />
                
                {/* Eyes */}
                <div
                  style={{
                    position: 'absolute',
                    top: '6px',
                    left: '4px',
                    width: '3px',
                    height: '3px',
                    background: '#1f2937',
                    borderRadius: '50%',
                    animation: 'blink 3s infinite'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '4px',
                    width: '3px',
                    height: '3px',
                    background: '#1f2937',
                    borderRadius: '50%',
                    animation: 'blink 3s infinite 1.5s'
                  }}
                />
              </div>

              {/* Backpack */}
              <div
                style={{
                  position: 'absolute',
                  top: '4px',
                  left: '-6px',
                  width: '8px',
                  height: '12px',
                  background: 'linear-gradient(180deg, #92400e, #78350f)',
                  borderRadius: '3px 1px 1px 3px',
                  border: '1px solid #78350f'
                }}
              />

              {/* Magnifying Glass */}
              <div
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '-14px',
                  transform: isWalking ? 'rotate(10deg)' : 'rotate(0deg)',
                  transition: 'transform 0.5s ease'
                }}
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    border: '2px solid #374151',
                    borderRadius: '50%',
                    background: 'rgba(59, 130, 246, 0.3)',
                    position: 'relative'
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      width: '3px',
                      height: '3px',
                      background: 'rgba(255,255,255,0.8)',
                      borderRadius: '50%'
                    }}
                  />
                </div>
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '-6px',
                    width: '8px',
                    height: '2px',
                    background: '#374151',
                    borderRadius: '1px',
                    transform: 'rotate(45deg)'
                  }}
                />
              </div>

              {/* Arms */}
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: '-6px',
                  width: '6px',
                  height: '16px',
                  background: '#5b21b6',
                  borderRadius: '3px',
                  transform: isWalking ? 'rotate(-20deg)' : 'rotate(-10deg)',
                  transition: 'transform 0.5s ease'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '-6px',
                  width: '6px',
                  height: '16px',
                  background: '#5b21b6',
                  borderRadius: '3px',
                  transform: isWalking ? 'rotate(20deg)' : 'rotate(10deg)',
                  transition: 'transform 0.5s ease'
                }}
              />

              {/* Legs - Walking Animation */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '-8px',
                  left: '3px',
                  width: '5px',
                  height: '12px',
                  background: '#431407',
                  borderRadius: '2px 2px 0 0',
                  transform: isWalking ? 'rotate(10deg) translateY(-2px)' : 'rotate(-5deg)',
                  transition: 'all 0.5s ease'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '-8px',
                  right: '3px',
                  width: '5px',
                  height: '12px',
                  background: '#431407',
                  borderRadius: '2px 2px 0 0',
                  transform: isWalking ? 'rotate(-10deg) translateY(-2px)' : 'rotate(5deg)',
                  transition: 'all 0.5s ease'
                }}
              />
            </div>

            {/* Walking Shadow */}
            <div
              style={{
                position: 'absolute',
                bottom: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '16px',
                height: '4px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '50%',
                opacity: isWalking ? 0.4 : 0.6,
                transition: 'all 0.5s ease'
              }}
            />
          </div>

          {/* Progress Indicator */}
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(255, 255, 255, 0.9)',
              padding: '4px 12px',
              borderRadius: '15px',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: '#1e40af',
              fontFamily: '"Inter", sans-serif',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              zIndex: 10
            }}
          >
            {progress}%
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulseSun {
          0%, 100% { 
            transform: scale(1) rotate(0deg); 
            box-shadow: 0 0 50px #f59e0b, 0 0 100px rgba(245, 158, 11, 0.5);
          }
          50% { 
            transform: scale(1.1) rotate(5deg); 
            box-shadow: 0 0 70px #f59e0b, 0 0 140px rgba(245, 158, 11, 0.7);
          }
        }

        @keyframes floatMoon {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg); 
          }
          33% { 
            transform: translateY(-10px) rotate(120deg); 
          }
          66% { 
            transform: translateY(5px) rotate(240deg); 
          }
        }

        @keyframes moveCloud {
          0% { transform: translateX(-100px); }
          100% { transform: translateX(calc(100vw + 100px)); }
        }

        @keyframes flyBird {
          0% { 
            transform: translateX(-100px) translateY(0px) scaleX(1); 
          }
          25% { 
            transform: translateX(25vw) translateY(-15px) scaleX(1); 
          }
          50% { 
            transform: translateX(50vw) translateY(5px) scaleX(-1); 
          }
          75% { 
            transform: translateX(75vw) translateY(-10px) scaleX(-1); 
          }
          100% { 
            transform: translateX(calc(100vw + 100px)) translateY(0px) scaleX(-1); 
          }
        }

        @keyframes blink {
          0%, 90%, 100% { opacity: 1; }
          95% { opacity: 0; }
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .mountain-scene {
            height: 200px;
          }
        }

        @media (max-width: 480px) {
          .mountain-scene {
            height: 150px;
          }
        }
      `}</style>
    </div>
  )
}

export default App
