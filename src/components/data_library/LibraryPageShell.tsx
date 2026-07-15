import React from 'react'
import { Box } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import LibraryTabs from 'src/components/data_library/LibraryTabs'
import LibraryFilters from 'src/components/data_library/LibraryFilters'
import LibraryDataGrid from 'src/components/data_library/LibraryDataGrid'
import InstantApprovalBadge from 'src/components/data_library/InstantApprovalBadge'
import { ExportableDatasets, TabConfig } from 'src/types/library'
import { LibraryPageState } from 'src/hooks/useLibraryPageState'

interface GridExtras {
  selectedDatasetIds?: number[]
  onSelectionChange?: (ids: number[]) => void
  extraColumns?: GridColDef[]
  checkboxSelection?: boolean
  exportableDatasets?: ExportableDatasets
  radarEnabledDatasetIds?: Set<number>
}

interface LibraryPageShellProps {
  pageState: LibraryPageState
  tabs: TabConfig[]
  header: React.ReactNode
  gridExtras?: GridExtras
  footer?: React.ReactNode
}

export const LibraryPageShell: React.FC<LibraryPageShellProps> = ({
  pageState,
  tabs,
  header,
  gridExtras = {},
  footer,
}) => {
  const {
    urlState,
    updateUrlState,
    data,
    isFetching,
    error,
    isMetadataLoading,
    tabCounts,
    filterSections,
    externalFilters,
    sortModel,
    handleTabChange,
    handleFiltersChange,
    handleClearFilters,
    handleRemoveExternalFilter,
    handleSortChange,
    handleToggleFilters,
  } = pageState

  const {
    selectedDatasetIds = [],
    onSelectionChange = () => {},
    extraColumns,
    checkboxSelection = true,
    exportableDatasets,
    radarEnabledDatasetIds,
  } = gridExtras

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
      <Box>{header}</Box>

      <Box sx={{ px: 3, pt: 1 }}>
        <LibraryTabs
          value={urlState.tab}
          onChange={handleTabChange}
          tabs={tabs.map(tab => ({ ...tab, count: tabCounts?.[tab.key] }))}
        />
      </Box>

      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', px: 3, pt: 2 }}>
        <Box
          sx={{
            width: urlState.hideFilters ? 40 : 280,
            flexShrink: 0,
            pr: urlState.hideFilters ? 0 : 2,
            overflowY: urlState.hideFilters ? 'hidden' : 'auto',
            overflowX: 'hidden',
            transition: 'width 0.2s ease',
          }}
        >
          <LibraryFilters
            filters={urlState.filters}
            onChange={handleFiltersChange}
            onClear={handleClearFilters}
            sections={filterSections}
            externalFilters={externalFilters}
            onRemoveExternalFilter={handleRemoveExternalFilter}
            loading={isMetadataLoading}
            isOpen={!urlState.hideFilters}
            onToggle={handleToggleFilters}
          />
        </Box>

        <Box sx={{ flex: 1, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            {isFetching
              ? <Skeleton variant="text" width={120} sx={{ fontSize: '15px' }} />
              : (
                  <Typography
                    sx={{
                      color: 'primary.main',
                      fontFamily: 'Montserrat, sans-serif',
                      fontSize: '15px',
                      fontWeight: 'bold',
                    }}
                  >
                    {(data?.total ?? 0).toLocaleString()}
                    {' '}
                    {data?.total === 1 ? currentAsset.label.singular : currentAsset.label.plural}
                  </Typography>
                )}
            {radarEnabledDatasetIds !== undefined && <InstantApprovalBadge />}
          </Box>
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <LibraryDataGrid
              assetType={urlState.tab}
              data={data?.items || []}
              loading={isFetching}
              total={data?.total || 0}
              paginationModel={{ page: urlState.page, pageSize: urlState.pageSize }}
              onPaginationChange={(model) => {
                updateUrlState({ page: model.page, pageSize: model.pageSize })
              }}
              sortModel={sortModel}
              onSortChange={handleSortChange}
              selectedDatasetIds={selectedDatasetIds}
              onSelectionChange={onSelectionChange}
              exportableDatasets={exportableDatasets}
              radarEnabledDatasetIds={radarEnabledDatasetIds}
              extraColumns={extraColumns}
              checkboxSelection={checkboxSelection}
            />
          </Box>
        </Box>
      </Box>

      {footer}
    </Box>
  )
}

export default LibraryPageShell
