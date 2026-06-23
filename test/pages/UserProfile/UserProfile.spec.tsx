import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { BrowserRouter } from 'react-router-dom'
import UserProfile from 'src/pages/user_profile/UserProfile'
import { DuosUser } from 'src/types/model'

vi.mock('src/libs/storage', () => ({
  Storage: {
    getCurrentUser: vi.fn(),
    setCurrentUser: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/User', () => ({
  User: {
    updateSelf: vi.fn(),
  },
}))

vi.mock('src/libs/notificationService', () => ({
  NotificationService: {
    getBannerObjectById: vi.fn(),
  },
}))

vi.mock('src/libs/utils', () => ({
  Notifications: {
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showInformation: vi.fn(),
  },
  setUserRoleStatuses: vi.fn(),
}))

vi.mock('src/hooks/usePageTitle', () => ({
  usePageTitle: vi.fn(),
}))

vi.mock('src/pages/user_profile/AffiliationAndRoles', () => ({
  default: () => <div data-testid="affiliation-and-roles" />,
}))

vi.mock('src/pages/user_profile/ResearcherStatus', () => ({
  default: () => <div data-testid="researcher-status" />,
}))

vi.mock('src/pages/user_profile/AcceptedAcknowledgements', () => ({
  default: () => <div data-testid="accepted-acknowledgements" />,
}))

vi.mock('src/pages/user_profile/ExternalProfile', () => ({
  default: () => <div data-testid="external-profile" />,
}))

vi.mock('src/components/Notification', () => ({
  Notification: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('src/components/forms/forms', () => {
  const FormFieldTypes = { TEXT: 'text', YESNORADIOGROUP: 'yesnoradiogroup' }
  const FormField = ({ id, type, onChange, defaultValue, disabled }: {
    id: string
    type: string
    onChange?: (field: { key: string, value: string | boolean, isValid: boolean }) => void
    defaultValue?: string | boolean
    disabled?: boolean
  }) => {
    if (type === FormFieldTypes.YESNORADIOGROUP) {
      return (
        <>
          <label htmlFor={`${id}_yes`}>Yes</label>
          <input
            type="radio"
            id={`${id}_yes`}
            name={id}
            onChange={() => onChange?.({ key: id, value: true, isValid: true })}
          />
          <label htmlFor={`${id}_no`}>No</label>
          <input
            type="radio"
            id={`${id}_no`}
            name={id}
            onChange={() => onChange?.({ key: id, value: false, isValid: true })}
          />
        </>
      )
    }
    return (
      <input
        id={id}
        type="text"
        defaultValue={typeof defaultValue === 'string' ? defaultValue : ''}
        disabled={disabled}
        onChange={e => onChange?.({ key: id, value: e.target.value, isValid: true })}
      />
    )
  }
  return { FormField, FormFieldTypes }
})

import { Storage } from 'src/libs/storage'
import { User } from 'src/libs/ajax/User'
import { NotificationService } from 'src/libs/notificationService'
import { Notifications } from 'src/libs/utils'

const mockUser: DuosUser = {
  userId: 1,
  displayName: 'Test User',
  email: 'test@example.com',
  emailPreference: false,
  createDate: new Date(),
  isAdmin: false,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: true,
  isSigningOfficial: false,
  roles: [],
}

function renderUserProfile() {
  return render(
    <BrowserRouter>
      <UserProfile />
    </BrowserRouter>,
  )
}

describe('UserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Storage.getCurrentUser).mockReturnValue(mockUser)
    vi.mocked(NotificationService.getBannerObjectById).mockResolvedValue(null)
  })

  it('renders the Your Profile heading', async () => {
    renderUserProfile()

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Your Profile' })).toBeInTheDocument()
    })
  })

  it('displays user name and email loaded from Storage on mount', async () => {
    renderUserProfile()

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
    })
  })

  it('clicking Save without editing the name shows an informational notification', async () => {
    renderUserProfile()
    await waitFor(() => screen.getByDisplayValue('Test User'))

    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(Notifications.showInformation).toHaveBeenCalledWith({
      text: 'There are no changes to save.',
    })
  })

  it('saving an edited name calls User.updateSelf and shows success', async () => {
    vi.mocked(User.updateSelf).mockResolvedValue(mockUser)
    renderUserProfile()
    await waitFor(() => screen.getByDisplayValue('Test User'))

    const nameInput = screen.getByDisplayValue('Test User')
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'New Name')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(User.updateSelf).toHaveBeenCalledWith({ displayName: 'New Name' })
      expect(Notifications.showSuccess).toHaveBeenCalledWith({
        text: 'Name updated successfully!',
      })
    })
  })

  it('changing the email preference calls User.updateSelf and shows success', async () => {
    vi.mocked(User.updateSelf).mockResolvedValue(mockUser)
    renderUserProfile()
    await waitFor(() => screen.getByDisplayValue('Test User'))

    await userEvent.click(screen.getByRole('radio', { name: 'Yes' }))

    await waitFor(() => {
      expect(User.updateSelf).toHaveBeenCalledWith({ emailPreference: true })
      expect(Notifications.showSuccess).toHaveBeenCalledWith({
        text: 'Email preference updated successfully!',
      })
    })
  })

  it('shows an error notification when initialization fails', async () => {
    vi.mocked(Storage.getCurrentUser).mockImplementation(() => {
      throw new Error('storage error')
    })

    renderUserProfile()

    await waitFor(() => {
      expect(Notifications.showError).toHaveBeenCalledWith({
        text: 'Error: Unable to retrieve user data from server',
      })
    })
  })
})
