import React, { useMemo } from 'react'
import {
  DataGrid,
  GridRowSelectionModel,
  GridColDef,
  useGridApiRef,
} from '@mui/x-data-grid'
import { Box, Typography, CircularProgress } from '@mui/material'
import { isEmpty } from 'lodash'
import { LibraryDataGridProps, AssetType, StudyAggregation } from 'src/types/library'
import { DatasetTerm } from 'src/types/model'
import { makeDatasetColumns } from 'src/components/data_library/columns/datasetColumns'
import { makeStudyColumns } from 'src/components/data_library/columns/studyColumns'

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
}) => {
  // API ref for manual selection workaround (MUI DataGrid checkbox click doesn't fire onChange)
  const apiRef = useGridApiRef()

  // Manual selection handler - workaround for MUI DataGrid checkbox click issue
  const handleCheckboxCellClick = (rowId: number | string) => {
    const api = apiRef.current
    if (!api) return

    const targetId = typeof rowId === 'string' && !isNaN(Number(rowId)) ? Number(rowId) : rowId
    const selectedRowsSet = api.getSelectedRows()
    const newSelectedIds = new Set(selectedRowsSet.keys())

    if (newSelectedIds.has(targetId)) {
      newSelectedIds.delete(targetId)
    }
    else {
      newSelectedIds.add(targetId)
    }

    api.setRowSelectionModel({
      type: 'include',
      ids: newSelectedIds,
    })
  }

  // Manual selection handler for "select all" in the header - workaround for checkbox issues
  const handleHeaderCheckboxClick = () => {
    const api = apiRef.current
    if (!api) return

    const allRowIds = api.getAllRowIds()
    const selectableRowIds = allRowIds.filter((id) => {
      const row = api.getRow(id)
      return row && isRowSelectable({ row })
    })

    if (selectableRowIds.length === 0) return

    const selectedRowsSet = api.getSelectedRows()
    const allSelectableAreSelected = selectableRowIds.every(id => selectedRowsSet.has(id))

    const newSelectedIds = new Set(selectedRowsSet.keys())

    if (allSelectableAreSelected) {
      selectableRowIds.forEach(id => newSelectedIds.delete(id))
    }
    else {
      selectableRowIds.forEach(id => newSelectedIds.add(id))
    }

    api.setRowSelectionModel({
      type: 'include',
      ids: newSelectedIds,
    })
  }

  const columns = useMemo(() => {
    if (assetType === AssetType.STUDIES) {
      return makeStudyColumns() as GridColDef<DatasetTerm | StudyAggregation>[]
    }
    return makeDatasetColumns() as GridColDef<DatasetTerm | StudyAggregation>[]
  }, [assetType])

  const getRowId = (row: DatasetTerm | StudyAggregation) => {
    if (assetType === AssetType.STUDIES) {
      return (row as StudyAggregation).studyId
    }
    return (row as DatasetTerm).datasetId
  }

  // For studies, we need to map study selection to dataset IDs
  const rowSelectionModel: GridRowSelectionModel = useMemo(() => {
    if (!Array.isArray(data)) {
      return {
        type: 'include',
        ids: new Set([]),
      }
    }
    if (assetType === AssetType.STUDIES) {
      const selectedStudyIds = data
        .filter((study) => {
          const studyDatasetIds = (study as StudyAggregation).datasetIds || []
          return studyDatasetIds.some(id => selectedDatasetIds.includes(id))
        })
        .map(study => (study as StudyAggregation).studyId)
      return {
        type: 'include',
        ids: new Set(selectedStudyIds),
      }
    }
    return {
      type: 'include',
      ids: new Set(selectedDatasetIds),
    }
  }, [assetType, data, selectedDatasetIds])

  const handleSelectionChange = (newSelection: GridRowSelectionModel) => {
    const selectedIds = Array.from(newSelection.ids) as number[]

    if (assetType === AssetType.STUDIES) {
      // Convert study selection to dataset IDs
      const newDatasetIds: number[] = []

      if (Array.isArray(data)) {
        data.forEach((study) => {
          if (selectedIds.includes((study as StudyAggregation).studyId)) {
            newDatasetIds.push(...((study as StudyAggregation).datasetIds || []))
          }
        })
      }

      onSelectionChange(newDatasetIds)
    }
    else {
      onSelectionChange(selectedIds)
    }
  }

  const isRowSelectable = (params: { row: DatasetTerm | StudyAggregation }) => {
    if (!params.row) {
      return false
    }

    if (assetType === AssetType.DATASETS) {
      const dataset = params.row as DatasetTerm
      return (
        dataset.accessManagement !== 'open'
        && dataset.accessManagement !== 'external'
      )
    }
    // For studies, check if any dataset in the study is selectable
    return true
  }

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
            No {assetType} found matching your criteria
          </Typography>
        </Box>
      )
    }
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <DataGrid
        apiRef={apiRef}
        onCellClick={(params) => {
          // Manual workaround for MUI DataGrid checkbox click issue
          // The checkbox's internal onChange doesn't fire, so we use onCellClick + API
          if (params.field === '__check__') {
            handleCheckboxCellClick(params.id)
          }
        }}
        onColumnHeaderClick={(params) => {
          // Manual workaround for MUI DataGrid "select all" checkbox click issue
          if (params.field === '__check__') {
            handleHeaderCheckboxClick()
          }
        }}
        rows={data as (StudyAggregation | DatasetTerm)[]}
        columns={columns}
        rowCount={total}
        loading={loading}
        pageSizeOptions={[25, 50, 100]}
        paginationModel={paginationModel}
        paginationMode="server"
        onPaginationModelChange={onPaginationChange}
        sortingMode="server"
        sortModel={sortModel}
        onSortModelChange={(model) => {
          // Convert readonly GridSortModel to mutable array with proper type
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
