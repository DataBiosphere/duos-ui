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
import { ACTION_COLUMN, normalizedWidths, withoutActionColumn } from './subtableColumns'
import { institutionLabel } from './researcherViewHelpers'

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

const INSTITUTION_COLUMN = 'Institution'

const COLUMN_HEADERS = [
  'Researcher',
  'Email',
  INSTITUTION_COLUMN,
  'Pre-Auth Status',
  'Pre-authorized By',
  ACTION_COLUMN,
] as const

type ColumnHeader = (typeof COLUMN_HEADERS)[number]

/** Relative weights, renormalized to 100% across whichever columns are shown. */
const COLUMN_WIDTHS: Record<ColumnHeader, string> = {
  'Researcher': '23%',
  'Email': '25%',
  'Institution': '20%',
  'Pre-Auth Status': '17%',
  'Pre-authorized By': '20%',
  'Action': '15%',
}

interface DAAResearcherSubtableProps {
  researcherRows: DAAResearcherRowData[]
  onAuthorize: (researcherId: number) => void
  onRevoke: (researcherId: number) => void
  /** Read-only mode (Admin Console): drops the Action column entirely. */
  readOnly?: boolean
  /**
   * Adds the Institution column. Only meaningful when the list spans more than
   * one institution, which is the Admin Console's cross-institution scope.
   */
  showInstitution?: boolean
}

/**
 * Sub-table rendered inside a DAA's expanded accordion row.
 *
 * Lists all researchers managed by this SO, showing each researcher's
 * authorization status under this specific DAA and an action button.
 *
 * This is the mirror of ResearcherDAASubtable — researcher-first instead of
 * DAA-first.
 *
 * In read-only mode the Action column — header and cells — is not rendered, so
 * the same table serves the Admin Console's observe-only view; that view also
 * adds an Institution column, since its rows span institutions.
 */
export default function DAAResearcherSubtable({
  researcherRows,
  onAuthorize,
  onRevoke,
  readOnly = false,
  showInstitution = false,
}: Readonly<DAAResearcherSubtableProps>) {
  const columnHeaders = (readOnly ? withoutActionColumn(COLUMN_HEADERS) : COLUMN_HEADERS)
    .filter(column => showInstitution || column !== INSTITUTION_COLUMN)
  const columnWidths = normalizedWidths(columnHeaders, COLUMN_WIDTHS)

  return (
    <Box sx={{ bgcolor: '#fafafa' }} data-cy="daa-researcher-subtable">
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f0f0f0' }}>
            {columnHeaders.map(col => (
              <TableCell key={col} sx={{ ...tableCellHeadSx, width: columnWidths[col] }}>
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
              {showInstitution && (
                <TableCell
                  sx={{ ...tableCellBodySx, width: columnWidths[INSTITUTION_COLUMN] }}
                  data-cy={`daa-researcher-institution-${researcher.userId}`}
                >
                  {institutionLabel(researcher)}
                </TableCell>
              )}
              <TableCell sx={{ width: columnWidths['Pre-Auth Status'] }}>
                <AuthStatusChip status={status} />
              </TableCell>
              <TableCell
                sx={{ ...tableCellBodySx, width: columnWidths['Pre-authorized By'] }}
                data-cy={`daa-authorized-by-${researcher.userId}`}
              >
                {authorizedBy ?? '—'}
              </TableCell>
              {!readOnly && (
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
              )}
            </TableRow>
          ))}
          {researcherRows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={columnHeaders.length}
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
