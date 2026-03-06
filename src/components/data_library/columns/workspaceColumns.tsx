import React from 'react'
import { GridColDef } from '@mui/x-data-grid'
import { Link, Chip, Box, Tooltip } from '@mui/material'
import { WorkspaceAsset } from 'src/types/library'

/**
 * Column definitions for the Workspaces view
 */
export const makeWorkspaceColumns = (): GridColDef<WorkspaceAsset>[] => [
  {
    field: 'name',
    headerName: 'Workspace Name',
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
      <Link href={`/studies/${params.row.studyId}`} underline="hover">
        {params.value}
      </Link>
    ),
  },
  {
    field: 'platform',
    headerName: 'Platform',
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
    field: 'description',
    headerName: 'Description',
    flex: 2,
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
    field: 'tools',
    headerName: 'Tools',
    flex: 1,
    minWidth: 150,
    sortable: false,
    valueGetter: (_value, row) => (row.tools || []).join(', '),
    renderCell: (params) => {
      const tools = params.row.tools || []
      if (tools.length === 0) return null
      return (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {tools.slice(0, 3).map((tool, i) => (
            <Chip key={i} label={tool} size="small" variant="outlined" />
          ))}
          {tools.length > 3 && (
            <Tooltip title={tools.slice(3).join(', ')}>
              <Chip label={`+${tools.length - 3}`} size="small" variant="outlined" />
            </Tooltip>
          )}
        </Box>
      )
    },
  },
  {
    field: 'access',
    headerName: 'Access',
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
