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

  const auditSteps = [
    "Initializing Domain Analysis",
    "Checking WHOIS Information",
    "Analyzing Hosting Infrastructure",
    "Verifying Email Configuration",
    "Detecting Technology Stack",
    "Scanning WordPress Details",
    "Auditing Security Protocols",
    "Testing Performance Metrics",
    "Compiling Final Report"
  ]

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
      setCurrentStep(prev => Math.min(prev + 1, 8))
    }, 800)

    return interval
  }

  const handleAudit = async (domain) => {
    setLoading(true)
    setError('')
    setAuditResults(null)
    const progressInterval = simulateProgress()

    try {
      const response = await fetch(`https://comprihensive-audit-backend.onrender.com/audit/${domain}`)
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }
      const data = await response.json()

      setProgress(100)
      setCurrentStep(8)
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
    <div className="App" style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif", color: '#1e293b', background: '#fff' }}>
      <Navbar />

      {/* Hero section */}
      {!loading && !auditResults && (
        <>
          <HeroSection onAudit={handleAudit} loading={loading} />
        </>
      )}

      {/* Premium Loader */}
      {loading && <PremiumLoader progress={progress} currentStep={currentStep} steps={auditSteps} />}

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
   PREMIUM LOADER COMPONENT
========================== */
const PremiumLoader = ({ progress, currentStep, steps }) => {
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setPulse(prev => !prev)
    }, 2000)
    return () => clearInterval(pulseInterval)
  }, [])

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #2d1b69 50%, #0f0f23 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: '80px',
        paddingBottom: '2rem',
        fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Animated Background Elements */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0) 70%)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite',
          filter: 'blur(20px)'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '5%',
          right: '5%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0) 70%)',
          borderRadius: '50%',
          animation: 'float 10s ease-in-out infinite 2s',
          filter: 'blur(15px)'
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.05) 0%, rgba(124, 58, 237, 0) 70%)',
          borderRadius: '50%',
          animation: 'pulse 6s ease-in-out infinite',
          filter: 'blur(30px)'
        }}
      />

      {/* Grid Pattern */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(rgba(168, 85, 247, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(168, 85, 247, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          opacity: 0.4
        }}
      />

      {/* Main Loader Container */}
      <div
        style={{
          background: 'rgba(15, 15, 35, 0.7)',
          backdropFilter: 'blur(20px)',
          borderRadius: '28px',
          border: '1px solid rgba(168, 85, 247, 0.2)',
          padding: '3.5rem 3rem',
          width: 'min(90%, 560px)',
          boxShadow: `
            0 25px 50px rgba(0, 0, 0, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '2.5rem'
          }}
        >
          <div
            style={{
              width: '90px',
              height: '90px',
              background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
              borderRadius: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `
                0 15px 35px rgba(139, 92, 246, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.2)
              `,
              transform: pulse ? 'scale(1.05)' : 'scale(1)',
              transition: 'transform 0.5s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0))',
                opacity: 0.6
              }}
            />
            <svg
              width="42"
              height="42"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="7.5 4.21 12 6.81 16.5 4.21" />
              <polyline points="7.5 19.79 7.5 14.6 3 12" />
              <polyline points="21 12 16.5 14.6 16.5 19.79" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2
          style={{
            textAlign: 'center',
            fontSize: '2.25rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #e9d5ff, #c4b5fd, #a855f7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '0.75rem',
            letterSpacing: '-0.025em'
          }}
        >
          Domain Audit
        </h2>

        <p
          style={{
            textAlign: 'center',
            color: '#cbd5e1',
            fontSize: '1.125rem',
            marginBottom: '3rem',
            fontWeight: '400',
            letterSpacing: '0.025em'
          }}
        >
          Comprehensive analysis in progress
        </p>

        {/* Progress Bar */}
        <div
          style={{
            background: 'rgba(30, 30, 60, 0.8)',
            borderRadius: '16px',
            height: '12px',
            marginBottom: '2rem',
            overflow: 'hidden',
            border: '1px solid rgba(168, 85, 247, 0.1)',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div
            style={{
              background: 'linear-gradient(90deg, #8b5cf6, #a855f7, #d946ef)',
              height: '100%',
              width: `${progress}%`,
              borderRadius: '16px',
              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                animation: 'shimmer 2s infinite',
                transform: 'skewX(-20deg)'
              }}
            />
          </div>
        </div>

        {/* Progress Text */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2.5rem'
          }}
        >
          <span
            style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#e9d5ff',
              letterSpacing: '0.05em'
            }}
          >
            {progress}% Complete
          </span>
          <span
            style={{
              fontSize: '0.875rem',
              color: '#94a3b8',
              fontWeight: '500'
            }}
          >
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>

        {/* Current Step */}
        <div
          style={{
            background: 'rgba(30, 30, 60, 0.6)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '2rem',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)'
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div
              style={{
                flex: 1
              }}
            >
              <div
                style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  marginBottom: '0.5rem',
                  letterSpacing: '0.025em'
                }}
              >
                {steps[currentStep]}
              </div>
              <div
                style={{
                  fontSize: '0.875rem',
                  color: '#cbd5e1',
                  fontWeight: '400'
                }}
              >
                Processing domain infrastructure data...
              </div>
            </div>
          </div>
        </div>

        {/* Loading Animation */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '2.5rem'
          }}
        >
          {[0, 1, 2].map((dot) => (
            <div
              key={dot}
              style={{
                width: '12px',
                height: '12px',
                background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                borderRadius: '50%',
                animation: `bounce 1.4s infinite ${dot * 0.16}s`,
                boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)'
              }}
            />
          ))}
        </div>

        {/* Status Indicators */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem'
          }}
        >
          {[
            { label: 'Security Scan', color: '#10b981' },
            { label: 'Performance', color: '#3b82f6' },
            { label: 'Technology', color: '#8b5cf6' },
            { label: 'Infrastructure', color: '#f59e0b' }
          ].map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem',
                background: 'rgba(30, 30, 60, 0.6)',
                borderRadius: '12px',
                border: '1px solid rgba(168, 85, 247, 0.1)',
                transition: 'all 0.3s ease'
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  background: currentStep > index + 1 ? item.color : '#475569',
                  borderRadius: '50%',
                  transition: 'all 0.3s ease',
                  boxShadow: currentStep > index + 1 ? `0 0 8px ${item.color}` : 'none'
                }}
              />
              <span
                style={{
                  fontSize: '0.875rem',
                  color: currentStep > index + 1 ? '#f8fafc' : '#64748b',
                  fontWeight: currentStep > index + 1 ? '600' : '500',
                  transition: 'all 0.3s ease',
                  letterSpacing: '0.025em'
                }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg); 
          }
          50% { 
            transform: translateY(-25px) rotate(5deg); 
          }
        }

        @keyframes pulse {
          0%, 100% { 
            opacity: 0.3;
            transform: translate(-50%, -50%) scale(1);
          }
          50% { 
            opacity: 0.6;
            transform: translate(-50%, -50%) scale(1.1);
          }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(200%) skewX(-20deg); }
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1.2);
            opacity: 1;
          }
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .premium-loader-container {
            padding: 2rem 1.5rem;
            margin: 1rem;
          }
        }

        @media (max-width: 480px) {
          .premium-loader-container {
            padding: 1.5rem 1rem;
          }
          
          .status-indicators {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default App
