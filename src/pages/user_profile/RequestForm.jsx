import React, { useState } from 'react'
import { Support } from 'src/libs/ajax/Support'
import { Notifications } from 'src/libs/utils'
import { FormField, FormFieldTypes } from 'src/components/forms/forms'
import { Link, useNavigate } from 'react-router-dom'
import { Storage } from 'src/libs/storage'

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
      label: `I am a Signing Official with authority to engage my instituion in contracts, and need to issue permissions to my institution's users`,
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

  const handleSupportRequestsChange = ({ key, value }) => {
    const newSupportRequests = Object.assign({}, supportRequests, { [key]: value })
    setSupportRequests(newSupportRequests)
    const hasAnyRequests = possibleSupportRequests.some(request => newSupportRequests[request.key])
    setHasSupportRequests(hasAnyRequests)
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
      style={{ padding: '25px 270px 0px 270px' }}
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
