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
  document.getElementById(`role-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const homeStyles = `
  .home-v2 {
    --ink: #0F2537;
    --body: #475569;
    --muted: #64748B;
    --navy: #1F3B50;
    --blue: #00609F;
    --teal: #00807A;
    --surface: #FFFFFF;
    --surface-muted: #F6F8FA;
    --border: #E3E8EE;
    --border-strong: #CBD5E1;
    --shadow-sm: 0 1px 2px rgba(15, 37, 55, 0.04), 0 4px 12px rgba(15, 37, 55, 0.05);
    --shadow-lg: 0 2px 4px rgba(15, 37, 55, 0.04), 0 16px 40px rgba(15, 37, 55, 0.10);
    --radius: 16px;
    --ease: cubic-bezier(0.2, 0.7, 0.2, 1);
    font-family: Montserrat, sans-serif;
    color: var(--body);
  }
  .home-v2 *, .home-v2 *::before, .home-v2 *::after { box-sizing: border-box; }

  /* Layout */
  .home-section {
    position: relative;
    padding: 64px 24px;
  }
  .home-section--muted {
    background: var(--surface-muted);
    border-top: 1px solid var(--border);
  }
  .home-container {
    position: relative;
    max-width: 1200px;
    margin: 0 auto;
  }
  .home-section-head {
    max-width: 680px;
    margin: 0 auto 36px;
    text-align: center;
  }
  .home-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 10px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--teal);
  }
  .home-eyebrow::before {
    content: '';
    width: 24px;
    height: 2px;
    border-radius: 2px;
    background: linear-gradient(90deg, var(--blue), var(--teal));
  }
  .home-heading {
    margin: 0 0 10px;
    font-family: Montserrat, sans-serif;
    font-size: clamp(24px, 2.6vw, 32px);
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.015em;
    color: var(--ink);
  }
  .home-lead {
    margin: 0;
    font-size: 16px;
    line-height: 1.6;
    color: var(--body);
  }

  /* Audience section */
  .home-audience {
    background: linear-gradient(180deg, var(--surface-muted) 0%, var(--surface) 100%);
    overflow: hidden;
  }
  .home-audience::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(31, 59, 80, 0.07) 1px, transparent 1px);
    background-size: 22px 22px;
    -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 0%, #000 0%, transparent 75%);
    mask-image: radial-gradient(ellipse 70% 60% at 50% 0%, #000 0%, transparent 75%);
    pointer-events: none;
  }
  .audience-cards-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;
  }
  .audience-card {
    --accent: var(--navy);
    --accent-soft: rgba(31, 59, 80, 0.08);
    --accent-hover: #2D5470;
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 26px 26px 24px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
    transition: transform 0.25s var(--ease), box-shadow 0.25s var(--ease), border-color 0.25s var(--ease);
  }
  .audience-card--so {
    --accent: var(--blue);
    --accent-soft: rgba(0, 96, 159, 0.08);
    --accent-hover: #004C7E;
  }
  .audience-card--data {
    --accent: var(--teal);
    --accent-soft: rgba(0, 128, 122, 0.09);
    --accent-hover: #006A65;
  }
  .audience-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--accent);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.35s var(--ease);
  }
  .audience-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
    border-color: var(--border-strong);
  }
  .audience-card:hover::before { transform: scaleX(1); }
  .audience-card-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 48px;
    margin-bottom: 16px;
    border-radius: 12px;
    background: var(--accent-soft);
    flex-shrink: 0;
  }
  .audience-card-icon-wrap img {
    width: 28px;
    height: 28px;
    object-fit: contain;
  }
  .audience-card-tagline {
    margin: 0 0 8px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent);
  }
  .audience-card-title {
    margin: 0 0 12px;
    font-family: Montserrat, sans-serif;
    font-size: 21px;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: -0.01em;
    color: var(--ink);
  }
  .audience-card-features {
    flex: 1;
    margin: 0 0 18px;
    padding: 0;
    list-style: none;
  }
  .audience-card-features li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 5px 0;
    font-size: 14px;
    line-height: 1.55;
    color: var(--body);
  }
  .audience-card-features .check-icon {
    flex-shrink: 0;
    margin-top: 2px;
    color: var(--accent);
  }
  .audience-card-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-top: 18px;
    border-top: 1px solid var(--border);
  }
  .home-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 11px 20px;
    font-family: Montserrat, sans-serif;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.2;
    color: #FFFFFF;
    background: var(--accent);
    border: none;
    border-radius: 10px;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.18s ease, box-shadow 0.18s ease;
  }
  .home-btn:hover, .home-btn:focus {
    color: #FFFFFF;
    background: var(--accent-hover);
    text-decoration: none;
    box-shadow: 0 6px 16px var(--accent-soft);
  }
  .home-link {
    display: inline-flex;
    align-items: center;
    align-self: center;
    gap: 6px;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--accent);
    text-decoration: none;
  }
  .home-link:hover, .home-link:focus {
    color: var(--accent-hover);
    text-decoration: none;
  }
  .home-arrow {
    display: inline-block;
    transition: transform 0.2s var(--ease);
  }
  .home-link:hover .home-arrow { transform: translateX(4px); }
  .audience-card-note {
    margin: 0;
    font-size: 12.5px;
    line-height: 1.5;
    color: var(--muted);
    text-align: center;
  }
  .home-v2 :is(a, button):focus-visible {
    outline: 2px solid var(--blue);
    outline-offset: 3px;
  }

  /* Data libraries */
  .logo-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: stretch;
    gap: 20px;
  }
  .logo-grid > [data-for] {
    overflow: visible !important;
  }
  .library-item {
    display: flex;
    flex-direction: column;
    width: 344px;
    padding: 12px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-sm);
    cursor: pointer;
    transition: transform 0.25s var(--ease), box-shadow 0.25s var(--ease), border-color 0.25s var(--ease);
  }
  .library-item:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
    border-color: rgba(0, 128, 122, 0.45);
  }
  .logo-card {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 140px;
    padding: 18px;
    background: var(--surface-muted);
    border-radius: 10px;
    overflow: hidden;
  }
  .logo-card a {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    text-decoration: none;
  }
  .logo-card img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
  }
  .logo-card-fallback {
    padding: 0 16px;
    font-size: 18px;
    font-weight: 700;
    color: var(--navy);
    text-align: center;
  }
  .library-item-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 6px 2px;
    font-size: 15px;
    font-weight: 600;
    color: var(--ink);
    text-align: left;
    word-wrap: break-word;
  }
  .library-item-label .home-arrow {
    flex-shrink: 0;
    color: var(--teal);
  }
  .library-item:hover .home-arrow { transform: translateX(4px); }

  /* Diagram */
  .diagram-panel {
    padding: 32px 28px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    box-shadow: var(--shadow-sm);
  }
  .diagram-panel img {
    display: block;
    width: 100%;
    height: auto;
  }

  /* Features by role */
  .role-nav {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin: -12px 0 40px;
  }
  .role-nav-chip {
    padding: 8px 16px;
    font-family: Montserrat, sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: var(--ink);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 999px;
    cursor: pointer;
    transition: border-color 0.18s ease, color 0.18s ease, background 0.18s ease;
  }
  .role-nav-chip:hover {
    color: var(--accent);
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .role-rows {
    display: flex;
    flex-direction: column;
    gap: 56px;
  }
  .role-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: center;
    gap: 56px;
    scroll-margin-top: 96px;
  }
  .role-row:nth-child(even) .role-copy { order: 2; }
  .role-accent--researcher {
    --accent: var(--teal);
    --accent-soft: rgba(0, 128, 122, 0.09);
    --accent-hover: #006A65;
  }
  .role-accent--submitter {
    --accent: #6A3A96;
    --accent-soft: rgba(106, 58, 150, 0.09);
    --accent-hover: #55297D;
  }
  .role-accent--dac {
    --accent: var(--navy);
    --accent-soft: rgba(31, 59, 80, 0.08);
    --accent-hover: #2D5470;
  }
  .role-accent--so {
    --accent: var(--blue);
    --accent-soft: rgba(0, 96, 159, 0.08);
    --accent-hover: #004C7E;
  }
  .role-tag {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 12px;
    padding: 5px 12px 5px 6px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--accent);
    background: var(--accent-soft);
    border-radius: 999px;
  }
  .role-tag img {
    width: 22px;
    height: 22px;
    padding: 3px;
    object-fit: contain;
    background: var(--surface);
    border-radius: 50%;
  }
  .role-title {
    margin: 0 0 10px;
    font-family: Montserrat, sans-serif;
    font-size: clamp(21px, 2.2vw, 26px);
    font-weight: 700;
    line-height: 1.25;
    letter-spacing: -0.01em;
    color: var(--ink);
  }
  .role-summary {
    margin: 0 0 20px;
    font-size: 15.5px;
    line-height: 1.6;
  }
  .role-features {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px 24px;
    margin: 0 0 22px;
    padding: 0;
    list-style: none;
  }
  .role-features li {
    padding-left: 14px;
    border-left: 2px solid var(--accent-soft);
    font-size: 13.5px;
    line-height: 1.5;
    transition: border-color 0.2s ease;
  }
  .role-row:hover .role-features li { border-left-color: var(--accent); }
  .role-features strong {
    display: block;
    margin-bottom: 2px;
    font-size: 14px;
    font-weight: 700;
    color: var(--ink);
  }
  .role-copy .home-link { align-self: auto; }
  .role-copy .home-btn {
    width: auto;
    padding: 10px 18px;
  }

  /* Decorative product previews */
  .role-visual {
    position: relative;
    padding: 28px;
    background: linear-gradient(135deg, var(--accent-soft) 0%, rgba(255, 255, 255, 0) 70%), var(--surface-muted);
    border: 1px solid var(--border);
    border-radius: 20px;
  }
  .mock-window {
    overflow: hidden;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: var(--shadow-lg);
  }
  .mock-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
  }
  .mock-bar i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--border-strong);
  }
  .mock-bar span {
    margin-left: 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--muted);
  }
  .mock-body {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px;
  }
  .mock-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    font-size: 13px;
    font-weight: 600;
    color: var(--ink);
    border: 1px solid var(--border);
    border-radius: 8px;
  }
  .mock-row-lead {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }
  .mock-dot {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    font-size: 11px;
    font-weight: 700;
    color: var(--accent);
    background: var(--accent-soft);
    border-radius: 50%;
  }
  .mock-pill {
    flex-shrink: 0;
    padding: 3px 10px;
    font-size: 11px;
    font-weight: 700;
    color: var(--accent);
    background: var(--accent-soft);
    border-radius: 999px;
  }
  .mock-pill--muted {
    color: var(--muted);
    background: var(--surface-muted);
  }
  .mock-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .mock-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .mock-skeleton {
    height: 8px;
    border-radius: 4px;
    background: var(--surface-muted);
  }
  .mock-progress {
    height: 6px;
    overflow: hidden;
    border-radius: 3px;
    background: var(--surface-muted);
  }
  .mock-progress > span {
    display: block;
    height: 100%;
    background: var(--accent);
    border-radius: 3px;
  }

  @media (max-width: 991px) {
    .audience-cards-grid {
      grid-template-columns: minmax(0, 520px);
      justify-content: center;
    }
    .role-row {
      grid-template-columns: minmax(0, 1fr);
      gap: 28px;
    }
    .role-row:nth-child(even) .role-copy { order: 0; }
    .role-rows { gap: 48px; }
  }
  @media (max-width: 768px) {
    .home-section { padding: 48px 16px; }
    .home-section-head { margin-bottom: 28px; }
    .home-lead { font-size: 16px; }
    .audience-card { padding: 24px 20px; }
    .library-item { width: 304px; }
    .role-features { grid-template-columns: minmax(0, 1fr); gap: 12px; }
    .role-visual { padding: 16px; }
    .role-nav { margin: -4px 0 28px; }
    .logo-card { height: 124px; }
    .logo-grid { gap: 16px; }
  }
  @media (max-width: 480px) {
    .library-item {
      width: 100%;
      max-width: 344px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .home-v2 *, .home-v2 *::before, .home-v2 *::after {
      transition: none !important;
    }
    .audience-card:hover, .library-item:hover { transform: none; }
  }
`

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
    <>
      <style>{homeStyles}</style>
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
                    <article key={id} id={`role-${id}`} className={`role-row role-accent--${id}`}>
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
      </div>
    </>
  )
}

export default Home
