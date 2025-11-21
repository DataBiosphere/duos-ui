import { GridColDef } from '@mui/x-data-grid'
import { Link, Chip, Box, Tooltip } from '@mui/material'
import React from 'react'
import { DatasetTerm, getAccessManagementSummary } from 'src/types/model'

/**
 * Column definitions for dataset view
 */
export const makeDatasetColumns = (): GridColDef<DatasetTerm>[] => [
  {
    field: 'datasetName',
    headerName: 'Dataset Name',
    flex: 1.5,
    minWidth: 200,
    renderCell: params => (
      <Link href={`/dataset/${params.row.datasetId}`} underline="hover">
        {params.value}
      </Link>
    ),
  },
  {
    field: 'studyName',
    headerName: 'Study Name',
    flex: 1,
    minWidth: 150,
    valueGetter: (_value, row) => row.study?.studyName || '',
    renderCell: params => (
      <Link href={`/studies/${params.row.study?.studyId}`} underline="hover">
        {params.value}
      </Link>
    ),
  },
  {
    field: 'participantCount',
    headerName: 'Participants',
    width: 120,
    type: 'number',
    align: 'right',
    headerAlign: 'right',
  },
  {
    field: 'dataUse',
    headerName: 'Data Use',
    width: 150,
    valueGetter: (_value, row) => row.dataUse?.primary?.[0]?.code || '',
    renderCell: (params) => {
      const codes = params.row.dataUse?.primary?.map(du => du.code).filter(Boolean) || []
      if (codes.length === 0) return null

      return (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {codes.slice(0, 2).map((code, idx) => (
            <Chip key={idx} label={code} size="small" variant="outlined" />
          ))}
          {codes.length > 2 && (
            <Tooltip title={codes.slice(2).join(', ')}>
              <Chip label={`+${codes.length - 2}`} size="small" variant="outlined" />
            </Tooltip>
          )}
        </Box>
      )
    },
    sortable: false,
  },
  {
    field: 'accessManagement',
    headerName: 'Access',
    width: 120,
    renderCell: (params) => {
      const summary = getAccessManagementSummary(params.value)
      return (
        <Tooltip title={summary.description}>
          <Chip
            label={summary.name}
            size="small"
            color={
              params.value === 'controlled'
                ? 'primary'
                : params.value === 'open'
                  ? 'success'
                  : 'default'
            }
          />
        </Tooltip>
      )
    },
  },
  {
    field: 'dac',
    headerName: 'DAC',
    width: 150,
    valueGetter: (_value, row) => row.dac?.dacName || '',
  },
  {
    field: 'datasetIdentifier',
    headerName: 'Identifier',
    width: 150,
  },
]
