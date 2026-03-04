import React from 'react'
import { GridColDef } from '@mui/x-data-grid'
import { Link, Chip, Box, Tooltip } from '@mui/material'
import { PresentationAsset } from 'src/types/library'

/**
 * Column definitions for the Presentations view in the Data Library.
 */
export const makePresentationColumns = (): GridColDef<PresentationAsset>[] => [
  {
    field: 'title',
    headerName: 'Title',
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
      <Link href={`/studies/${params.row.studyId}`} underline="hover">
        {params.value}
      </Link>
    ),
  },
  {
    field: 'event',
    headerName: 'Event',
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
    field: 'date',
    headerName: 'Date',
    width: 120,
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
    field: 'location',
    headerName: 'Location',
    flex: 1,
    minWidth: 130,
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
    field: 'presenter',
    headerName: 'Presenter',
    flex: 1,
    minWidth: 140,
    sortable: false,
    valueGetter: (_value, row) => row.presenter?.name || '',
    renderCell: (params) => {
      const name = params.row.presenter?.name || ''
      return (
        <Tooltip title={name} placement="top">
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
    field: 'format',
    headerName: 'Format',
    width: 120,
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
    field: 'tags',
    headerName: 'Tags',
    flex: 1,
    minWidth: 120,
    sortable: false,
    renderCell: (params) => {
      const tags: string[] = params.value || []
      if (tags.length === 0) {
        return null
      }
      const maxVisible = 3
      const visible = tags.slice(0, maxVisible)
      const overflow = tags.length - maxVisible
      return (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'nowrap', overflow: 'hidden' }}>
          {visible.map(tag => (
            <Chip key={tag} label={tag} size="small" variant="outlined" />
          ))}
          {overflow > 0 && (
            <Chip label={`+${overflow}`} size="small" variant="outlined" />
          )}
        </Box>
      )
    },
  },
]
