import { UserRole, ExternalProfiles } from './model'

export interface CreateDuosUserRequest {
  displayName: string
  email: string
  emailPreference: boolean
  roles: UserRole[]
}

export interface UpdateDuosUserRequestV1 {
  displayName?: string
  institutionId?: number
  emailPreference?: boolean
  eraCommonsId?: string
  selectedSigningOfficialId?: number
  suggestedInstitution?: string
  suggestedSigningOfficial?: string
  daaAcceptance?: string
  userData?: { externalProfiles?: ExternalProfiles }
}

export interface UpdateDuosUserRequestV2 {
  displayName?: string
  institutionId?: number
  emailPreference?: boolean
  eraCommonsId?: string
  userRoleIds?: number[]
  selectedSigningOfficialId?: number
  suggestedInstitution?: string
  suggestedSigningOfficial?: string
  daaAcceptance?: boolean
}
