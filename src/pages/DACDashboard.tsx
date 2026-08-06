import React, { useEffect, useState } from 'react'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined'
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import { isNil } from 'src/utils/NodashUtil'
import { Styles } from 'src/libs/theme'
import { Storage } from 'src/libs/storage'
import { usePageTitle } from 'src/hooks/usePageTitle'
import ConsoleDashboardGrid, { ConsoleDashboardTile, ConsoleDashboardTileMeta } from 'src/components/dashboard/ConsoleDashboardGrid'
import ConsoleDashboardResources, { ConsoleDashboardResource } from 'src/components/dashboard/ConsoleDashboardResources'
import ConsoleDashboardPromo from 'src/components/dashboard/ConsoleDashboardPromo'
import { Notifications, USER_ROLES } from 'src/libs/utils'
import { DAC } from 'src/libs/ajax/DAC'
import { DataSet } from 'src/libs/ajax/DataSet'
import { Collections } from 'src/libs/ajax/Collections'
import { buildElasticsearchQuery } from 'src/hooks/useLibraryData'
import { assetRegistry } from 'src/components/data_library/assets'
import { EMPTY_FILTERS } from 'src/components/data_library/filterRegistry'
import { AssetType, LibraryVersionNew } from 'src/types/library'
import { DuosUser } from 'src/types/model'
import { ElasticsearchQuery } from 'src/types/elastic'
import { extractError } from 'src/utils/ErrorUtils'

const tileMetaByLink: Record<string, ConsoleDashboardTileMeta> = {
  '/dac_console_dar_requests': {
    icon: DescriptionOutlinedIcon,
    description: 'Review and vote on data access requests for your Data Access Committee.',
    statLabels: ['Total', 'Approved', 'Denied', 'Pending', 'Awaiting My Vote'],
  },
  '/manage_dac': {
    icon: AccountBalanceOutlinedIcon,
    description: 'Manage the Data Access Committees you chair.',
    statLabels: ['DACs'],
  },
  '/dac_datasets': {
    icon: StorageOutlinedIcon,
    description: 'View the status of datasets submitted to your Data Access Committee.',
    statLabels: ['Datasets'],
  },
  '/datalibrary': {
    icon: LibraryBooksOutlinedIcon,
    description: 'Browse and search datasets, studies, and other assets available in DUOS.',
    statLabels: ['Studies', 'Datasets', 'AI Models', 'Workspaces'],
  },
}

// These pages no longer have their own top-nav sub-tabs; the Dashboard is now
// the only place DAC members/chairs navigate to them from, so the tile list
// lives here instead of being derived from headerTabsConfig.
const DASHBOARD_TILES: Array<ConsoleDashboardTile & { isRenderedForUser?: (user: DuosUser) => boolean }> = [
  { label: 'Data Access Requests', link: '/dac_console_dar_requests' },
  { label: 'Manage DACs', link: '/manage_dac', isRenderedForUser: user => user?.isChairPerson },
  { label: 'My DAC\'s Datasets', link: '/dac_datasets', isRenderedForUser: user => user?.isChairPerson },
  { label: 'Data Library', link: '/datalibrary' },
]

const helpfulResources: ConsoleDashboardResource[] = [
  {
    icon: MenuBookOutlinedIcon,
    label: 'DAC User Guide',
    description: 'A walkthrough of the DAC role, from reviewing data access requests to managing your committee\'s datasets.',
    href: 'https://duos.blog/help/dacguide/',
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

const fetchDacDatasetTotal = async (user: DuosUser): Promise<number> => {
  const dacIds = user.roles?.map(r => r.dacId).filter(id => id !== undefined) ?? []
  if (dacIds.length === 0) {
    return 0
  }
  const query = {
    from: 0,
    size: 10000,
    query: {
      terms: {
        dacId: dacIds,
      },
    },
  } as unknown as ElasticsearchQuery
  const datasetTerms = await DataSet.searchDatasetIndex(query)
  return datasetTerms.length
}

export default function DACDashboard(): React.JSX.Element {
  usePageTitle('Dashboard')

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [statValuesByLink, setStatValuesByLink] = useState<Record<string, Record<string, number>>>({})

  useEffect(() => {
    const init = async (): Promise<void> => {
      try {
        setIsLoading(true)
        const currentUser = Storage.getCurrentUser()
        const isChair = currentUser.isChairPerson
        const role = isChair ? USER_ROLES.chairperson : USER_ROLES.member
        // Non-public studies are hidden from members; Chairpersons retain full visibility.
        const restrictToPublicVisibility = !isChair

        const [collections, libraryTotals, dacCount, dacDatasetTotal] = await Promise.all([
          Collections.getCollectionSummariesByRoleName(role),
          fetchLibraryTotals(restrictToPublicVisibility),
          isChair ? DAC.list().then(dacs => dacs.length) : Promise.resolve(undefined),
          isChair ? fetchDacDatasetTotal(currentUser) : Promise.resolve(undefined),
        ])

        const approvedCount = collections.filter(collection => collection.status === 'Complete').length
        const deniedCount = collections.filter(collection => collection.status === 'Canceled').length
        const pendingCount = collections.length - approvedCount - deniedCount
        const awaitingMyVoteCount = collections.filter(collection => collection.actions.includes('Vote')).length

        setStatValuesByLink({
          '/dac_console_dar_requests': {
            Total: collections.length,
            Approved: approvedCount,
            Denied: deniedCount,
            Pending: pendingCount,
            'Awaiting My Vote': awaitingMyVoteCount,
          },
          '/datalibrary': libraryTotals,
          ...(!isNil(dacCount) && {
            '/manage_dac': { DACs: dacCount },
          }),
          ...(!isNil(dacDatasetTotal) && {
            '/dac_datasets': { Datasets: dacDatasetTotal },
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
        heading="Helpful Resources for DACs"
        resources={helpfulResources}
      />

      <ConsoleDashboardPromo
        heading="Get more out of DUOS"
        paragraphs={[
          'DACs can use DUOS to centralize review of data access requests, track compliance across every '
          + 'request, and manage the datasets under their committee\'s oversight in one place.',
          'Reach out if you\'d like to learn more about what DUOS can do for your committee.',
        ]}
      />
    </div>
  )
}
