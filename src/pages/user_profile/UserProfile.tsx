import React, { useEffect, useState } from 'react'
import { Switch } from '@mui/material'
import { FormField, FormFieldTypes } from 'src/components/forms/forms'
import { Notification } from 'src/components/Notification'
import { User } from 'src/libs/ajax/User'
import { Storage } from 'src/libs/storage'
import { Banner, NotificationService } from 'src/libs/notificationService'
import { Notifications, setUserRoleStatuses } from 'src/libs/utils'
import { Theme } from 'src/libs/theme'
import AffiliationAndRoles from './AffiliationAndRoles'
import ResearcherStatus from './ResearcherStatus'
import AcceptedAcknowledgements from './AcceptedAcknowledgements'
import ExternalProfile from './ExternalProfile'
import { usePageTitle } from 'src/hooks/usePageTitle'
import { DuosUser } from 'src/types/model'
import PageHeading from 'src/components/PageHeading'
import './UserProfile.css'

const emailToggleSx = {
  '& .MuiSwitch-switchBase.Mui-checked': { color: Theme.palette.success },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: Theme.palette.success },
}

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
        const user = await User.getMe()
        setUserRoleStatuses(user, Storage)
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
    <main className="user-profile-page">
      <div className="header">
        <Notification notificationData={notificationData} />
        <PageHeading
          id="researcherProfile"
          color="common"
          title="Your Profile"
          iconSize="none"
          description={(
            <>
              DUOS user profile components are based off of the GA4GH Passports specification Visa types. More information on the GA4GH Passports standard can be found{' '}
              <a href="https://github.com/ga4gh-duri/ga4gh-duri.github.io/blob/master/researcher_ids/ga4gh_passport_v1.md">
                here.
              </a>
            </>
          )}
        />
      </div>
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
            style={{ width: '400px' }}
          />
          <button
            type="button"
            className="btn-primary common-background profile-save-button"
            onClick={updateName}
          >
            Save
          </button>
        </div>
        <div className="user-profile-field">
          <FormField
            type={FormFieldTypes.TEXT}
            id="profileEmail"
            title="Email Address"
            hideTitle={true}
            defaultValue={user.email}
            disabled={true}
            style={{ width: '400px' }}
          />
        </div>
        <div className="user-profile-field user-profile-email-toggle">
          <span>Send me email notifications</span>
          <Switch
            checked={!!user.emailPreference}
            onChange={(_event, checked) => updateEmailPreference(checked)}
            slotProps={{ input: { 'aria-label': 'Send me email notifications' } }}
            size="small"
            sx={emailToggleSx}
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
