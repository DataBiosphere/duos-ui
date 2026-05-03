import React from 'react'
import { GridColDef } from '@mui/x-data-grid'
import { Link, Chip, Box, Tooltip } from '@mui/material'
import { ModelAsset } from 'src/types/library'
import { Link as RouterLink } from 'react-router-dom'

/**
 * Column definitions for AI model view
 */
export const makeModelColumns = (selectedMenuTab?: number): GridColDef<ModelAsset>[] => [
  {
    field: 'name',
    headerName: 'Model Name',
    flex: 1.5,
    minWidth: 200,
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
    field: 'studyName',
    headerName: 'Study',
    flex: 1,
    minWidth: 150,
    renderCell: params => (
      <Link component={RouterLink} to={`/studies/${params.row.studyId}`} state={{ selectedMenuTab }} underline="hover">
        {params.value}
      </Link>
    ),
  },
  {
    field: 'format',
    headerName: 'Format',
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
    field: 'license',
    headerName: 'License',
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
    field: 'maintainer',
    headerName: 'Maintainer',
    flex: 1,
    minWidth: 150,
    valueGetter: (_value, row) => row.maintainer?.name || '',
    renderCell: (params) => {
      const name = params.row.maintainer?.name || ''
      const email = params.row.maintainer?.email || ''
      return (
        <Tooltip title={email || name} placement="top">
          <Box
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </Box>
        </Tooltip>
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
