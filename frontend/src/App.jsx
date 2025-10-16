import React, { useState } from 'react'
import Navbar from './Components/audit/Navbar'
import HeroSection from './Components/audit/HeroSection'
import AuditVisualization from './Components/audit/AuditVisualization'
import AuditResults from './Components/audit/AuditResults'
import FeaturesSection from './Components/audit/FeaturesSection'
import CTASection from './Components/audit/CTASection'
import Contact from './Components/audit/Contact' // ✅ Added contact section
import Footer from './Components/audit/Footer'
import './App.css'

function App() {
  const [auditResults, setAuditResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState('')

  // Simulate progress animation
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
      setCurrentStep(prev => (prev + 1) % 10)
    }, 500)

    return interval
  }

  // Audit handler
  const handleAudit = async (domain) => {
    setLoading(true)
    setError('')
    setAuditResults(null)
    const progressInterval = simulateProgress()

    try {
      const response = await fetch(`https://comprihensive-audit-backend.onrender.com/audit/${domain}`)
      if (!response.ok) throw new Error(`Server error: ${response.status}`)
      const data = await response.json()

      setProgress(100)
      setTimeout(() => {
        setAuditResults(data)
        setLoading(false)
      }, 500)
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to connect to the backend. Please ensure FastAPI is running on port 8000.')
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

      {/* Loader */}
      {loading && <CreativeLoader progress={progress} currentStep={currentStep} />}

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
          <CTASection onAudit={handleAudit} /> {/* ✅ Keep CTASection here */}
          <Contact /> {/* ✅ Added Contact section right before Footer */}
        </>
      )}

      <Footer />
    </div>
  )
}

/* ==========================
   CREATIVE LOADER COMPONENT
========================== */
const CreativeLoader = ({ progress, currentStep }) => {
  const steps = [
    "Initializing domain analysis...",
    "Checking domain registration...",
    "Scanning hosting information...",
    "Analyzing email configuration...",
    "Detecting technology stack...",
    "Checking for WordPress...",
    "Scanning for advertisements...",
    "Auditing security headers...",
    "Measuring performance...",
    "Compiling final report...",
  ]

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem',
        color: 'white',
        fontFamily: 'system-ui',
      }}
    >
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '3rem',
          textAlign: 'center',
          maxWidth: '500px',
          width: '100%',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            margin: '0 auto 2rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            animation: 'spin 3s linear infinite, pulse 2s ease-in-out infinite',
          }}
        >
          🔍
        </div>

        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem' }}>
          Analyzing Domain
        </h2>

        <div
          style={{
            width: '100%',
            height: '8px',
            background: 'rgba(255,255,255,0.3)',
            borderRadius: '10px',
            margin: '2rem 0',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #4ecdc4, #44a08d)',
              borderRadius: '10px',
              boxShadow: '0 0 20px rgba(78, 205, 196, 0.5)',
              transition: 'width 0.5s ease',
            }}
          />
        </div>

        <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          {progress}%
        </div>

        <p style={{ fontSize: '1rem', opacity: 0.9, minHeight: '24px', marginBottom: '2rem' }}>
          {steps[currentStep]}
        </p>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255,255,255,0.1)',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontSize: '0.9rem',
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              border: '2px solid #4ecdc4',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          Scanning in progress...
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  )
}

export default App
