import React from 'react'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined'
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import ConsoleDashboard from 'src/components/dashboard/ConsoleDashboard'
import { ConsoleDashboardResource } from 'src/components/dashboard/ConsoleDashboardResources'
import { COMMON_CONSOLE_RESOURCES } from 'src/components/dashboard/dashboardResources'
import { ConsoleDashboardTileMeta } from 'src/components/dashboard/useConsoleDashboardSummary'
import { SigningOfficial, SigningOfficialDashboardSummary } from 'src/libs/ajax/SigningOfficial'
import { SO_CONSOLE_SECTIONS } from './signingOfficialConsoleRoutes'

const tileMeta: ConsoleDashboardTileMeta<SigningOfficialDashboardSummary>[] = [
  {
    ...SO_CONSOLE_SECTIONS[0],
    icon: PeopleAltOutlinedIcon,
    // Data Submitter management lives on this page too, so its count is reported here.
    description: 'Manage researchers who request or submit data on behalf of your institution.',
    stats: [
      { label: 'Active', value: summary => summary.researcherStatus?.active },
      { label: 'Inactive', value: summary => summary.researcherStatus?.inactive },
      { label: 'Data Submitters', value: summary => summary.dataSubmitters?.approved },
    ],
  },
  {
    ...SO_CONSOLE_SECTIONS[1],
    icon: DescriptionOutlinedIcon,
    description: 'Review data access requests submitted by researchers at your institution.',
    stats: [
      { label: 'Total', value: summary => summary.darRequests?.total },
      { label: 'Approved', value: summary => summary.darRequests?.approved },
      { label: 'Canceled', value: summary => summary.darRequests?.canceled },
      { label: 'In Process', value: summary => summary.darRequests?.inProcess },
    ],
  },
  {
    ...SO_CONSOLE_SECTIONS[2],
    icon: FactCheckOutlinedIcon,
    description: 'Approve or reject data access request applications awaiting your signature.',
    stats: [
      { label: 'Total', value: summary => summary.darApprovals?.total },
      { label: 'Awaiting SO Action', value: summary => summary.darApprovals?.awaitingSoAction },
    ],
  },
  {
    ...SO_CONSOLE_SECTIONS[3],
    icon: StorageOutlinedIcon,
    description: 'Browse the datasets and studies registered by your institution.',
    stats: [
      { label: 'Datasets', value: summary => summary.institutionLibrary?.datasets },
      { label: 'Studies', value: summary => summary.institutionLibrary?.studies },
    ],
  },
  {
    ...SO_CONSOLE_SECTIONS[4],
    icon: HandshakeOutlinedIcon,
    description: 'Manage Data Access Agreement associations for your researchers.',
    stats: [
      { label: 'Agreements', value: summary => summary.daaAssociations?.agreements },
      { label: 'Researchers Approved', value: summary => summary.daaAssociations?.researchersApproved },
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
  ...COMMON_CONSOLE_RESOURCES,
]

const promoParagraphs = [
  'Signing Officials can use DUOS to curate and share their institution\'s datasets with the '
  + 'research community. You can also leverage DUOS alongside Terra to meet NIH requirements '
  + 'for analyzing and storing controlled-access data.',
  'Reach out if you\'d like to learn more about either of these.',
]

export default function SigningOfficialDashboard(): React.JSX.Element {
  return (
    <ConsoleDashboard
      consoleTitle="Signing Official Console"
      queryKey={['signing-official-dashboard-summary']}
      queryFn={SigningOfficial.getDashboardSummary}
      tileMeta={tileMeta}
      resourcesHeading="Helpful Resources for Signing Officials"
      resources={helpfulResources}
      promoParagraphs={promoParagraphs}
    />
  )
}
