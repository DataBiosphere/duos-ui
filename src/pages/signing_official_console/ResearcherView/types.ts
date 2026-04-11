import { DAAObject, DuosUser } from 'src/types/model'

export type AuthStatus = 'authorized' | 'not_requested' | 'revoked'

export interface DAARowData {
  daa: DAAObject
  dacName: string
  status: AuthStatus
}

export interface ResearcherRowData {
  researcher: DuosUser
  daaRows: DAARowData[]
  authorizedCount: number
}

export interface ConfirmDialogState {
  daaId: number
  researcherId: number
  researcherName: string
  daaLabel: string
  action: 'authorize' | 'revoke'
}
