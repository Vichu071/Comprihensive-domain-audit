import React, { useState, useEffect } from 'react'

const FeaturesSection = () => {
  const [hoveredCard, setHoveredCard] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if mobile on mount and on resize
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
          <pattern id={`circles-${color}`} width="60" height="60" patternUnits="userSpaceOnUse">
            <circle cx="30" cy="30" r="3" fill={color} />
            <circle cx="10" cy="10" r="2" fill={color} />
            <circle cx="50" cy="20" r="2" fill={color} />
          </pattern>
          <rect width="100%" height="100%" fill={`url(#circles-${color})`} />
        </svg>
      ),
      grid: (
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.03 }}>
          <pattern id={`grid-${color}`} width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke={color} strokeWidth="1"/>
          </pattern>
          <rect width="100%" height="100%" fill={`url(#grid-${color})`} />
        </svg>
      ),
      waves: (
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.03 }}>
          <pattern id={`waves-${color}`} width="80" height="40" patternUnits="userSpaceOnUse">
            <path d="M0 20 Q20 10,40 20 T80 20" stroke={color} strokeWidth="1" fill="none"/>
          </pattern>
          <rect width="100%" height="100%" fill={`url(#waves-${color})`} />
        </svg>
      ),
      shields: (
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.03 }}>
          <pattern id={`shields-${color}`} width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M25 5 L45 15 L45 35 L25 45 L5 35 L5 15 Z" stroke={color} strokeWidth="1" fill="none"/>
          </pattern>
          <rect width="100%" height="100%" fill={`url(#shields-${color})`} />
        </svg>
      ),
      dots: (
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.03 }}>
          <pattern id={`dots-${color}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1.5" fill={color} />
          </pattern>
          <rect width="100%" height="100%" fill={`url(#dots-${color})`} />
        </svg>
      ),
      lines: (
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.03 }}>
          <pattern id={`lines-${color}`} width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M0 30 L30 0" stroke={color} strokeWidth="1" fill="none"/>
          </pattern>
          <rect width="100%" height="100%" fill={`url(#lines-${color})`} />
        </svg>
      )
    }

    return patterns[pattern] || patterns.circles
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        .features-section * {
          box-sizing: border-box;
        }
        
        .feature-card {
          transition: all 0.3s ease;
          cursor: pointer;
          width: 100%;
        }

        .feature-card:hover {
          transform: ${isMobile ? 'none' : 'translateY(-8px)'};
        }

        .feature-icon {
          transition: all 0.3s ease;
        }

        .feature-card:hover .feature-icon {
          transform: ${isMobile ? 'none' : 'scale(1.1)'};
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

        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          .features-section {
            padding: 3rem 0 !important;
          }

          .features-container {
            padding: 0 1rem !important;
            max-width: 100% !important;
          }

          .features-header h2 {
            font-size: 1.8rem !important;
            line-height: 1.2 !important;
            text-align: center;
          }

          .features-header p {
            font-size: 1rem !important;
            padding: 0 0.5rem;
            margin-bottom: 2.5rem !important;
            text-align: center;
          }

          .features-grid {
            grid-template-columns: 1fr !important;
            gap: 1.2rem !important;
            width: 100%;
          }

          .feature-card {
            padding: 1.5rem 1.2rem !important;
            margin: 0 auto;
            max-width: 100%;
            border-radius: 16px !important;
            min-height: auto !important;
          }

          .feature-icon {
            width: 55px !important;
            height: 55px !important;
            border-radius: 14px !important;
            font-size: 1.4rem !important;
            margin-bottom: 1rem !important;
          }

          .feature-title {
            font-size: 1.25rem !important;
            margin-bottom: 0.8rem !important;
          }

          .feature-description {
            font-size: 0.9rem !important;
            margin-bottom: 1.2rem !important;
            line-height: 1.5 !important;
          }

          .feature-detail {
            padding: 0.6rem 0.8rem !important;
            font-size: 0.85rem !important;
            min-height: auto !important;
          }

          .feature-detail span {
            font-size: 0.85rem !important;
            line-height: 1.4;
          }

          .floating-action {
            margin-top: 1.2rem !important;
            padding: 0.6rem !important;
          }

          .background-element {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .features-section {
            padding: 2.5rem 0 !important;
          }

          .features-header h2 {
            font-size: 1.6rem !important;
          }

          .features-header p {
            font-size: 0.95rem !important;
            margin-bottom: 2rem !important;
          }

          .feature-card {
            padding: 1.2rem 1rem !important;
            border-radius: 14px !important;
          }

          .feature-icon {
            width: 50px !important;
            height: 50px !important;
            font-size: 1.2rem !important;
          }

          .feature-title {
            font-size: 1.1rem !important;
          }

          .feature-description {
            font-size: 0.85rem !important;
          }

          .feature-detail {
            padding: 0.5rem 0.7rem !important;
            font-size: 0.8rem !important;
          }

          .features-grid {
            gap: 1rem !important;
          }
        }

        /* Tablet responsive styles */
        @media (min-width: 769px) and (max-width: 1024px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 1.5rem !important;
          }

          .feature-card {
            padding: 2rem 1.5rem !important;
          }

          .features-header h2 {
            font-size: 2.5rem !important;
          }

          .features-header p {
            font-size: 1.1rem !important;
          }
        }

        /* Large desktop adjustments */
        @media (min-width: 1440px) {
          .features-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 2rem !important;
          }

          .feature-card {
            padding: 2.5rem 2rem !important;
          }
        }

        /* Touch device optimizations */
        @media (max-width: 768px) {
          .feature-card:active {
            transform: scale(0.98) !important;
            background: rgba(255, 255, 255, 0.95) !important;
          }
        }

        /* Performance optimizations */
        @media (max-width: 768px) {
          .feature-card {
            animation: none;
            transition: none;
          }
          
          .feature-icon {
            transition: none;
          }
        }
      `}</style>

      <section
        id="features"
        className="features-section"
        style={{
          padding: '5rem 0',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          position: 'relative',
          overflow: 'hidden',
          width: '100%'
        }}
      >
        {/* Background Elements - Hidden on mobile */}
        {!isMobile && (
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
        )}

        <div 
          className="features-container"
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 1.5rem',
            position: 'relative',
            width: '100%'
          }}
        >
          {/* Header */}
          <div
            className="features-header fade-in-up"
            style={{
              textAlign: 'center',
              marginBottom: '3rem',
              width: '100%'
            }}
          >
            <h2 style={{
              fontSize: '2.8rem',
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
              fontSize: '1.15rem',
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
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.5rem',
              position: 'relative',
              width: '100%'
            }}
          >
            {features.map((feature, index) => (
              <div
                key={index}
                className="feature-card fade-in-up"
                onMouseEnter={() => !isMobile && setHoveredCard(index)}
                onMouseLeave={() => !isMobile && setHoveredCard(null)}
                onClick={() => isMobile && setHoveredCard(hoveredCard === index ? null : index)}
                style={{
                  background: 'white',
                  padding: '2rem',
                  borderRadius: '18px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
                  border: `1px solid rgba(0,0,0,0.04)`,
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: isMobile ? 'pointer' : 'default',
                  minHeight: isMobile ? 'auto' : '400px'
                }}
              >
                {/* Pattern Background */}
                <PatternBackground pattern={feature.pattern} color={feature.color} />

                {/* Creative Accent Line */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '4px',
                    borderRadius: '2px',
                    width: hoveredCard === index ? '100%' : '60px',
                    background: `linear-gradient(90deg, ${feature.color}, ${feature.color}80)`,
                    transition: 'width 0.3s ease'
                  }}
                />

                <div style={{ position: 'relative', zIndex: 2, height: '100%' }}>
                  {/* Icon Container */}
                  <div
                    className="feature-icon"
                    style={{
                      width: '65px',
                      height: '65px',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.8rem',
                      marginBottom: '1.2rem',
                      boxShadow: `0 6px 20px ${feature.color}25`,
                      background: `linear-gradient(135deg, ${feature.color}, ${feature.color}80)`
                    }}
                  >
                    {feature.icon}
                  </div>

                  {/* Title */}
                  <h3
                    className="feature-title"
                    style={{
                      fontSize: '1.35rem',
                      fontWeight: '700',
                      marginBottom: '0.8rem',
                      lineHeight: '1.2',
                      color: hoveredCard === index ? feature.color : '#1a202c',
                      transition: 'color 0.3s ease'
                    }}
                  >
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p
                    className="feature-description"
                    style={{
                      fontSize: '0.95rem',
                      color: '#64748b',
                      lineHeight: '1.6',
                      marginBottom: '1.5rem',
                      fontWeight: '400'
                    }}
                  >
                    {feature.description}
                  </p>

                  {/* Features List */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem'
                  }}>
                    {feature.details.map((detail, detailIndex) => (
                      <div
                        key={detailIndex}
                        className="feature-detail"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.7rem',
                          padding: '0.7rem 0.9rem',
                          borderRadius: '10px',
                          border: `1px solid ${feature.color}10`,
                          background: 'rgba(255,255,255,0.8)',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <div
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
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
                          fontSize: '0.9rem',
                          fontWeight: '500'
                        }}>
                          {detail}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Floating Action - Only show on hover for desktop */}
                  {!isMobile && (
                    <div
                      className="floating-action"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginTop: '1.5rem',
                        padding: '0.7rem',
                        background: `linear-gradient(90deg, ${feature.color}08, ${feature.color}15)`,
                        borderRadius: '8px',
                        border: `1px solid ${feature.color}20`,
                        opacity: hoveredCard === index ? 1 : 0,
                        transform: `translateY(${hoveredCard === index ? 0 : 8}px)`,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          color: feature.color
                        }}
                      >
                        Learn more
                      </span>
                      <span
                        style={{
                          fontSize: '0.9rem',
                          color: feature.color,
                          transform: hoveredCard === index ? 'translateX(3px)' : 'translateX(0)',
                          transition: 'transform 0.3s ease'
                        }}
                      >
                        →
                      </span>
                    </div>
                  )}
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
