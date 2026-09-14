import React from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'

import { PI_QUALIFICATION } from 'src/definitions/definitions-en-us'

/**
 * The DUOS definition of a qualifying Principal Investigator, shown as help text
 * on the Signing Official Console pages where an SO acts on that judgement —
 * pre-authorizing researchers and approving their Data Access Requests.
 *
 * The qualification language is the same one an SO attests to when approving an
 * individual DAR; both render `PI_QUALIFICATION` so the two cannot drift.
 */
export const PrincipalInvestigatorHelpText = () => {
  return (
    <Alert severity="info" data-cy="pi-help-text">
      <AlertTitle>Who qualifies as a Principal Investigator?</AlertTitle>
      <strong>Principal Investigator (PI):</strong> is {PI_QUALIFICATION}
    </Alert>
  )
}

export default PrincipalInvestigatorHelpText
