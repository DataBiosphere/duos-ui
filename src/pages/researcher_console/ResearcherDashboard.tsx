import React, { useEffect, useState } from 'react'
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
import { isNil } from 'src/utils/NodashUtil'
import { Styles } from 'src/libs/theme'
import { Storage } from 'src/libs/storage'
import { usePageTitle } from 'src/hooks/usePageTitle'
import ConsoleDashboardGrid, { ConsoleDashboardTile, ConsoleDashboardTileMeta } from 'src/components/dashboard/ConsoleDashboardGrid'
import ConsoleDashboardResources, { ConsoleDashboardResource } from 'src/components/dashboard/ConsoleDashboardResources'
import ConsoleDashboardPromo from 'src/components/dashboard/ConsoleDashboardPromo'
import { isRestrictedToPublicVisibility, Notifications, USER_ROLES } from 'src/libs/utils'
import { User } from 'src/libs/ajax/User'
import { Collections } from 'src/libs/ajax/Collections'
import { DataSet } from 'src/libs/ajax/DataSet'
import { buildElasticsearchQuery } from 'src/hooks/useLibraryData'
import { assetRegistry } from 'src/components/data_library/assets'
import { EMPTY_FILTERS } from 'src/components/data_library/filterRegistry'
import { AssetType, LibraryVersionNew } from 'src/types/library'
import { DuosUser } from 'src/types/model'
import { extractError } from 'src/utils/ErrorUtils'
import { SUBMISSION_TAB_TYPES, buildSubmissionOwnershipQuery } from 'src/pages/researcher_console/DatasetSubmissions'

const tileMetaByLink: Record<string, ConsoleDashboardTileMeta> = {
  '/datalibrary': {
    icon: LibraryBooksOutlinedIcon,
    description: 'Browse and search datasets, studies, and other assets available in DUOS.',
    statLabels: ['Studies', 'Datasets', 'AI Models', 'Workspaces'],
  },
  '/researcher_console': {
    icon: DescriptionOutlinedIcon,
    description: 'Track the data access requests you have submitted.',
    statLabels: ['Total', 'Approved', 'Denied', 'Pending'],
  },
  '/datasets': {
    icon: AssignmentTurnedInOutlinedIcon,
    description: 'View your current dataset approvals and when access expires.',
    statLabels: ['Active', 'Expiring in 30 Days', 'Expired'],
  },
  '/dataset_submissions': {
    icon: CloudUploadOutlinedIcon,
    description: 'Track the status of datasets you have registered in DUOS.',
    statLabels: ['Total'],
  },
}

// These pages no longer have their own top-nav sub-tabs; the Dashboard is now
// the only place researchers navigate to them from, so the tile list lives
// here instead of being derived from headerTabsConfig.
const DASHBOARD_TILES: Array<ConsoleDashboardTile & { isRenderedForUser?: (user: DuosUser) => boolean }> = [
  { label: 'Data Library', link: '/datalibrary' },
  { label: 'Data Access Requests', link: '/researcher_console' },
  { label: 'My Dataset Approvals', link: '/datasets' },
  { label: 'Data Submissions', link: '/dataset_submissions', isRenderedForUser: user => user?.isDataSubmitter },
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

const MS_PER_DAY = 24 * 60 * 60 * 1000

interface LibraryTotals {
  Studies: number
  Datasets: number
  'AI Models': number
  Workspaces: number
  [key: string]: number
}

const fetchLibraryTotals = async (restrictToPublicVisibility: boolean): Promise<LibraryTotals> => {
  const libraryConfig: LibraryVersionNew = {
    key: 'duos',
    title: 'DUOS Data Library',
    featured: true,
    order: 0,
    restrictToPublicVisibility,
  }
  const [studies, datasets, models, workspaces] = await Promise.all(
    [AssetType.STUDIES, AssetType.DATASETS, AssetType.MODELS, AssetType.WORKSPACES].map(async (assetType) => {
      // Some asset types (e.g. Studies) derive their count from a composite
      // aggregation whose size must be >= 1, so a plain pageSize of 0 is rejected.
      const pagination = { page: 0, pageSize: 1 }
      const response = await DataSet.searchDatasetIndexV2(
        buildElasticsearchQuery(libraryConfig, assetType, EMPTY_FILTERS, '', pagination),
      )
      return assetRegistry[assetType].transformResponse(response, pagination).total
    }),
  )
  return { Studies: studies, Datasets: datasets, 'AI Models': models, Workspaces: workspaces }
}

const fetchSubmissionTotal = async (user: DuosUser): Promise<number | undefined> => {
  const query = buildSubmissionOwnershipQuery(user)
  if (isNil(query)) {
    return undefined
  }
  const libraryConfig: LibraryVersionNew = {
    key: `dashboard-submissions-${user.userId}`,
    title: 'My Data Submissions',
    featured: true,
    order: 0,
    query,
    showAllControlled: true,
  }
  const pagination = { page: 0, pageSize: 1 }
  const totals = await Promise.all(
    Array.from(SUBMISSION_TAB_TYPES).map(async (assetType) => {
      const response = await DataSet.searchDatasetIndexV2(
        buildElasticsearchQuery(libraryConfig, assetType, EMPTY_FILTERS, '', pagination),
      )
      return assetRegistry[assetType].transformResponse(response, pagination).total
    }),
  )
  return totals.reduce((sum, total) => sum + total, 0)
}

export default function ResearcherDashboard(): React.JSX.Element {
  usePageTitle('Dashboard')

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [statValuesByLink, setStatValuesByLink] = useState<Record<string, Record<string, number>>>({})

  useEffect(() => {
    const init = async (): Promise<void> => {
      try {
        setIsLoading(true)
        const currentUser = Storage.getCurrentUser()
        const restrictToPublicVisibility = isRestrictedToPublicVisibility(currentUser)

        const [libraryTotals, collections, approvedDatasets, submissionTotal] = await Promise.all([
          fetchLibraryTotals(restrictToPublicVisibility),
          Collections.getCollectionSummariesByRoleName(USER_ROLES.researcher),
          User.getApprovedDatasets(),
          currentUser?.isDataSubmitter
            ? fetchSubmissionTotal(currentUser)
            : Promise.resolve(undefined),
        ])

        const approvedDarCount = collections.filter(collection => collection.status === 'Complete').length
        const deniedDarCount = collections.filter(collection => collection.status === 'Canceled').length
        const pendingDarCount = collections.length - approvedDarCount - deniedDarCount

        const now = Date.now()
        const in30Days = now + 30 * MS_PER_DAY
        const expiredCount = approvedDatasets.filter(dataset => dataset.expirationDate < now).length
        const expiringSoonCount = approvedDatasets.filter(
          dataset => dataset.expirationDate >= now && dataset.expirationDate <= in30Days,
        ).length
        const activeCount = approvedDatasets.length - expiredCount

        setStatValuesByLink({
          '/datalibrary': libraryTotals,
          '/researcher_console': {
            Total: collections.length,
            Approved: approvedDarCount,
            Denied: deniedDarCount,
            Pending: pendingDarCount,
          },
          '/datasets': {
            Active: activeCount,
            'Expiring in 30 Days': expiringSoonCount,
            Expired: expiredCount,
          },
          ...(!isNil(submissionTotal) && {
            '/dataset_submissions': {
              Total: submissionTotal,
            },
          }),
        })
        setIsLoading(false)
      }
      catch (error) {
        const message = extractError(error)
        Notifications.showError({ text: `Error: Unable to load dashboard statistics: ${message}` })
        setIsLoading(false)
      }
    }
    init()
  }, [])

  const currentUser = Storage.getCurrentUser()
  const tiles = DASHBOARD_TILES.filter(tile => tile.isRenderedForUser?.(currentUser) ?? true)

  return (
    <div style={Styles.PAGE}>
      <ConsoleDashboardGrid
        tiles={tiles}
        tileMetaByLink={tileMetaByLink}
        statValuesByLink={statValuesByLink}
        isLoading={isLoading}
      />

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
    </div>
  )
}
