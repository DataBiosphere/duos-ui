import React, { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Box, Button, Card, Typography } from '@mui/material'
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

// Brand colors come from the shared theme; these three have no palette equivalent. Font family is
// left to inherit, since both the page and the MUI theme already resolve to Montserrat.
const MUTED_TEXT = '#6b7280'
const FOCUS_RING = '#2fa4e7'
const PROMO_TEXT = '#d7e2ea'

const focusRing = {
  '&:focus-visible': {
    outline: `3px solid ${FOCUS_RING}`,
    outlineOffset: '3px',
  },
}

const contentWidth = { maxWidth: '900px', mx: 'auto' }

const titleStyle = {
  ...contentWidth,
  mt: '2rem',
  mb: '10px',
  color: Theme.palette.primary,
  fontSize: '2.8rem',
  fontWeight: 600,
  lineHeight: 'normal',
}

const headingStyle = {
  ...contentWidth,
  mt: '3rem',
  mb: '10px',
  color: Theme.palette.primary,
  fontSize: '20px',
  fontWeight: 600,
  lineHeight: 'normal',
}

const gridStyle = {
  ...contentWidth,
  display: 'grid',
  // The stylesheet dropped to a single column under 600px, which is the MUI `sm` breakpoint.
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
  gap: '1.5rem',
  mt: '2rem',
  mb: '2rem',
}

const cardStyle = {
  'display': 'flex',
  'alignItems': 'flex-start',
  'gap': '1rem',
  'padding': '1.5rem',
  'border': '1.5px solid rgb(0 0 0 / 8%)',
  'borderRadius': '12px',
  'background': Theme.palette.white,
  'color': 'inherit',
  'textDecoration': 'none',
  'transition': 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    borderColor: 'rgb(0 0 0 / 18%)',
    boxShadow: '0 8px 24px rgb(0 0 0 / 13%)',
  },
  ...focusRing,
}

const cardIconStyle = {
  display: 'flex',
  flex: '0 0 48px',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  background: Theme.palette.background.secondary,
  color: Theme.palette.secondary,
}

const cardTitleStyle = {
  display: 'block',
  mb: '.35rem',
  color: Theme.palette.primary,
  fontSize: '18px',
  fontWeight: 600,
  lineHeight: 'normal',
}

const descriptionStyle = {
  display: 'block',
  color: MUTED_TEXT,
  fontSize: '14px',
  lineHeight: 1.4,
}

const externalIconStyle = {
  ml: '.4rem',
  color: MUTED_TEXT,
  fontSize: '16px',
  verticalAlign: 'middle',
}

const statsStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '1.25rem',
  mt: '1rem',
}

const statValueStyle = {
  color: Theme.palette.secondary,
  fontSize: '20px',
  fontWeight: 700,
  lineHeight: 'normal',
}

const statLabelStyle = {
  color: MUTED_TEXT,
  fontSize: '12px',
  fontWeight: 500,
  lineHeight: 'normal',
  letterSpacing: '.04em',
  textTransform: 'uppercase',
}

const promoStyle = {
  ...contentWidth,
  boxSizing: 'border-box',
  mt: '1.5rem',
  mb: '2rem',
  padding: '2rem 2.25rem',
  borderRadius: '12px',
  background: Theme.palette.primary,
  color: PROMO_TEXT,
  fontSize: '14px',
  lineHeight: 1.6,
}

const promoHeadingStyle = {
  mt: 0,
  mb: '10px',
  color: Theme.palette.white,
  fontSize: '18px',
  fontWeight: 500,
  lineHeight: 1.1,
}

const promoButtonStyle = {
  'mt': '.5rem',
  'padding': '10px 22px',
  'border': 0,
  'borderRadius': '6px',
  'background': Theme.palette.white,
  'color': Theme.palette.primary,
  'fontSize': '14px',
  'fontWeight': 600,
  'lineHeight': 'normal',
  'textTransform': 'none',
  '&:hover': { background: Theme.palette.white },
  ...focusRing,
}

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
    <Box sx={{ ...Styles.PAGE }}>
      <Typography component="h1" sx={titleStyle}>Signing Official Console</Typography>
      <Box sx={gridStyle}>
        {tileMeta.map((tile) => {
          const Icon = tile.icon
          return (
            <Card
              variant="outlined"
              key={tile.link}
              component={Link}
              to={tile.link}
              state={{ selectedMenuTab: activeTab }}
              sx={cardStyle}
            >
              <Box component="span" sx={cardIconStyle}><Icon /></Box>
              <span>
                <Typography component="span" sx={cardTitleStyle}>{tile.label}</Typography>
                <Typography component="span" sx={descriptionStyle}>{tile.description}</Typography>
                <Box component="span" sx={statsStyle}>
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
                      <Box component="span" key={stat.label} sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography
                          component="span"
                          sx={statValueStyle}
                          aria-label={`${stat.label}: ${valueDescription}`}
                        >
                          {value ?? '–'}
                        </Typography>
                        <Typography component="span" sx={statLabelStyle} aria-hidden="true">{stat.label}</Typography>
                      </Box>
                    )
                  })}
                </Box>
              </span>
            </Card>
          )
        })}
      </Box>

      <Typography component="h2" sx={headingStyle}>Helpful Resources for Signing Officials</Typography>
      <Box sx={gridStyle}>
        {resources.map((resource) => {
          const Icon = resource.icon
          return (
            <Card
              variant="outlined"
              key={resource.href}
              component="a"
              href={resource.href}
              target="_blank"
              rel="noopener noreferrer"
              sx={cardStyle}
            >
              <Box component="span" sx={cardIconStyle}><Icon /></Box>
              <span>
                <Typography component="span" sx={cardTitleStyle}>
                  {resource.label}
                  <OpenInNewOutlinedIcon sx={externalIconStyle} />
                </Typography>
                <Typography component="span" sx={descriptionStyle}>{resource.description}</Typography>
              </span>
            </Card>
          )
        })}
      </Box>

      <Box component="section" sx={promoStyle}>
        <Typography component="h2" sx={promoHeadingStyle}>Get more out of DUOS</Typography>
        <p>Signing Officials can use DUOS to curate and share their institution&apos;s datasets with the research community. You can also leverage DUOS alongside Terra to meet NIH requirements for analyzing and storing controlled-access data.</p>
        <p>Reach out if you&apos;d like to learn more about either of these.</p>
        <Button type="button" onClick={() => setShowContactModal(true)} sx={promoButtonStyle}>Contact Us</Button>
      </Box>

      <SupportRequestModal
        showModal={showContactModal}
        onCloseRequest={() => setShowContactModal(false)}
        url={window.location.href}
      />
    </Box>
  )
}
