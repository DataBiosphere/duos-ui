import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { AdminManageUsers } from 'src/pages/AdminManageUsers'
import { User } from 'src/libs/ajax/User'
import { DAA } from 'src/libs/ajax/DAA'
import { Notifications, USER_ROLES } from 'src/libs/utils'
import { DAAObject, DuosUser } from 'src/types/model'

vi.mock('src/libs/ajax/User', () => ({
  User: { list: vi.fn() },
}))

vi.mock('src/libs/ajax/DAA', () => ({
  DAA: { getDaas: vi.fn() },
}))

vi.mock('src/libs/utils', async (importActual) => {
  const actual = await importActual<typeof import('src/libs/utils')>()
  return {
    ...actual,
    Notifications: { showError: vi.fn(), showSuccess: vi.fn() },
  }
})

vi.mock('src/components/manage_users_table/ManageUsersTable', () => ({
  ManageUsersTable: ({ userList, isLoading, daaLabelsById }: {
    userList: DuosUser[]
    isLoading: boolean
    daaLabelsById: Map<number, string>
  }) => (
    <div data-testid="manage-users-table" data-loading={isLoading} data-daa-label-count={daaLabelsById.size}>
      {userList.map(u => <span key={u.userId}>{u.displayName}</span>)}
    </div>
  ),
}))

vi.mock('src/components/modals/AddUserModal', () => ({
  AddUserModal: ({ showModal, onOKRequest, onCloseRequest }: {
    showModal: boolean
    onOKRequest: () => void
    onCloseRequest: () => void
  }) => showModal
    ? (
        <div data-testid="add-user-modal">
          <button onClick={onOKRequest}>OK</button>
          <button onClick={onCloseRequest}>Close</button>
        </div>
      )
    : null,
}))

vi.mock('src/components/SearchBar', () => ({
  default: ({ handleSearchChange }: { handleSearchChange: (v: string) => void }) => (
    <input
      aria-label="search"
      onChange={e => handleSearchChange(e.target.value)}
    />
  ),
}))

const makeUser = (overrides: Partial<DuosUser> & { userId: number, displayName: string }): DuosUser => ({
  createDate: new Date(),
  email: `user${overrides.userId}@test.com`,
  emailPreference: false,
  isAdmin: false,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: false,
  isSigningOfficial: false,
  roles: [],
  ...overrides,
})

const testUsers: DuosUser[] = [
  makeUser({ userId: 1, displayName: 'Alice Admin' }),
  makeUser({ userId: 2, displayName: 'Bob Admin' }),
]

describe('AdminManageUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(DAA.getDaas).mockResolvedValue([])
  })

  it('renders the page title and description', async () => {
    vi.mocked(User.list).mockResolvedValue([])
    await act(async () => render(<AdminManageUsers />))
    expect(screen.getByText('Manage Users')).toBeInTheDocument()
    expect(screen.getByText('Select and manage users and their roles')).toBeInTheDocument()
  })

  it('fetches users with the admin role on mount', async () => {
    vi.mocked(User.list).mockResolvedValue([])
    await act(async () => render(<AdminManageUsers />))
    expect(User.list).toHaveBeenCalledWith(USER_ROLES.admin)
  })

  it('passes loaded users to ManageUsersTable', async () => {
    vi.mocked(User.list).mockResolvedValue(testUsers)
    await act(async () => render(<AdminManageUsers />))
    expect(screen.getByText('Alice Admin')).toBeInTheDocument()
    expect(screen.getByText('Bob Admin')).toBeInTheDocument()
  })

  it('builds a daa label lookup map and passes it to ManageUsersTable', async () => {
    vi.mocked(User.list).mockResolvedValue([])
    vi.mocked(DAA.getDaas).mockResolvedValue([
      { daaId: 1, file: { fileName: 'Broad DAA v2.pdf' } } as DAAObject,
      { daaId: 2, file: { fileName: 'MGH DAA.pdf' } } as DAAObject,
    ])
    await act(async () => render(<AdminManageUsers />))
    expect(screen.getByTestId('manage-users-table')).toHaveAttribute('data-daa-label-count', '2')
  })

  it('degrades gracefully when the daa fetch fails, without blocking the user list', async () => {
    vi.mocked(User.list).mockResolvedValue(testUsers)
    vi.mocked(DAA.getDaas).mockRejectedValue(new Error('daa service unavailable'))
    await act(async () => render(<AdminManageUsers />))
    expect(screen.getByText('Alice Admin')).toBeInTheDocument()
    expect(screen.getByTestId('manage-users-table')).toHaveAttribute('data-daa-label-count', '0')
    expect(Notifications.showError).not.toHaveBeenCalled()
  })

  it('shows loading state while fetching', () => {
    vi.mocked(User.list).mockReturnValue(new Promise(() => {}))
    render(<AdminManageUsers />)
    expect(screen.getByTestId('manage-users-table')).toHaveAttribute('data-loading', 'true')
  })

  it('clears loading state after fetch completes', async () => {
    vi.mocked(User.list).mockResolvedValue(testUsers)
    await act(async () => render(<AdminManageUsers />))
    expect(screen.getByTestId('manage-users-table')).toHaveAttribute('data-loading', 'false')
  })

  it('shows an error notification when the fetch fails', async () => {
    vi.mocked(User.list).mockRejectedValue(new Error('network error'))
    await act(async () => render(<AdminManageUsers />))
    expect(Notifications.showError).toHaveBeenCalledWith({
      text: 'Error: Unable to retrieve user data from server',
    })
  })

  it('clears loading state after the fetch fails', async () => {
    vi.mocked(User.list).mockRejectedValue(new Error('network error'))
    await act(async () => render(<AdminManageUsers />))
    expect(screen.getByTestId('manage-users-table')).toHaveAttribute('data-loading', 'false')
  })

  it('opens the add user modal when the Add User button is clicked', async () => {
    vi.mocked(User.list).mockResolvedValue([])
    await act(async () => render(<AdminManageUsers />))
    expect(screen.queryByTestId('add-user-modal')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('ADD USER'))
    expect(screen.getByTestId('add-user-modal')).toBeInTheDocument()
  })

  it('closes the add user modal and refreshes users when OK is clicked', async () => {
    vi.mocked(User.list).mockResolvedValue(testUsers)
    await act(async () => render(<AdminManageUsers />))
    expect(User.list).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByText('ADD USER'))
    expect(screen.getByTestId('add-user-modal')).toBeInTheDocument()

    await act(async () => fireEvent.click(screen.getByText('OK')))
    expect(screen.queryByTestId('add-user-modal')).not.toBeInTheDocument()
    expect(User.list).toHaveBeenCalledTimes(2)
  })

  it('closes the add user modal when Close is clicked', async () => {
    vi.mocked(User.list).mockResolvedValue([])
    await act(async () => render(<AdminManageUsers />))
    fireEvent.click(screen.getByText('ADD USER'))
    expect(screen.getByTestId('add-user-modal')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Close'))
    expect(screen.queryByTestId('add-user-modal')).not.toBeInTheDocument()
  })
})
