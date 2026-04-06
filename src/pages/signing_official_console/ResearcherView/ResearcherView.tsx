import React, { useState, useMemo, useCallback } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material'
import { DuosUser, DAAObject } from 'src/types/model'
import { DAA } from 'src/libs/ajax/DAA'
import { User } from 'src/libs/ajax/User'
import { Notifications, USER_ROLES } from 'src/libs/utils'
import ResearcherAccordionRow from './ResearcherAccordionRow'
import ResearcherViewLegend from './ResearcherViewLegend'
import ResearcherViewConfirmDialog from './ResearcherViewConfirmDialog'
import { ConfirmDialogState, DAARowData, ResearcherRowData } from './types'
import { buildResearcherRows } from './researcherViewHelpers'

const FONT = 'Montserrat'
const BRAND_BLUE = '#0948b7'

export interface ResearcherViewProps {
  readonly researchers: readonly DuosUser[]
  readonly daas: readonly DAAObject[]
  readonly isLoading: boolean
  readonly onResearchersRefresh: (updated: DuosUser[]) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Researcher View tab of the Pre-Authorize Researchers page.
 *
 * Shows an accordion list of researchers, each expandable to reveal every
 * DAA managed by this SO along with the researcher's authorization status
 * and an inline action button (Authorize / Revoke / Re-authorize).
 *
 * Auth mutations (createDaaLcLink / deleteDaaLcLink) are the same APIs used
 * by the existing ManageResearcherDAAs page.
 */
export default function ResearcherView({
  researchers,
  daas,
  isLoading,
  onResearchersRefresh,
}: Readonly<ResearcherViewProps>) {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null)

  // ── Data ────────────────────────────────────────────────────────────────────

  const researcherRows = useMemo<ResearcherRowData[]>(
    () => buildResearcherRows(researchers, daas),
    [researchers, daas],
  )

  const filteredRows = useMemo<ResearcherRowData[]>(() => {
    const term = search.trim().toLowerCase()
    if (!term) return researcherRows
    return researcherRows.filter(
      (row: ResearcherRowData) =>
        row.researcher.displayName?.toLowerCase().includes(term)
        || row.researcher.email?.toLowerCase().includes(term),
    )
  }, [researcherRows, search])

  const totalPending = useMemo(
    () => researcherRows.reduce((sum: number, row: ResearcherRowData) => sum + row.pendingCount, 0),
    [researcherRows],
  )

  const allExpanded
    = filteredRows.length > 0
      && filteredRows.every((row: ResearcherRowData) => expanded[row.researcher.userId])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const refreshResearchers = useCallback(async () => {
    try {
      const updated = await User.list(USER_ROLES.signingOfficial)
      onResearchersRefresh(updated)
    }
    catch {
      Notifications.showError({ text: 'Failed to refresh researcher list' })
    }
  }, [onResearchersRefresh])

  const toggleRow = useCallback((userId: number) => {
    setExpanded(prev => ({ ...prev, [userId]: !prev[userId] }))
  }, [])

  const toggleExpandAll = useCallback(() => {
    if (allExpanded) {
      setExpanded({})
    }
    else {
      const next: Record<number, boolean> = {}
      filteredRows.forEach((row: ResearcherRowData) => {
        next[row.researcher.userId] = true
      })
      setExpanded(next)
    }
  }, [allExpanded, filteredRows])

  const openAuthorizeDialog = useCallback(
    (researcher: Readonly<DuosUser>, daaId: number, daaRows: readonly DAARowData[]) => {
      const daaLabel
        = daaRows.find(r => r.daa.daaId === daaId)?.daa.file?.fileName ?? `DAA-${daaId}`
      setConfirmDialog({
        daaId,
        researcherId: researcher.userId,
        researcherName: researcher.displayName ?? researcher.email,
        daaLabel,
        action: 'authorize',
      })
    },
    [],
  )

  const openRevokeDialog = useCallback(
    (researcher: Readonly<DuosUser>, daaId: number, daaRows: readonly DAARowData[]) => {
      const daaLabel
        = daaRows.find(r => r.daa.daaId === daaId)?.daa.file?.fileName ?? `DAA-${daaId}`
      setConfirmDialog({
        daaId,
        researcherId: researcher.userId,
        researcherName: researcher.displayName ?? researcher.email,
        daaLabel,
        action: 'revoke',
      })
    },
    [],
  )

  const handleConfirm = useCallback(async () => {
    if (!confirmDialog) return
    const { daaId, researcherId, researcherName, daaLabel, action } = confirmDialog
    setConfirmDialog(null)
    try {
      if (action === 'authorize') {
        await DAA.createDaaLcLink(daaId, researcherId)
        Notifications.showSuccess({ text: `Authorized ${researcherName} for ${daaLabel}` })
      }
      else {
        await DAA.deleteDaaLcLink(daaId, researcherId)
        Notifications.showSuccess({
          text: `Revoked access for ${researcherName} from ${daaLabel}`,
        })
      }
      await refreshResearchers()
    }
    catch {
      Notifications.showError({
        text: `Failed to ${action} access for ${researcherName}`,
      })
    }
  }, [confirmDialog, refreshResearchers])

  // ── Render ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Box
        data-cy="researcher-view-loading"
        sx={{ display: 'flex', justifyContent: 'center', py: 8 }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box data-cy="researcher-view">
      {/* Info banner */}
      <Box
        data-cy="researcher-view-info-banner"
        sx={{
          border: '1px solid #c8e6c9',
          borderRadius: 2,
          bgcolor: '#f1f8e9',
          p: 2.5,
          mb: 3,
          display: 'flex',
          gap: 2,
          alignItems: 'flex-start',
        }}
      >
        <Box sx={{ fontSize: 18, mt: 0.1 }} aria-hidden="true">ℹ️</Box>
        <Typography sx={{ fontFamily: FONT, fontSize: 13, color: '#388e3c', lineHeight: 1.7 }}>
          <strong>Pre-auth authorization is per-DAA.</strong>{' '}
          Researchers must be approved individually for each Pre-Auth DAA they wish to access.
          Authorization under one Pre-Auth DAA does not carry over to others.
          Each DAR operates under the specific DAA version in effect at the time of submission,
          for its full lifecycle.
        </Typography>
      </Box>

      {/* Toolbar */}
      <Box
        data-cy="researcher-view-toolbar"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        <TextField
          placeholder="Search researchers"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          data-cy="researcher-search"
          sx={{
            'width': 280,
            '& .MuiOutlinedInput-root': { fontFamily: FONT, fontSize: 13 },
          }}
          slotProps={{
            htmlInput: { 'aria-label': 'search researchers' },
            input: {
              endAdornment: <InputAdornment position="end">🔍</InputAdornment>,
            },
          }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ResearcherViewLegend />
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Button
            variant="outlined"
            size="small"
            data-cy="expand-collapse-all"
            onClick={toggleExpandAll}
            sx={{
              fontFamily: FONT,
              fontWeight: 600,
              fontSize: 12,
              textTransform: 'none',
              borderColor: BRAND_BLUE,
              color: BRAND_BLUE,
              borderWidth: 1.5,
            }}
          >
            {allExpanded ? '▲ Collapse All' : '▼ Expand All'}
          </Button>
        </Box>
      </Box>

      {/* Pending summary */}
      {totalPending > 0 && (
        <Typography
          data-cy="pending-summary"
          sx={{ fontFamily: FONT, fontSize: 13, color: '#856404', mb: 1.5 }}
        >
          {totalPending} researcher{totalPending === 1 ? ' has' : 's have'} pending authorization
          request{totalPending === 1 ? '' : 's'} — sorted to the top.
        </Typography>
      )}

      {/* Researcher accordion list */}
      <Box
        data-cy="researcher-list"
        sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
      >
        {filteredRows.length === 0 && (
          <Typography
            data-cy="researcher-empty-message"
            sx={{
              fontFamily: FONT,
              color: '#888',
              fontSize: 13,
              textAlign: 'center',
              py: 4,
            }}
          >
            No researchers found.
          </Typography>
        )}
        {filteredRows.map((row: ResearcherRowData) => (
          <ResearcherAccordionRow
            key={row.researcher.userId}
            researcher={row.researcher}
            daaRows={row.daaRows}
            pendingCount={row.pendingCount}
            authorizedCount={row.authorizedCount}
            isExpanded={expanded[row.researcher.userId] ?? false}
            onToggle={() => toggleRow(row.researcher.userId)}
            onAuthorize={daaId => openAuthorizeDialog(row.researcher, daaId, row.daaRows)}
            onRevoke={daaId => openRevokeDialog(row.researcher, daaId, row.daaRows)}
          />
        ))}
      </Box>

      {/* Confirmation dialog */}
      <ResearcherViewConfirmDialog
        dialog={confirmDialog}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmDialog(null)}
      />
    </Box>
  )
}
