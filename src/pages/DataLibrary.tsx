import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Skeleton, Typography } from '@mui/material'
import LibraryTabs from 'src/components/data_library/LibraryTabs'
import SearchBar from 'src/components/SearchBar'
import TableHeaderSection from 'src/components/TableHeaderSection'
import { useLibraryUrlState } from 'src/hooks/useLibraryUrlState'
import {
  AssetType,
  AvailableFilters,
  ExportableDatasets,
  LibraryVersionNew,
  SortOrder,
  TabConfig,
} from 'src/types/library'
import { DatasetTerm } from 'src/types/model'
import { assetRegistry } from 'src/components/data_library/assets'
import LibraryFilters from 'src/components/data_library/LibraryFilters'
import { useLibraryData, useLibraryMetadata } from 'src/hooks/useLibraryData'
import LibraryDataGrid from 'src/components/data_library/LibraryDataGrid'
import { AggregationResult } from 'src/types/elastic'
import LibraryFooter from 'src/components/data_library/LibraryFooter'
import { applyForAccess } from 'src/utils/accessUtils'
import { getBrandedLibrary } from 'src/libs/libraryVersions'
import { Storage } from 'src/libs/storage'
import { Notifications } from 'src/libs/utils'
import { Metrics } from 'src/libs/ajax/Metrics'
import eventList from 'src/libs/events'
import { TerraDataRepo } from 'src/libs/ajax/TerraDataRepo'
import { chain, intersection } from 'lodash'
import { EnumerateSnapshotModel } from 'src/types/tdrModel'
import { getRadarEnabledDatasetsWithRules } from 'src/utils/DatasetUtils'

/**
 * DataLibrary Page Component
 *
 * Main page for browsing and searching datasets and studies in DUOS.
 * Features:
 * - Tabbed interface for Studies vs Datasets views
 * - Advanced filtering sidebar
 * - Server-side pagination and sorting
 * - Multi-select with Apply for Access functionality
 * - URL-based state for shareability
 *
 * State Management:
 * - URL state: filters, pagination, sort, search, active tab (managed by useLibraryUrlState)
 * - Server state: data fetching, caching (managed by React Query via useLibraryData)
 * - Metadata fetching for filter options (useLibraryMetadata)
 * - Local UI state: selection tracking (useState)
 * - Exportable datasets state for enabling export functionality (useState)
 * - Radar-enabled datasets state for showing Radar integration (useState)
 */
export const DataLibrary: React.FC = () => {
  const { query } = useParams()
  const navigate = useNavigate()

  const [urlState, updateUrlState] = useLibraryUrlState()

  const [selectedDatasetIds, setSelectedDatasetIds] = useState<number[]>([])
  const [exportableDatasets, setExportableDatasets] = useState<ExportableDatasets>({})
  const [radarEnabledDatasetIds, setRadarEnabledDatasetIds] = useState<Set<number>>(new Set())

  const user = Storage.getCurrentUser()
  const institutionId = user?.institution?.id
  const institutionName = user?.institution?.name

  const tabs: TabConfig[] = [
    { key: AssetType.STUDIES, label: 'Studies' },
    { key: AssetType.DATASETS, label: 'Datasets' },
    { key: AssetType.MODELS, label: 'AI Models' },
    { key: AssetType.CLINICAL_TRIALS, label: 'Clinical Trials' },
    { key: AssetType.BIOSPECIMENS, label: 'Biospecimens' },
    { key: AssetType.PUBLICATIONS, label: 'Publications' },
    { key: AssetType.PRESENTATIONS, label: 'Presentations' },
  ]

  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchRef.current && urlState.query) {
      searchRef.current.value = urlState.query
    }
  }, [urlState.query])

  useEffect(() => {
    const init = () => {
      const key = query === undefined ? '/datalibrary' : query.toLowerCase()
      if (key === 'myinstitution' && !institutionId) {
        Notifications.showError({ text: 'You must set an institution in your profile to view the `myinstitution` data library' })
        navigate('/profile')
      }
      if (key === '/datalibrary') {
        Metrics.captureEvent(eventList.dataLibrary)
      }
      else {
        const brand = key.replaceAll('/', '').toLowerCase()
        Metrics.captureEvent(eventList.dataLibrary, { brand })
      }
    }
    init()
  }, [query, institutionId, navigate])

  const libraryConfig: LibraryVersionNew = useMemo(() => {
    const brand = getBrandedLibrary(institutionId, institutionName, query)
    const description = 'Search, filter, and select datasets, then click \'Apply for Access\' to request access'

    if (brand) {
      return {
        key: query || 'default',
        query: brand.query,
        icon: brand.icon || undefined,
        title: brand.title,
        description,
        featured: brand.featured,
        order: brand.order,
      }
    }

    return {
      key: 'duos',
      title: 'DUOS Data Library',
      description,
      featured: true,
      order: 0,
    }
  }, [query, institutionId, institutionName])

  const { data: metadata, isLoading: isMetadataLoading } = useLibraryMetadata(libraryConfig)

  const availableFilters: AvailableFilters = useMemo(() => {
    const dacAgg = (metadata?.dac as AggregationResult)?.buckets || []
    const dataTypeAgg = (metadata?.data_type as AggregationResult)?.buckets || []

    return {
      accessManagement: [
        { value: 'controlled', label: 'Controlled' },
        { value: 'open', label: 'Open' },
        { value: 'external', label: 'External' },
      ],
      dataUse: [
        { value: 'HMB', label: 'Health/Medical/Biomedical' },
        { value: 'GRU', label: 'General Research Use' },
        { value: 'DS', label: 'Disease Specific' },
        { value: 'OTHER', label: 'Other Restriction' },
        { value: 'NRES', label: 'No Restrictions' },
      ],
      dataType: dataTypeAgg
        .map(bucket => ({
          value: bucket.key as string,
          label: bucket.key as string,
          count: bucket.doc_count,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
      dac: dacAgg
        .map(bucket => ({
          value: bucket.key as string,
          label: bucket.key as string,
          count: bucket.doc_count,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
      participantCountRange: {
        min: 0,
        max: 100000,
      },
    }
  }, [metadata])

  const { data, isLoading, isFetching, error } = useLibraryData(
    libraryConfig,
    urlState.tab,
    urlState.filters,
    urlState.query ?? '',
    { page: urlState.page, pageSize: urlState.pageSize },
    urlState.sortField && urlState.sortOrder
      ? { field: urlState.sortField, order: urlState.sortOrder }
      : undefined,
  )

  const currentAsset = useMemo(() => assetRegistry[urlState.tab], [urlState.tab])

  const selectedStudyIds = useMemo(() => {
    if (!data?.items) return []
    return currentAsset.getStudyIdsForSelection(
      data.items,
      selectedDatasetIds,
    )
  }, [data, selectedDatasetIds, currentAsset])

  const sortModel = useMemo(() => {
    if (urlState.sortField && urlState.sortOrder) {
      return [{ field: urlState.sortField, sort: urlState.sortOrder }]
    }
    return []
  }, [urlState.sortField, urlState.sortOrder])

  const handleTabChange = (newAssetType: AssetType) => {
    updateUrlState({ tab: newAssetType, page: 0 })
    setSelectedDatasetIds([])
  }

  const handleSearchChange = (query: string) => {
    updateUrlState({
      query,
      page: 0,
    })
  }

  const handleFiltersChange = (newFilters: typeof urlState.filters) => {
    updateUrlState({
      filters: newFilters,
    })
  }

  const handleClearFilters = () => {
    updateUrlState({
      filters: {
        accessManagement: [],
        dataUse: [],
        dataType: [],
        dac: [],
        participantCount: {},
      },
      page: 0,
    })
  }

  const handleSortChange = (model: Array<{ field: string, sort: SortOrder | null }>) => {
    if (model.length > 0 && model[0].sort) {
      updateUrlState({
        sortField: model[0].field,
        sortOrder: model[0].sort,
      })
    }
    else {
      updateUrlState({
        sortField: undefined,
        sortOrder: undefined,
      })
    }
  }

  const handleSelectionChange = (datasetIds: number[]) => {
    setSelectedDatasetIds(datasetIds)
  }

  const handleApplyForAccess = () => {
    applyForAccess(selectedDatasetIds, navigate)
  }

  useEffect(() => {
    const fetchExportable = async () => {
      if (urlState.tab !== AssetType.DATASETS || !data?.items?.length) {
        setExportableDatasets({})
        return
      }
      const datasetIdentifiers = (data.items as DatasetTerm[]).map(d => d.datasetIdentifier).filter(Boolean)
      if (datasetIdentifiers.length === 0) {
        setExportableDatasets({})
        return
      }
      try {
        const result: EnumerateSnapshotModel = await TerraDataRepo.listSnapshotsByDatasetIds(datasetIdentifiers)
        if (result.filteredTotal > 0) {
          const mapped = chain(result.items)
            .filter(snapshot => intersection(result.roleMap[snapshot.id], ['steward', 'reader']).length > 0)
            .groupBy('duosId')
            .value()
          setExportableDatasets(mapped)
        }
        else {
          setExportableDatasets({})
        }
      }
      catch {
        setExportableDatasets({})
      }
    }

    const fetchRadarEnabled = async () => {
      if (urlState.tab !== AssetType.DATASETS || !data?.items?.length) {
        setRadarEnabledDatasetIds(new Set())
        return
      }
      const datasetIds = (data.items as DatasetTerm[]).map(d => d.datasetId)
      if (datasetIds.length === 0) {
        setRadarEnabledDatasetIds(new Set())
        return
      }
      try {
        const radarEnabledIds = await getRadarEnabledDatasetsWithRules(data.items as DatasetTerm[])
        setRadarEnabledDatasetIds(new Set(radarEnabledIds))
      }
      catch {
        setRadarEnabledDatasetIds(new Set())
      }
    }

    fetchExportable()
    fetchRadarEnabled()
  }, [data?.items, urlState.tab])

  if (error) {
    return (
      <Box sx={{ px: 3, py: 4 }}>
        <Box sx={{ textAlign: 'center', color: 'error.main' }}>
          <h2>Error Loading Data</h2>
          <p>{error instanceof Error ? error.message : 'An unexpected error occurred'}</p>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', pb: 5 }}>
      {/* Header */}
      <Box>
        <TableHeaderSection
          icon={libraryConfig.icon ? { src: libraryConfig.icon } : undefined}
          title={libraryConfig.title}
          description={libraryConfig.description}
        />
        <SearchBar
          handleSearchChange={handleSearchChange}
          searchRef={searchRef}
          style={{
            paddingTop: '10px',
          }}
        />
      </Box>

      {/* Tabs */}
      <Box sx={{ px: 3, pt: 2 }}>
        <LibraryTabs
          value={urlState.tab}
          onChange={handleTabChange}
          tabs={tabs}
        />
      </Box>

      {/* Main content area with filters and grid */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', px: 3, pt: 2 }}>
        {/* Filters Sidebar */}
        <Box
          sx={{
            width: 280,
            flexShrink: 0,
            pr: 2,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <LibraryFilters
            filters={urlState.filters}
            onChange={handleFiltersChange}
            onClear={handleClearFilters}
            availableFilters={availableFilters}
            loading={isLoading || isMetadataLoading}
          />
        </Box>

        <Box sx={{ flex: 1, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Asset count */}
          {isFetching
            ? <Skeleton variant="text" width={120} sx={{ fontSize: '1.6rem', mb: 1 }} />
            : (
                <Typography sx={{ fontWeight: 600, fontSize: '1.6rem', mb: 1 }}>
                  {(data?.total ?? 0).toLocaleString()}
                  {' '}
                  {data?.total === 1
                    ? currentAsset.label.singular
                    : currentAsset.label.plural}
                </Typography>
              )}
          {/* Data Library */}
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <LibraryDataGrid
              assetType={urlState.tab}
              data={data?.items || []}
              loading={isFetching}
              total={data?.total || 0}
              paginationModel={{
                page: urlState.page,
                pageSize: urlState.pageSize,
              }}
              onPaginationChange={(model) => {
                updateUrlState({
                  page: model.page,
                  pageSize: model.pageSize,
                })
              }}
              sortModel={sortModel}
              onSortChange={handleSortChange}
              selectedDatasetIds={selectedDatasetIds}
              onSelectionChange={handleSelectionChange}
              exportableDatasets={exportableDatasets}
              radarEnabledDatasetIds={radarEnabledDatasetIds}
            />
          </Box>
        </Box>
      </Box>

      {/* Footer (shown when assets are selected) */}
      <LibraryFooter
        selectedDatasetIds={selectedDatasetIds}
        selectedStudyIds={selectedStudyIds}
        onApplyForAccess={handleApplyForAccess}
      />
    </Box>
  )
}

export default DataLibrary
