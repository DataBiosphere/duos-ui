import React from 'react'
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material'
import AuthStatusChip from './AuthStatusChip'
import AuthActionButton from './AuthActionButton'
import { AuthStatus, DAAResearcherRowData } from './types'

const FONT = 'Montserrat'

const tableCellHeadSx = {
  fontWeight: 600,
  color: '#333',
  fontSize: 12,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  fontFamily: FONT,
  bgcolor: '#f0f0f0',
  py: 1,
}

const tableCellBodySx = {
  color: '#555',
  fontSize: 13,
  fontFamily: FONT,
  py: 1.25,
}

function rowBgColor(status: AuthStatus): string {
  if (status === 'authorized') return '#f0fdf4'
  return '#fafafa'
}

function rowBorderColor(status: AuthStatus): string {
  if (status === 'authorized') return '1px solid #bbf7d0'
  return '1px solid #e5e7eb'
}

const COLUMN_HEADERS = [
  'Researcher',
  'Email',
  'Pre-Auth Status',
  'Pre-authorized By',
  'Action',
] as const

const COLUMN_WIDTHS: Record<(typeof COLUMN_HEADERS)[number], string> = {
  'Researcher': '23%',
  'Email': '25%',
  'Pre-Auth Status': '17%',
  'Pre-authorized By': '20%',
  'Action': '15%',
}

interface DAAResearcherSubtableProps {
  researcherRows: DAAResearcherRowData[]
  onAuthorize: (researcherId: number) => void
  onRevoke: (researcherId: number) => void
}

/**
 * Sub-table rendered inside a DAA's expanded accordion row.
 *
 * Lists all researchers managed by this SO, showing each researcher's
 * authorization status under this specific DAA and an action button.
 *
 * This is the mirror of ResearcherDAASubtable — researcher-first instead of
 * DAA-first.
 */
export default function DAAResearcherSubtable({
  researcherRows,
  onAuthorize,
  onRevoke,
}: Readonly<DAAResearcherSubtableProps>) {
  return (
    <Box sx={{ bgcolor: '#fafafa' }} data-cy="daa-researcher-subtable">
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f0f0f0' }}>
            {COLUMN_HEADERS.map(col => (
              <TableCell key={col} sx={{ ...tableCellHeadSx, width: COLUMN_WIDTHS[col] }}>
                {col}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {researcherRows.map(({ researcher, status, authorizedBy }) => (
            <TableRow
              key={researcher.userId}
              data-cy={`daa-researcher-row-${researcher.userId}`}
              sx={{
                'bgcolor': rowBgColor(status),
                '& td': { borderBottom: rowBorderColor(status) },
                '&:hover': { filter: 'brightness(0.97)' },
              }}
            >
              <TableCell sx={{ ...tableCellBodySx, fontWeight: 600, color: '#1a1a2e' }}>
                {researcher.displayName || '—'}
              </TableCell>
              <TableCell sx={tableCellBodySx}>
                {researcher.email}
              </TableCell>
              <TableCell sx={{ width: COLUMN_WIDTHS['Pre-Auth Status'] }}>
                <AuthStatusChip status={status} />
              </TableCell>
              <TableCell
                sx={{ ...tableCellBodySx, width: COLUMN_WIDTHS['Pre-authorized By'] }}
                data-cy={`daa-authorized-by-${researcher.userId}`}
              >
                {authorizedBy ?? '—'}
              </TableCell>
              <TableCell
                sx={{
                  width: COLUMN_WIDTHS.Action,
                  minWidth: 120,
                  whiteSpace: 'nowrap',
                }}
              >
                <AuthActionButton
                  status={status}
                  onAuthorize={() => onAuthorize(researcher.userId)}
                  onRevoke={() => onRevoke(researcher.userId)}
                />
              </TableCell>
            </TableRow>
          ))}
          {researcherRows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={COLUMN_HEADERS.length}
                sx={{ ...tableCellBodySx, textAlign: 'center', color: '#999', py: 4 }}
                data-cy="daa-researcher-subtable-empty"
              >
                No researchers found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Box>
  )
}
