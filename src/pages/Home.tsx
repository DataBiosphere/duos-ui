import React, { useMemo, useState } from 'react'
import homeHeaderBackground from 'src/images/home_header_background.png'
import duosLogoImg from 'src/images/duos_logo.svg'
import duosDiagram from 'src/images/DUOS_Homepage_diagram.svg'
import broadLogo from 'src/images/broad_logo_allwhite.png'
import dacIcon from 'src/images/dac_icon.svg'
import signingOfficialIcon from 'src/images/icon_add_user.png'
import datasetIcon from 'src/images/icon_dataset_.png'
import datasetAddIcon from 'src/images/icon_dataset_add.png'
import documentIcon from 'src/images/icon-document.png'
import { OverflowTooltip } from 'src/components/Tooltips'
import { Link, useLocation, useNavigate } from 'react-router'
import { getLibraryVersions } from 'src/libs/libraryVersions'
import { handleSignIn } from 'src/libs/signInUtils'
import { SupportRequestModal } from 'src/components/modals/SupportRequestModal'
import 'src/styles/home.css'

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

const CheckIcon = () => (
  <svg className="check-icon" width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="8" cy="8" r="8" fill="currentColor" fillOpacity="0.12" />
    <path d="M4.5 8.2L6.8 10.5L11.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const MockWindow = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="mock-window">
    <div className="mock-bar">
      <i />
      <i />
      <i />
      <span>{title}</span>
    </div>
    <div className="mock-body">{children}</div>
  </div>
)

const MockRow = ({ dot, label, pill, muted = false }: { dot: string, label: string, pill: string, muted?: boolean }) => (
  <div className="mock-row">
    <span className="mock-row-lead">
      <span className="mock-dot">{dot}</span>
      {label}
    </span>
    <span className={muted ? 'mock-pill mock-pill--muted' : 'mock-pill'}>{pill}</span>
  </div>
)

const ResearcherPreview = () => (
  <MockWindow title="Data Access Request">
    <span className="mock-label">Application · 3 of 4 steps</span>
    <div className="mock-progress"><span style={{ width: '75%' }} /></div>
    <MockRow dot="✓" label="Datasets selected" pill="3 datasets" />
    <MockRow dot="✓" label="Research purpose" pill="Complete" />
    <MockRow dot="✓" label="Collaborators" pill="2 added" />
    <MockRow dot="4" label="Data Access Agreements" pill="In progress" muted />
  </MockWindow>
)

const SubmitterPreview = () => (
  <MockWindow title="Dataset registration">
    <span className="mock-label">Study</span>
    <div className="mock-skeleton" style={{ width: '72%' }} />
    <div className="mock-skeleton" style={{ width: '48%' }} />
    <span className="mock-label">Consent groups</span>
    <div className="mock-chips">
      <span className="mock-pill">General Research Use</span>
      <span className="mock-pill">Disease-Specific</span>
      <span className="mock-pill">Health/Medical/Biomedical</span>
    </div>
    <MockRow dot="✓" label="Data Access Committee" pill="Assigned" />
  </MockWindow>
)

const DacPreview = () => (
  <MockWindow title="Request review">
    <span className="mock-label">Research purpose</span>
    <div className="mock-skeleton" style={{ width: '84%' }} />
    <div className="mock-skeleton" style={{ width: '60%' }} />
    <MockRow dot="1" label="Dataset 1" pill="Approved" />
    <MockRow dot="2" label="Dataset 2" pill="Approved" />
    <MockRow dot="3" label="Dataset 3" pill="Vote pending" muted />
  </MockWindow>
)

const SigningOfficialPreview = () => (
  <MockWindow title="Library Cards">
    <span className="mock-label">Your institution&#39;s researchers</span>
    <MockRow dot="PI" label="Principal Investigator" pill="Card issued" />
    <MockRow dot="RS" label="Research Scientist" pill="Card issued" />
    <MockRow dot="PF" label="Postdoctoral Fellow" pill="DAA pending" muted />
  </MockWindow>
)

interface RoleSection {
  id: string
  name: string
  icon: string
  title: string
  summary: string
  features: { title: string, text: string }[]
  // Roles without a guide link get a button that opens the contact modal.
  guide?: { label: string, href: string }
  Preview: () => React.JSX.Element
}

const roleSections: RoleSection[] = [
  {
    id: 'researcher',
    name: 'Researchers',
    icon: documentIcon,
    title: 'Request controlled-access data in one application',
    summary: 'Find datasets in the Data Library, then submit a single request that DUOS routes to every responsible Data Access Committee.',
    features: [
      { title: 'Multi-dataset requests', text: 'Bundle datasets into one application, even across DACs.' },
      { title: 'Collaborators', text: 'Add internal and external collaborators to your request.' },
      { title: 'Agreements in-app', text: 'Review and accept required Data Access Agreements.' },
      { title: 'Stay compliant', text: 'Submit progress reports and closeouts as your project evolves.' },
    ],
    guide: { label: 'Read the Researcher Guide', href: 'https://duos.blog/help/researcherguide/' },
    Preview: ResearcherPreview,
  },
  {
    id: 'submitter',
    name: 'Data Submitters',
    icon: datasetAddIcon,
    title: 'Register studies and make them discoverable',
    summary: 'Describe your study once with a guided submission form, define how each consent group may be used, and choose the DAC that oversees access.',
    features: [
      { title: 'Guided submission', text: 'Capture study, NIH administrative, and data management details in one form.' },
      { title: 'Standardized data use', text: 'Record consent limitations such as General Research Use or Disease-Specific.' },
      { title: 'DAC assignment', text: 'Route each consent group to the committee that governs it.' },
      { title: 'Discoverability', text: 'Make your datasets findable in the DUOS Data Library.' },
    ],
    Preview: SubmitterPreview,
  },
  {
    id: 'dac',
    name: 'Data Access Committees',
    icon: dacIcon,
    title: 'Review requests with full context',
    summary: 'See each request\'s research purpose alongside the data use limitations of every dataset, and record decisions dataset by dataset.',
    features: [
      { title: 'Per-dataset voting', text: 'Approve or deny each dataset in a request independently.' },
      { title: 'Automated matching', text: 'DUOS checks research purposes against consent terms.' },
      { title: 'Voting history', text: 'Every vote is recorded for audit and continuity.' },
      { title: 'Committee management', text: 'Manage members, chairs, and the datasets your DAC governs.' },
    ],
    guide: { label: 'Read the DAC Guide', href: 'https://duos.blog/help/dacguide/' },
    Preview: DacPreview,
  },
  {
    id: 'so',
    name: 'Signing Officials',
    icon: signingOfficialIcon,
    title: 'Authorize researchers at your institution',
    summary: 'Issue Library Cards to pre-authorize researchers, manage institutional agreements, and keep oversight of your institution\'s data access.',
    features: [
      { title: 'Library Cards', text: 'Pre-authorize researchers once instead of signing off on every request.' },
      { title: 'Data Access Agreements', text: 'Assign DAAs to the researchers who need them.' },
      { title: 'Institutional visibility', text: 'Track your researchers\' requests and approvals in one place.' },
      { title: 'Simple setup', text: 'One-time setup — no repeat steps per dataset.' },
    ],
    guide: { label: 'Read the Signing Official Guide', href: 'https://duos.blog/help/signingofficialguide/' },
    Preview: SigningOfficialPreview,
  },
]

const scrollToRole = (id: string) => {
  const target = document.getElementById(`role-${id}`)
  if (!target) return
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  // Moves keyboard focus with the scroll, so Tab continues from the section on screen.
  target.focus({ preventScroll: true })
}

const Home = ({ isLogged }: Readonly<HomeProps>) => {
  const location = useLocation()
  const navigate = useNavigate()
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
    <main className="row">
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

        <div className="home-v2">
          <section className="home-section home-audience">
            <div className="home-container">
              <div className="home-section-head">
                <p className="home-eyebrow">Who uses DUOS?</p>
                <h2 className="home-heading">Built for every role in data sharing</h2>
                <p className="home-lead">Whether you oversee access, authorize researchers, or need data for your work — DUOS has you covered.</p>
              </div>
              <div className="audience-cards-grid">

                {/* DACs card */}
                <div className="audience-card">
                  <div className="audience-card-icon-wrap">
                    <img src={dacIcon} alt="" />
                  </div>
                  <p className="audience-card-tagline">Streamline access oversight</p>
                  <h3 className="audience-card-title">DUOS for DACs</h3>
                  <ul className="audience-card-features">
                    <li>
                      <CheckIcon />
                      Centralized review of all incoming data access requests
                    </li>
                    <li>
                      <CheckIcon />
                      Automated consent-code matching to research purposes
                    </li>
                    <li>
                      <CheckIcon />
                      Audit-ready compliance tracking across every request
                    </li>
                  </ul>
                  <div className="audience-card-actions">
                    <button
                      type="button"
                      className="home-btn"
                      onClick={() => setShowContactModal(true)}
                    >
                      Request a Meeting
                    </button>
                    <a
                      id="blog-support-dac-link"
                      href="https://duos.blog/help/dacguide/"
                      target="_blank"
                      rel="noreferrer"
                      className="home-link"
                    >
                      Read the DAC Guide
                      {' '}
                      <span className="home-arrow" aria-hidden="true">→</span>
                    </a>
                  </div>
                </div>

                {/* Signing Officials card */}
                <div className="audience-card audience-card--so">
                  <div className="audience-card-icon-wrap">
                    <img src={signingOfficialIcon} alt="" />
                  </div>
                  <p className="audience-card-tagline">Authorize your institution&#39;s researchers</p>
                  <h3 className="audience-card-title">DUOS for Signing Officials</h3>
                  <ul className="audience-card-features">
                    <li>
                      <CheckIcon />
                      Promote and share your institution&#39;s data
                    </li>
                    <li>
                      <CheckIcon />
                      Enable your PIs to request controlled-access datasets
                    </li>
                    <li>
                      <CheckIcon />
                      Simple one-time setup — no repeat steps per dataset
                    </li>
                  </ul>
                  <div className="audience-card-actions">
                    <a
                      id="blog-support-so-link"
                      href="https://duos.blog/help/signingofficialguide/"
                      target="_blank"
                      rel="noreferrer"
                      className="home-btn"
                    >
                      Signing Official Guide
                    </a>
                    <p className="audience-card-note">Sign in to get started</p>
                  </div>
                </div>

                {/* Looking for Data card */}
                <div className="audience-card audience-card--data">
                  <div className="audience-card-icon-wrap">
                    <img src={datasetIcon} alt="" />
                  </div>
                  <p className="audience-card-tagline">Access hundreds of curated datasets</p>
                  <h3 className="audience-card-title">Looking for Data?</h3>
                  <ul className="audience-card-features">
                    <li>
                      <CheckIcon />
                      Browse datasets from leading genomics &amp; biomedical programs
                    </li>
                    <li>
                      <CheckIcon />
                      Submit access requests directly through DUOS
                    </li>
                    <li>
                      <CheckIcon />
                      Integrated with Terra, AnVIL, and other platforms
                    </li>
                  </ul>
                  <div className="audience-card-actions">
                    <button
                      type="button"
                      className="home-btn"
                      onClick={() => handleSignIn('/datalibrary', navigate)}
                    >
                      Sign In to Browse Data
                    </button>
                    <p className="audience-card-note">Search 1,000s of datasets and scientific assets</p>
                  </div>
                </div>
              </div>
            </div>
            <SupportRequestModal
              showModal={showContactModal}
              onCloseRequest={() => setShowContactModal(false)}
              url={location.pathname}
            />
          </section>

          <section className="home-section home-roles">
            <div className="home-container">
              <div className="home-section-head">
                <p className="home-eyebrow">Features by role</p>
                <h2 className="home-heading">One platform, tailored to every role</h2>
                <p className="home-lead">See what DUOS offers at each step of the data sharing lifecycle.</p>
              </div>
              <nav className="role-nav" aria-label="Jump to a role">
                {roleSections.map(role => (
                  <button
                    key={role.id}
                    type="button"
                    className={`role-nav-chip role-accent--${role.id}`}
                    onClick={() => scrollToRole(role.id)}
                  >
                    {role.name}
                  </button>
                ))}
              </nav>
              <div className="role-rows">
                {roleSections.map(({ id, name, icon, title, summary, features, guide, Preview }) => (
                  <article key={id} id={`role-${id}`} className={`role-row role-accent--${id}`} tabIndex={-1}>
                    <div className="role-copy">
                      <p className="role-tag">
                        <img src={icon} alt="" />
                        {name}
                      </p>
                      <h3 className="role-title">{title}</h3>
                      <p className="role-summary">{summary}</p>
                      <ul className="role-features">
                        {features.map(feature => (
                          <li key={feature.title}>
                            <strong>{feature.title}</strong>
                            {feature.text}
                          </li>
                        ))}
                      </ul>
                      {guide
                        ? (
                            <a href={guide.href} target="_blank" rel="noreferrer" className="home-link">
                              {guide.label}
                              {' '}
                              <span className="home-arrow" aria-hidden="true">→</span>
                            </a>
                          )
                        : (
                            <button type="button" className="home-btn" onClick={() => setShowContactModal(true)}>
                              Talk to our team
                            </button>
                          )}
                    </div>
                    <div className="role-visual" aria-hidden="true">
                      <Preview />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="home-section home-section--muted home-libraries">
            <div className="home-container">
              <div className="home-section-head">
                <p className="home-eyebrow">Data Libraries</p>
                <h2 className="home-heading">Search Data Libraries in DUOS</h2>
                <p className="home-lead">
                  Institutions, programs, and studies use curated Data Libraries to showcase their science! Check out the options below and contact us to request your own.
                </p>
              </div>

              <div className="logo-grid">
                {featuredLibraries.map((library) => {
                  const libraryPath = library.key.startsWith('/') ? library.key : `/datalibrary/${library.key}`
                  const libraryName = library.title.replace(' Data Library', '')
                  const tooltipText = isLogged
                    ? libraryName
                    : `Please login to access ${libraryName} Data Library`

                  const cardStyle: React.CSSProperties | undefined = library.key === 'broad'
                    ? { background: '#1F3B50', padding: '15px' }
                    : undefined

                  const logoSrc = library.key === 'broad'
                    ? broadLogo
                    : library.icon ?? undefined

                  return (
                    <OverflowTooltip key={library.key} id={library.key} tooltipText={tooltipText}>
                      <div className="library-item">
                        <div className="logo-card" style={cardStyle}>
                          <Link
                            to={isLogged ? libraryPath : '#'}
                            onClick={(e) => {
                              if (!isLogged) {
                                e.preventDefault()
                                handleSignIn(libraryPath, navigate)
                              }
                            }}
                          >
                            {logoSrc
                              ? <img src={logoSrc} alt={libraryName} loading="lazy" />
                              : <span className="logo-card-fallback">{libraryName}</span>}
                          </Link>
                        </div>
                        <div className="library-item-label">
                          <span>{libraryName}</span>
                          <span className="home-arrow" aria-hidden="true">→</span>
                        </div>
                      </div>
                    </OverflowTooltip>
                  )
                })}
              </div>
            </div>
          </section>

          <section className="home-section">
            <div className="home-container">
              <div className="home-section-head">
                <p className="home-eyebrow">How it works</p>
                <h2 className="home-heading">How does DUOS expedite compliant data sharing?</h2>
                <p className="home-lead">
                  Researchers use DUOS to share and request access to data, and data access committees
                  and institutional officials use DUOS to review and approve research uses of the data.
                </p>
              </div>
              <div className="diagram-panel hidden-xs">
                <img alt="What is DUOS graphic" src={duosDiagram} />
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

export default Home
