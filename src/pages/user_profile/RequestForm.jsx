import React, { useState } from 'react'
import { Support } from 'src/libs/ajax/Support'
import { Notifications } from 'src/libs/utils'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import { Link, useNavigate } from 'react-router-dom'
import { Storage } from 'src/libs/storage'
import { User } from 'src/libs/ajax/User'

export default function RequestForm() {
  const navigate = useNavigate()
  const headerStyle = {
    fontWeight: 'bold',
    color: '#333F52',
    fontSize: '16px',
    marginTop: '1.5rem',
    marginBottom: '1rem',
  }

  const possibleSupportRequests = [
    {
      key: 'checkRegisterDataset',
      label: 'Register a dataset',
    },
    {
      key: 'checkSOPermissions',
      label: `I am a Signing Official with authority to engage my institution in contracts, and need to issue permissions to my institution's users`,
    },
    {
      key: 'checkJoinDac',
      label: 'I am looking to join a DAC',
    },
  ]
  const hasSupportRequestsCond = false
  const supportRequestsCond = {
    checkRegisterDataset: false,
    checkRequestDataAccess: false,
    checkSOPermissions: false,
    checkJoinDac: false,
    extraRequest: undefined,
  }

  const [hasSupportRequests, setHasSupportRequests] = useState(hasSupportRequestsCond)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [supportRequests, setSupportRequests] = useState(supportRequestsCond)
  const [showExternalProfileUrls, setShowExternalProfileUrls] = useState(false)
  const [userProfile, setUserProfile] = useState(Storage.getCurrentUser())

  const externalProfileUrlsConfig = [
    { id: 'linkedInProfileUrl', placeholder: 'LinkedIn Profile URL' },
    { id: 'orcIdProfileUrl', placeholder: 'ORCID Profile URL' },
    { id: 'throughBioProfileUrl', placeholder: 'Through.Bio Profile URL' },
    { id: 'institutionalProfileUrl', placeholder: 'Institutional Profile URL' },
  ]

  const handleSupportRequestsChange = ({ key, value }) => {
    const newSupportRequests = { ...supportRequests, [key]: value }
    setSupportRequests(newSupportRequests)
    const hasAnyRequests = possibleSupportRequests.some(request => newSupportRequests[request.key])
    setHasSupportRequests(hasAnyRequests)
    setShowExternalProfileUrls(key === 'checkSOPermissions' && value) // When Requesting SO Permissions
  }

  const handleExternalProfileChange = ({ key, value }) => {
    setUserProfile({
      ...userProfile,
      userData: {
        ...userProfile.userData,
        [key]: value,
      },
    })
  }

  const submitForm = async () => {
    await sendSupportRequests()
  }

  const processSupportRequests
    = () => {
      const filteredRequests = possibleSupportRequests.filter(request => supportRequests[request.key])
      return [
        filteredRequests.length > 0,
        filteredRequests
          .map(x => `- ${x.label}`)
          .join('\n'),
      ]
    }

  const sendSupportRequests
    = async () => {
      const [hasSupportRequests, requestText] = processSupportRequests()

      // if there are no supportRequests, don't create a new support ticket
      if (!hasSupportRequests) {
        return
      }
      const user = Storage.getCurrentUser()
      const profile = {
        profileName: user.displayName,
        email: user.email,
        emailPreference: user.emailPreference,
        id: user.userId,
      }
      const ticketInfo = {
        attachmentToken: [],
        type: 'task',
        subject: `DUOS: User Request for ${profile.profileName}`,
        description: `User (${profile.id}, ${profile.email}) has selected the following options:\n`
          + requestText
          + (supportRequests.extraRequest ? `\n- ${supportRequests.extraRequest}` : ''),
      }

      const ticket = Support.createTicket(
        profile.profileName,
        ticketInfo.type,
        profile.email,
        ticketInfo.subject,
        ticketInfo.description,
        ticketInfo.attachmentToken,
        'User Profile Page',
      )
      try {
        setIsSubmitting(true)

        const hasAtLeastOneExternalProfileUrl = () => {
          return externalProfileUrlsConfig.some(({ id }) => {
            const value = userProfile?.userData?.[id]
            return value && value.trim() !== ''
          })
        }

        // Show error notification if user is requesting SO permissions but has not provided at least one external profile URL
        if (showExternalProfileUrls && !hasAtLeastOneExternalProfileUrl()) {
          Notifications.showError({
            text: 'Please provide at least one external profile URL to request Signing Official permissions',
            layout: 'topRight',
          })
          setIsSubmitting(false)
          return
        }

        // Update Profile/LocalStorage with external Profile URLs if the user is requesting SO permissions
        if (showExternalProfileUrls && hasAtLeastOneExternalProfileUrl()) {
          await User.updateSelf({ userData: userProfile?.userData })
          Storage.setCurrentUser(userProfile)
        }

        await Support.createSupportRequest(ticket)
        Notifications.showSuccess(
          { text: 'Sent Requests Successfully', layout: 'topRight', timeout: 1500 },
        )
        setIsSubmitting(false)
        navigate('/profile')
      }
      catch (error) {
        Notifications.showError({
          text: `ERROR ${error.status} : Unable To Send Requests`,
          layout: 'topRight',
        })
        setIsSubmitting(false)
      }
    }

  return (
    <div
      style={{ padding: '25px 270px 120px 270px' }}
      data-cy="supportRequestForm"
    >
      <p
        style={{
          color: '#01549F',
          fontFamily: 'Montserrat',
          fontSize: '20px',
          fontWeight: '600',
          marginTop: 10,
        }}
      >
        Request a New Role
      </p>
      <div
        style={{
          backgroundColor: '#F2F2F2',
          padding: 25,
          marginTop: 40,
        }}
      >
        <h2
          id="lbl_supportRequests"
          style={{ ...headerStyle, marginTop: 0 }}
        >
          Which of the following are you looking to do?*
        </h2>
        {possibleSupportRequests.map((supportRequest) => {
          return (
            <FormField
              toggleText={supportRequest.label}
              defaultValue={supportRequest?.isDefaultOption}
              disabled={supportRequest?.isDefaultOption}
              type={FormFieldTypes.CHECKBOX}
              key={supportRequest.key}
              id={supportRequest.key}
              onChange={handleSupportRequestsChange}
            />
          )
        })}
        {showExternalProfileUrls && (
          <>
            {externalProfileUrlsConfig.map(({ id, placeholder }) => (
              <FormField
                style={{ marginTop: '15px' }}
                type={FormFieldTypes.TEXT}
                id={id}
                placeholder={placeholder}
                defaultValue={userProfile?.userData?.[id] || ''}
                onChange={handleExternalProfileChange}
                validators={[FormValidators.URL]}
                key={id}
              />
            ),
            )}
          </>
        )}
        <div style={{ margin: '15px 0 10px' }}>
          Is there anything else you would like to request?
        </div>
        <FormField
          type={FormFieldTypes.TEXTAREA}
          id="extraRequest"
          placeholder="Enter your request"
          maxLength="512"
          rows="3"
          onChange={handleSupportRequestsChange}
        />
      </div>
      <Link to="/profile">
        <button
          type="button"
          id="btn_save"
          className="f-left btn-primary btn-back"
          style={{ marginTop: '50px' }}
          data-cy="backButton"
        >
          Back
        </button>
      </Link>
      <button
        type="button"
        id="btn_save"
        onClick={submitForm}
        className="f-right btn-primary common-background"
        style={{
          marginTop: '50px',
        }}
        disabled={!hasSupportRequests || isSubmitting}
        data-cy="submitButton"
      >
        Submit
      </button>
    </div>
  )
}
