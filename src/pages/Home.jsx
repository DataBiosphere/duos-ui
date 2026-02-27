import React, { useMemo, useState } from 'react'
import homeHeaderBackground from '../images/home_header_background.png'
import duosLogoImg from '../images/duos_logo.svg'
import duosDiagram from '../images/DUOS_Homepage_diagram.svg'
import broadLogo from '../images/broad_logo_allwhite.png'
import { OverflowTooltip } from '../components/Tooltips'
import { Link } from 'react-router-dom'
import { getLibraryVersions } from '../libs/libraryVersions'
import { handleSignIn } from 'src/libs/signInUtils'
import { SupportRequestModal } from '../components/modals/SupportRequestModal'
import { useLocation } from 'react-router-dom'

const Home = (props) => {
  const { isLogged } = props

  const location = useLocation()
  const [showContactModal, setShowContactModal] = useState(false)

  // Get all library versions and filter for featured ones
  const featuredLibraries = useMemo(() => {
    const allLibraries = getLibraryVersions(null, null)
    return Object.entries(allLibraries)
      .filter(([_key, library]) => library.featured)
      .map(([key, library]) => ({ key, ...library }))
      .sort((a, b) => {
        // Sort by order first, then alphabetically by key as fallback
        if (a.order !== b.order) {
          return a.order - b.order
        }
        return a.key.localeCompare(b.key)
      })
  }, [])

  const homeTitle = {
    color: '#FFFFFF',
    fontFamily: 'Montserrat',
    fontSize: '28px',
    fontWeight: 600,
    textAlign: 'center',
    padding: '0 5rem',
  }

  const homeBannerDescription = {
    color: '#FFFFFF',
    fontFamily: 'Montserrat',
    fontSize: '20px',
    textAlign: 'center',
    whiteSpace: 'pre-wrap',
    padding: '0 10rem',
  }

  const duosLogo = {
    height: '80px',
    width: '300px',
    display: 'block',
    margin: '0 auto 3rem',
    padding: '0 3rem',
  }

  const header = {
    color: '#1F3B50',
    fontFamily: 'Montserrat',
    fontSize: '24px',
    fontWeight: 600,
    textAlign: 'center',
    padding: '0 5rem',
  }

  const subHeader = {
    color: '#1F3B50',
    fontFamily: 'Montserrat',
    fontSize: '16px',
    textAlign: 'center',
    whiteSpace: 'pre-wrap',
    padding: '0 5rem',
  }

  const description = {
    color: '#1F3B50',
    fontFamily: 'Montserrat',
    fontSize: '14px',
    textAlign: 'center',
    textIndent: '10px',
    whiteSpace: 'pre-wrap',
    padding: '10px 1rem',
  }

  const logoGrid = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '2rem',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: '1400px',
    margin: '0 auto',
  }

  const baseCard = {
    width: '320px',
    height: '160px', // 2:1 aspect ratio
    borderRadius: '6px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden', // Prevent images from overflowing
  }

  const logoImg = {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    display: 'block',
  }

  return (
    <>
      <style>
        {`
        .logo-card {
          width: 320px;
          height: 160px;
        }
        @media (max-width: 768px) {
          .logo-card {
            width: 280px;
            height: 140px;
          }
          .logo-grid {
            gap: 1.5rem !important;
          }
        }
        @media (max-width: 480px) {
          .logo-card {
            width: 100%;
            max-width: 320px;
            height: 160px;
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
              <img style={duosLogo} alt="DUOS logo" src={duosLogoImg} />
              <h1 style={homeTitle}>Data Use Oversight System</h1>
              <div className="hidden-xs" style={homeBannerDescription}>
                Access data faster.
                {' '}
              </div>
            </div>
          </div>
          <div className="row" style={{ background: '#eff0f2', padding: '48px 0 60px 0' }}>
            <div className="col-lg-4 col-md-4">
              <p style={header}>DUOS for DACs</p>
              <p style={description}>
                Swiftly manage data access requests
                <br />
                {' '}
                and clearly track data use compliance.
                <br />
                {' '}
                Interested in using DUOS for your DAC?
                <br />
                {' '}
                Request a meeting with our team
                <br />
                <span
                  onClick={() => setShowContactModal(true)}
                  style={{ cursor: 'pointer', color: '#2FA4E7', textDecoration: 'underline' }}
                >
                  here
                </span> to learn more.
              </p>
              <SupportRequestModal
                showModal={showContactModal}
                onCloseRequest={() => setShowContactModal(false)}
                url={location.pathname}
              />
              <div className="row" style={{ display: 'flex', justifyContent: 'center' }}>
                <a id="blog-support-dac-link" href="https://duos.blog/help/dacguide/" target="_blank" rel="noreferrer" style={{ color: '#1F3B50', fontSize: '16px', fontWeight: 500 }}>LEARN MORE</a>
              </div>
            </div>
            <div className="col-lg-4 col-md-4 ">
              <p style={header}>DUOS for Signing Officials</p>
              <p style={description}>Grant permissions to principal investigators to request data.</p>
              <div className="row" style={{ display: 'flex', justifyContent: 'center' }}>
                <a href="https://duos.blog/help/preauthorize_researchers_librarycards/" target="_blank" rel="noreferrer" id="blog-support-so-link" style={{ color: '#1F3B50', fontSize: '16px', fontWeight: 500 }}>LEARN MORE</a>
              </div>
            </div>
            <div className="col-lg-4 col-md-4">
              <p style={header}>Looking for data?</p>
              <p style={description}>
                Find and request access to 100s of datasets through DUOS!
                <br />
                <span
                  onClick={() => handleSignIn()}
                  style={{ cursor: 'pointer', color: '#2FA4E7', textDecoration: 'underline' }}
                >
                  Sign in
                </span> to get started.
              </p>
            </div>
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

                  // Use the library name (title without "Data Library") as the label
                  const label = libraryName

                  // Special styling for Broad Institute (dark background)
                  const cardStyle = library.key === 'broad'
                    ? { ...baseCard, background: '#1F3B50', padding: '15px' }
                    : baseCard

                  // Special case for Broad logo to use the imported asset
                  const logoSrc = library.key === 'broad'
                    ? broadLogo
                    : library.icon

                  return (
                    <OverflowTooltip key={library.key} id={library.key} tooltipText={tooltipText}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
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
                          </Link>
                        </div>
                        {label && (
                          <div style={{
                            fontSize: '16px',
                            color: '#333',
                            textAlign: 'center',
                            fontWeight: '600',
                            maxWidth: '320px',
                            wordWrap: 'break-word',
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
