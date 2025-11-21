import React, { useMemo } from 'react'
import {
  DataGrid,
  GridRowSelectionModel,
  GridColDef,
} from '@mui/x-data-grid'
import { Box, Typography, CircularProgress } from '@mui/material'
import { isEmpty } from 'lodash'
import { LibraryDataGridProps, AssetType } from 'src/types/library'
import { DatasetTerm } from 'src/types/model'
import { StudyAggregation } from 'src/types/library'
import { makeDatasetColumns } from './columns/datasetColumns'
import { makeStudyColumns } from './columns/studyColumns'

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
  // Memoize columns based on asset type
  // Cast to union type to satisfy DataGrid's type requirements
  const columns = useMemo(() => {
    if (assetType === AssetType.STUDIES) {
      return makeStudyColumns() as GridColDef<DatasetTerm | StudyAggregation>[]
    }
    return makeDatasetColumns() as GridColDef<DatasetTerm | StudyAggregation>[]
  }, [assetType])

  // Get row ID based on asset type
  const getRowId = (row: DatasetTerm | StudyAggregation) => {
    if (assetType === AssetType.STUDIES) {
      return (row as StudyAggregation).studyId
    }
    return (row as DatasetTerm).datasetId
  }

  // For studies, we need to map study selection to dataset IDs
  const rowSelectionModel: GridRowSelectionModel = useMemo(() => {
    // Ensure data is an array
    if (!Array.isArray(data)) {
      return {
        type: 'include',
        ids: new Set([]),
      }
    }

    if (assetType === AssetType.STUDIES) {
      // Find which studies are fully or partially selected
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

  // Handle selection change
  const handleSelectionChange = (newSelection: GridRowSelectionModel) => {
    // Extract IDs from the selection model
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

  // Check if a row is selectable
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

  // Show loading state when data is empty and loading
  if (isEmpty(data) && loading) {
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
  if (isEmpty(data) && !loading) {
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

  return (
    <Box sx={{ width: '100%', height: 600 }}>
      <DataGrid
        rows={data}
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
          loadingOverlay: () => (
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
          ),
        }}
      />
    </Box>
  )
}

export default LibraryDataGrid
