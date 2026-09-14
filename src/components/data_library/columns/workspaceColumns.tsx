import React from 'react'
import { GridColDef } from '@mui/x-data-grid'
import { Link, Chip, Box, Tooltip } from '@mui/material'
import { Link as RouterLink } from 'react-router'
import { WorkspaceAsset } from 'src/types/library'
import { validateHttpUrl } from 'src/utils/UrlUtils'
import { chipListColumn, truncatedTextColumn } from 'src/components/data_library/columns/sharedColumns'

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
      <Link component={RouterLink} to={`/studies/${params.row.studyId}`} underline="hover">
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
    renderCell: (params) => {
      const url = validateHttpUrl(params.value)
      return url
        ? (
            <Link
              href={url}
              underline="hover"
              target="_blank"
              rel="noopener noreferrer"
            >
              Link
            </Link>
          )
        : null
    },
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
  chipListColumn<WorkspaceAsset>('cloud', 'Cloud', row => row.cloud || [], 130),
  truncatedTextColumn<WorkspaceAsset>('access', 'Access', 120),
  chipListColumn<WorkspaceAsset>('tags', 'Tags', row => row.tags || [], 150),
]
