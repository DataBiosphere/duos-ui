import React from 'react'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined'
import DatasetOutlinedIcon from '@mui/icons-material/DatasetOutlined'
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import ConsoleDashboard from 'src/components/dashboard/ConsoleDashboard'
import { ConsoleDashboardResource } from 'src/components/dashboard/ConsoleDashboardResources'
import { COMMON_CONSOLE_RESOURCES } from 'src/components/dashboard/dashboardResources'
import { createDataLibraryTile } from 'src/components/dashboard/dashboardTiles'
import { ConsoleDashboardTileMeta } from 'src/components/dashboard/useConsoleDashboardSummary'
import { Researcher, ResearcherDashboardSummary } from 'src/libs/ajax/Researcher'
import { RESEARCHER_CONSOLE_SECTIONS } from './researcherConsoleRoutes'

// Tiles reuse the header's section entries so a tile and its sub-tab can never disagree about a
// route or about who is allowed to see it.
const tileMeta: ConsoleDashboardTileMeta<ResearcherDashboardSummary>[] = [
  createDataLibraryTile<ResearcherDashboardSummary>(),
  {
    ...RESEARCHER_CONSOLE_SECTIONS[0],
    icon: DescriptionOutlinedIcon,
    description: 'Track the data access requests you have submitted.',
    stats: [
      { label: 'Total', value: summary => summary.darRequests?.total },
      { label: 'Approved', value: summary => summary.darRequests?.approved },
      { label: 'Canceled', value: summary => summary.darRequests?.canceled },
      { label: 'In Process', value: summary => summary.darRequests?.inProcess },
    ],
  },
  {
    ...RESEARCHER_CONSOLE_SECTIONS[1],
    icon: AssignmentTurnedInOutlinedIcon,
    description: 'View your current dataset approvals and when access expires.',
    stats: [
      { label: 'Active', value: summary => summary.datasetApprovals?.active },
      { label: 'Expiring in 30 Days', value: summary => summary.datasetApprovals?.expiringSoon },
      { label: 'Expired', value: summary => summary.datasetApprovals?.expired },
    ],
  },
  {
    ...RESEARCHER_CONSOLE_SECTIONS[2],
    icon: CloudUploadOutlinedIcon,
    description: 'Track the status of datasets you have registered in DUOS.',
    // This sums all nine tabs of My Data Submissions, while the linked page opens on Datasets.
    stats: [{ label: 'All Submissions', value: summary => summary.dataSubmissions?.total }],
  },
]

const helpfulResources: ConsoleDashboardResource[] = [
  {
    icon: MenuBookOutlinedIcon,
    label: 'Researcher Guide',
    description: 'A walkthrough of the Researcher role, from browsing the data library to submitting a data access request.',
    href: 'https://duos.blog/help/researcherguide/',
  },
  ...COMMON_CONSOLE_RESOURCES,
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

const promoParagraphs = [
  'Researchers can use DUOS to discover controlled-access datasets and submit data access '
  + 'requests to Data Access Committees. You can also leverage DUOS alongside Terra to meet '
  + 'NIH requirements for analyzing and storing controlled-access data.',
  'Reach out if you\'d like to learn more about either of these.',
]

export default function ResearcherDashboard(): React.JSX.Element {
  return (
    <ConsoleDashboard
      consoleTitle="Researcher Console"
      queryKey={['researcher-dashboard-summary']}
      queryFn={Researcher.getDashboardSummary}
      tileMeta={tileMeta}
      resourcesHeading="Helpful Resources for Researchers"
      resources={helpfulResources}
      promoParagraphs={promoParagraphs}
    />
  )
}
