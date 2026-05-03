import React from 'react'
import { GridColDef } from '@mui/x-data-grid'
import { Link, Chip, Box, Tooltip } from '@mui/material'
import { ClinicalTrialAsset } from 'src/types/library'
import { Link as RouterLink } from 'react-router-dom'

/**
 * Column definitions for the Clinical Trials view
 */
export const makeClinicalTrialColumns = (): GridColDef<ClinicalTrialAsset>[] => [
  {
    field: 'title',
    headerName: 'Trial Title',
    flex: 2,
    minWidth: 220,
    renderCell: (params) => {
      const text = params.value || ''
      const url = params.row.url
      return (
        <Tooltip title={text} placement="top">
          <Box
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {url
              ? (
                  <Link href={url} target="_blank" rel="noopener noreferrer" underline="hover">
                    {text}
                  </Link>
                )
              : text}
          </Box>
        </Tooltip>
      )
    },
  },
  {
    field: 'studyName',
    headerName: 'Study',
    flex: 1,
    minWidth: 150,
    renderCell: params => (
      <Link component={RouterLink} to={`/studies/${params.row.studyId}`} underline="hover">
        {params.value}
      </Link>
    ),
  },
  {
    field: 'identifier',
    headerName: 'Identifier',
    width: 140,
    renderCell: (params) => {
      const text = params.value || ''
      const url = params.row.url
      return (
        <Tooltip title={text} placement="top">
          <Box
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {url
              ? (
                  <Link href={url} target="_blank" rel="noopener noreferrer" underline="hover">
                    {text}
                  </Link>
                )
              : text}
          </Box>
        </Tooltip>
      )
    },
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 175,
    renderCell: (params) => {
      const value = params.value || ''
      const label = value
        .toLowerCase()
        .replaceAll('_', ' ')
        .replaceAll(/\b\w/g, (c: string) => c.toUpperCase())
      return (
        <Chip
          label={label}
          size="small"
          variant="outlined"
          sx={{ fontSize: '12px', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}
        />
      )
    },
  },
  {
    field: 'phase',
    headerName: 'Phase',
    width: 110,
    renderCell: (params) => {
      const value = params.value || ''
      const label = value
        .replaceAll('_', ' ')
        .replace('EARLY ', 'Early ')
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
    field: 'interventionType',
    headerName: 'Intervention',
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
    field: 'sponsor',
    headerName: 'Sponsor',
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
    field: 'startDate',
    headerName: 'Start Date',
    width: 110,
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
