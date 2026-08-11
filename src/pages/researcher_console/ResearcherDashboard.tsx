import React from 'react'
import { Box } from '@mui/material'
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined'
import DatasetOutlinedIcon from '@mui/icons-material/DatasetOutlined'
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import { Styles } from 'src/libs/theme'
import { Storage } from 'src/libs/storage'
import { usePageTitle } from 'src/hooks/usePageTitle'
import ConsoleDashboardGrid from 'src/components/dashboard/ConsoleDashboardGrid'
import ConsoleDashboardPromo from 'src/components/dashboard/ConsoleDashboardPromo'
import ConsoleDashboardResources, { ConsoleDashboardResource } from 'src/components/dashboard/ConsoleDashboardResources'
import ConsoleDashboardTitle from 'src/components/dashboard/ConsoleDashboardTitle'
import {
  ConsoleDashboardTileMeta,
  isRenderedForUser,
  useConsoleDashboardSummary,
} from 'src/components/dashboard/useConsoleDashboardSummary'
import { Researcher, ResearcherDashboardSummary } from 'src/libs/ajax/Researcher'
import { RESEARCHER_CONSOLE_SECTIONS } from './researcherConsoleRoutes'

// Tiles reuse the header's section entries so a tile and its sub-tab can never disagree about a
// route or about who is allowed to see it.
const tileMeta: ConsoleDashboardTileMeta<ResearcherDashboardSummary>[] = [
  {
    label: 'Data Library',
    link: '/datalibrary',
    icon: LibraryBooksOutlinedIcon,
    description: 'Browse and search datasets, studies, and other assets available in DUOS.',
    // The endpoint applies the same publicVisibility restriction /datalibrary does, so these
    // counts match the tab badges a researcher sees there.
    stats: [
      { label: 'Studies', value: s => s?.dataLibrary?.studies },
      { label: 'Datasets', value: s => s?.dataLibrary?.datasets },
      { label: 'AI Models', value: s => s?.dataLibrary?.models },
      { label: 'Workspaces', value: s => s?.dataLibrary?.workspaces },
    ],
  },
  {
    ...RESEARCHER_CONSOLE_SECTIONS[0],
    icon: DescriptionOutlinedIcon,
    description: 'Track the data access requests you have submitted.',
    stats: [
      { label: 'Total', value: s => s?.darRequests?.total },
      { label: 'Approved', value: s => s?.darRequests?.approved },
      { label: 'Canceled', value: s => s?.darRequests?.canceled },
      { label: 'In Process', value: s => s?.darRequests?.inProcess },
    ],
  },
  {
    ...RESEARCHER_CONSOLE_SECTIONS[1],
    icon: AssignmentTurnedInOutlinedIcon,
    description: 'View your current dataset approvals and when access expires.',
    stats: [
      { label: 'Active', value: s => s?.datasetApprovals?.active },
      { label: 'Expiring in 30 Days', value: s => s?.datasetApprovals?.expiringSoon },
      { label: 'Expired', value: s => s?.datasetApprovals?.expired },
    ],
  },
  {
    ...RESEARCHER_CONSOLE_SECTIONS[2],
    icon: CloudUploadOutlinedIcon,
    description: 'Track the status of datasets you have registered in DUOS.',
    // Labelled "All Submissions" because it sums all nine tabs of My Data Submissions, while the
    // page it links to opens on Datasets - no single badge there is meant to match this number.
    stats: [{ label: 'All Submissions', value: s => s?.dataSubmissions?.total }],
  },
]

const helpfulResources: ConsoleDashboardResource[] = [
  {
    icon: MenuBookOutlinedIcon,
    label: 'Researcher Guide',
    description: 'A walkthrough of the Researcher role, from browsing the data library to submitting a data access request.',
    href: 'https://duos.blog/help/researcherguide/',
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
  {
    icon: BadgeOutlinedIcon,
    label: 'Linking Your NIH RAS Account',
    description: 'Learn how to link your NIH Researcher Auth Service (RAS) identity to your DUOS profile.',
    href: 'https://duos.blog/help/nih_ras/',
  },
  {
    icon: AutoStoriesOutlinedIcon,
    label: 'Promote Your Publications in DUOS',
    description: 'Add your publications to DUOS so the research community can discover the science that used your data.',
    to: '/dataset_submissions?tab=publications',
    // /dataset_submissions is RoleBAC-gated, so offering this to a plain researcher would land
    // them on Not Found. Gated exactly like the Data Submissions tile.
    isRenderedForUser: user => user?.isDataSubmitter === true,
  },
  {
    icon: FactCheckOutlinedIcon,
    label: 'Progress Reports',
    description: 'Submit and manage progress reports for your active data access requests.',
    to: '/researcher_console',
  },
  {
    icon: InsightsOutlinedIcon,
    label: 'See Your Impact on Through.bio',
    description: 'See the impact of your science and track how your published research is being used.',
    href: 'https://through.bio',
  },
  {
    icon: DatasetOutlinedIcon,
    label: 'Register a Dataset in DUOS',
    description: 'Contact us to get started registering a new dataset in DUOS.',
    action: 'contactUs',
  },
  {
    icon: AccountBalanceOutlinedIcon,
    label: 'Register Your Institution',
    description: 'Contact us if your institution isn\'t yet registered in DUOS.',
    action: 'contactUs',
  },
]

export default function ResearcherDashboard(): React.JSX.Element {
  usePageTitle('Dashboard')
  const currentUser = Storage.getCurrentUser()
  const visibleTiles = tileMeta.filter(tile => isRenderedForUser(tile.isRenderedForUser, currentUser))
  const { tiles, isLoading } = useConsoleDashboardSummary(
    ['researcher-dashboard-summary'],
    Researcher.getDashboardSummary,
    visibleTiles,
  )

  return (
    <Box sx={{ ...Styles.PAGE }}>
      <ConsoleDashboardTitle>Researcher Console</ConsoleDashboardTitle>

      <ConsoleDashboardGrid tiles={tiles} isLoading={isLoading} />

      <ConsoleDashboardResources
        heading="Helpful Resources for Researchers"
        resources={helpfulResources}
      />

      <ConsoleDashboardPromo
        heading="Get more out of DUOS"
        paragraphs={[
          'Researchers can use DUOS to discover controlled-access datasets and submit data access '
          + 'requests to Data Access Committees. You can also leverage DUOS alongside Terra to meet '
          + 'NIH requirements for analyzing and storing controlled-access data.',
          'Reach out if you\'d like to learn more about either of these.',
        ]}
      />
    </Box>
  )
}
