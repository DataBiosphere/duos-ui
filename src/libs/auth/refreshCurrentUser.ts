/**
 * Re-reads the signed-in user's profile after a role change that touched them.
 *
 * Sign-in is the only other writer of the stored profile, so without this a
 * user who adds themselves as a DAC chair keeps the old roles (no Chair vote
 * tab, no chair routes) until they sign out and back in (DT-505).
 */
import { User } from 'src/libs/ajax/User'
import { Storage } from 'src/libs/storage'
import { announceSessionChange } from 'src/libs/auth/session'
import { setUserRoleStatuses } from 'src/libs/utils'

export const refreshCurrentUserIfAffected = async (affectedUserIds: number[]): Promise<void> => {
  if (!affectedUserIds.includes(Storage.getCurrentUser().userId)) return
  try {
    // setUserRoleStatuses persists the user itself (utils.ts).
    setUserRoleStatuses(await User.getMe(), Storage)
  }
  catch {
    // The role change itself succeeded. Keep the stored profile; under the
    // BFF the probe below still carries the new roles from Consent.
  }
  // A storage write is invisible to React, and a save need not navigate
  // (DacProfile's inline EditDac). Drop the cached probe and re-probe now, so
  // mounted consumers such as the header's DAC Console tab re-render.
  announceSessionChange()
}
