import { isNil, uniq } from 'src/utils/NodashUtil'
import { InstitutionInterface, LibraryCard, UserRole } from 'src/types/model'

/** Researcher and DataSubmitter are implicit/broken out into their own status columns in this table. */
export const formatUserRoles = (roles: UserRole[] | undefined, libraryCard: LibraryCard | undefined): string => {
  const named = (roles ?? []).map(role => role.name).filter(name => name !== 'Researcher' && name !== 'DataSubmitter')
  const withCard = isNil(libraryCard) ? named : [...named, 'LibraryCard']
  // SigningOfficial -> Signing Official
  const spaced = withCard.map(name => name.replace(/([A-Z])/g, ' $1').trim())
  return uniq(spaced).join(', ') || 'None'
}

export const institutionName = (institution: InstitutionInterface | undefined): string => institution?.name ?? 'N/A'

export const yesNo = (value: boolean): string => (value ? 'Yes' : 'No')
