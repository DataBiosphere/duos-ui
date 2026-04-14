import { DAAObject, DuosUser } from 'src/types/model'
import { DAARowData } from 'src/pages/signing_official_console/DAAAssignment/types'

interface DaaOptions {
  daaId: number
  broadDaa?: boolean
  fileName?: string
  dacId?: number
  mapped?: boolean
}

interface ResearcherOptions {
  userId: number
  displayName: string
  email: string
  authorizedDaaIds?: unknown[]
}

export function makeDaa({
  daaId,
  broadDaa = false,
  fileName = `DAA-${daaId}.pdf`,
  dacId = 10,
  mapped = true,
}: DaaOptions): DAAObject & { broadDaa?: boolean } {
  return {
    broadDaa,
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
  authorizedDaaIds = [],
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
    roles: [],
    libraryCard: {
      id: userId * 10,
      userId,
      userName: displayName,
      userEmail: email,
      createDate: new Date('2023-01-01'),
      createUserId: 1,
      daaIds: authorizedDaaIds as number[],
    },
  }
}

export function makeDaaRow(daa: DAAObject, status: DAARowData['status'], dacName: string): DAARowData {
  return { daa, dacName, status }
}
