import React, { useEffect, useState } from 'react'
import { FormField, FormFieldTypes } from 'src/components/forms/forms'
import { Notification } from 'src/components/Notification'
import TableHeaderSection from 'src/components/TableHeaderSection'
import { User } from 'src/libs/ajax/User'
import { Storage } from 'src/libs/storage'
import { Banner, NotificationService } from 'src/libs/notificationService'
import { Notifications, setUserRoleStatuses } from 'src/libs/utils'
import AffiliationAndRoles from './AffiliationAndRoles'
import ResearcherStatus from './ResearcherStatus'
import AcceptedAcknowledgements from './AcceptedAcknowledgements'
import ExternalProfile from './ExternalProfile'
import { usePageTitle } from 'src/hooks/usePageTitle'
import { DuosUser } from 'src/types/model'

export default function UserProfile() {
  usePageTitle('User Profile')
  const [user, setUser] = useState<Partial<DuosUser>>({})
  const [name, setName] = useState<string>('')
  const [updatedName, setUpdatedName] = useState<string>('')

  const [notificationData, setNotificationData] = useState<Banner | null | undefined>(null)

  const updateRef = ({ value }: { key: string, value: string, isValid: boolean }) => {
    setName(value)
    setUpdatedName(value)
  }

  const updateName = () => {
    if (updatedName) {
      const payload = {
        displayName: updatedName,
      }

      User.updateSelf(payload).then((response) => {
        if (response) {
          setUserRoleStatuses(response, Storage)
        }
        Notifications.showSuccess({ text: 'Name updated successfully!' })
      }, () => {
        Notifications.showError({ text: 'Some errors occurred, the user\'s name was not updated.' })
      })
    }
    else {
      Notifications.showInformation({ text: 'There are no changes to save.' })
    }
  }

  const updateEmailPreference = (value: boolean) => {
    const payload = {
      emailPreference: value,
    }

    User.updateSelf(payload).then((response) => {
      if (response) {
        setUserRoleStatuses(response, Storage)
      }
      Notifications.showSuccess({ text: 'Email preference updated successfully!' })
    }, () => {
      Notifications.showError({ text: 'Some errors occurred, the user\'s email preference was not updated.' })
    })
  }

  useEffect(() => {
    const init = async () => {
      try {
        const user = Storage.getCurrentUser()
        setUser(user)
        setName(user.displayName)
        setNotificationData(await NotificationService.getBannerObjectById('eRACommonsOutage'))
      }
      catch {
        Notifications.showError({ text: 'Error: Unable to retrieve user data from server' })
      }
    }

    init()
  }, [])

  return (
    <div
      style={{
        flexDirection: 'column',
        padding: '50px 275px 70px',
      }}
    >
      <div className="header">
        <Notification>
          {notificationData}
        </Notification>
        <div style={{ marginLeft: '-2em' }}>
          <TableHeaderSection title="Your Profile" />
        </div>
      </div>
      <h1
        style={{
          color: '#01549F',
          fontSize: '20px',
          fontWeight: '600',
          marginBottom: '15px',
          marginTop: '40px',
          borderBottom: '1px solid #ddd',
          paddingBottom: '8px',
        }}
      >
        Full Name
      </h1>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <FormField
          type={FormFieldTypes.TEXT}
          id="profileName"
          title="Full Name"
          hideTitle={true}
          defaultValue={name}
          onChange={updateRef}
          style={{ width: '90%', marginTop: '10px',
          }}
        />
        <button
          className="f-right btn-primary common-background"
          onClick={updateName}
          style={{
            marginTop: '10px',
          }}
        >
          Save
        </button>
      </div>
      <div style={{ marginTop: '10px' }} />
      <FormField
        type={FormFieldTypes.TEXT}
        id="profileEmail"
        title="Email Address"
        hideTitle={true}
        defaultValue={user.email}
        disabled={true}
      />
      <div style={{ marginTop: '10px' }} />
      <p
        style={{
          color: '#000',
          fontSize: '16px',
          fontWeight: '400',
        }}
      >
        Send me email notifications
      </p>
      <FormField
        type={FormFieldTypes.YESNORADIOGROUP}
        id="profileEmailEnabled"
        title="Send me email notifications"
        hideTitle={true}
        defaultValue={user.emailPreference}
        onChange={(field: { key: string, value: boolean, isValid: boolean }) => updateEmailPreference(field.value)}
      />
      <div style={{ marginTop: '45px' }} />
      <ExternalProfile
        readonly={false}
      />
      <div style={{ marginTop: '45px' }} />
      <AffiliationAndRoles
        user={user as DuosUser}
      />
      <div style={{ marginTop: '115px' }} />
      <ResearcherStatus
        user={user as DuosUser}
      />
      <div style={{ marginTop: '60px' }} />
      <AcceptedAcknowledgements />
    </div>
  )
}
