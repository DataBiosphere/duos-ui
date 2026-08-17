import React, { useCallback, useMemo, useState } from 'react'
import { Box, CircularProgress } from '@mui/material'
import { DataGrid, GridSortModel } from '@mui/x-data-grid'
import { Storage } from 'src/libs/storage'
import { makeDACDatasetGridColumns } from 'src/components/dac_dataset_table/datasetGridColumns'
import { DatasetTerm } from 'src/types/model'

const storageDACDatasetSort = 'storageDACDatasetSort'
const DEFAULT_SORT_MODEL: GridSortModel = [{ field: 'datasetIdentifier', sort: 'asc' }]

const LoadingOverlay = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
    <CircularProgress />
  </Box>
)

export interface DACDatasetsTableProps {
  datasets: DatasetTerm[]
  columns?: string[]
  isLoading: boolean
}

export const DACDatasetsTable = function DACDatasetTable({ datasets, columns, isLoading }: DACDatasetsTableProps) {
  const gridColumns = useMemo(() => makeDACDatasetGridColumns(columns), [columns])

  const [sortModel, setSortModel] = useState<GridSortModel>(() => {
    const stored = Storage.getCurrentUserSettings<GridSortModel>(storageDACDatasetSort)
    return Array.isArray(stored) ? stored : DEFAULT_SORT_MODEL
  })

  const handleSortModelChange = useCallback((newSortModel: GridSortModel) => {
    Storage.setCurrentUserSettings(storageDACDatasetSort, newSortModel)
    setSortModel(newSortModel)
  }, [])

  return (
    <Box sx={{ width: '100%' }}>
      <DataGrid
        rows={datasets}
        columns={gridColumns}
        getRowId={row => row.datasetId}
        loading={isLoading}
        autoHeight
        pageSizeOptions={[10, 25, 50]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        sortingMode="client"
        sortModel={sortModel}
        onSortModelChange={handleSortModelChange}
        disableRowSelectionOnClick
        sx={{
          '& .MuiDataGrid-cell:focus': { outline: 'none' },
          '& .MuiDataGrid-cell:focus-within': { outline: 'none' },
          '& .MuiDataGrid-columnHeader:focus': { outline: 'none' },
          '& .MuiDataGrid-columnHeader:focus-within': { outline: 'none' },
        }}
        slots={{ loadingOverlay: LoadingOverlay }}
      />
    </Box>
  )
}
