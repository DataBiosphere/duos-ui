import { DAAObject, DuosUser } from 'src/types/model'
import type { User } from 'src/libs/ajax/User'

export type AuthStatus = 'authorized' | 'not_requested' | 'revoked'

/**
 * Which user list the DAA association views work against: `SigningOfficial`
 * scopes to the signed-in SO's institution, `Admin` spans every institution.
 * Derived from `User.list` so the two cannot drift apart.
 */
export type UserListScope = Parameters<typeof User.list>[0]

// ── Researcher View types ──────────────────────────────────────────────────────

/** A single row in the per-researcher DAA sub-table */
export interface DAARowData {
  daa: DAAObject
  dacName: string
  status: AuthStatus
}

/** A researcher enriched with their DAA authorization summary */
export interface ResearcherRowData {
  researcher: DuosUser
  daaRows: DAARowData[]
  authorizedCount: number
}

// ── DAA View types ─────────────────────────────────────────────────────────────

/** A single row in the per-DAA researcher sub-table */
export interface DAAResearcherRowData {
  researcher: DuosUser
  status: AuthStatus
  /** Email of the SO who granted pre-authorization, if recorded */
  authorizedBy?: string
}

/** A DAA enriched with per-researcher auth data, ready for the accordion */
export interface DAAAccordionData {
  daa: DAAObject
  dacName: string
  researcherRows: DAAResearcherRowData[]
  authorizedCount: number
  isRecentlyUpdated: boolean
}

// ── Shared ────────────────────────────────────────────────────────────────────

/** State held while a confirm dialog is open */
export interface ConfirmDialogState {
  daaId: number
  researcherId: number
  researcherName: string
  daaLabel: string
  action: 'authorize' | 'revoke'
}

/**
 * State held while a *bulk* confirm dialog is open.
 *
 * Kept deliberately separate from {@link ConfirmDialogState} so the
 * well-tested single-relationship flow stays untouched.
 *
 * - `scope: 'researcher'` — target is one researcher; `ids` are DAA ids.
 * - `scope: 'daa'` — target is one DAA; `ids` are researcher (user) ids.
 */
export interface BulkConfirmState {
  scope: 'researcher' | 'daa'
  mode: 'approve' | 'remove'
  /** userId when scope==='researcher', daaId when scope==='daa' */
  targetId: number
  /** Human-readable name of the target card (researcher name or DAA label) */
  targetLabel: string
  /** Number of relationships the action will affect */
  count: number
  /** The ids to send to the bulk endpoint (daaIds or userIds per scope) */
  ids: number[]
}
