import React, { useMemo } from 'react'
import {
  Box,
  Chip,
  Collapse,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material'
import { DAAObject } from 'src/types/model'
import DAAResearcherSubtable from './DAAResearcherSubtable'
import BulkActionButtons from './BulkActionButtons'
import { DAAResearcherRowData } from './types'
import { daaLabel, formatDateYYYYMMDD } from './researcherViewHelpers'
import { accordionHeaderKeyboardProps } from './accordionHeaderKeyboard'

const FONT = 'Montserrat'

/**
 * The recently-updated warning tells an SO to act on their own institution's
 * researchers. An admin viewing the read-only, system-wide page has neither an
 * institution nor the controls to act, so the same fact is stated without the
 * call to action.
 */
const RECENTLY_UPDATED_TOOLTIP = {
  managed: 'This DAA was updated within the last year. Review the agreement to ensure your '
    + 'institution\'s researchers are operating under the most current terms.',
  readOnly: 'This DAA was updated within the last year. Researchers pre-authorized before the '
    + 'update may be operating under superseded terms.',
} as const

/** Body of the same warning as an in-panel banner, following the heading sentence. */
const RECENTLY_UPDATED_BANNER = {
  managed: ' Please review the agreement to ensure it reflects your institution\'s current data '
    + 'governance expectations before authorizing new researchers.',
  readOnly: ' Researchers pre-authorized before the update may be operating under superseded '
    + 'terms.',
} as const

interface DAAAccordionRowProps {
  daa: DAAObject
  dacName: string
  researcherRows: DAAResearcherRowData[]
  authorizedCount: number
  isRecentlyUpdated: boolean
  isExpanded: boolean
  onToggle: () => void
  onAuthorize: (researcherId: number) => void
  onRevoke: (researcherId: number) => void
  /** Bulk "Approve All" — receives the ids of every not-yet-authorized researcher */
  onApproveAll: (researcherIds: number[]) => void
  /** Bulk "Remove All" — receives the ids of every currently-authorized researcher */
  onRemoveAll: (researcherIds: number[]) => void
  /** Read-only mode (Admin Console): renders no bulk or per-row action buttons. */
  readOnly?: boolean
  /** Adds an Institution column to the researcher sub-table. */
  showInstitution?: boolean
}

/**
 * A single collapsible card representing one DAA.
 *
 * The card header shows the DAA name, its associated DAC, a "Recently Updated"
 * tooltip chip when relevant, and a count of pre-authorized researchers.
 *
 * When expanded, a sub-table lists all researchers with their authorization
 * status and action buttons for this specific DAA.
 *
 * This is the DAA-first mirror of ResearcherAccordionRow.
 *
 * In read-only mode the bulk action buttons are omitted from the header and the
 * sub-table drops its Action column, leaving status information only.
 */
export default function DAAAccordionRow({
  daa,
  dacName,
  researcherRows,
  authorizedCount,
  isRecentlyUpdated,
  isExpanded,
  onToggle,
  onAuthorize,
  onRevoke,
  onApproveAll,
  onRemoveAll,
  readOnly = false,
  showInstitution = false,
}: Readonly<DAAAccordionRowProps>) {
  const daaId = daa.daaId
  const label = daaLabel(daa)
  const formattedEffectiveDate = formatDateYYYYMMDD(daa.createDate)

  const unauthorizedUserIds = useMemo(
    () => researcherRows.filter(r => r.status !== 'authorized').map(r => r.researcher.userId),
    [researcherRows],
  )
  const authorizedUserIds = useMemo(
    () => researcherRows.filter(r => r.status === 'authorized').map(r => r.researcher.userId),
    [researcherRows],
  )

  return (
    <Paper
      elevation={0}
      data-cy={`daa-accordion-row-${daaId}`}
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
        aria-controls={`daa-researcher-panel-${daaId}`}
        data-cy={`daa-accordion-toggle-${daaId}`}
        onClick={onToggle}
        {...accordionHeaderKeyboardProps(onToggle)}
        sx={{
          'display': 'flex',
          'alignItems': 'center',
          'justifyContent': 'space-between',
          'px': 3,
          'py': 2.25,
          'cursor': 'pointer',
          'bgcolor': 'white',
          'borderBottom': isExpanded ? '1px solid #e0e0e0' : 'none',
          '&:hover': { bgcolor: '#f8f9fa' },
        }}
      >
        {/* Left: DAA name + DAC name + recently updated indicator */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography
              sx={{ fontFamily: FONT, fontWeight: 700, fontSize: 15, color: '#1a1a2e' }}
            >
              {label}
            </Typography>
            <Typography
              sx={{ fontFamily: FONT, fontSize: 13, color: '#888', fontWeight: 400 }}
            >
              ({dacName})
            </Typography>
            {isRecentlyUpdated && (
              <Tooltip
                arrow
                placement="top"
                title={
                  (
                    <Typography sx={{ fontFamily: FONT, fontSize: 12, lineHeight: 1.6 }}>
                      {readOnly ? RECENTLY_UPDATED_TOOLTIP.readOnly : RECENTLY_UPDATED_TOOLTIP.managed}
                    </Typography>
                  )
                }
              >
                <Chip
                  label="⚠ Recently Updated"
                  data-cy={`daa-recently-updated-chip-${daaId}`}
                  sx={{
                    bgcolor: '#fff8e1',
                    color: '#e65100',
                    fontWeight: 700,
                    fontSize: 11,
                    height: 22,
                    fontFamily: FONT,
                    cursor: 'help',
                  }}
                />
              </Tooltip>
            )}
          </Box>
          <Typography sx={{ fontFamily: FONT, fontSize: 12, color: '#888', mt: 0.5 }}>
            {formattedEffectiveDate === '—'
              ? 'No effective date available'
              : `Effective ${formattedEffectiveDate}`}
          </Typography>
        </Box>

        {/* Right: bulk actions + authorized count badge + chevron */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, ml: 2 }}>
          {!readOnly && (
            <BulkActionButtons
              dataCyPrefix={`daa-${daaId}`}
              approveAllDisabled={unauthorizedUserIds.length === 0}
              removeAllDisabled={authorizedUserIds.length === 0}
              onApproveAll={() => onApproveAll(unauthorizedUserIds)}
              onRemoveAll={() => onRemoveAll(authorizedUserIds)}
            />
          )}
          {authorizedCount > 0 && (
            <Chip
              label={`${authorizedCount} pre-authorized`}
              data-cy={`daa-authorized-badge-${daaId}`}
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
          <Typography
            aria-hidden="true"
            sx={{ fontSize: 13, color: '#bbb' }}
          >
            {isExpanded ? '▲' : '▼'}
          </Typography>
        </Box>
      </Box>

      {/* ── Collapsible researcher sub-table ── */}
      <Collapse
        in={isExpanded}
        timeout="auto"
        unmountOnExit
        id={`daa-researcher-panel-${daaId}`}
      >
        <Box sx={{ p: 2, bgcolor: '#fafafa' }}>
          {isRecentlyUpdated && (
            <Box
              data-cy={`daa-recently-updated-banner-${daaId}`}
              sx={{
                mb: 2,
                px: 2,
                py: 1.5,
                border: '1px solid #ffe0b2',
                borderRadius: 1.5,
                bgcolor: '#fff8e1',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
              }}
            >
              <Typography sx={{ fontSize: 16 }} aria-hidden="true">⚠️</Typography>
              <Typography
                sx={{ fontFamily: FONT, fontSize: 13, color: '#e65100', lineHeight: 1.7 }}
              >
                <strong>This DAA has been updated within the last year.</strong>
                {readOnly ? RECENTLY_UPDATED_BANNER.readOnly : RECENTLY_UPDATED_BANNER.managed}
              </Typography>
            </Box>
          )}
          <DAAResearcherSubtable
            researcherRows={researcherRows}
            onAuthorize={onAuthorize}
            onRevoke={onRevoke}
            readOnly={readOnly}
            showInstitution={showInstitution}
          />
        </Box>
      </Collapse>
    </Paper>
  )
}
