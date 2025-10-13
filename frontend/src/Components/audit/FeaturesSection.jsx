import React, { useState, useEffect } from 'react'

const FeaturesSection = () => {
  const [activeCard, setActiveCard] = useState(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    
    // Check if mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  const features = [
    {
      title: "WHOIS Analysis",
      description: "Complete domain registration details and historical ownership tracking",
      gradient: "from-blue-500 to-cyan-500",
      icon: "🔍",
      details: ["Registrar Information", "Historical Ownership", "Status Tracking"],
      color: "#3B82F6",
      pattern: "circles"
    },
    {
      title: "Technology Stack",
      description: "Identify frameworks, CMS, and third-party services with detailed mapping",
      gradient: "from-purple-500 to-pink-500",
      icon: "⚙️",
      details: ["Framework Detection", "CMS Identification", "Service Mapping"],
      color: "#8B5CF6",
      pattern: "grid"
    },
    {
      title: "Email Configuration",
      description: "Analyze email providers and security settings with validation",
      gradient: "from-green-500 to-emerald-500",
      icon: "📧",
      details: ["Email Provider Analysis", "MX Record Configuration", "Contact Extraction"],
      color: "#10B981",
      pattern: "waves"
    },
    {
      title: "Security Audit",
      description: "Comprehensive security checks and vulnerability assessment",
      gradient: "from-red-500 to-orange-500",
      icon: "🛡️",
      details: ["SSL Certificate Analysis", "Security Headers", "Vulnerability Scan"],
      color: "#EF4444",
      pattern: "shields"
    },
    {
      title: "Performance Metrics",
      description: "Measure load times and optimize website speed with insights",
      gradient: "from-yellow-500 to-amber-500",
      icon: "🚀",
      details: ["Load Time Analysis", "Performance Scoring", "Optimization Tips"],
      color: "#F59E0B",
      pattern: "dots"
    },
    {
      title: "Advertising Networks",
      description: "Detect ad networks and tracking scripts with analytics",
      gradient: "from-indigo-500 to-violet-500",
      icon: "📊",
      details: ["Ad Network Detection", "Tracking Scripts", "Analytics Mapping"],
      color: "#6366F1",
      pattern: "lines"
    }
  ]

  const PatternBackground = ({ pattern, color }) => {
    const patterns = {
      circles: (
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.03 }}>
          <pattern id="circles" width="60" height="60" patternUnits="userSpaceOnUse">
            <circle cx="30" cy="30" r="3" fill={color} />
            <circle cx="10" cy="10" r="2" fill={color} />
            <circle cx="50" cy="20" r="2" fill={color} />
          </pattern>
          <rect width="100%" height="100%" fill="url(#circles)" />
        </svg>
      ),
      grid: (
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.03 }}>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke={color} strokeWidth="1"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      ),
      waves: (
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.03 }}>
          <pattern id="waves" width="80" height="40" patternUnits="userSpaceOnUse">
            <path d="M0 20 Q20 10,40 20 T80 20" stroke={color} strokeWidth="1" fill="none"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#waves)" />
        </svg>
      ),
      shields: (
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.03 }}>
          <pattern id="shields" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M25 5 L45 15 L45 35 L25 45 L5 35 L5 15 Z" stroke={color} strokeWidth="1" fill="none"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#shields)" />
        </svg>
      ),
      dots: (
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.03 }}>
          <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1.5" fill={color} />
          </pattern>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      ),
      lines: (
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.03 }}>
          <pattern id="lines" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M0 30 L30 0" stroke={color} strokeWidth="1" fill="none"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#lines)" />
        </svg>
      )
    }

    return patterns[pattern] || patterns.circles
  }

  const handleCardClick = (index) => {
    if (isMobile) {
      setActiveCard(activeCard === index ? null : index)
    }
  }

  const isCardActive = (index) => {
    if (isMobile) {
      return activeCard === index
    }
    // On desktop, we can keep hover behavior or set to always show details
    return true // You can change this based on your preference
  }

  return (
    <>
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        .feature-card {
          transition: all 0.3s ease;
          cursor: pointer;
        }

        /* Desktop hover effects */
        @media (min-width: 769px) {
          .feature-card:hover {
            transform: translateY(-8px);
          }

          .feature-card:hover .feature-icon {
            transform: scale(1.1);
          }
        }

        /* Mobile active state */
        .feature-card.mobile-active {
            transform: translateY(-4px);
            box-shadow: 0 15px 35px rgba(0,0,0,0.15) !important;
        }

        .feature-card.mobile-active .feature-icon {
            transform: scale(1.05);
        }

        .feature-icon {
          transition: all 0.3s ease;
        }

        .fade-in-up {
          opacity: 0;
          transform: translateY(30px);
          animation: fadeInUp 0.8s ease forwards;
        }

        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .stagger-animation > *:nth-child(1) { animation-delay: 0.1s; }
        .stagger-animation > *:nth-child(2) { animation-delay: 0.2s; }
        .stagger-animation > *:nth-child(3) { animation-delay: 0.3s; }
        .stagger-animation > *:nth-child(4) { animation-delay: 0.4s; }
        .stagger-animation > *:nth-child(5) { animation-delay: 0.5s; }
        .stagger-animation > *:nth-child(6) { animation-delay: 0.6s; }

        /* Mobile Responsive Styles for Features Section */
        @media (max-width: 768px) {
          /* Section padding */
          section {
            padding: 4rem 0 !important;
          }

          /* Container padding */
          section > div:first-child {
            padding: 0 1rem !important;
          }

          /* Header adjustments */
          h2 {
            font-size: 2.2rem !important;
            line-height: 1.2 !important;
            padding: 0 0.5rem;
          }

          /* Subtitle */
          p {
            font-size: 1.1rem !important;
            padding: 0 1rem;
            margin-bottom: 3rem !important;
          }

          /* Features grid - single column on mobile */
          .features-grid {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }

          /* Feature cards */
          .feature-card {
            padding: 2rem 1.5rem !important;
            margin: 0 auto;
            max-width: 400px;
            width: 100%;
            border-radius: 16px !important;
            transition: all 0.3s ease !important;
          }

          /* Mobile tap feedback */
          .feature-card:active {
            transform: scale(0.98) !important;
          }

          /* Always show details on mobile - no hover dependency */
          .floating-action {
            opacity: 1 !important;
            transform: translateY(0) !important;
          }

          /* Icon container */
          .feature-icon {
            width: 60px !important;
            height: 60px !important;
            border-radius: 14px !important;
            font-size: 1.5rem !important;
            margin-bottom: 1.2rem !important;
          }

          /* Feature title */
          .feature-title {
            font-size: 1.3rem !important;
            margin-bottom: 0.8rem !important;
          }

          /* Feature description */
          .feature-description {
            font-size: 0.95rem !important;
            margin-bottom: 1.5rem !important;
            line-height: 1.5 !important;
          }

          /* Feature details list */
          .feature-detail {
            padding: 0.6rem 0.8rem !important;
            font-size: 0.9rem !important;
          }

          .feature-detail span {
            font-size: 0.9rem !important;
          }

          /* Floating action - always visible on mobile */
          .floating-action {
            margin-top: 1.5rem !important;
            padding: 0.6rem !important;
            opacity: 1 !important;
            transform: translateY(0) !important;
          }

          /* Background elements - reduce on mobile */
          .background-element {
            display: none;
          }

          /* Accent line - always full width on mobile */
          .accent-line {
            width: 100% !important;
          }
        }

        @media (max-width: 480px) {
          /* Extra small devices */
          section {
            padding: 3rem 0 !important;
          }

          h2 {
            font-size: 1.8rem !important;
          }

          p {
            font-size: 1rem !important;
            margin-bottom: 2.5rem !important;
          }

          .feature-card {
            padding: 1.5rem 1.2rem !important;
            border-radius: 14px !important;
          }

          .feature-icon {
            width: 55px !important;
            height: 55px !important;
            font-size: 1.3rem !important;
            margin-bottom: 1rem !important;
          }

          .feature-title {
            font-size: 1.2rem !important;
          }

          .feature-description {
            font-size: 0.9rem !important;
          }

          .feature-detail {
            padding: 0.5rem 0.7rem !important;
            font-size: 0.85rem !important;
          }

          .features-grid {
            gap: 1.2rem !important;
          }
        }

        /* Tablet responsive styles */
        @media (min-width: 769px) and (max-width: 1024px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 1.8rem !important;
          }

          .feature-card {
            padding: 2rem 1.8rem !important;
          }

          h2 {
            font-size: 2.8rem !important;
          }

          p {
            font-size: 1.15rem !important;
          }

          /* Reduce background animation scale on tablet */
          .background-element {
            transform: scale(0.8);
          }
        }

        /* Large desktop adjustments */
        @media (min-width: 1440px) {
          .features-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 2.5rem !important;
          }

          .feature-card {
            padding: 3rem 2.5rem !important;
          }
        }

        /* Touch device optimizations */
        @media (max-width: 768px) {
          /* Increase touch targets */
          .feature-card {
            min-height: 44px;
          }

          /* Simplify hover effects for touch */
          .feature-card:hover {
            transform: none !important;
          }

          /* Active state for touch feedback */
          .feature-card:active {
            transform: scale(0.98) !important;
            background: rgba(255, 255, 255, 0.95) !important;
          }

          /* Reduce animations for performance */
          .feature-card {
            animation: none;
          }
        }

        /* Improve readability on small screens */
        @media (max-width: 768px) {
          .feature-description {
            line-height: 1.5 !important;
          }

          .feature-detail span {
            line-height: 1.4;
          }
        }

        /* Prevent horizontal scrolling */
        @media (max-width: 768px) {
          .features-grid {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>

      <section
        id="features"
        style={{
          padding: '6rem 0',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          fontFamily: "'Inter', sans-serif",
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background Elements */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <div
            className="background-element"
            style={{
              position: 'absolute',
              top: '10%',
              right: '10%',
              width: '300px',
              height: '300px',
              background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.05), rgba(139, 92, 246, 0.05))',
              borderRadius: '50%',
              filter: 'blur(40px)'
            }}
          />
          
          <div
            className="background-element"
            style={{
              position: 'absolute',
              bottom: '20%',
              left: '5%',
              width: '250px',
              height: '250px',
              background: 'linear-gradient(45deg, rgba(16, 185, 129, 0.05), rgba(59, 130, 246, 0.05))',
              borderRadius: '50%',
              filter: 'blur(30px)'
            }}
          />
        </div>

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
          position: 'relative'
        }}>
          {/* Header */}
          <div
            className="fade-in-up"
            style={{
              textAlign: 'center',
              marginBottom: '4rem'
            }}
          >
            <h2 style={{
              fontSize: '3rem',
              fontWeight: '800',
              marginBottom: '1rem',
              color: '#1a202c',
              lineHeight: '1.1'
            }}>
              Advanced Domain
              <span style={{
                background: 'linear-gradient(45deg, #3B82F6, #8B5CF6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'block',
                marginTop: '0.5rem'
              }}>
                Intelligence Suite
              </span>
            </h2>
            <p style={{
              fontSize: '1.2rem',
              color: '#64748b',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: '1.6',
              fontWeight: '400'
            }}>
              Unlock powerful insights with our comprehensive toolkit designed for{' '}
              <span style={{ color: '#3B82F6', fontWeight: '600' }}>developers, analysts, and businesses</span>
            </p>
          </div>

          {/* Features Grid */}
          <div
            className="features-grid stagger-animation"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '2rem',
              position: 'relative'
            }}
          >
            {features.map((feature, index) => (
              <div
                key={index}
                className={`feature-card ${activeCard === index ? 'mobile-active' : ''}`}
                onMouseEnter={() => !isMobile && setActiveCard(index)}
                onMouseLeave={() => !isMobile && setActiveCard(null)}
                onClick={() => handleCardClick(index)}
                style={{
                  background: 'white',
                  padding: '2.5rem',
                  borderRadius: '20px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                  border: `1px solid rgba(0,0,0,0.05)`,
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transform: (isMobile && activeCard === index) ? 'translateY(-4px)' : 'translateY(0)',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Pattern Background */}
                <PatternBackground pattern={feature.pattern} color={feature.color} />

                {/* Creative Accent Line */}
                <div
                  className="accent-line"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '4px',
                    borderRadius: '2px',
                    width: (isMobile || activeCard === index) ? '100%' : '60px',
                    background: `linear-gradient(90deg, ${feature.color}, ${feature.color}80)`,
                    transition: 'width 0.3s ease'
                  }}
                />

                <div style={{ position: 'relative', zIndex: 2 }}>
                  {/* Icon Container */}
                  <div
                    className="feature-icon"
                    style={{
                      width: '70px',
                      height: '70px',
                      borderRadius: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      marginBottom: '1.5rem',
                      boxShadow: `0 8px 25px ${feature.color}30`,
                      background: `linear-gradient(135deg, ${feature.color}, ${feature.color}80)`,
                      transform: (isMobile && activeCard === index) ? 'scale(1.05)' : 'scale(1)',
                      transition: 'transform 0.3s ease'
                    }}
                  >
                    {feature.icon}
                  </div>

                  {/* Title */}
                  <h3
                    className="feature-title"
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      marginBottom: '1rem',
                      lineHeight: '1.2',
                      color: (isMobile && activeCard === index) ? feature.color : '#1a202c',
                      transition: 'color 0.3s ease'
                    }}
                  >
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p
                    className="feature-description"
                    style={{
                      fontSize: '1rem',
                      color: '#64748b',
                      lineHeight: '1.6',
                      marginBottom: '2rem',
                      fontWeight: '400'
                    }}
                  >
                    {feature.description}
                  </p>

                  {/* Features List */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.8rem'
                  }}>
                    {feature.details.map((detail, detailIndex) => (
                      <div
                        key={detailIndex}
                        className="feature-detail"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.8rem',
                          padding: '0.8rem 1rem',
                          borderRadius: '10px',
                          border: `1px solid ${feature.color}10`,
                          background: 'rgba(255,255,255,0.8)',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            color: 'white',
                            fontWeight: 'bold',
                            flexShrink: 0,
                            background: `linear-gradient(135deg, ${feature.color}, ${feature.color}80)`
                          }}
                        >
                          ✓
                        </div>
                        <span style={{
                          color: '#374151',
                          fontSize: '0.95rem',
                          fontWeight: '500'
                        }}>
                          {detail}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Floating Action */}
                  <div
                    className="floating-action"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginTop: '2rem',
                      padding: '0.8rem',
                      background: `linear-gradient(90deg, ${feature.color}08, ${feature.color}15)`,
                      borderRadius: '10px',
                      border: `1px solid ${feature.color}20`,
                      opacity: (isMobile || activeCard === index) ? 1 : 0,
                      transform: `translateY(${(isMobile || activeCard === index) ? 0 : 10}px)`,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: feature.color
                      }}
                    >
                      Learn more
                    </span>
                    <span
                      style={{
                        fontSize: '1rem',
                        color: feature.color,
                        transform: (isMobile || activeCard === index) ? 'translateX(5px)' : 'translateX(0)',
                        transition: 'transform 0.3s ease'
                      }}
                    >
                      →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default FeaturesSection
