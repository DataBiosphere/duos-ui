import React from 'react'
import { GridColDef } from '@mui/x-data-grid'
import { Link, Box, Tooltip } from '@mui/material'
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
  truncatedTextColumn<WorkspaceAsset>('platform', 'Platform', 150),
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
  chipListColumn<WorkspaceAsset>('tools', 'Tools', row => row.tools || [], 150),
  truncatedTextColumn<WorkspaceAsset>('access', 'Access', 120),
  chipListColumn<WorkspaceAsset>('tags', 'Tags', row => row.tags || [], 150),
]
