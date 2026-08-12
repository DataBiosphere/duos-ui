import React from 'react'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import ConsoleDashboard from 'src/components/dashboard/ConsoleDashboard'
import { ConsoleDashboardResource } from 'src/components/dashboard/ConsoleDashboardResources'
import { COMMON_CONSOLE_RESOURCES } from 'src/components/dashboard/dashboardResources'
import { createDataLibraryTile } from 'src/components/dashboard/dashboardTiles'
import { ConsoleDashboardTileMeta } from 'src/components/dashboard/useConsoleDashboardSummary'
import { DAC, DacDashboardSummary } from 'src/libs/ajax/DAC'

// These pages no longer have their own top-nav sub-tabs; the Dashboard is now the only place DAC
// members and chairs navigate to them from, so the tile list lives here.
const tileMeta: ConsoleDashboardTileMeta<DacDashboardSummary>[] = [
  {
    label: 'Data Access Requests',
    link: '/dac_console_dar_requests',
    icon: DescriptionOutlinedIcon,
    description: 'Review and vote on data access requests for your Data Access Committee.',
    stats: [
      { label: 'Total', value: summary => summary.darRequests?.total },
      { label: 'Approved', value: summary => summary.darRequests?.approved },
      { label: 'Pending', value: summary => summary.darRequests?.pending },
      { label: 'Awaiting My Vote', value: summary => summary.darRequests?.awaitingMyVote },
    ],
  },
  {
    label: 'Manage DACs',
    link: '/dac_console/manage_dac',
    icon: AccountBalanceOutlinedIcon,
    description: 'Manage the Data Access Committees you chair.',
    stats: [{ label: 'DACs', value: summary => summary.dacs?.total }],
    isRenderedForUser: user => user?.isChairPerson === true,
  },
  {
    label: 'My DAC\'s Datasets',
    link: '/dac_datasets',
    icon: StorageOutlinedIcon,
    description: 'View the status of datasets submitted to your Data Access Committee.',
    stats: [{ label: 'Datasets', value: summary => summary.dacDatasets?.total }],
    isRenderedForUser: user => user?.isChairPerson === true,
  },
  createDataLibraryTile<DacDashboardSummary>(),
]

const helpfulResources: ConsoleDashboardResource[] = [
  {
    icon: MenuBookOutlinedIcon,
    label: 'DAC User Guide',
    description: 'A walkthrough of the DAC role, from reviewing data access requests to managing your committee\'s datasets.',
    href: 'https://duos.blog/help/dacguide/',
  },
  ...COMMON_CONSOLE_RESOURCES,
]

const promoParagraphs = [
  'DACs can use DUOS to centralize review of data access requests, track compliance across every '
  + 'request, and manage the datasets under their committee\'s oversight in one place.',
  'Reach out if you\'d like to learn more about what DUOS can do for your committee.',
]

export default function DACDashboard(): React.JSX.Element {
  return (
    <ConsoleDashboard
      queryKey={['dac-dashboard-summary']}
      queryFn={DAC.getDashboardSummary}
      tileMeta={tileMeta}
      resourcesHeading="Helpful Resources for DACs"
      resources={helpfulResources}
      promoParagraphs={promoParagraphs}
    />
  )
}
