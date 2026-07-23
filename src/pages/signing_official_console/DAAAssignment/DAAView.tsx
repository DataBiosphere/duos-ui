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
import DAAAccordionRow from './DAAAccordionRow'
import ResearcherViewLegend from './ResearcherViewLegend'
import ResearcherViewConfirmDialog from './ResearcherViewConfirmDialog'
import BulkActionConfirmDialog from './BulkActionConfirmDialog'
import { buildDAAViewRows, daaLabel } from './researcherViewHelpers'
import { useBulkPreAuthorization } from './useBulkPreAuthorization'
import { BulkConfirmState, ConfirmDialogState, DAAAccordionData } from './types'

const FONT = 'Montserrat'
const BRAND_BLUE = '#0948b7'

/** Success toast text for a bulk action on a DAA card (researchers per DAA). */
function bulkSuccessText(mode: 'approve' | 'remove', applied: number, daaLabelText: string): string {
  const plural = applied === 1 ? '' : 's'
  return mode === 'approve'
    ? `Pre-authorized ${applied} researcher${plural} for ${daaLabelText}`
    : `Removed pre-authorization for ${applied} researcher${plural} from ${daaLabelText}`
}

function bulkErrorText(mode: 'approve' | 'remove', daaLabelText: string): string {
  return `Failed to ${mode === 'approve' ? 'approve' : 'remove'} all researchers for ${daaLabelText}`
}

export interface DAAViewProps {
  readonly researchers: readonly DuosUser[]
  readonly daas: readonly DAAObject[]
  readonly isLoading: boolean
  readonly onResearchersRefresh: (updated: DuosUser[]) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * DAA View tab of the Pre-Authorize Researchers page.
 *
 * Shows an accordion list of DAAs.  Each DAA is expandable to reveal all
 * researchers managed by this SO, along with each researcher's authorization
 * status and an action button for this specific DAA.
 *
 * This is the DAA-first mirror of ResearcherView, allowing SOs to manage
 * all researcher authorizations for a single agreement in one place.
 *
 * Auth mutations (createDaaLcLink / deleteDaaLcLink) are the same APIs used
 * by the existing ManageResearcherDAAs page.
 */
export default function DAAView({
  researchers,
  daas,
  isLoading,
  onResearchersRefresh,
}: Readonly<DAAViewProps>) {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null)
  const [bulkDialog, setBulkDialog] = useState<BulkConfirmState | null>(null)

  // ── Data ────────────────────────────────────────────────────────────────────

  const daaRows = useMemo<DAAAccordionData[]>(
    () => buildDAAViewRows(daas, researchers),
    [daas, researchers],
  )

  const filteredRows = useMemo<DAAAccordionData[]>(() => {
    const term = search.trim().toLowerCase()
    if (!term) return daaRows
    return daaRows.filter(
      row =>
        daaLabel(row.daa).toLowerCase().includes(term)
        || row.dacName.toLowerCase().includes(term),
    )
  }, [daaRows, search])

  const allExpanded = filteredRows.length > 0
    && filteredRows.every(row => expanded[row.daa.daaId])

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

  const toggleRow = useCallback((daaId: number) => {
    setExpanded(prev => ({ ...prev, [daaId]: !prev[daaId] }))
  }, [])

  const toggleExpandAll = useCallback(() => {
    if (allExpanded) {
      setExpanded({})
    }
    else {
      const next: Record<number, boolean> = {}
      filteredRows.forEach((row) => {
        next[row.daa.daaId] = true
      })
      setExpanded(next)
    }
  }, [allExpanded, filteredRows])

  const openAuthorizeDialog = useCallback(
    (daaId: number, researcherId: number, daaLabel: string, researcherName: string) => {
      setConfirmDialog({ daaId, researcherId, daaLabel, researcherName, action: 'authorize' })
    },
    [],
  )

  const openRevokeDialog = useCallback(
    (daaId: number, researcherId: number, daaLabel: string, researcherName: string) => {
      setConfirmDialog({ daaId, researcherId, daaLabel, researcherName, action: 'revoke' })
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
        Notifications.showSuccess({ text: `Pre-authorized ${researcherName} for ${daaLabel}` })
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

  // ── Bulk handlers ─────────────────────────────────────────────────────────────

  const openBulkDialog = useCallback(
    (daaId: number, daaLabel: string, mode: 'approve' | 'remove', userIds: number[]) => {
      if (userIds.length === 0) return
      setBulkDialog({
        scope: 'daa',
        mode,
        targetId: daaId,
        targetLabel: daaLabel,
        count: userIds.length,
        ids: userIds,
      })
    },
    [],
  )

  const handleBulkConfirm = useBulkPreAuthorization({
    bulkDialog,
    setBulkDialog,
    refresh: refreshResearchers,
    add: DAA.bulkAddUsersToDaa,
    remove: DAA.bulkRemoveUsersFromDaa,
    successText: bulkSuccessText,
    errorText: bulkErrorText,
  })

  // ── Render ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Box
        data-cy="daa-view-loading"
        sx={{ display: 'flex', justifyContent: 'center', py: 8 }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box data-cy="daa-view">
      {/* Toolbar */}
      <Box
        data-cy="daa-view-toolbar"
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
          placeholder="Search by DAA name or DAC"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          data-cy="daa-search"
          sx={{
            'width': 300,
            '& .MuiOutlinedInput-root': { fontFamily: FONT, fontSize: 13 },
          }}
          slotProps={{
            htmlInput: { 'aria-label': 'search DAAs' },
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
            data-cy="daa-expand-collapse-all"
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

      {/* DAA accordion list */}
      <Box
        data-cy="daa-list"
        sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
      >
        {filteredRows.length === 0 && (
          <Typography
            data-cy="daa-empty-message"
            sx={{
              fontFamily: FONT,
              color: '#888',
              fontSize: 13,
              textAlign: 'center',
              py: 4,
            }}
          >
            No active Pre-Auth DAAs found.
          </Typography>
        )}
        {filteredRows.map(row => (
          <DAAAccordionRow
            key={row.daa.daaId}
            daa={row.daa}
            dacName={row.dacName}
            researcherRows={row.researcherRows}
            authorizedCount={row.authorizedCount}
            isRecentlyUpdated={row.isRecentlyUpdated}
            isExpanded={expanded[row.daa.daaId]}
            onToggle={() => toggleRow(row.daa.daaId)}
            onAuthorize={researcherId => openAuthorizeDialog(
              row.daa.daaId,
              researcherId,
              daaLabel(row.daa),
              row.researcherRows.find(r => r.researcher.userId === researcherId)
                ?.researcher.displayName ?? String(researcherId),
            )}
            onRevoke={researcherId => openRevokeDialog(
              row.daa.daaId,
              researcherId,
              daaLabel(row.daa),
              row.researcherRows.find(r => r.researcher.userId === researcherId)
                ?.researcher.displayName ?? String(researcherId),
            )}
            onApproveAll={userIds => openBulkDialog(
              row.daa.daaId,
              daaLabel(row.daa),
              'approve',
              userIds,
            )}
            onRemoveAll={userIds => openBulkDialog(
              row.daa.daaId,
              daaLabel(row.daa),
              'remove',
              userIds,
            )}
          />
        ))}
      </Box>

      {/* Single-relationship confirmation dialog (shared with ResearcherView) */}
      <ResearcherViewConfirmDialog
        dialog={confirmDialog}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmDialog(null)}
      />

      {/* Bulk Approve All / Remove All confirmation dialog */}
      <BulkActionConfirmDialog
        dialog={bulkDialog}
        onConfirm={handleBulkConfirm}
        onCancel={() => setBulkDialog(null)}
      />
    </Box>
  )
}
