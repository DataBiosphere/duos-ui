import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { BrowserRouter } from 'react-router'
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
    getMe: vi.fn(),
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
  default: ({ user }: { user: DuosUser }) => (
    <div data-testid="researcher-status">
      {user.libraryCard ? 'Active' : 'Inactive'}
    </div>
  ),
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
  const FormFieldTypes = { TEXT: 'text' }
  const FormField = ({ id, onChange, defaultValue, disabled }: {
    id: string
    onChange?: (field: { key: string, value: string, isValid: boolean }) => void
    defaultValue?: string
    disabled?: boolean
  }) => (
    <input
      id={id}
      type="text"
      defaultValue={defaultValue ?? ''}
      disabled={disabled}
      onChange={e => onChange?.({ key: id, value: e.target.value, isValid: true })}
    />
  )
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
    vi.mocked(User.getMe).mockResolvedValue(mockUser)
    vi.mocked(NotificationService.getBannerObjectById).mockResolvedValue(null)
  })

  it('renders the Your Profile heading', async () => {
    renderUserProfile()

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Your Profile' })).toBeInTheDocument()
    })
  })

  it('displays user name and email loaded from the API on mount', async () => {
    renderUserProfile()

    await waitFor(() => {
      expect(User.getMe).toHaveBeenCalledOnce()
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
    })
  })

  it('shows the current researcher status when cached user data is stale', async () => {
    const currentUser = {
      ...mockUser,
      libraryCard: {
        id: 1,
        userId: mockUser.userId,
        userName: mockUser.displayName,
        userEmail: mockUser.email,
        createDate: new Date(),
        createUserId: 2,
        daaIds: [],
      },
    }
    vi.mocked(User.getMe).mockResolvedValue(currentUser)

    renderUserProfile()

    await waitFor(() => {
      expect(screen.getByTestId('researcher-status')).toHaveTextContent('Active')
      expect(Storage.getCurrentUser).not.toHaveBeenCalled()
    })
  })

  it('clicking Save without editing the name shows an informational notification', async () => {
    renderUserProfile()
    await screen.findByDisplayValue('Test User')

    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(Notifications.showInformation).toHaveBeenCalledWith({
      text: 'There are no changes to save.',
    })
  })

  it('saving an edited name calls User.updateSelf and shows success', async () => {
    vi.mocked(User.updateSelf).mockResolvedValue(mockUser)
    renderUserProfile()
    await screen.findByDisplayValue('Test User')

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

  it('reflects the saved email preference in the notification toggle', async () => {
    vi.mocked(User.getMe).mockResolvedValue({ ...mockUser, emailPreference: true })
    renderUserProfile()

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: 'Send me email notifications' })).toBeChecked()
    })
  })

  it('turning on the email notification toggle calls User.updateSelf and shows success', async () => {
    vi.mocked(User.updateSelf).mockResolvedValue(mockUser)
    renderUserProfile()
    await screen.findByDisplayValue('Test User')

    await userEvent.click(screen.getByRole('switch', { name: 'Send me email notifications' }))

    await waitFor(() => {
      expect(User.updateSelf).toHaveBeenCalledWith({ emailPreference: true })
      expect(Notifications.showSuccess).toHaveBeenCalledWith({
        text: 'Email preference updated successfully!',
      })
    })
  })

  it('disables the email notification toggle while the update is in flight', async () => {
    let resolveUpdate: (user: DuosUser) => void = () => {}
    vi.mocked(User.updateSelf).mockReturnValue(new Promise((resolve) => {
      resolveUpdate = resolve
    }))
    renderUserProfile()
    await screen.findByDisplayValue('Test User')

    const toggle = screen.getByRole('switch', { name: 'Send me email notifications' })
    await userEvent.click(toggle)

    await waitFor(() => expect(toggle).toBeDisabled())

    resolveUpdate(mockUser)

    await waitFor(() => expect(toggle).toBeEnabled())
    expect(User.updateSelf).toHaveBeenCalledOnce()
  })

  it('reverts the email notification toggle when the update fails', async () => {
    vi.mocked(User.updateSelf).mockRejectedValue(new Error('API error'))
    renderUserProfile()
    await screen.findByDisplayValue('Test User')

    const toggle = screen.getByRole('switch', { name: 'Send me email notifications' })
    await userEvent.click(toggle)

    await waitFor(() => {
      expect(Notifications.showError).toHaveBeenCalledWith({
        text: 'Some errors occurred, the user\'s email preference was not updated.',
      })
      expect(toggle).not.toBeChecked()
    })
  })

  it('shows an error notification when initialization fails', async () => {
    vi.mocked(User.getMe).mockRejectedValue(new Error('API error'))

    renderUserProfile()

    await waitFor(() => {
      expect(Notifications.showError).toHaveBeenCalledWith({
        text: 'Error: Unable to retrieve user data from server',
      })
    })
  })
})
