import React from 'react'
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
import { DAAResearcherRowData } from './types'
import { formatDateYYYYMMDD } from './researcherViewHelpers'

const FONT = 'Montserrat'

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
}: Readonly<DAAAccordionRowProps>) {
  const daaId = daa.daaId
  const daaLabel = daa.file?.fileName ?? `DAA-${daaId}`
  const formattedEffectiveDate = formatDateYYYYMMDD(daa.createDate)

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
              {daaLabel}
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
                      This DAA was updated within the last year. Review the agreement to ensure
                      your institution&apos;s researchers are operating under the most current terms.
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

        {/* Right: authorized count badge + chevron */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, ml: 2 }}>
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
                <strong>This DAA has been updated within the last year.</strong> Please review
                the agreement to ensure it reflects your institution&apos;s current data
                governance expectations before authorizing new researchers.
              </Typography>
            </Box>
          )}
          <DAAResearcherSubtable
            researcherRows={researcherRows}
            onAuthorize={onAuthorize}
            onRevoke={onRevoke}
          />
        </Box>
      </Collapse>
    </Paper>
  )
}
