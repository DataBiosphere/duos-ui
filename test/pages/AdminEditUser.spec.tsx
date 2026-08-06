import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { AdminEditUser } from 'src/pages/AdminEditUser'
import { User } from 'src/libs/ajax/User'
import { Notifications } from 'src/libs/utils'
import { DuosUser, UserRole } from 'src/types/model'

const mockNavigate = vi.fn()

vi.mock('react-router', async (importActual) => {
  const actual = await importActual<typeof import('react-router')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('src/libs/ajax/User', () => ({
  User: {
    getById: vi.fn(),
    update: vi.fn(),
    addRoleToUser: vi.fn(),
    deleteRoleFromUser: vi.fn(),
  },
}))

vi.mock('src/libs/utils', async (importActual) => {
  const actual = await importActual<typeof import('src/libs/utils')>()
  return {
    ...actual,
    Notifications: { showError: vi.fn(), showSuccess: vi.fn() },
  }
})

vi.mock('src/components/ResearcherReview', () => ({
  ResearcherReview: ({ user }: { user: DuosUser }) =>
    React.createElement('div', { 'data-testid': 'researcher-review', 'data-user-id': String(user.userId) }),
}))

vi.mock('src/components/PageHeading', () => ({
  PageHeading: ({ title, description }: { title: string, description: string }) =>
    React.createElement('div', null,
      React.createElement('h1', null, title),
      React.createElement('p', null, description)),
}))

vi.mock('src/pages/user_profile/ExternalProfile', () => ({
  default: ({ userId }: { userId?: number }) =>
    React.createElement('div', { 'data-testid': 'external-profile', 'data-user-id': String(userId) }),
}))

vi.mock('src/images/icon_edit_user.png', () => ({ default: 'icon_edit_user.png' }))

const makeRole = (roleId: number, name: UserRole['name']): UserRole => ({
  roleId,
  name,
  userId: 42,
  userRoleId: roleId * 100,
})

const mockUser: DuosUser = {
  userId: 42,
  displayName: 'Test User',
  email: 'test@example.com',
  emailPreference: true,
  createDate: new Date('2024-01-01'),
  isAdmin: false,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: true,
  isSigningOfficial: false,
  roles: [makeRole(5, 'Researcher')],
  institution: { id: 1, name: 'Broad Institute', createUser: {} as DuosUser, createUserId: 1, createDate: '2024-01-01', signingOfficials: [] },
}

const renderWithRoute = (userId = '42') =>
  render(
    <MemoryRouter initialEntries={[`/admin/edit_user/${userId}`]}>
      <Routes>
        <Route path="/admin/edit_user/:userId" element={<AdminEditUser />} />
      </Routes>
    </MemoryRouter>,
  )

describe('AdminEditUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(User.update).mockResolvedValue(undefined as never)
    vi.mocked(User.addRoleToUser).mockResolvedValue(mockUser)
    vi.mocked(User.deleteRoleFromUser).mockResolvedValue(mockUser)
  })

  it('renders the Edit User heading', async () => {
    vi.mocked(User.getById).mockResolvedValue(mockUser)
    await act(async () => renderWithRoute())
    expect(screen.getByText('Edit User')).toBeInTheDocument()
  })

  it('populates the name field with the fetched user display name', async () => {
    vi.mocked(User.getById).mockResolvedValue(mockUser)
    await act(async () => renderWithRoute())
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
  })

  it('populates the email field with the fetched user email', async () => {
    vi.mocked(User.getById).mockResolvedValue(mockUser)
    await act(async () => renderWithRoute())
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
  })

  it('populates the institution field from the fetched user', async () => {
    vi.mocked(User.getById).mockResolvedValue(mockUser)
    await act(async () => renderWithRoute())
    expect(screen.getByDisplayValue('Broad Institute')).toBeInTheDocument()
  })

  it('shows ResearcherReview and ExternalProfile after user is loaded', async () => {
    vi.mocked(User.getById).mockResolvedValue(mockUser)
    await act(async () => renderWithRoute())
    expect(screen.getByTestId('researcher-review')).toBeInTheDocument()
    expect(screen.getByTestId('external-profile')).toBeInTheDocument()
  })

  it('does not show ResearcherReview before user is loaded', () => {
    vi.mocked(User.getById).mockReturnValue(new Promise(() => {}))
    renderWithRoute()
    expect(screen.queryByTestId('researcher-review')).not.toBeInTheDocument()
  })

  it('shows an error notification when fetch fails', async () => {
    vi.mocked(User.getById).mockRejectedValue(new Error('network error'))
    await act(async () => renderWithRoute())
    expect(Notifications.showError).toHaveBeenCalledWith({
      text: 'Error: Unable to retrieve current user from server',
    })
  })

  it('renders the Researcher role checkbox as always checked and read-only', async () => {
    vi.mocked(User.getById).mockResolvedValue(mockUser)
    await act(async () => renderWithRoute())
    const researcherCheckbox = screen.getByRole('checkbox', { name: 'Roles Researcher' })
    expect(researcherCheckbox).toBeChecked()
    expect(researcherCheckbox).toHaveAttribute('readonly')
  })

  it('Back button navigates to admin_manage_users', async () => {
    vi.mocked(User.getById).mockResolvedValue(mockUser)
    await act(async () => renderWithRoute())
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    })
    expect(mockNavigate).toHaveBeenCalledWith('/admin_manage_users')
  })

  it('Save button is disabled when displayName is empty', async () => {
    vi.mocked(User.getById).mockResolvedValue({ ...mockUser, displayName: '' })
    await act(async () => renderWithRoute())
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('calls User.update and navigates on successful save', async () => {
    vi.mocked(User.getById).mockResolvedValue(mockUser)
    await act(async () => renderWithRoute())
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    })
    await waitFor(() => expect(User.update).toHaveBeenCalledTimes(1))
    expect(mockNavigate).toHaveBeenCalledWith('/admin_manage_users')
  })

  it('shows an error notification when save fails', async () => {
    vi.mocked(User.getById).mockResolvedValue(mockUser)
    vi.mocked(User.update).mockRejectedValue(new Error('save failed'))
    await act(async () => renderWithRoute())
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    })
    await waitFor(() => expect(Notifications.showError).toHaveBeenCalled())
  })

  it('toggles the Admin role checkbox', async () => {
    vi.mocked(User.getById).mockResolvedValue(mockUser)
    await act(async () => renderWithRoute())
    const adminCheckbox = screen.getByRole('checkbox', { name: 'Admin' })
    expect(adminCheckbox).not.toBeChecked()
    await act(async () => {
      fireEvent.click(adminCheckbox)
    })
    expect(screen.getByRole('checkbox', { name: 'Admin' })).toBeChecked()
  })

  it('shows the email preference checkbox only when user has Admin role', async () => {
    vi.mocked(User.getById).mockResolvedValue({ ...mockUser, roles: [makeRole(4, 'Admin'), makeRole(5, 'Researcher')] })
    await act(async () => renderWithRoute())
    expect(screen.getByRole('checkbox', { name: 'Disable Admin email notifications' })).toBeInTheDocument()
  })

  it('does not show email preference checkbox when user lacks Admin role', async () => {
    vi.mocked(User.getById).mockResolvedValue(mockUser)
    await act(async () => renderWithRoute())
    expect(screen.queryByRole('checkbox', { name: 'Disable Admin email notifications' })).not.toBeInTheDocument()
  })
})
