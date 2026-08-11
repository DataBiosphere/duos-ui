import React from 'react'
import { Box } from '@mui/material'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined'
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import { Styles } from 'src/libs/theme'
import { usePageTitle } from 'src/hooks/usePageTitle'
import ConsoleDashboardGrid from 'src/components/dashboard/ConsoleDashboardGrid'
import ConsoleDashboardPromo from 'src/components/dashboard/ConsoleDashboardPromo'
import ConsoleDashboardResources, { ConsoleDashboardResource } from 'src/components/dashboard/ConsoleDashboardResources'
import ConsoleDashboardTitle from 'src/components/dashboard/ConsoleDashboardTitle'
import {
  ConsoleDashboardTileMeta,
  useConsoleDashboardSummary,
} from 'src/components/dashboard/useConsoleDashboardSummary'
import { SigningOfficial, SigningOfficialDashboardSummary } from 'src/libs/ajax/SigningOfficial'
import { SO_CONSOLE_SECTIONS } from './signingOfficialConsoleRoutes'

const tileMeta: ConsoleDashboardTileMeta<SigningOfficialDashboardSummary>[] = [
  {
    ...SO_CONSOLE_SECTIONS[0],
    icon: PeopleAltOutlinedIcon,
    // Data Submitter management lives on this page too, so its count is reported here.
    description: 'Manage researchers who request or submit data on behalf of your institution.',
    stats: [
      { label: 'Active', value: s => s?.researcherStatus?.active },
      { label: 'Inactive', value: s => s?.researcherStatus?.inactive },
      { label: 'Data Submitters', value: s => s?.dataSubmitters?.approved },
    ],
  },
  {
    ...SO_CONSOLE_SECTIONS[1],
    icon: DescriptionOutlinedIcon,
    description: 'Review data access requests submitted by researchers at your institution.',
    stats: [
      { label: 'Total', value: s => s?.darRequests?.total },
      { label: 'Approved', value: s => s?.darRequests?.approved },
      { label: 'Canceled', value: s => s?.darRequests?.canceled },
      { label: 'In Process', value: s => s?.darRequests?.inProcess },
    ],
  },
  {
    ...SO_CONSOLE_SECTIONS[2],
    icon: FactCheckOutlinedIcon,
    description: 'Approve or reject data access request applications awaiting your signature.',
    stats: [
      { label: 'Total', value: s => s?.darApprovals?.total },
      { label: 'Awaiting SO Action', value: s => s?.darApprovals?.awaitingSoAction },
    ],
  },
  {
    ...SO_CONSOLE_SECTIONS[3],
    icon: StorageOutlinedIcon,
    description: 'Browse the datasets and studies registered by your institution.',
    stats: [
      { label: 'Datasets', value: s => s?.institutionLibrary?.datasets },
      { label: 'Studies', value: s => s?.institutionLibrary?.studies },
    ],
  },
  {
    ...SO_CONSOLE_SECTIONS[4],
    icon: HandshakeOutlinedIcon,
    description: 'Manage Data Access Agreement associations for your researchers.',
    stats: [
      { label: 'Agreements', value: s => s?.daaAssociations?.agreements },
      { label: 'Researchers Approved', value: s => s?.daaAssociations?.researchersApproved },
    ],
  },
]

const helpfulResources: ConsoleDashboardResource[] = [
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

export default function SigningOfficialDashboard(): React.JSX.Element {
  usePageTitle('Dashboard')
  const { tiles, isLoading } = useConsoleDashboardSummary(
    ['signing-official-dashboard-summary'],
    SigningOfficial.getDashboardSummary,
    tileMeta,
  )

  return (
    <Box sx={{ ...Styles.PAGE }}>
      <ConsoleDashboardTitle>Signing Official Console</ConsoleDashboardTitle>

      <ConsoleDashboardGrid tiles={tiles} isLoading={isLoading} />

      <ConsoleDashboardResources
        heading="Helpful Resources for Signing Officials"
        resources={helpfulResources}
      />

      <ConsoleDashboardPromo
        heading="Get more out of DUOS"
        paragraphs={[
          'Signing Officials can use DUOS to curate and share their institution\'s datasets with the '
          + 'research community. You can also leverage DUOS alongside Terra to meet NIH requirements '
          + 'for analyzing and storing controlled-access data.',
          'Reach out if you\'d like to learn more about either of these.',
        ]}
      />
    </Box>
  )
}
