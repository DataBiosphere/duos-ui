import React from 'react'
import { GridColDef } from '@mui/x-data-grid'
import { Link, Tooltip, Box } from '@mui/material'
import { StudyAggregation } from 'src/types/library'

/**
 * Column definitions for study view
 */
export const makeStudyColumns = (): GridColDef<StudyAggregation>[] => [
  {
    field: 'studyName',
    headerName: 'Study Name',
    flex: 1.5,
    minWidth: 200,
    renderCell: params => (
      <Link href={`/studies/${params.row.studyId}`} underline="hover">
        {params.value}
      </Link>
    ),
  },
  {
    field: 'totalParticipants',
    headerName: 'Participants',
    width: 120,
    type: 'number',
    align: 'right',
    headerAlign: 'right',
  },
  {
    field: 'phenotype',
    headerName: 'Phenotype',
    flex: 1,
    minWidth: 150,
    renderCell: (params) => {
      const text = params.value || ''
      return (
        <Tooltip title={text} placement="top">
          <Box
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {text}
          </Box>
        </Tooltip>
      )
    },
  },
  {
    field: 'species',
    headerName: 'Species',
    width: 120,
    renderCell: (params) => {
      const text = params.value || ''
      return (
        <Tooltip title={text} placement="top">
          <Box
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {text}
          </Box>
        </Tooltip>
      )
    },
  },
  {
    field: 'piName',
    headerName: 'PI Name',
    width: 150,
    renderCell: (params) => {
      const text = params.value || ''
      return (
        <Tooltip title={text} placement="top">
          <Box
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {text}
          </Box>
        </Tooltip>
      )
    },
  },
  {
    field: 'dataCustodianEmail',
    headerName: 'Data Custodian',
    flex: 1,
    minWidth: 150,
    valueGetter: (_value, row) => row.dataCustodianEmail?.join(', ') || '',
    renderCell: (params) => {
      const emails = params.row.dataCustodianEmail || []
      const text = emails.join(', ')
      return (
        <Tooltip title={text} placement="top">
          <Box
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {text}
          </Box>
        </Tooltip>
      )
    },
  },
  {
    field: 'datasetCount',
    headerName: 'Datasets',
    width: 100,
    type: 'number',
    align: 'right',
    headerAlign: 'right',
  },
]
