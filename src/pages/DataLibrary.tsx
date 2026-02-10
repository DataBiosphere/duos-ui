import React, { useState, useMemo } from 'react'
import { Box } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { AssetType, LibraryVersion, TabConfig, AvailableFilters } from 'src/types/library'
import { useLibraryUrlState } from 'src/hooks/useLibraryUrlState'
import { useLibraryData } from 'src/hooks/useLibraryData'
import { LibraryHeader } from 'src/components/data_library/LibraryHeader'
import { LibraryTabs } from 'src/components/data_library/LibraryTabs'
import { LibraryFilters } from 'src/components/data_library/LibraryFilters'
import { LibraryDataGrid } from 'src/components/data_library/LibraryDataGrid'
import { LibraryFooter } from 'src/components/data_library/LibraryFooter'

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
 * - Local UI state: selection tracking (useState)
 */
export const DataLibrary: React.FC = () => {
  const navigate = useNavigate()

  // URL-based state for all filterable/pageable parameters
  const [urlState, updateUrlState] = useLibraryUrlState()

  // Local selection state (dataset IDs)
  const [selectedDatasetIds, setSelectedDatasetIds] = useState<number[]>([])

  const libraryConfig: LibraryVersion = {
    key: 'duos',
    query: null,
    icon: null,
    title: 'DUOS Data Library',
    description: 'Browse and request access to datasets',
    featured: true,
    order: 0,
  }

  const tabs: TabConfig[] = [
    { key: AssetType.STUDIES, label: 'Studies' },
    { key: AssetType.DATASETS, label: 'Datasets' },
  ]

  const availableFilters: AvailableFilters = {
    accessManagement: [
      { value: 'controlled', label: 'Controlled' },
      { value: 'open', label: 'Open' },
      { value: 'external', label: 'External' },
    ],
    dataUse: [
      { value: 'HMB', label: 'Health/Medical/Biomedical' },
      { value: 'GRU', label: 'General Research Use' },
      { value: 'DS', label: 'Disease Specific' },
      { value: 'NRES', label: 'No Restrictions' },
    ],
    dataType: [
      { value: 'Phenotype', label: 'Phenotype' },
      { value: 'Genomic', label: 'Genomic' },
      { value: 'Transcriptomic', label: 'Transcriptomic' },
    ],
    dac: [],
    participantCountRange: {
      min: 0,
      max: 100000,
    },
  }

  // Fetch data based on current state
  const { data, isLoading, isFetching, error } = useLibraryData(
    libraryConfig,
    urlState.tab,
    urlState.filters,
    urlState.search,
    { page: urlState.page, pageSize: urlState.pageSize },
    urlState.sortField && urlState.sortOrder
      ? { field: urlState.sortField, order: urlState.sortOrder }
      : undefined,
  )

  const handleTabChange = (newAssetType: AssetType) => {
    updateUrlState({ tab: newAssetType })
    setSelectedDatasetIds([])
  }

  const handleSearchChange = (searchTerm: string) => {
    updateUrlState({
      search: searchTerm,
      page: 0,
    })
  }

  const handleClearSearch = () => {
    updateUrlState({ search: '' })
  }

  const handleFiltersChange = (newFilters: typeof urlState.filters) => {
    updateUrlState({
      filters: newFilters,
      page: 0,
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

  const sortModel = useMemo(() => {
    if (urlState.sortField && urlState.sortOrder) {
      return [{ field: urlState.sortField, sort: urlState.sortOrder }]
    }
    return []
  }, [urlState.sortField, urlState.sortOrder])

  const handleSortChange = (model: Array<{ field: string, sort: 'asc' | 'desc' | null }>) => {
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
    // Navigate to DAR Application with selected dataset IDs
    const datasetIdsParam = selectedDatasetIds.join(',')
    navigate(`/dar_application?datasetIds=${datasetIdsParam}`)
  }

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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <Box sx={{ px: 3, pt: 3 }}>
        <LibraryHeader
          icon={null}
          title="Data Library"
          description="Search and browse available datasets and studies"
          searchTerm={urlState.search}
          onSearchChange={handleSearchChange}
          onClearSearch={handleClearSearch}
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
            loading={isLoading}
          />
        </Box>

        {/* Data Grid */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
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
          />
        </Box>
      </Box>

      {/* Footer (shown when datasets are selected) */}
      <LibraryFooter
        selectedDatasetIds={selectedDatasetIds}
        datasets={urlState.tab === AssetType.DATASETS ? data?.items || [] : []}
        onApplyForAccess={handleApplyForAccess}
      />
    </Box>
  )
}

export default DataLibrary
