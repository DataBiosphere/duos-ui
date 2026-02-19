import React, { useMemo } from 'react'
import {
  DataGrid,
  GridRowSelectionModel,
  GridColDef,
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
    <Box sx={{ width: '100%', height: 600 }}>
      <DataGrid
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
