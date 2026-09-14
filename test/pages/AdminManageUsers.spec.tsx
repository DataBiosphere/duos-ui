import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AdminManageUsers } from 'src/pages/AdminManageUsers'
import { User } from 'src/libs/ajax/User'
import { DAC } from 'src/libs/ajax/DAC'
import { DAA } from 'src/libs/ajax/DAA'
import { Notifications, USER_ROLES } from 'src/libs/utils'
import { DAAObject, DacObject, DuosUser } from 'src/types/model'

vi.mock('src/libs/ajax/User', () => ({
  User: { list: vi.fn() },
}))

// The page loads users, DACs and DAAs together, so an unmocked call would reach the network
// and fail the set.
vi.mock('src/libs/ajax/DAC', () => ({
  DAC: { list: vi.fn() },
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
  ManageUsersTable: ({ userList, dacList, isLoading, daaLabelsById }: {
    userList: DuosUser[]
    dacList: DacObject[]
    isLoading: boolean
    daaLabelsById: Map<number, string>
  }) => (
    <div data-testid="manage-users-table" data-loading={isLoading} data-daa-label-count={daaLabelsById.size}>
      {userList.map(u => <span key={u.userId}>{u.displayName}</span>)}
      {dacList.map(dac => <span key={dac.dacId}>{dac.name}</span>)}
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

const testDacs: DacObject[] = [{ dacId: 1, name: 'Cancer DAC' }]

// The mount fetch has to settle before a test asserts, or its state update lands after the test.
const renderPage = async (): Promise<void> => {
  render(<AdminManageUsers />)
  await waitFor(() => expect(screen.getByTestId('manage-users-table')).toHaveAttribute('data-loading', 'false'))
}

describe('AdminManageUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Every test loads the page, and only the DAC and DAA tests care what comes back.
    vi.mocked(DAC.list).mockResolvedValue([])
    vi.mocked(DAA.getDaas).mockResolvedValue([])
  })

  it('renders the page title and description', async () => {
    vi.mocked(User.list).mockResolvedValue([])
    await renderPage()
    expect(screen.getByText('Manage Users')).toBeInTheDocument()
    expect(screen.getByText('Select and manage users and their roles')).toBeInTheDocument()
  })

  it('fetches users with the admin role on mount', async () => {
    vi.mocked(User.list).mockResolvedValue([])
    await renderPage()
    expect(User.list).toHaveBeenCalledWith(USER_ROLES.admin)
  })

  it('passes loaded users to ManageUsersTable', async () => {
    vi.mocked(User.list).mockResolvedValue(testUsers)
    await renderPage()
    expect(screen.getByText('Alice Admin')).toBeInTheDocument()
    expect(screen.getByText('Bob Admin')).toBeInTheDocument()
  })

  it('fetches the DAC list on mount, for the table to name a user\'s DACs', async () => {
    vi.mocked(User.list).mockResolvedValue([])
    vi.mocked(DAC.list).mockResolvedValue(testDacs)
    await renderPage()
    expect(screen.getByText('Cancer DAC')).toBeInTheDocument()
    expect(DAC.list).toHaveBeenCalledWith(false)
  })

  it('shows an error notification when the DAC fetch fails', async () => {
    vi.mocked(User.list).mockResolvedValue(testUsers)
    vi.mocked(DAC.list).mockRejectedValue(new Error('network error'))
    render(<AdminManageUsers />)
    await waitFor(() => expect(Notifications.showError).toHaveBeenCalledWith({
      text: 'Error: Unable to retrieve user data from server',
    }))
  })

  it('builds a daa label lookup map and passes it to ManageUsersTable', async () => {
    vi.mocked(User.list).mockResolvedValue([])
    vi.mocked(DAA.getDaas).mockResolvedValue([
      { daaId: 1, file: { fileName: 'Broad DAA v2.pdf' } } as DAAObject,
      { daaId: 2, file: { fileName: 'MGH DAA.pdf' } } as DAAObject,
    ])
    await renderPage()
    expect(screen.getByTestId('manage-users-table')).toHaveAttribute('data-daa-label-count', '2')
  })

  it('degrades gracefully when the daa fetch fails, without blocking the user list', async () => {
    vi.mocked(User.list).mockResolvedValue(testUsers)
    vi.mocked(DAA.getDaas).mockRejectedValue(new Error('daa service unavailable'))
    await renderPage()
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
    render(<AdminManageUsers />)
    await waitFor(() => expect(screen.getByTestId('manage-users-table')).toHaveAttribute('data-loading', 'false'))
  })

  it('shows an error notification when the fetch fails', async () => {
    vi.mocked(User.list).mockRejectedValue(new Error('network error'))
    render(<AdminManageUsers />)
    await waitFor(() => expect(Notifications.showError).toHaveBeenCalledWith({
      text: 'Error: Unable to retrieve user data from server',
    }))
  })

  it('clears loading state after the fetch fails', async () => {
    vi.mocked(User.list).mockRejectedValue(new Error('network error'))
    render(<AdminManageUsers />)
    await waitFor(() => expect(screen.getByTestId('manage-users-table')).toHaveAttribute('data-loading', 'false'))
  })

  it('opens the add user modal when the Add User button is clicked', async () => {
    vi.mocked(User.list).mockResolvedValue([])
    await renderPage()
    expect(screen.queryByTestId('add-user-modal')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('ADD USER'))
    expect(screen.getByTestId('add-user-modal')).toBeInTheDocument()
  })

  it('closes the add user modal and refreshes users when OK is clicked', async () => {
    vi.mocked(User.list).mockResolvedValue(testUsers)
    await renderPage()
    expect(User.list).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByText('ADD USER'))
    expect(screen.getByTestId('add-user-modal')).toBeInTheDocument()

    fireEvent.click(screen.getByText('OK'))
    await waitFor(() => expect(User.list).toHaveBeenCalledTimes(2))
    expect(screen.queryByTestId('add-user-modal')).not.toBeInTheDocument()
  })

  it('closes the add user modal when Close is clicked', async () => {
    vi.mocked(User.list).mockResolvedValue([])
    await renderPage()
    fireEvent.click(screen.getByText('ADD USER'))
    expect(screen.getByTestId('add-user-modal')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Close'))
    expect(screen.queryByTestId('add-user-modal')).not.toBeInTheDocument()
  })
})
