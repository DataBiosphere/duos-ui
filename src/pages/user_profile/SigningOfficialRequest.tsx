import React, { useState } from 'react'
import Alert from '@mui/material/Alert'
import { Support } from 'src/libs/ajax/Support'
import { User } from 'src/libs/ajax/User'
import { Notifications } from 'src/libs/utils'
import { DuosUser, ResponseError } from 'src/types/model'
import { getExternalProfileLinks } from './externalProfileUtils'
import './SigningOfficialRequest.css'

interface SigningOfficialRequestProps {
  readonly user: DuosUser
}

export default function SigningOfficialRequest({ user }: SigningOfficialRequestProps): React.JSX.Element | null {
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (user.isSigningOfficial) {
    return null
  }

  const submitRequest = async () => {
    try {
      setIsSubmitting(true)
      const currentUser = await User.getMe()
      const externalProfileLinks = getExternalProfileLinks(currentUser.userData?.externalProfiles)

      if (externalProfileLinks.length < 2) {
        Notifications.showError({
          text: 'Please provide at least two External Profiles before requesting Signing Official status.',
        })
        return
      }

      const description = `User (${user.userId}, ${user.email}) has attested that they are a Signing Official for their institution and have the authority to engage their institution in contracts related to data access and submission.\n\nExternal profile URLs:\n`
        + externalProfileLinks.map(({ label, url }) => `- ${label}: ${url}`).join('\n')
      const ticket = Support.createTicket(
        user.displayName,
        'task',
        user.email,
        `DUOS: Signing Official Status Request for ${user.displayName}`,
        description,
        [],
        'User Profile Page',
      )

      await Support.createSupportRequest(ticket)
      Notifications.showSuccess({
        text: 'Signing Official status request submitted successfully.',
        timeout: 1500,
      })
    }
    catch (error) {
      const status = (error as ResponseError)?.response?.status
      const statusPrefix = status ? `ERROR ${status}: ` : ''
      Notifications.showError({
        text: `${statusPrefix}Unable to request Signing Official status`,
      })
    }
    finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="signing-official-request" aria-labelledby="signing-official-request-title">
      <h2 id="signing-official-request-title">Request Signing Official Status</h2>
      <Alert severity="info" sx={{ mb: 2, fontStyle: 'italic' }}>
        You cannot be both the requestor and the Signing Official on the same Data Access Request.
        The Signing Official is typically a member of your institution&apos;s Contracts Office, Office
        of Sponsored Programs, or Legal/General Counsel &mdash; not the researcher submitting the request.
        Only request this status if that describes your role.
      </Alert>
      <p>
        I legally attest that I am a Signing Official for the above listed institution, and have the authority to engage my institution in contracts related to data access and submission.
      </p>
      <p className="signing-official-request-requirement">
        Signing Officials are required to provide two External Profiles above to assist with validating their identity.
      </p>
      <button
        type="button"
        className="btn-primary common-background signing-official-request-button"
        onClick={submitRequest}
        disabled={isSubmitting}
      >
        Attest & Request
      </button>
    </section>
  )
}
