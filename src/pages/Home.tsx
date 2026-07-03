import React, { useMemo, useState } from 'react'
import homeHeaderBackground from 'src/images/home_header_background.png'
import duosLogoImg from 'src/images/duos_logo.svg'
import duosDiagram from 'src/images/DUOS_Homepage_diagram.svg'
import broadLogo from 'src/images/broad_logo_allwhite.png'
import dacIcon from 'src/images/dac_icon.svg'
import signingOfficialIcon from 'src/images/icon_add_user.png'
import datasetIcon from 'src/images/icon_dataset_.png'
import { OverflowTooltip } from 'src/components/Tooltips'
import { Link, useLocation } from 'react-router-dom'
import { getLibraryVersions } from 'src/libs/libraryVersions'
import { handleSignIn } from 'src/libs/signInUtils'
import { SupportRequestModal } from 'src/components/modals/SupportRequestModal'

export interface HomeProps {
  isLogged: boolean
}

const homeTitle: React.CSSProperties = {
  color: '#FFFFFF',
  fontFamily: 'Montserrat',
  fontSize: '28px',
  fontWeight: 600,
  textAlign: 'center',
  padding: '0 5rem',
}

const homeBannerDescription: React.CSSProperties = {
  color: '#FFFFFF',
  fontFamily: 'Montserrat',
  fontSize: '20px',
  textAlign: 'center',
  whiteSpace: 'pre-wrap',
  padding: '0 10rem',
}

const duosLogoStyle: React.CSSProperties = {
  height: '80px',
  width: '300px',
  display: 'block',
  margin: '0 auto 3rem',
  padding: '0 3rem',
}

const header: React.CSSProperties = {
  color: '#1F3B50',
  fontFamily: 'Montserrat',
  fontSize: '24px',
  fontWeight: 600,
  textAlign: 'center',
  padding: '0 5rem',
}

const subHeader: React.CSSProperties = {
  color: '#1F3B50',
  fontFamily: 'Montserrat',
  fontSize: '16px',
  textAlign: 'center',
  whiteSpace: 'pre-wrap',
  padding: '0 5rem',
}

const description: React.CSSProperties = {
  color: '#1F3B50',
  fontFamily: 'Montserrat',
  fontSize: '14px',
  textAlign: 'center',
  textIndent: '10px',
  whiteSpace: 'pre-wrap',
  padding: '10px 1rem',
}

const logoGrid: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2rem',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  maxWidth: '1400px',
  margin: '0 auto',
}

const baseCard: React.CSSProperties = {
  width: '320px',
  height: '160px',
  borderRadius: '6px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  overflow: 'hidden',
}

const logoImg: React.CSSProperties = {
  maxWidth: '100%',
  maxHeight: '100%',
  objectFit: 'contain',
  display: 'block',
}

const CheckIcon = ({ color }: { color: string }) => (
  <svg className="check-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="8" fill={color} fillOpacity="0.15" />
    <path d="M4.5 8.2L6.8 10.5L11.5 5.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const Home = ({ isLogged }: Readonly<HomeProps>) => {
  const location = useLocation()
  const [showContactModal, setShowContactModal] = useState(false)

  const featuredLibraries = useMemo(() => {
    const allLibraries = getLibraryVersions(null, null)
    return Object.entries(allLibraries)
      .filter(([_key, library]) => library.featured)
      .map(([key, library]) => ({ key, ...library }))
      .sort((a, b) => {
        if (a.order !== b.order) {
          return a.order - b.order
        }
        return a.key.localeCompare(b.key)
      })
  }, [])

  return (
    <>
      <style>
        {`
        .logo-card {
          width: 320px;
          height: 160px;
        }
        .library-item {
          width: 344px;
          height: 240px;
          border: 1.5px solid rgba(0, 0, 0, 0.08);
          border-radius: 12px;
          padding: 0.75rem;
          cursor: pointer;
          box-sizing: border-box;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }
        .library-item:hover {
          transform: translateY(-4px) scale(1.03);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.13);
          border-color: rgba(0, 0, 0, 0.18);
        }
        .library-item-label {
          height: 44px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          overflow: hidden;
        }

        /* Audience cards */
        .audience-cards-grid {
          display: flex;
          gap: 2rem;
          justify-content: center;
          flex-wrap: wrap;
          max-width: 1120px;
          margin: 0 auto;
        }
        .audience-card {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          border-top: 5px solid transparent;
          padding: 2.25rem 2rem 2rem;
          width: 320px;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-sizing: border-box;
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }
        .audience-card:hover {
          box-shadow: 0 8px 28px rgba(0,0,0,0.14);
          transform: translateY(-3px);
        }
        .audience-card-icon-wrap {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
          flex-shrink: 0;
        }
        .audience-card-title {
          font-family: Montserrat, sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #1F3B50;
          margin: 0 0 0.4rem;
          text-align: center;
        }
        .audience-card-tagline {
          font-family: Montserrat, sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #6b7280;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin: 0 0 1.4rem;
        }
        .audience-card-features {
          list-style: none;
          padding: 0;
          margin: 0 0 1.75rem;
          width: 100%;
          flex: 1;
        }
        .audience-card-features li {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          font-family: Montserrat, sans-serif;
          font-size: 14px;
          color: #374151;
          padding: 0.45rem 0;
          line-height: 1.5;
        }
        .audience-card-features li .check-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }
        .audience-card-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.6rem;
          width: 100%;
          margin-top: auto;
        }
        .audience-cta-primary {
          font-family: Montserrat, sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          background: #1F3B50;
          border: none;
          border-radius: 6px;
          padding: 10px 22px;
          cursor: pointer;
          width: 100%;
          text-align: center;
          text-decoration: none;
          display: inline-block;
          transition: background 0.18s ease;
        }
        .audience-cta-primary:hover {
          background: #2d5470;
          color: #ffffff;
        }
        .audience-cta-primary-teal {
          background: #00928A;
        }
        .audience-cta-primary-teal:hover {
          background: #007a73;
        }
        .audience-cta-secondary {
          font-family: Montserrat, sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #00609f;
          background: none;
          border: none;
          cursor: pointer;
          text-decoration: none;
          padding: 2px 0;
          transition: color 0.15s ease;
        }
        .audience-cta-secondary:hover {
          color: #004c7e;
          text-decoration: underline;
        }
        .audience-section-eyebrow {
          font-family: Montserrat, sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #9ca3af;
          text-align: center;
          margin-bottom: 0.75rem;
        }
        .audience-section-heading {
          font-family: Montserrat, sans-serif;
          font-size: 26px;
          font-weight: 700;
          color: #1F3B50;
          text-align: center;
          margin: 0 0 0.5rem;
        }
        .audience-section-subheading {
          font-family: Montserrat, sans-serif;
          font-size: 15px;
          color: #6b7280;
          text-align: center;
          margin: 0 0 2.75rem;
        }
        @media (max-width: 768px) {
          .logo-card {
            width: 280px;
            height: 140px;
          }
          .library-item {
            width: 304px;
            height: 220px;
          }
          .logo-grid {
            gap: 1.5rem !important;
          }
          .audience-card {
            width: 100%;
            max-width: 400px;
          }
        }
        @media (max-width: 480px) {
          .logo-card {
            width: 100%;
            max-width: 320px;
            height: 160px;
          }
          .library-item {
            width: 100%;
            max-width: 344px;
            height: 240px;
          }
          .logo-grid {
            gap: 1rem !important;
          }
        }
      `}
      </style>
      <div className="row">
        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
          <div className="row" style={{ backgroundColor: 'white', height: '350px', position: 'relative', margin: '-20px auto auto 0' }}>
            <img style={{ height: 'inherit', minWidth: '100%' }} src={homeHeaderBackground} alt="Home header background" />
            <div style={{ position: 'absolute', width: '100%', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
              <img style={duosLogoStyle} alt="DUOS logo" src={duosLogoImg} />
              <h1 style={homeTitle}>Data Use Oversight System</h1>
              <div className="hidden-xs" style={homeBannerDescription}>
                Access data faster.
                {' '}
              </div>
            </div>
          </div>
          <div style={{ background: '#eff0f2', padding: '64px 24px 80px' }}>
            <p className="audience-section-eyebrow">Who uses DUOS?</p>
            <h2 className="audience-section-heading">Built for every role in data sharing</h2>
            <p className="audience-section-subheading">Whether you oversee access, authorize researchers, or need data for your work — DUOS has you covered.</p>
            <div className="audience-cards-grid">

              {/* DACs card */}
              <div className="audience-card" style={{ borderTopColor: '#1F3B50' }}>
                <div className="audience-card-icon-wrap" style={{ background: 'rgba(31,59,80,0.1)' }}>
                  <img src={dacIcon} alt="" style={{ width: '44px', height: '44px' }} />
                </div>
                <h3 className="audience-card-title">DUOS for DACs</h3>
                <p className="audience-card-tagline">Streamline access oversight</p>
                <ul className="audience-card-features">
                  <li>
                    <CheckIcon color="#1F3B50" />
                    Centralized review of all incoming data access requests
                  </li>
                  <li>
                    <CheckIcon color="#1F3B50" />
                    Automated consent-code matching to research purposes
                  </li>
                  <li>
                    <CheckIcon color="#1F3B50" />
                    Audit-ready compliance tracking across every request
                  </li>
                </ul>
                <div className="audience-card-actions">
                  <button
                    type="button"
                    className="audience-cta-primary"
                    onClick={() => setShowContactModal(true)}
                  >
                    Request a Meeting
                  </button>
                  <a
                    id="blog-support-dac-link"
                    href="https://duos.blog/help/dacguide/"
                    target="_blank"
                    rel="noreferrer"
                    className="audience-cta-secondary"
                  >
                    Read the DAC Guide →
                  </a>
                </div>
              </div>

              {/* Signing Officials card */}
              <div className="audience-card" style={{ borderTopColor: '#00609f' }}>
                <div className="audience-card-icon-wrap" style={{ background: 'rgba(0,96,159,0.1)' }}>
                  <img src={signingOfficialIcon} alt="" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                </div>
                <h3 className="audience-card-title">DUOS for Signing Officials</h3>
                <p className="audience-card-tagline">Authorize your institution&#39;s researchers</p>
                <ul className="audience-card-features">
                  <li>
                    <CheckIcon color="#00609f" />
                    Promote and share your institution&#39;s data
                  </li>
                  <li>
                    <CheckIcon color="#00609f" />
                    Enable your PIs to request controlled-access datasets
                  </li>
                  <li>
                    <CheckIcon color="#00609f" />
                    Simple one-time setup — no repeat steps per dataset
                  </li>
                </ul>
                <div className="audience-card-actions">
                  <a
                    id="blog-support-so-link"
                    href="https://duos.blog/help/preauthorize_researchers_librarycards/"
                    target="_blank"
                    rel="noreferrer"
                    className="audience-cta-primary"
                    style={{ background: '#00609f', textDecoration: 'none' }}
                  >
                    Signing Official Guide
                  </a>
                  <span className="audience-cta-secondary" style={{ fontSize: '12px', color: '#9ca3af' }}>
                    Sign in to get started
                  </span>
                </div>
              </div>

              {/* Looking for Data card */}
              <div className="audience-card" style={{ borderTopColor: '#00928A' }}>
                <div className="audience-card-icon-wrap" style={{ background: 'rgba(0,146,138,0.1)' }}>
                  <img src={datasetIcon} alt="" style={{ width: '44px', height: '44px', objectFit: 'contain' }} />
                </div>
                <h3 className="audience-card-title">Looking for Data?</h3>
                <p className="audience-card-tagline">Access hundreds of curated datasets</p>
                <ul className="audience-card-features">
                  <li>
                    <CheckIcon color="#00928A" />
                    Browse datasets from leading genomics &amp; biomedical programs
                  </li>
                  <li>
                    <CheckIcon color="#00928A" />
                    Submit access requests directly through DUOS
                  </li>
                  <li>
                    <CheckIcon color="#00928A" />
                    Integrated with Terra, AnVIL, and other platforms
                  </li>
                </ul>
                <div className="audience-card-actions">
                  <button
                    type="button"
                    className="audience-cta-primary audience-cta-primary-teal"
                    onClick={() => handleSignIn('/datalibrary')}
                  >
                    Sign In to Browse Data
                  </button>
                  <span className="audience-cta-secondary" style={{ fontSize: '12px', color: '#9ca3af' }}>
                    Search 1,000s of datasets and scientific assets
                  </span>
                </div>
              </div>
            </div>
            <SupportRequestModal
              showModal={showContactModal}
              onCloseRequest={() => setShowContactModal(false)}
              url={location.pathname}
            />
          </div>

          <section style={{ margin: '5rem auto', padding: '0 2rem' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', textAlign: 'center' }}>
              <p style={header}>Search Data Libraries in DUOS</p>
              <p style={description}>
                Institutions, programs, and studies use curated Data Libraries to showcase their science! Check out the options below and contact us to request your own.
              </p>

              <div style={logoGrid} className="logo-grid">
                {featuredLibraries.map((library) => {
                  const libraryPath = library.key.startsWith('/') ? library.key : `/datalibrary/${library.key}`
                  const libraryName = library.title.replace(' Data Library', '')
                  const tooltipText = isLogged
                    ? libraryName
                    : `Please login to access ${libraryName} Data Library`

                  const label = libraryName

                  const cardStyle: React.CSSProperties = library.key === 'broad'
                    ? { ...baseCard, background: '#1F3B50', padding: '15px' }
                    : baseCard

                  const logoSrc = library.key === 'broad'
                    ? broadLogo
                    : library.icon ?? undefined

                  return (
                    <OverflowTooltip key={library.key} id={library.key} tooltipText={tooltipText}>
                      <div className="library-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="logo-card" style={cardStyle}>
                          <Link
                            to={isLogged ? libraryPath : '#'}
                            onClick={(e) => {
                              if (!isLogged) {
                                e.preventDefault()
                                handleSignIn(libraryPath)
                              }
                            }}
                            style={{ textDecoration: 'none', display: 'flex', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                          >
                            {logoSrc
                              ? (
                                  <img
                                    src={logoSrc}
                                    alt={libraryName}
                                    loading="lazy"
                                    style={{
                                      ...logoImg,
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'contain',
                                      objectPosition: 'center',
                                    }}
                                  />
                                )
                              : (
                                  <span style={{ fontSize: '18px', fontWeight: 700, color: '#1F3B50', textAlign: 'center', padding: '0 1rem' }}>
                                    {libraryName}
                                  </span>
                                )}
                          </Link>
                        </div>
                        {label && (
                          <div
                            className="library-item-label"
                            style={{
                              fontSize: '16px',
                              color: '#333',
                              textAlign: 'center',
                              fontWeight: '600',
                              wordWrap: 'break-word',
                              width: '100%',
                            }}
                          >
                            {label}
                          </div>
                        )}
                      </div>
                    </OverflowTooltip>
                  )
                })}
              </div>
            </div>
          </section>
          <div className="row">
            <div style={{ margin: '5rem auto 0', backgroundColor: 'white' }}>
              <h1 style={header}>How does DUOS expedite compliant data sharing?</h1>
              <h3 style={subHeader}>
                Researchers use DUOS to share and request access to data, and data access committees
                {' '}
                <br />
                {' '}
                and institutional officials use DUOS to review and approve research uses of the data.
              </h3>
              <div>
                <img className="col-sm-10 hidden-xs" style={{ padding: '1rem', margin: 'auto 8.25% 8.25% 8.25%' }} alt="What is DUOS graphic" src={duosDiagram} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Home
