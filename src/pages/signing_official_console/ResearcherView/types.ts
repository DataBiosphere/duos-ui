import { DAAObject, DuosUser } from 'src/types/model'

export type AuthStatus = 'authorized' | 'not_requested' | 'revoked'

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
