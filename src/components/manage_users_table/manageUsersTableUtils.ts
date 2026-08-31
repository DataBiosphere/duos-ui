import { isNil, uniq } from 'src/utils/NodashUtil'
import { DacObject, InstitutionInterface, LibraryCard, UserRole, UserRoleName } from 'src/types/model'

const STATUS_COLUMN_ROLES = new Set<UserRoleName>(['Researcher', 'DataSubmitter'])

export const formatUserRoles = (roles: UserRole[] | undefined, libraryCard: LibraryCard | undefined): string => {
  const named = (roles ?? []).map(role => role.name).filter(name => !STATUS_COLUMN_ROLES.has(name))
  const withCard = isNil(libraryCard) ? named : [...named, 'LibraryCard']
  // SigningOfficial -> Signing Official
  const spaced = withCard.map(name => name.replace(/([A-Z])/g, ' $1').trim())
  return uniq(spaced).join(', ') || 'None'
}

export const institutionName = (institution: InstitutionInterface | undefined): string => institution?.name ?? 'N/A'

export const yesNo = (value: boolean): string => (value ? 'Yes' : 'No')

export interface UserDac {
  dacId: number
  name: string
}

/** DAC name lookup built once from the full DAC list, since a role only carries a dacId. */
export const dacNameMap = (dacList: DacObject[]): Map<number, string> =>
  new Map(
    dacList
      .filter((dac): dac is DacObject & { dacId: number } => !isNil(dac.dacId))
      .map(dac => [dac.dacId, dac.name ?? dac.dacName ?? 'Unknown']),
  )

/** DACs a user chairs or belongs to, deduped by DAC and sorted by name. */
export const userDacs = (roles: UserRole[] | undefined, dacNameById: Map<number, string>): UserDac[] => {
  const seen = new Set<number>()
  const dacs: UserDac[] = []
  for (const role of roles ?? []) {
    if ((role.name !== 'Chairperson' && role.name !== 'Member') || isNil(role.dacId) || seen.has(role.dacId)) {
      continue
    }
    seen.add(role.dacId)
    dacs.push({ dacId: role.dacId, name: dacNameById.get(role.dacId) ?? 'Unknown' })
  }
  return dacs.sort((a, b) => a.name.localeCompare(b.name))
}

export const formatUserDacs = (dacs: UserDac[]): string => dacs.map(dac => dac.name).join(', ') || 'None'
