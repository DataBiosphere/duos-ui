import React from 'react'
import { GridColDef } from '@mui/x-data-grid'
import { Link, Box, Tooltip } from '@mui/material'
import { Link as RouterLink } from 'react-router'
import { ModelAsset } from 'src/types/library'
import { validateHttpUrl } from 'src/utils/UrlUtils'
import { chipListColumn } from 'src/components/data_library/columns/sharedColumns'

/**
 * Column definitions for AI model view
 */
export const makeModelColumns = (): GridColDef<ModelAsset>[] => [
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
      <Link component={RouterLink} to={`/studies/${params.row.studyId}`} underline="hover">
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
  chipListColumn<ModelAsset>('cloud', 'Cloud', row => row.cloud || [], 130),
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
  chipListColumn<ModelAsset>('tags', 'Tags', row => row.tags || [], 150),
]
