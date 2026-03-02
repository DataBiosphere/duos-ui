import React, { useMemo } from 'react'
import {
  DataGrid,
  GridRowSelectionModel,
} from '@mui/x-data-grid'
import { Box, Typography, CircularProgress } from '@mui/material'
import { isEmpty } from 'lodash'
import { LibraryDataGridProps } from 'src/types/library'
import { assetRegistry, LibraryRow } from 'src/components/data_library/assets'

const LoadingOverlay = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
    }}
  >
    <CircularProgress />
  </Box>
)

export const LibraryDataGrid: React.FC<LibraryDataGridProps> = ({
  assetType,
  data,
  loading,
  total,
  paginationModel,
  onPaginationChange,
  sortModel,
  onSortChange,
  selectedDatasetIds,
  onSelectionChange,
  exportableDatasets = {},
  radarEnabledDatasetIds = new Set(),
}) => {
  const asset = assetRegistry[assetType]

  const columns = useMemo(
    () => asset.makeColumns({ exportableDatasets, radarEnabledDatasetIds }),
    [asset, exportableDatasets, radarEnabledDatasetIds],
  )

  const getRowId = (row: LibraryRow) => asset.getRowId(row)

  // Derive which DataGrid rows should appear checked from the set of selected dataset IDs
  const rowSelectionModel: GridRowSelectionModel = useMemo(() => ({
    type: 'include',
    ids: asset.computeRowSelection(
      Array.isArray(data) ? data as LibraryRow[] : [],
      selectedDatasetIds,
    ),
  }), [asset, data, selectedDatasetIds])

  const handleSelectionChange = (newSelection: GridRowSelectionModel) => {
    onSelectionChange(
      asset.selectionToDatasetIds(
        Array.isArray(data) ? data as LibraryRow[] : [],
        Array.from(newSelection.ids),
      ),
    )
  }

  const isRowSelectable = (params: { row: LibraryRow }) =>
    params.row ? asset.isRowSelectable(params.row) : false

  if (isEmpty(data)) {
    // Show loading state when data is empty and loading
    if (loading) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '50vh',
          }}
        >
          <CircularProgress />
        </Box>
      )
    }
    // Show empty state only when not loading and no data
    else {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '50vh',
          }}
        >
          <Typography variant="h6" color="text.secondary">
            No {asset.label.plural.toLowerCase()} found matching your criteria
          </Typography>
        </Box>
      )
    }
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <DataGrid
        rows={data as LibraryRow[]}
        columns={columns}
        rowCount={total}
        loading={loading}
        pageSizeOptions={[25, 50, 100]}
        paginationModel={paginationModel}
        paginationMode="server"
        onPaginationModelChange={onPaginationChange}
        sortingMode={asset.sortingMode}
        sortModel={sortModel}
        onSortModelChange={(model) => {
          onSortChange(model.map(item => ({
            field: item.field,
            sort: item.sort ?? null,
          })))
        }}
        checkboxSelection
        disableRowSelectionOnClick
        rowSelectionModel={rowSelectionModel}
        onRowSelectionModelChange={handleSelectionChange}
        isRowSelectable={isRowSelectable}
        getRowId={getRowId}
        sx={{
          '& .MuiDataGrid-cell:focus': {
            outline: 'none',
          },
          '& .MuiDataGrid-cell:focus-within': {
            outline: 'none',
          },
          '& .MuiDataGrid-columnHeader:focus': {
            outline: 'none',
          },
          '& .MuiDataGrid-columnHeader:focus-within': {
            outline: 'none',
          },
        }}
        slots={{
          loadingOverlay: LoadingOverlay,
        }}
      />
    </Box>
  )
}

export default LibraryDataGrid
