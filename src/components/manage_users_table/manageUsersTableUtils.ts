import { isNil, uniq } from 'src/utils/NodashUtil'
import { formatDate } from 'src/libs/utils'
import { InstitutionInterface, LibraryCard, UserRole } from 'src/types/model'

/** Researcher is implicit for every user, and a library card reads as a role in this table. */
export const formatUserRoles = (roles: UserRole[] | undefined, libraryCard: LibraryCard | undefined): string => {
  const named = (roles ?? []).map(role => role.name).filter(name => name !== 'Researcher')
  const withCard = isNil(libraryCard) ? named : [...named, 'LibraryCard']
  // SigningOfficial -> Signing Official
  const spaced = withCard.map(name => name.replace(/([A-Z])/g, ' $1').trim())
  return uniq(spaced).join(', ') || 'None'
}

export const institutionName = (institution: InstitutionInterface | undefined): string => institution?.name ?? 'N/A'

// createDate arrives as an ISO string over the wire despite its Date type, so it's coerced before formatting.
export const formatRegistrationDate = (createDate: Date | string | undefined): string =>
  formatDate(createDate as unknown as string)

/** Labels a user's pre-authorized DAAs, falling back to a stable token for a DAA missing from the lookup. */
export const formatPreAuth = (
  libraryCard: LibraryCard | undefined,
  daaLabelsById: Map<number, string>,
): string => {
  const labels = (libraryCard?.daaDetails ?? [])
    .map(({ daaId }) => daaLabelsById.get(daaId) ?? `DAA-${daaId}`)
  return uniq(labels).join(', ') || 'None'
}
