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

      // Defensive: the atomic bulk endpoints are all-or-nothing, so `errors` is
      // expected to be empty. If a partial-failure response ever populates it,
      // surface the failure and refresh to reflect whatever actually changed
      // rather than reporting success.
      if (Array.isArray(result?.errors) && result.errors.length > 0) {
        console.error(`Bulk ${mode} for ${targetLabel} reported errors`, result.errors)
        Notifications.showError({ text: errorText(mode, targetLabel) })
        await refresh()
        return
      }

      // TODO(otchet-dt-3325): `applied` may be absent until the companion backend
      // PR ships the field; fall back to the requested count until then. Drop this
      // guard (and read `result.applied` directly) once the backend returns it.
      const applied = typeof (result as { applied?: unknown })?.applied === 'number'
        ? (result as { applied: number }).applied
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
