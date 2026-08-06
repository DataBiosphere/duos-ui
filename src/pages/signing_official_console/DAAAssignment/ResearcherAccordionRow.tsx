import React, { useMemo } from 'react'
import {
  Box,
  Chip,
  Collapse,
  Paper,
  Typography,
} from '@mui/material'
import { DuosUser } from 'src/types/model'
import ResearcherDAASubtable from './ResearcherDAASubtable'
import BulkActionButtons from './BulkActionButtons'
import { DAARowData } from './types'

const FONT = 'Montserrat'

interface ResearcherAccordionRowProps {
  researcher: DuosUser
  daaRows: DAARowData[]
  authorizedCount: number
  isExpanded: boolean
  onToggle: () => void
  onAuthorize: (daaId: number) => void
  onRevoke: (daaId: number) => void
  /** Bulk "Approve All" — receives the ids of every not-yet-authorized DAA */
  onApproveAll: (daaIds: number[]) => void
  /** Bulk "Remove All" — receives the ids of every currently-authorized DAA */
  onRemoveAll: (daaIds: number[]) => void
}

/**
 * A single collapsible card representing one researcher.
 *
 * The card header shows the researcher's name, email, and summary badge counts.
 * When expanded, a sub-table lists each DAA with its status and an action button.
 */
export default function ResearcherAccordionRow({
  researcher,
  daaRows,
  authorizedCount,
  isExpanded,
  onToggle,
  onAuthorize,
  onRevoke,
  onApproveAll,
  onRemoveAll,
}: Readonly<ResearcherAccordionRowProps>) {
  const researcherId = researcher.userId

  const unauthorizedDaaIds = useMemo(
    () => daaRows.filter(r => r.status !== 'authorized').map(r => r.daa.daaId),
    [daaRows],
  )
  const authorizedDaaIds = useMemo(
    () => daaRows.filter(r => r.status === 'authorized').map(r => r.daa.daaId),
    [daaRows],
  )

  return (
    <Paper
      elevation={0}
      data-cy={`researcher-row-${researcherId}`}
      sx={{
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'white',
      }}
    >
      {/* ── Accordion header ── */}
      <Box
        role="button"
        aria-expanded={isExpanded}
        aria-controls={`researcher-daa-panel-${researcherId}`}
        data-cy={`researcher-row-toggle-${researcherId}`}
        onClick={onToggle}
        sx={{
          'display': 'flex',
          'alignItems': 'center',
          'justifyContent': 'space-between',
          'px': 3,
          'py': 2,
          'cursor': 'pointer',
          'bgcolor': 'white',
          'borderBottom': isExpanded ? '1px solid #e0e0e0' : 'none',
          '&:hover': { bgcolor: '#f8f9fa' },
        }}
      >
        {/* Left: chevron + name/email */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography
            aria-hidden="true"
            sx={{
              fontSize: 13,
              color: '#bbb',
              transform: isExpanded ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.15s',
              display: 'inline-block',
            }}
          >
            ▶
          </Typography>
          <Box>
            <Typography
              sx={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}
            >
              {researcher.displayName || '—'}
            </Typography>
            <Typography sx={{ fontFamily: FONT, fontSize: 12, color: '#888' }}>
              {researcher.email}
            </Typography>
          </Box>
        </Box>

        {/* Right: summary badges */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {authorizedCount > 0 && (
            <Chip
              label={`${authorizedCount} pre-authorized`}
              data-cy={`researcher-authorized-badge-${researcherId}`}
              sx={{
                bgcolor: '#d4edda',
                color: '#155724',
                fontWeight: 700,
                fontSize: 11,
                height: 22,
                fontFamily: FONT,
              }}
            />
          )}
          {authorizedCount === 0 && (
            <Typography
              data-cy={`researcher-no-status-${researcherId}`}
              sx={{ fontFamily: FONT, fontSize: 12, color: '#bbb' }}
            >
              No pre-auth status
            </Typography>
          )}
          <BulkActionButtons
            dataCyPrefix={`researcher-${researcherId}`}
            approveAllDisabled={unauthorizedDaaIds.length === 0}
            removeAllDisabled={authorizedDaaIds.length === 0}
            onApproveAll={() => onApproveAll(unauthorizedDaaIds)}
            onRemoveAll={() => onRemoveAll(authorizedDaaIds)}
          />
        </Box>
      </Box>

      {/* ── Collapsible DAA sub-table ── */}
      <Collapse
        in={isExpanded}
        timeout="auto"
        unmountOnExit
        id={`researcher-daa-panel-${researcherId}`}
      >
        <ResearcherDAASubtable
          daaRows={daaRows}
          onAuthorize={onAuthorize}
          onRevoke={onRevoke}
        />
      </Collapse>
    </Paper>
  )
}
