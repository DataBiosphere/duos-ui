import React from 'react'
import { GridColDef } from '@mui/x-data-grid'
import { Box, Link } from '@mui/material'
import Tooltip from '@mui/material/Tooltip'
import { BiospecimenAsset } from 'src/types/library'

export const makeBiospecimenColumns = (): GridColDef<BiospecimenAsset>[] => [
  {
    field: 'studyName',
    headerName: 'Study Name',
    flex: 1,
    minWidth: 150,
    renderCell: params => (
      <Link href={`/studies/${params.row.studyId}`} underline="hover">
        {params.value}
      </Link>
    ),
  },
  {
    field: 'biospecimenId',
    headerName: 'Biospecimen ID',
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
    field: 'specimenType',
    headerName: 'Specimen Type',
    width: 150,
    renderCell: (params) => {
      const value = params.value || ''
      const label = value
        .toLowerCase()
        .replaceAll('_', ' ')
        .replaceAll(/\b\w/g, (c: string) => c.toUpperCase())
      return (
        <Tooltip title={label} placement="top">
          <Box
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </Box>
        </Tooltip>
      )
    },
  },
  {
    field: 'donorId',
    headerName: 'Donor ID',
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
    field: 'dateOfCollection',
    headerName: 'Date Of Collection',
    width: 150,
    renderCell: (params) => {
      const text = params.value || ''
      return (
        <Box
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {text}
        </Box>
      )
    },
  },
]
