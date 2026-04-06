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
import { AuthStatus, DAARowData } from './types'

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
  if (status === 'pending') return '#fffdf0'
  return '#fafafa'
}

function rowBorderColor(status: AuthStatus): string {
  if (status === 'authorized') return '1px solid #bbf7d0'
  if (status === 'pending') return '1px solid #fde68a'
  return '1px solid #e5e7eb'
}

const COLUMN_HEADERS = ['DAA', 'DAC', 'Effective Date', 'Status', 'Action'] as const

interface ResearcherDAASubtableProps {
  daaRows: DAARowData[]
  onAuthorize: (daaId: number) => void
  onRevoke: (daaId: number) => void
}

/**
 * Sub-table rendered inside a researcher's expanded accordion row.
 * Lists every DAA the SO manages, showing the researcher's auth status
 * and an action button for each.
 */
export default function ResearcherDAASubtable({
  daaRows,
  onAuthorize,
  onRevoke,
}: Readonly<ResearcherDAASubtableProps>) {
  return (
    <Box sx={{ bgcolor: '#fafafa' }} data-cy="daa-subtable">
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f0f0f0' }}>
            {COLUMN_HEADERS.map(col => (
              <TableCell key={col} sx={tableCellHeadSx}>
                {col}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {daaRows.map(({ daa, dacName, status }) => (
            <TableRow
              key={daa.daaId}
              data-cy={`daa-row-${daa.daaId}`}
              sx={{
                'bgcolor': rowBgColor(status),
                '& td': { borderBottom: rowBorderColor(status) },
              }}
            >
              <TableCell
                sx={{ ...tableCellBodySx, fontWeight: 600, color: '#1a1a2e' }}
              >
                {daa.file?.fileName ?? `DAA-${daa.daaId}`}
              </TableCell>
              <TableCell sx={tableCellBodySx}>{dacName}</TableCell>
              <TableCell sx={tableCellBodySx}>
                {daa.createDate ?? '—'}
              </TableCell>
              <TableCell>
                <AuthStatusChip status={status} />
              </TableCell>
              <TableCell>
                <AuthActionButton
                  status={status}
                  onAuthorize={() => onAuthorize(daa.daaId)}
                  onRevoke={() => onRevoke(daa.daaId)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}
