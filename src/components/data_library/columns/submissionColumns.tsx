import React from 'react'
import { GridColDef } from '@mui/x-data-grid'
import { Box, Button, Chip, IconButton } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { Link as RouterLink } from 'react-router-dom'
import { DatasetTerm } from 'src/types/model'
import { getApprovalStatus } from 'src/libs/utils'

const getSubmissionStatus = (row: Record<string, unknown>): string | null => {
  if (!row || !('dacApproval' in row)) return null
  const raw = getApprovalStatus(row.dacApproval as boolean | null | undefined, 'pending')
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

const getStatusColor = (status: string): 'success' | 'error' | 'default' => {
  switch (status) {
    case 'Accepted': return 'success'
    case 'Rejected': return 'error'
    default: return 'default'
  }
}

export const makeSubmissionColumns = (
  onDeleteClick: (term: DatasetTerm) => void,
): GridColDef[] => [
  {
    field: 'datasetSubmitter',
    headerName: 'Dataset Submitter',
    width: 160,
    valueGetter: (_value: unknown, row: Record<string, unknown>) =>
      (row.createUserDisplayName as string) || '',
  },
  {
    field: 'datasetCustodian',
    headerName: 'Dataset Custodian',
    width: 180,
    sortable: false,
    valueGetter: (_value: unknown, row: Record<string, unknown>) => {
      const study = row.study as { dataCustodianEmail?: string | string[] } | undefined
      const emails = study?.dataCustodianEmail
      if (!emails) return ''
      return Array.isArray(emails) ? emails.join(', ') : emails
    },
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 110,
    sortable: false,
    renderCell: (params) => {
      const status = getSubmissionStatus(params.row as Record<string, unknown>)
      if (!status) return null
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Chip label={status} size="small" color={getStatusColor(status)} />
        </Box>
      )
    },
  },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 150,
    sortable: false,
    filterable: false,
    hideable: true,
    disableColumnMenu: true,
    renderCell: (params) => {
      const term = params.row as unknown as DatasetTerm
      if (!term?.datasetId) return null
      const status = getSubmissionStatus(params.row as Record<string, unknown>)
      const editLink = term.study?.studyId
        ? `/study_update/${term.study.studyId}`
        : `/dataset_update/${term.datasetId}`
      return (
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', height: '100%' }}>
          {status !== 'Accepted' && (
            <Button
              component={RouterLink}
              to={editLink}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.75rem', height: 25, minWidth: 0, px: 1 }}
            >
              Edit
            </Button>
          )}
          {status !== 'Accepted' && term.deletable && (
            <IconButton
              size="small"
              onClick={() => onDeleteClick(term)}
              aria-label={`Delete dataset '${term.datasetIdentifier}'`}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      )
    },
  },
]
