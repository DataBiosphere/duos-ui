import React from 'react'
import { GridColDef } from '@mui/x-data-grid'
import { Link, Chip, Box, Tooltip } from '@mui/material'
import { IntellectualPropertyAsset } from 'src/types/library'
import { Link as RouterLink } from 'react-router-dom'

/**
 * Column definitions for the Intellectual Property view in the Data Library.
 */
export const makeIntellectualPropertyColumns = (): GridColDef<IntellectualPropertyAsset>[] => [
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
      <Link component={RouterLink} to={`/studies/${params.row.studyId}`} underline="hover">
        {params.value}
      </Link>
    ),
  },
  {
    field: 'type',
    headerName: 'Type',
    width: 140,
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
    field: 'patentNumber',
    headerName: 'Patent Number',
    width: 160,
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
    field: 'assignee',
    headerName: 'Assignee',
    flex: 1,
    minWidth: 140,
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
    field: 'status',
    headerName: 'Status',
    width: 130,
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
    field: 'filingDate',
    headerName: 'Filing Date',
    width: 130,
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
    field: 'contact',
    headerName: 'Contact',
    flex: 1,
    minWidth: 140,
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
