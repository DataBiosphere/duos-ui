import { DAAObject, DuosUser, InstitutionInterface, UserRole } from 'src/types/model'
import { ROLES, USER_ROLES } from 'src/libs/utils'

interface DaaOptions {
  daaId: number
  fileName?: string
  dacId?: number
  mapped?: boolean
}

interface DaaDetailOption {
  daaId: number
  authorizedBy?: string
}

interface ResearcherOptions {
  userId: number
  displayName: string
  email: string
  daaDetails?: DaaDetailOption[]
  /** Defaults to the Researcher role, as a list response would carry it. */
  roles?: UserRole[]
  /** Omitted by default, so tests must opt in to having an institution. */
  institutionName?: string
}

/** The `roles` entry a list response carries for a researcher. */
export function researcherRole(userId: number): UserRole {
  return { roleId: ROLES.researcher.roleId, name: USER_ROLES.researcher, userId }
}

export function makeDaa({
  daaId,
  fileName = `DAA-${daaId}.pdf`,
  dacId = 10,
  mapped = true,
}: DaaOptions): DAAObject {
  return {
    daaId,
    createUserId: 1,
    createDate: '2024-01-15',
    updateUserId: 1,
    updateDate: '2024-01-15',
    initialDacId: dacId,
    file: {
      fileStorageObjectId: daaId,
      entityId: `entity-${daaId}`,
      fileName,
      category: 'dataAccessAgreement',
      mediaType: 'application/pdf',
      createUserId: 1,
      createDate: 1705276800,
    },
    dacs: mapped ? [{ dacId, name: `DAC-${dacId}`, dacName: `DAC-${dacId}` }] : [],
  }
}

export function makeResearcher({
  userId,
  displayName,
  email,
  daaDetails,
  roles,
  institutionName,
}: ResearcherOptions): DuosUser {
  return {
    userId,
    displayName,
    email,
    createDate: new Date('2020-01-01') as unknown as Date,
    emailPreference: true,
    isAdmin: false,
    isAlumni: false,
    isChairPerson: false,
    isDataSubmitter: false,
    isMember: false,
    isResearcher: true,
    isSigningOfficial: false,
    roles: roles ?? [researcherRole(userId)],
    ...(institutionName && {
      institutionId: userId * 100,
      // Only the identifying fields, as a user payload's nested institution
      // carries; InstitutionInterface also declares creation metadata that the
      // views never read.
      institution: {
        id: userId * 100,
        name: institutionName,
      } as unknown as InstitutionInterface,
    }),
    libraryCard: {
      id: userId * 10,
      userId,
      userName: displayName,
      userEmail: email,
      createDate: new Date('2023-01-01'),
      createUserId: 1,
      ...(daaDetails && { daaDetails }),
    },
  }
}
