import React, { useEffect, useState } from 'react'
import { FormControlLabel, Switch } from '@mui/material'
import { FormField, FormFieldTypes } from 'src/components/forms/forms'
import { Notification } from 'src/components/Notification'
import { User } from 'src/libs/ajax/User'
import { Storage } from 'src/libs/storage'
import { Banner, NotificationService } from 'src/libs/notificationService'
import { Notifications, setUserRoleStatuses } from 'src/libs/utils'
import AffiliationAndRoles from './AffiliationAndRoles'
import ResearcherStatus from './ResearcherStatus'
import AcceptedAcknowledgements from './AcceptedAcknowledgements'
import ExternalProfile from './ExternalProfile'
import { usePageTitle } from 'src/hooks/usePageTitle'
import { Theme } from 'src/libs/theme'
import { DuosUser } from 'src/types/model'
import PageHeading from 'src/components/PageHeading'
import './UserProfile.css'

const emailToggleSx = {
  '& .MuiSwitch-switchBase.Mui-checked': { color: Theme.palette.success },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: Theme.palette.success },
}

// The app roots rem at 10px, so MUI's rem-based label default renders far smaller than the page text.
const emailToggleLabelSx = {
  'margin': 0,
  'gap': '8px',
  '& .MuiFormControlLabel-label': { font: 'inherit' },
}

export default function UserProfile() {
  usePageTitle('User Profile')
  const [user, setUser] = useState<Partial<DuosUser>>({})
  const [name, setName] = useState<string>('')
  const [updatedName, setUpdatedName] = useState<string>('')
  const [emailPreference, setEmailPreference] = useState<boolean>(false)
  const [savingEmailPreference, setSavingEmailPreference] = useState<boolean>(false)

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

  const updateEmailPreference = async (value: boolean) => {
    const payload = {
      emailPreference: value,
    }
    const lastConfirmed = emailPreference

    setEmailPreference(value)
    setSavingEmailPreference(true)
    try {
      const response = await User.updateSelf(payload)
      if (response) {
        setUserRoleStatuses(response, Storage)
      }
      Notifications.showSuccess({ text: 'Email preference updated successfully!' })
    }
    catch {
      setEmailPreference(lastConfirmed)
      Notifications.showError({ text: 'Some errors occurred, the user\'s email preference was not updated.' })
    }
    finally {
      setSavingEmailPreference(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      try {
        const user = await User.getMe()
        setUserRoleStatuses(user, Storage)
        setUser(user)
        setName(user.displayName)
        setEmailPreference(Boolean(user.emailPreference))
        setNotificationData(await NotificationService.getBannerObjectById('eRACommonsOutage'))
      }
      catch {
        Notifications.showError({ text: 'Error: Unable to retrieve user data from server' })
      }
    }

    init()
  }, [])

  return (
    <main className="user-profile-page">
      <Notification notificationData={notificationData} />
      <PageHeading
        id="researcherProfile"
        color="common"
        title="Your Profile"
        description="Review and update the information DUOS holds about you"
        iconSize="none"
      />
      <section className="user-profile-section user-profile-card">
        <h1 className="user-profile-section-heading">Full Name</h1>
        <div className="user-profile-name-row">
          <FormField
            type={FormFieldTypes.TEXT}
            id="profileName"
            title="Full Name"
            hideTitle={true}
            defaultValue={name}
            onChange={updateRef}
          />
          <button
            type="button"
            className="btn-primary common-background profile-save-button"
            onClick={updateName}
          >
            Save
          </button>
        </div>
        <div className="user-profile-field user-profile-input">
          <FormField
            type={FormFieldTypes.TEXT}
            id="profileEmail"
            title="Email Address"
            hideTitle={true}
            defaultValue={user.email}
            disabled={true}
          />
        </div>
        <div className="user-profile-field">
          <FormControlLabel
            sx={emailToggleLabelSx}
            label="Send me email notifications"
            control={(
              <Switch
                id="profileEmailEnabled"
                size="small"
                sx={emailToggleSx}
                checked={emailPreference}
                disabled={savingEmailPreference}
                onChange={event => updateEmailPreference(event.target.checked)}
              />
            )}
          />
        </div>
      </section>
      <section className="user-profile-section user-profile-card">
        <ExternalProfile
          readonly={false}
        />
      </section>
      <section className="user-profile-section user-profile-card">
        <AffiliationAndRoles
          user={user as DuosUser}
        />
      </section>
      <section className="user-profile-section user-profile-card">
        <ResearcherStatus
          user={user as DuosUser}
        />
      </section>
      <section className="user-profile-section user-profile-card">
        <AcceptedAcknowledgements />
      </section>
    </main>
  )
}
