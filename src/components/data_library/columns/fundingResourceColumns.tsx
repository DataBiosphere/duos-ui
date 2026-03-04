import React from 'react'
import { GridColDef } from '@mui/x-data-grid'
import { Box, Chip, Link } from '@mui/material'
import Tooltip from '@mui/material/Tooltip'
import { FundingResourceAsset } from 'src/types/library'

export const makeFundingResourceColumns = (): GridColDef<FundingResourceAsset>[] => [
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
    field: 'fundingId',
    headerName: 'FundingResource ID',
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
    field: 'funderName',
    headerName: 'Funder Name',
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
    field: 'funderProgram',
    headerName: 'Funder Program',
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
    field: 'grantNumber',
    headerName: 'Grant Number',
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
    field: 'projectTitle',
    headerName: 'Project Title',
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
  {
    field: 'url',
    headerName: 'URL',
    width: 80,
    sortable: false,
    renderCell: params =>
      params.value
        ? (
            <Link
              href={params.value}
              underline="hover"
              target="_blank"
              rel="noopener noreferrer"
            >
              Link
            </Link>
          )
        : null,
  },
  {
    field: 'tags',
    headerName: 'Tags',
    flex: 1,
    minWidth: 150,
    sortable: false,
    valueGetter: (_value, row) => (row.tags || []).join(', '),
    renderCell: (params) => {
      const tags = params.row.tags || []
      if (tags.length === 0) return null
      return (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {tags.slice(0, 3).map((tag, i) => (
            <Chip key={i} label={tag} size="small" variant="outlined" />
          ))}
          {tags.length > 3 && (
            <Tooltip title={tags.slice(3).join(', ')}>
              <Chip label={`+${tags.length - 3}`} size="small" variant="outlined" />
            </Tooltip>
          )}
        </Box>
      )
    },
  },
]
