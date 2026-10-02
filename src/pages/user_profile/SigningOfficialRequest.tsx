import React, { useState } from 'react'
import { Alert, Checkbox, FormControlLabel, Link, Stack } from '@mui/material'
import { Support } from 'src/libs/ajax/Support'
import { User } from 'src/libs/ajax/User'
import { Storage } from 'src/libs/storage'
import { Notifications } from 'src/libs/utils'
import { DuosUser, ResponseError } from 'src/types/model'
import { getExternalProfileLinks } from './externalProfileUtils'
import './SigningOfficialRequest.css'

export const SO_REQUESTED_SETTING = 'signingOfficialRequestedAt'

const toggleSx = { font: 'inherit', verticalAlign: 'baseline' }
const attestationSx = {
  'alignItems': 'flex-start',
  'mb': 1.5,
  'fontWeight': 'normal',
  '& .MuiCheckbox-root': { pt: 0 },
  '& .MuiFormControlLabel-label': { font: 'inherit', lineHeight: 1.45 },
}

interface SigningOfficialRequestProps {
  readonly user: DuosUser
  readonly institutionHasSigningOfficials?: boolean
}

export default function SigningOfficialRequest({ user, institutionHasSigningOfficials = false }: SigningOfficialRequestProps): React.JSX.Element | null {
  const [isExpanded, setIsExpanded] = useState(false)
  const [hasAttested, setHasAttested] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requestedAt, setRequestedAt] = useState(() => Storage.getCurrentUserSettings<string>(SO_REQUESTED_SETTING))

  if (user.isSigningOfficial) {
    return null
  }

  if (requestedAt) {
    return (
      <section className="signing-official-request" aria-labelledby="signing-official-request-title">
        <h2 id="signing-official-request-title">Signing Official Status Requested</h2>
        <p>
          You requested Signing Official status on {new Date(requestedAt).toLocaleDateString()}.
          {' '}DUOS support will follow up by email.
        </p>
      </section>
    )
  }

  const collapse = () => {
    setIsExpanded(false)
    setHasAttested(false)
  }

  if (!isExpanded) {
    return (
      <section className="signing-official-request">
        <Link component="button" type="button" onClick={() => setIsExpanded(true)} sx={toggleSx}>
          Are you your institution&apos;s Signing Official? Request Signing Official status
        </Link>
      </section>
    )
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
      const submittedAt = new Date().toISOString()
      Storage.setCurrentUserSettings(SO_REQUESTED_SETTING, submittedAt)
      setRequestedAt(submittedAt)
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
      {institutionHasSigningOfficials && (
        <p className="signing-official-request-existing">
          Your institution already has Signing Officials, listed below. If you need a Library Card or
          approval for a Data Access Request, contact one of them instead.
        </p>
      )}
      <FormControlLabel
        control={<Checkbox checked={hasAttested} onChange={event => setHasAttested(event.target.checked)} />}
        label="I legally attest that I am a Signing Official for the above listed institution, and have the authority to engage my institution in contracts related to data access and submission."
        sx={attestationSx}
      />
      <p className="signing-official-request-requirement">
        Signing Officials are required to provide two External Profiles above to assist with validating their identity.
      </p>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <button
          type="button"
          className="button button-white"
          onClick={submitRequest}
          disabled={!hasAttested || isSubmitting}
        >
          Request Signing Official Status
        </button>
        <Link component="button" type="button" onClick={collapse} sx={toggleSx}>
          Cancel
        </Link>
      </Stack>
    </section>
  )
}
