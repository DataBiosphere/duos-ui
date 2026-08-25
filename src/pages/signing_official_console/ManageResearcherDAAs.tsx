import React from 'react'

import { DaaAssociationsPage } from 'src/pages/signing_official_console/DAAAssignment'
import PrincipalInvestigatorHelpText from 'src/pages/signing_official_console/PrincipalInvestigatorHelpText'
import { USER_ROLES } from 'src/libs/utils'

const DESCRIPTION = 'Grant and revoke pre-authorization for researchers at your institution to '
  + 'submit DARs directly to the DAC (without SO review of the individual DAR first) when '
  + 'permitted by the DAC.'

/**
 * SO Console → DAA Associations. Scoped to the SO's own institution, with the
 * pre-authorize / revoke controls enabled.
 *
 * The Admin Console renders the same page read-only and system-wide; see
 * `src/pages/AdminDaaAssociations.tsx`. The Principal Investigator definition is
 * shown here but not there: it informs the pre-authorization decision, which
 * only the SO makes.
 */
export default function ManageResearcherDAAs(): React.JSX.Element {
  return (
    <DaaAssociationsPage
      title="Pre-Authorize Researchers (DAAs)"
      description={DESCRIPTION}
      scope={USER_ROLES.signingOfficial}
      helpContent={<PrincipalInvestigatorHelpText />}
    />
  )
}
