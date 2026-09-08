import React, { useCallback, useMemo, useState } from 'react'
import { Box } from '@mui/material'
import { DataGrid, GridSortModel } from '@mui/x-data-grid'
import { Storage } from 'src/libs/storage'
import { DATA_GRID_CONTAINER_SX, DATA_GRID_SLOTS, DATA_GRID_SX } from 'src/components/dataGridDefaults'
import { makeDACDatasetGridColumns } from 'src/components/dac_dataset_table/datasetGridColumns'
import { DatasetTerm } from 'src/types/model'

const storageDACDatasetSort = 'storageDACDatasetSort'
const DEFAULT_SORT_MODEL: GridSortModel = [{ field: 'datasetIdentifier', sort: 'asc' }]

const getRowId = (row: DatasetTerm) => row.datasetId

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
    <Box sx={DATA_GRID_CONTAINER_SX}>
      <DataGrid
        rows={datasets}
        columns={gridColumns}
        getRowId={getRowId}
        loading={isLoading}
        autoHeight
        pageSizeOptions={[10, 25, 50]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        sortingMode="client"
        sortModel={sortModel}
        onSortModelChange={handleSortModelChange}
        disableRowSelectionOnClick
        sx={DATA_GRID_SX}
        slots={DATA_GRID_SLOTS}
      />
    </Box>
  )
}
