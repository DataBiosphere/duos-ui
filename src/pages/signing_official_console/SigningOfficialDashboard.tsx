import React, { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined'
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined'
import { Styles, Theme } from 'src/libs/theme'
import { usePageTitle } from 'src/hooks/usePageTitle'
import { SupportRequestModal } from 'src/components/modals/SupportRequestModal'
import { Notifications } from 'src/libs/utils'
import { SigningOfficial, SigningOfficialDashboardSummary } from 'src/libs/ajax/SigningOfficial'
import { extractError } from 'src/utils/ErrorUtils'
import { useNavigationState } from 'src/contexts/NavigationStateContext'
import { SO_CONSOLE_SECTIONS } from './signingOfficialConsoleRoutes'
import './SigningOfficialDashboard.css'

interface Stat {
  label: string
  value: (summary: SigningOfficialDashboardSummary) => number
}

const tileMeta = [
  {
    ...SO_CONSOLE_SECTIONS[0],
    icon: PeopleAltOutlinedIcon,
    description: 'Manage researchers who request data on behalf of your institution.',
    stats: [
      { label: 'Active', value: (s: SigningOfficialDashboardSummary) => s.researcherStatus.active },
      { label: 'Inactive', value: (s: SigningOfficialDashboardSummary) => s.researcherStatus.inactive },
    ],
  },
  {
    ...SO_CONSOLE_SECTIONS[1],
    icon: DescriptionOutlinedIcon,
    description: 'Review data access requests submitted by researchers at your institution.',
    stats: [
      { label: 'Total', value: (s: SigningOfficialDashboardSummary) => s.darRequests.total },
      { label: 'Approved', value: (s: SigningOfficialDashboardSummary) => s.darRequests.approved },
      { label: 'Canceled', value: (s: SigningOfficialDashboardSummary) => s.darRequests.canceled },
      { label: 'In Process', value: (s: SigningOfficialDashboardSummary) => s.darRequests.inProcess },
    ],
  },
  {
    ...SO_CONSOLE_SECTIONS[2],
    icon: FactCheckOutlinedIcon,
    description: 'Approve or reject data access request applications awaiting your signature.',
    stats: [
      { label: 'Total', value: (s: SigningOfficialDashboardSummary) => s.darApprovals.total },
      { label: 'Awaiting SO Action', value: (s: SigningOfficialDashboardSummary) => s.darApprovals.awaitingSoAction },
    ],
  },
  {
    ...SO_CONSOLE_SECTIONS[3],
    icon: GroupOutlinedIcon,
    description: 'Manage the researchers who submit data on behalf of your institution.',
    stats: [{ label: 'Approved', value: (s: SigningOfficialDashboardSummary) => s.dataSubmitters.approved }],
  },
  {
    ...SO_CONSOLE_SECTIONS[4],
    icon: StorageOutlinedIcon,
    description: 'Browse the datasets and studies registered by your institution.',
    stats: [
      { label: 'Datasets', value: (s: SigningOfficialDashboardSummary) => s.institutionLibrary.datasets },
      { label: 'Studies', value: (s: SigningOfficialDashboardSummary) => s.institutionLibrary.studies },
    ],
  },
  {
    ...SO_CONSOLE_SECTIONS[5],
    icon: HandshakeOutlinedIcon,
    description: 'Manage Data Access Agreement associations for your researchers.',
    stats: [
      { label: 'Agreements', value: (s: SigningOfficialDashboardSummary) => s.daaAssociations.agreements },
      { label: 'Researchers Approved', value: (s: SigningOfficialDashboardSummary) => s.daaAssociations.researchersApproved },
    ],
  },
]

const resources = [
  {
    icon: MenuBookOutlinedIcon,
    label: 'Signing Official Guide',
    description: 'A walkthrough of the Signing Official role, from pre-authorizing researchers to issuing library cards.',
    href: 'https://duos.blog/help/preauthorize_researchers_librarycards/',
  },
  {
    icon: QuizOutlinedIcon,
    label: 'Frequently Asked Questions',
    description: 'Answers to common questions about using DUOS.',
    href: 'https://duos.blog/help/faqs/',
  },
  {
    icon: ArticleOutlinedIcon,
    label: 'Help Center',
    description: 'Browse the full library of DUOS documentation and how-to articles.',
    href: 'https://duos.blog/help/',
  },
]

// Brand colors come from the shared theme rather than being re-typed in the stylesheet, which is
// what lets SigningOfficialDashboard.css reference them as var(--so-*).
const themeVariables = {
  '--so-primary': Theme.palette.primary,
  '--so-secondary': Theme.palette.secondary,
  '--so-secondary-background': Theme.palette.background.secondary,
  '--so-surface': Theme.palette.white,
} as React.CSSProperties

export default function SigningOfficialDashboard(): React.JSX.Element {
  usePageTitle('Dashboard')
  const { activeTab } = useNavigationState()
  const [showContactModal, setShowContactModal] = useState(false)
  const { data, isFetching, error } = useQuery({
    queryKey: ['signing-official-dashboard-summary'],
    queryFn: SigningOfficial.getDashboardSummary,
    staleTime: 0,
    retry: false,
    refetchOnMount: 'always',
  })

  useEffect(() => {
    if (error) {
      Notifications.showError({
        text: `Error: Unable to load dashboard statistics: ${extractError(error)}`,
      })
    }
  }, [error])

  return (
    <div style={{ ...Styles.PAGE, ...themeVariables }}>
      <h1 className="so-dashboard-title">Signing Official Console</h1>
      <div className="so-dashboard-grid">
        {tileMeta.map((tile) => {
          const Icon = tile.icon
          return (
            <Link
              key={tile.link}
              to={tile.link}
              state={{ selectedMenuTab: activeTab }}
              className="so-dashboard-card"
            >
              <span className="so-dashboard-icon"><Icon /></span>
              <span>
                <span className="so-dashboard-card-title">{tile.label}</span>
                <span className="so-dashboard-description">{tile.description}</span>
                <span className="so-dashboard-stats">
                  {tile.stats.map((stat: Stat) => {
                    // The en-dash alone tells a screen reader nothing, so the accessible name
                    // always spells out the label and either the count or why it is missing.
                    const value = isFetching || error || !data ? null : stat.value(data)
                    let valueDescription: string
                    if (value !== null) {
                      valueDescription = `${value}`
                    }
                    else if (isFetching) {
                      valueDescription = 'loading'
                    }
                    else {
                      valueDescription = 'unavailable'
                    }
                    return (
                      <span key={stat.label} className="so-dashboard-stat">
                        <span
                          className="so-dashboard-stat-value"
                          aria-label={`${stat.label}: ${valueDescription}`}
                        >
                          {value ?? '–'}
                        </span>
                        <span className="so-dashboard-stat-label" aria-hidden="true">{stat.label}</span>
                      </span>
                    )
                  })}
                </span>
              </span>
            </Link>
          )
        })}
      </div>

      <h2 className="so-dashboard-heading">Helpful Resources for Signing Officials</h2>
      <div className="so-dashboard-grid">
        {resources.map((resource) => {
          const Icon = resource.icon
          return (
            <a key={resource.href} href={resource.href} target="_blank" rel="noopener noreferrer" className="so-dashboard-card">
              <span className="so-dashboard-icon"><Icon /></span>
              <span>
                <span className="so-dashboard-card-title">{resource.label}<OpenInNewOutlinedIcon /></span>
                <span className="so-dashboard-description">{resource.description}</span>
              </span>
            </a>
          )
        })}
      </div>

      <section className="so-dashboard-promo">
        <h2>Get more out of DUOS</h2>
        <p>Signing Officials can use DUOS to curate and share their institution&apos;s datasets with the research community. You can also leverage DUOS alongside Terra to meet NIH requirements for analyzing and storing controlled-access data.</p>
        <p>Reach out if you&apos;d like to learn more about either of these.</p>
        <button type="button" onClick={() => setShowContactModal(true)}>Contact Us</button>
      </section>

      <SupportRequestModal
        showModal={showContactModal}
        onCloseRequest={() => setShowContactModal(false)}
        url={window.location.href}
      />
    </div>
  )
}
