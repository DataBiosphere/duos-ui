/**
 * Re-reads the signed-in user's profile after a role change that touched them.
 *
 * Sign-in is the only other writer of the stored profile, so without this a
 * user who adds themselves as a DAC chair keeps the old roles (no Chair vote
 * tab, no chair routes) until they sign out and back in (DT-505).
 */
import { User } from 'src/libs/ajax/User'
import { Storage } from 'src/libs/storage'
import { resetSessionCache } from 'src/libs/auth/session'
import { setUserRoleStatuses } from 'src/libs/utils'

export const refreshCurrentUserIfAffected = async (affectedUserIds: number[]): Promise<void> => {
  if (!affectedUserIds.includes(Storage.getCurrentUser().userId)) return
  // Under the BFF the cached /auth/me probe still carries the old roles. Drop
  // it so the next navigation probes fresh and the reconciler re-renders
  // consumers off the new profile.
  resetSessionCache()
  try {
    // setUserRoleStatuses persists the user itself (utils.ts).
    setUserRoleStatuses(await User.getMe(), Storage)
  }
  catch {
    // The role change itself succeeded. Keep the stored profile; the next
    // session probe (BFF) or sign-in (legacy) picks the new roles up.
  }
}
