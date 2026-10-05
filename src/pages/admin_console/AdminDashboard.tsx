import React, { useMemo } from 'react'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined'
import ConsoleDashboard from 'src/components/dashboard/ConsoleDashboard'
import { COMMON_CONSOLE_RESOURCES } from 'src/components/dashboard/dashboardResources'
import { ConsoleDashboardTileMeta } from 'src/components/dashboard/useConsoleDashboardSummary'
import { useMetricTiles } from 'src/components/dashboard/metricTiles'
import { Admin, AdminDashboardSummary } from 'src/libs/ajax/Admin'
import { ADMIN_CONSOLE_SECTIONS, ADMIN_METRICS_ROUTE } from './adminConsoleRoutes'
import { METRICS_TABS } from './metricsTabs'

type Tile = ConsoleDashboardTileMeta<AdminDashboardSummary>

const sectionTiles: Tile[] = [
  {
    ...ADMIN_CONSOLE_SECTIONS[0],
    icon: DescriptionOutlinedIcon,
    description: 'Review data access requests and their DAC decisions across every DAC.',
    stats: [
      { label: 'Total', value: s => s.darRequests?.total },
      { label: 'Approved', value: s => s.darRequests?.approved },
      { label: 'Canceled', value: s => s.darRequests?.canceled },
      { label: 'In Process', value: s => s.darRequests?.inProcess },
    ],
  },
  {
    ...ADMIN_CONSOLE_SECTIONS[1],
    icon: AccountBalanceOutlinedIcon,
    description: 'Create and manage Data Access Committees and their members.',
    stats: [{ label: 'DACs', value: s => s.dacs?.total }],
  },
  {
    ...ADMIN_CONSOLE_SECTIONS[2],
    icon: PeopleAltOutlinedIcon,
    description: 'Find users and manage their roles.',
    stats: [{ label: 'Users', value: s => s.users?.total }],
  },
  {
    ...ADMIN_CONSOLE_SECTIONS[3],
    icon: ApartmentOutlinedIcon,
    description: 'Manage institutions and their Signing Officials.',
    stats: [
      { label: 'Institutions', value: s => s.institutions?.total },
      { label: 'Without an SO', value: s => s.institutions?.withoutSigningOfficial },
    ],
  },
  {
    ...ADMIN_CONSOLE_SECTIONS[4],
    icon: BadgeOutlinedIcon,
    description: 'Issue and revoke researchers\' library cards.',
    stats: [{ label: 'Cards', value: s => s.libraryCards?.total }],
  },
  {
    ...ADMIN_CONSOLE_SECTIONS[5],
    icon: HandshakeOutlinedIcon,
    description: 'View researchers\' DAA pre-authorization across all institutions.',
    stats: [
      { label: 'Agreements', value: s => s.daaAssociations?.agreements },
      { label: 'Researchers Approved', value: s => s.daaAssociations?.researchersApproved },
    ],
  },
]

const SUMMARY_KEY = ['admin-dashboard-summary']

export default function AdminDashboard(): React.JSX.Element {
  const metricTiles = useMetricTiles(SUMMARY_KEY, Admin.getDashboardSummary, ADMIN_METRICS_ROUTE, METRICS_TABS)
  const tileMeta = useMemo(() => [...sectionTiles, ...metricTiles], [metricTiles])
  return (
    <ConsoleDashboard
      consoleTitle="Admin Console"
      queryKey={SUMMARY_KEY}
      queryFn={Admin.getDashboardSummary}
      tileMeta={tileMeta}
      resourcesHeading="Helpful Resources"
      resources={COMMON_CONSOLE_RESOURCES}
    />
  )
}
