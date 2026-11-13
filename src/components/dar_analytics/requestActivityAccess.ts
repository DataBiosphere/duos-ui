import { USER_ROLES } from 'src/libs/utils'
import { DuosUser } from 'src/types/model'

const DAC_ROLES = new Set<string>([USER_ROLES.chairperson, USER_ROLES.member])

/** The DACs the user is a chair or member of. */
export const chairOrMemberDacIds = (user: Partial<DuosUser> | null | undefined): number[] =>
  [...new Set((user?.roles ?? [])
    .flatMap(role => (DAC_ROLES.has(role.name) && role.dacId != null ? [role.dacId] : [])))]

/**
 * How much of the reports that count denied and pending requests consent serves a user: `all` of a
 * study's or dataset's requests to an admin, the requests for their `own-dacs`' datasets to a chair
 * or member of a DAC in charge, and `none` to anyone else who can merely read the study or dataset.
 */
export type RequestActivityAccess = 'all' | 'own-dacs' | 'none'

/**
 * What to offer the user of those reports, for datasets these DACs are in charge of.
 *
 * A hint for what to show, read from the roles stored at sign-in: consent decides, and a report it
 * refuses shows its refusal.
 */
export const requestActivityAccess = (
  user: Partial<DuosUser> | null | undefined,
  dacIds: ReadonlyArray<number | null | undefined>,
): RequestActivityAccess => {
  if (user?.isAdmin === true) {
    return 'all'
  }
  const own = chairOrMemberDacIds(user)
  return dacIds.some(dacId => dacId != null && own.includes(dacId)) ? 'own-dacs' : 'none'
}
