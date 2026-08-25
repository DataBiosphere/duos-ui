import { isNil, uniq } from 'src/utils/NodashUtil'
import { InstitutionInterface, LibraryCard, UserRole, UserRoleName } from 'src/types/model'

const STATUS_COLUMN_ROLES: UserRoleName[] = ['Researcher', 'DataSubmitter']

export const formatUserRoles = (roles: UserRole[] | undefined, libraryCard: LibraryCard | undefined): string => {
  const named = (roles ?? []).map(role => role.name).filter(name => !STATUS_COLUMN_ROLES.includes(name))
  const withCard = isNil(libraryCard) ? named : [...named, 'LibraryCard']
  // SigningOfficial -> Signing Official
  const spaced = withCard.map(name => name.replace(/([A-Z])/g, ' $1').trim())
  return uniq(spaced).join(', ') || 'None'
}

export const institutionName = (institution: InstitutionInterface | undefined): string => institution?.name ?? 'N/A'

export const yesNo = (value: boolean): string => (value ? 'Yes' : 'No')
