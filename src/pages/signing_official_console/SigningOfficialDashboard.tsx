import React, { useEffect, useState } from 'react'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined'
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import { isNil } from 'src/utils/NodashUtil'
import { Styles } from 'src/libs/theme'
import { Storage } from 'src/libs/storage'
import { usePageTitle } from 'src/hooks/usePageTitle'
import { headerTabsConfig } from 'src/components/DuosHeader'
import ConsoleDashboardGrid, { ConsoleDashboardTileMeta } from 'src/components/dashboard/ConsoleDashboardGrid'
import ConsoleDashboardTitle from 'src/components/dashboard/ConsoleDashboardTitle'
import ConsoleDashboardResources, { ConsoleDashboardResource } from 'src/components/dashboard/ConsoleDashboardResources'
import ConsoleDashboardPromo from 'src/components/dashboard/ConsoleDashboardPromo'
import { hasDataSubmitterRole, Notifications, USER_ROLES } from 'src/libs/utils'
import { User } from 'src/libs/ajax/User'
import { Collections } from 'src/libs/ajax/Collections'
import { DataSet } from 'src/libs/ajax/DataSet'
import { DAA } from 'src/libs/ajax/DAA'
import { buildResearcherRows } from 'src/pages/signing_official_console/DAAAssignment'
import { getBrandedLibrary } from 'src/libs/libraryVersions'
import { buildElasticsearchQuery } from 'src/hooks/useLibraryData'
import { assetRegistry } from 'src/components/data_library/assets'
import { EMPTY_FILTERS } from 'src/components/data_library/filterRegistry'
import { AssetType, LibraryVersionNew } from 'src/types/library'
import { DAAObject } from 'src/types/model'
import { extractError } from 'src/utils/ErrorUtils'

const tileMetaByLink: Record<string, ConsoleDashboardTileMeta> = {
  '/signing_official_console/library_cards': {
    icon: PeopleAltOutlinedIcon,
    description: 'Manage researchers who request data on behalf of your institution.',
    statLabels: ['Active', 'Inactive'],
  },
  '/signing_official_console/dar_requests': {
    icon: DescriptionOutlinedIcon,
    description: 'Review data access requests submitted by researchers at your institution.',
    statLabels: ['Total', 'Approved', 'Denied', 'Pending'],
  },
  '/signing_official_console/dar_approvals': {
    icon: FactCheckOutlinedIcon,
    description: 'Approve or reject data access request applications awaiting your signature.',
    statLabels: ['Total', 'Awaiting SO Action'],
  },
  '/signing_official_console/data_submitters': {
    icon: GroupOutlinedIcon,
    description: 'Manage the researchers who submit data on behalf of your institution.',
    statLabels: ['Approved'],
  },
  '/datalibrary/myinstitution': {
    icon: StorageOutlinedIcon,
    description: 'Browse the datasets and studies registered by your institution.',
    statLabels: ['Datasets', 'Studies'],
  },
  '/signing_official_console/researchers_daa_associations': {
    icon: HandshakeOutlinedIcon,
    description: 'Manage Data Access Agreement associations for your researchers.',
    statLabels: ['Agreements', 'Researchers Approved'],
  },
}

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

// Some DAAs aren't mapped to any DAC and aren't selectable for pre-authorization;
// mirrors the filtering in ManageResearcherDAAs.tsx so the counts match that page.
const filterAssignableDaas = (daas: Array<DAAObject & { broadDaa?: boolean }>): DAAObject[] =>
  daas.filter((daa) => {
    const hasMappedDac = Array.isArray(daa.dacs) && daa.dacs.length > 0
    return Boolean(daa.broadDaa) || hasMappedDac
  })

interface InstitutionLibraryTotals {
  datasetTotal: number
  studyTotal: number
}

const fetchInstitutionLibraryTotals = async (institutionId?: number, institutionName?: string): Promise<InstitutionLibraryTotals | undefined> => {
  if (isNil(institutionId)) {
    return undefined
  }
  const brand = getBrandedLibrary(institutionId, institutionName, 'myinstitution')
  const libraryConfig: LibraryVersionNew = {
    key: 'myinstitution',
    query: brand?.query,
    icon: brand?.icon || undefined,
    title: brand?.title ?? 'My Institution\'s Data Library',
    featured: brand?.featured ?? false,
    order: brand?.order ?? 999,
    restrictToPublicVisibility: false,
  }
  const datasetPagination = { page: 0, pageSize: 0 }
  // Studies use a composite aggregation whose `size` is derived from pagination and must be >= 1,
  // unlike the plain hit-count query datasets use — a pageSize of 0 here is rejected by Elasticsearch.
  const studyPagination = { page: 0, pageSize: 1 }
  const [datasetResponse, studyResponse] = await Promise.all([
    DataSet.searchDatasetIndexV2(buildElasticsearchQuery(libraryConfig, AssetType.DATASETS, EMPTY_FILTERS, '', datasetPagination)),
    DataSet.searchDatasetIndexV2(buildElasticsearchQuery(libraryConfig, AssetType.STUDIES, EMPTY_FILTERS, '', studyPagination)),
  ])
  return {
    datasetTotal: datasetResponse.total,
    studyTotal: assetRegistry[AssetType.STUDIES].transformResponse(studyResponse, studyPagination).total,
  }
}

export default function SigningOfficialDashboard(): React.JSX.Element {
  usePageTitle('Dashboard')

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [statValuesByLink, setStatValuesByLink] = useState<Record<string, Record<string, number>>>({})

  useEffect(() => {
    const init = async (): Promise<void> => {
      try {
        setIsLoading(true)
        const currentUser = Storage.getCurrentUser()

        const [researchers, collections, libraryTotals, daas] = await Promise.all([
          User.list(USER_ROLES.signingOfficial),
          Collections.getCollectionSummariesByRoleName(USER_ROLES.signingOfficial),
          fetchInstitutionLibraryTotals(currentUser?.institution?.id, currentUser?.institution?.name),
          DAA.getDaas(),
        ])
        const assignableDaas = filterAssignableDaas(daas)
        const approvedResearcherCount = buildResearcherRows(researchers, assignableDaas)
          .filter(row => row.authorizedCount > 0).length

        const activeResearcherCount = researchers.filter(researcher => !isNil(researcher.libraryCard)).length
        const inactiveResearcherCount = researchers.length - activeResearcherCount

        const approvedDarCount = collections.filter(collection => collection.status === 'Complete').length
        const deniedDarCount = collections.filter(collection => collection.status === 'Canceled').length
        const pendingDarCount = collections.length - approvedDarCount - deniedDarCount

        const totalApprovalsCount = collections.filter(collection =>
          collection.requiresSOApproval || collection.actions.includes('Review_Progress_Report')).length
        const awaitingSOActionCount = collections.filter(collection => collection.actions.includes('Approve')).length

        const approvedDataSubmitterCount = researchers.filter(hasDataSubmitterRole).length

        setStatValuesByLink({
          '/signing_official_console/library_cards': {
            Active: activeResearcherCount,
            Inactive: inactiveResearcherCount,
          },
          '/signing_official_console/dar_requests': {
            Total: collections.length,
            Approved: approvedDarCount,
            Denied: deniedDarCount,
            Pending: pendingDarCount,
          },
          '/signing_official_console/dar_approvals': {
            'Total': totalApprovalsCount,
            'Awaiting SO Action': awaitingSOActionCount,
          },
          '/signing_official_console/data_submitters': {
            Approved: approvedDataSubmitterCount,
          },
          '/signing_official_console/researchers_daa_associations': {
            'Agreements': assignableDaas.length,
            'Researchers Approved': approvedResearcherCount,
          },
          ...(!isNil(libraryTotals) && {
            '/datalibrary/myinstitution': {
              Datasets: libraryTotals.datasetTotal,
              Studies: libraryTotals.studyTotal,
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

  const soConsoleTab = headerTabsConfig.find(tab => tab.label === 'SO Console')
  const tiles = (soConsoleTab?.children ?? []).filter(child => child.label !== 'Dashboard')

  return (
    <div style={Styles.PAGE}>
      <ConsoleDashboardTitle>Signing Official Console</ConsoleDashboardTitle>
      <ConsoleDashboardGrid
        tiles={tiles}
        tileMetaByLink={tileMetaByLink}
        statValuesByLink={statValuesByLink}
        isLoading={isLoading}
      />

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
    </div>
  )
}
