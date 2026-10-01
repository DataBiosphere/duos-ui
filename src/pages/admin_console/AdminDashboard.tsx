import React from 'react'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined'
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined'
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined'
import ConsoleDashboard from 'src/components/dashboard/ConsoleDashboard'
import { COMMON_CONSOLE_RESOURCES } from 'src/components/dashboard/dashboardResources'
import { ConsoleDashboardTileMeta } from 'src/components/dashboard/useConsoleDashboardSummary'
import { Admin, AdminDashboardSummary } from 'src/libs/ajax/Admin'
import { ADMIN_CONSOLE_SECTIONS, ADMIN_METRICS_ROUTE } from './adminConsoleRoutes'

type Tile = ConsoleDashboardTileMeta<AdminDashboardSummary>

const roundDays = (days?: number | null) => (days == null ? null : Math.round(days * 10) / 10)

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

const metricTile = (tab: string, tile: Omit<Tile, 'link'>): Tile => ({
  ...tile,
  link: `${ADMIN_METRICS_ROUTE}?tab=${tab}`,
})

const metricTiles: Tile[] = [
  metricTile('decisions', {
    label: 'Decisions',
    icon: FactCheckOutlinedIcon,
    description: 'DAC decisions on DARs submitted in the last 90 days.',
    stats: [
      { label: 'Submitted', value: s => s.metrics?.decisions.submitted },
      { label: 'Approved', value: s => s.metrics?.decisions.approved },
      { label: 'Denied', value: s => s.metrics?.decisions.denied },
      { label: 'Pending', value: s => s.metrics?.decisions.pending },
    ],
  }),
  metricTile('turnaround', {
    label: 'DAC Turnaround',
    icon: TimerOutlinedIcon,
    description: 'Days from submission to DAC decision, last 90 days.',
    stats: [
      { label: 'Median Days', value: s => roundDays(s.metrics?.turnaround.medianDays) },
      { label: 'Mode Days', value: s => s.metrics?.turnaround.modeDays },
      { label: 'Decided', value: s => s.metrics?.turnaround.decided },
    ],
  }),
  metricTile('so-approvals', {
    label: 'SO Approvals',
    icon: VerifiedUserOutlinedIcon,
    description: 'Where submissions from the last 90 days stand with their Signing Official.',
    stats: [
      { label: 'Approved', value: s => s.metrics?.soApprovals.approved },
      { label: 'Pending', value: s => s.metrics?.soApprovals.pending },
      { label: 'Skipped', value: s => s.metrics?.soApprovals.skipped },
    ],
  }),
  metricTile('volume', {
    label: 'Volume',
    icon: BarChartOutlinedIcon,
    description: 'DARs submitted in the last 90 days, and by whom.',
    stats: [
      { label: 'DARs', value: s => s.metrics?.volume.dars },
      { label: 'Researchers', value: s => s.metrics?.volume.researchers },
      { label: 'Institutions', value: s => s.metrics?.volume.institutions },
    ],
  }),
  metricTile('expiration', {
    label: 'Expiration & Renewal',
    icon: EventBusyOutlinedIcon,
    description: 'Access that ended, and datasets renewed, in the last 90 days.',
    stats: [
      { label: 'Expired', value: s => s.metrics?.expiration.expired },
      { label: 'Closed Out', value: s => s.metrics?.expiration.closedOut },
      { label: 'Renewals', value: s => s.metrics?.expiration.renewals },
    ],
  }),
]

const tileMeta = [...sectionTiles, ...metricTiles]

export default function AdminDashboard(): React.JSX.Element {
  return (
    <ConsoleDashboard
      consoleTitle="Admin Console"
      queryKey={['admin-dashboard-summary']}
      queryFn={Admin.getDashboardSummary}
      tileMeta={tileMeta}
      resourcesHeading="Helpful Resources"
      resources={COMMON_CONSOLE_RESOURCES}
    />
  )
}
