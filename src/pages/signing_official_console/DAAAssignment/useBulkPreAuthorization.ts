import { useCallback } from 'react'
import { Notifications } from 'src/libs/utils'
import { DaaBulkRelationResult } from 'src/types/model'
import { BulkConfirmState } from './types'

type BulkMode = BulkConfirmState['mode']
type BulkMutation = (targetId: number, ids: number[]) => Promise<DaaBulkRelationResult>

export interface UseBulkPreAuthorizationArgs {
  readonly bulkDialog: BulkConfirmState | null
  readonly setBulkDialog: (next: BulkConfirmState | null) => void
  readonly refresh: () => Promise<void>
  /** Bulk "Approve All" endpoint for this view's scope. */
  readonly add: BulkMutation
  /** Bulk "Remove All" endpoint for this view's scope. */
  readonly remove: BulkMutation
  /** Success toast text, given the server-applied count and the target card's label. */
  readonly successText: (mode: BulkMode, applied: number, targetLabel: string) => string
  /** Error toast text shown when the bulk call fails. */
  readonly errorText: (mode: BulkMode, targetLabel: string) => string
}

/**
 * The shared confirm handler for a bulk Approve All / Remove All action, used by
 * both ResearcherView (DAAs per researcher) and DAAView (researchers per DAA).
 *
 * The two views differ only in which endpoints to call and how the toasts read,
 * so those are injected; the dialog-close / call / success-toast / refresh flow —
 * and the "log then error-toast, do not refresh" failure path that preserves the
 * displayed state — lives here once.
 */
export function useBulkPreAuthorization({
  bulkDialog,
  setBulkDialog,
  refresh,
  add,
  remove,
  successText,
  errorText,
}: UseBulkPreAuthorizationArgs): () => Promise<void> {
  return useCallback(async () => {
    if (!bulkDialog) return
    const { mode, targetId, targetLabel, ids } = bulkDialog
    setBulkDialog(null)
    try {
      const result = await (mode === 'approve' ? add : remove)(targetId, ids)
      const applied = typeof (result as unknown as { applied?: unknown })?.applied === 'number'
        ? (result as unknown as { applied: number }).applied
        : ids.length
      Notifications.showSuccess({ text: successText(mode, applied, targetLabel) })
      await refresh()
    }
    catch (error) {
      // Intentionally do not refresh on error, preserving the displayed state.
      console.error(`Bulk ${mode} for ${targetLabel} failed`, error)
      Notifications.showError({ text: errorText(mode, targetLabel) })
    }
  }, [bulkDialog, setBulkDialog, refresh, add, remove, successText, errorText])
}
