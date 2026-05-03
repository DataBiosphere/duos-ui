import React from 'react'
import { GridColDef } from '@mui/x-data-grid'
import { Link, Chip, Box, Tooltip } from '@mui/material'
import { PublicationAsset } from 'src/types/library'
import { Link as RouterLink } from 'react-router-dom'

/**
 * Column definitions for the Publications view in the Data Library.
 */
export const makePublicationColumns = (): GridColDef<PublicationAsset>[] => [
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
    field: 'journal',
    headerName: 'Journal',
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
    field: 'publishedDate',
    headerName: 'Published',
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
    field: 'pubmedId',
    headerName: 'PubMed ID',
    width: 130,
    renderCell: (params) => {
      const id = params.value || ''
      if (!id) {
        return null
      }
      return (
        <Link
          href={`https://pubmed.ncbi.nlm.nih.gov/${id}`}
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
        >
          {id}
        </Link>
      )
    },
  },
  {
    field: 'doi',
    headerName: 'DOI',
    width: 120,
    renderCell: (params) => {
      const doi = params.value || ''
      if (!doi) {
        return null
      }
      return (
        <Link
          href={`https://doi.org/${doi}`}
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
        >
          {doi}
        </Link>
      )
    },
  },
  {
    field: 'authorNames',
    headerName: 'Authors',
    flex: 1.2,
    minWidth: 160,
    sortable: false,
    renderCell: (params) => {
      const names: string[] = params.value || []
      const text = names.join(', ')
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
