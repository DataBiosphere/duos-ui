import { DAAObject, DuosUser } from 'src/types/model'

export type AuthStatus = 'authorized' | 'pending' | 'not_requested' | 'revoked'

export interface DAARowData {
  daa: DAAObject
  dacName: string
  status: AuthStatus
}

export interface ResearcherRowData {
  researcher: DuosUser
  daaRows: DAARowData[]
  authorizedCount: number
  pendingCount: number
  hasPending: boolean
}

export interface ConfirmDialogState {
  daaId: number
  researcherId: number
  researcherName: string
  daaLabel: string
  action: 'authorize' | 'revoke'
}
