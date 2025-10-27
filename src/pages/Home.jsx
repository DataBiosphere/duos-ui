import React, { useMemo } from 'react'
import homeHeaderBackground from '../images/home_header_background.png'
import duosLogoImg from '../images/duos_logo.svg'
import duosDiagram from '../images/DUOS_Homepage_diagram.svg'
import broadLogo from '../images/broad_logo_allwhite.png'
import { OverflowTooltip } from '../components/Tooltips'
import { Link } from 'react-router-dom'
import { getLibraryVersions } from '../libs/libraryVersions'

const Home = (props) => {
  const { isLogged } = props

  // Get all library versions and filter for featured ones
  const featuredLibraries = useMemo(() => {
    const allLibraries = getLibraryVersions(null, null, null)
    return Object.entries(allLibraries)
      .filter(([key, library]) => library.featured)
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
    boxShadow: '0 1px 4px rgba(58, 36, 36, 0.06)',
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

  const handleSignIn = (redirectPath) => {
    // Set the redirectTo parameter without forcing a page reload
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set('redirectTo', redirectPath)
    window.history.replaceState({}, '', currentUrl)

    // Find the existing sign-in button in the header and programmatically click it
    // This will trigger the existing authentication flow with all proper session handling
    const signInButtons = document.querySelectorAll('button')
    const signInButton = Array.from(signInButtons).find(button =>
      button.textContent && button.textContent.trim() === 'Sign In',
    )
    if (signInButton) {
      signInButton.click()
    }
    else {
      // Fallback - scroll to top where the sign-in button is located
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
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
                Get data faster.
                {' '}
              </div>
            </div>
          </div>
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
                <img className="col-sm-10 hidden-xs" style={{ padding: '1rem', margin: 'auto 8.25%' }} alt="What is DUOS graphic" src={duosDiagram} />
              </div>
            </div>
          </div>
          <div className="row" style={{ background: '#eff0f2', margin: '50px 0', padding: '48px 0 60px 0' }}>
            <div className="col-lg-4 col-md-4">
              <p style={header}>DUOS for DACs</p>
              <p style={description}>
                DACs can swiftly manage data access requests
                <br />
                {' '}
                and clearly track data use compliance.
              </p>
              <div className="row" style={{ display: 'flex', justifyContent: 'center' }}>
                <a id="blog-support-dac-link" href="https://duos.blog/help/dacguide/" target="_blank" rel="noreferrer" style={{ color: '#1F3B50', fontSize: '16px', fontWeight: 500 }}>LEARN MORE</a>
              </div>
            </div>
            <div className="col-lg-4 col-md-4 ">
              <p style={header}>Approving your researchers to submit or request data?</p>
              <p style={description}>Signing Officials can login to request status to approve researchers or click below to learn more about our expedite data access agreements</p>
              <div className="row" style={{ display: 'flex', justifyContent: 'center' }}>
                <a href="https://duos.blog/help/preauthorize_researchers_librarycards/" target="_blank" rel="noreferrer" id="blog-support-so-link" style={{ color: '#1F3B50', fontSize: '16px', fontWeight: 500 }}>LEARN MORE</a>
              </div>
            </div>
            <div className="col-lg-4 col-md-4">
              <p style={header}>Looking for data?</p>
              <p style={description}>Find and request access to 100s of datasets now!</p>
              <div className="row" style={{ display: 'flex', justifyContent: 'center' }}>
                <a href="https://duos.org/datalibrary" id="data-library-link" target="_blank" rel="noreferrer" style={{ color: '#1F3B50', fontSize: '16px', fontWeight: 500 }}>LEARN MORE</a>
              </div>
            </div>
          </div>

          <section style={{ margin: '5rem auto', padding: '0 2rem' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', textAlign: 'center' }}>
              <p style={header}>Search Data Libraries in DUOS</p>
              <p style={description}>
                Explore curated Data Libraries for studies, programs, and institutions below. Contact us to request your own!
              </p>

              <div style={logoGrid} className="logo-grid">
                {featuredLibraries.map((library) => {
                  const libraryPath = `/datalibrary/${library.key}`
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
                            <img src={logoSrc} alt={libraryName} style={logoImg} />
                          </Link>
                        </div>
                        {label && (
                          <div style={{
                            fontSize: '14px',
                            color: '#333',
                            textAlign: 'center',
                            fontWeight: '500',
                            maxWidth: '320px',
                            wordWrap: 'break-word'
                          }}>
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
        </div>
      </div>
    </>
  )
}

export default Home
