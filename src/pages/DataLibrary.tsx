import React, { useMemo, useRef, useState } from 'react'
import { Box } from '@mui/material'
import LibraryTabs from 'src/components/data_library/LibraryTabs'
import SearchBar from 'src/components/SearchBar'
import TableHeaderSection from 'src/components/TableHeaderSection'
import { useLibraryUrlState } from 'src/hooks/useLibraryUrlState'
import { AssetType, AvailableFilters, LibraryVersionNew, TabConfig } from 'src/types/library'
import LibraryFilters from 'src/components/data_library/LibraryFilters'
import { useLibraryData } from 'src/hooks/useLibraryData'
import LibraryDataGrid from 'src/components/data_library/LibraryDataGrid'

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
  const [urlState, updateUrlState] = useLibraryUrlState()

  const [selectedDatasetIds, setSelectedDatasetIds] = useState<number[]>([])

  const searchRef = useRef<HTMLInputElement>(null)

  const libraryConfig: LibraryVersionNew = {
    key: 'duos',
    title: 'DUOS Data Library',
    description: 'Search, filter, and select datasets, then click \'Apply for Access\' to request access',
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

  const { data, isLoading, isFetching, error } = useLibraryData(
    libraryConfig,
    urlState.tab,
    urlState.filters,
    { page: urlState.page, pageSize: urlState.pageSize },
    urlState.sortField && urlState.sortOrder
      ? { field: urlState.sortField, order: urlState.sortOrder }
      : undefined,
  )

  const sortModel = useMemo(() => {
    if (urlState.sortField && urlState.sortOrder) {
      return [{ field: urlState.sortField, sort: urlState.sortOrder }]
    }
    return []
  }, [urlState.sortField, urlState.sortOrder])

  const handleTabChange = (newAssetType: AssetType) => {
    updateUrlState({ tab: newAssetType })
    setSelectedDatasetIds([])
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
    })
  }

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

  if (error) {
    console.log(error)
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
      <Box>
        <TableHeaderSection
          title={libraryConfig.title}
          description={libraryConfig.description}
        />
        <SearchBar
          handleSearchChange={() => {}}
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
    </Box>
  )
}

export default DataLibrary
