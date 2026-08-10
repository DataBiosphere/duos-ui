import React from 'react'
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Modal from 'react-modal'
import SigningOfficialTable from 'src/pages/signing_official_console/SigningOfficialTable'
import { LibraryCard as LibraryCardApi } from 'src/libs/ajax/LibraryCard'
import { User } from 'src/libs/ajax/User'
import { Notifications } from 'src/libs/utils'
import { DuosUser, DuosUserWithInstitutionId, LibraryCard, UserRole } from 'src/types/model'

vi.mock('src/libs/ajax/LibraryCard', () => ({
  LibraryCard: {
    createLibraryCard: vi.fn(),
    deleteLibraryCard: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/User', () => ({
  User: {
    addRoleToUser: vi.fn(),
    deleteRoleFromUser: vi.fn(),
  },
}))

const role = (overrides: Partial<UserRole> = {}): UserRole => ({
  roleId: 2,
  name: 'Researcher',
  userId: 1,
  userRoleId: 1,
  ...overrides,
})

const user = (overrides: Partial<DuosUser> = {}): DuosUser => ({
  createDate: new Date('2022-01-01T00:00:00.000Z'),
  displayName: 'Researcher',
  email: 'researcher@example.com',
  emailPreference: true,
  institutionId: 1,
  isAdmin: false,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: true,
  isSigningOfficial: false,
  roles: [role()],
  userId: 1,
  ...overrides,
})

const libraryCard = (overrides: Partial<LibraryCard> = {}): LibraryCard => ({
  id: 100,
  userId: 1,
  userEmail: 'researcher@example.com',
  userName: 'Researcher',
  createDate: new Date('2022-01-01T00:00:00.000Z'),
  createUserId: 1,
  ...overrides,
})

const libraryCardError = (message: string): Error => {
  return Object.assign(new Error(message), {
    response: {
      data: {
        message,
      },
    },
  })
}

const mockSigningOfficial = user({
  displayName: 'Test Signing Official',
  email: 'so@example.com',
  isResearcher: false,
  isSigningOfficial: true,
  userId: 10,
}) as DuosUserWithInstitutionId

const mockResearcher1 = user({
  userId: 1,
  email: 'existing.researcher1@test.com',
  displayName: 'Existing Researcher 1',
  libraryCard: undefined,
})

const mockResearcher2 = user({
  userId: 2,
  email: 'existing.researcher2@test.com',
  displayName: 'Existing Researcher 2',
  libraryCard: undefined,
})

const mockResearcher3 = user({
  userId: 3,
  email: 'researcher.with.card@test.com',
  displayName: 'Researcher With Card',
  libraryCard: libraryCard({
    id: 101,
    userId: 3,
    userEmail: 'researcher.with.card@test.com',
    userName: 'Researcher With Card',
  }),
})

const renderTable = () => render(
  <SigningOfficialTable
    researchers={[mockResearcher1, mockResearcher2, mockResearcher3]}
    signingOfficial={mockSigningOfficial}
    isLoading={false}
  />,
)

const rowFor = async (name: string): Promise<HTMLElement> => {
  const cell = await screen.findByText(name)
  const row = cell.closest('[role="row"]')
  expect(row).not.toBeNull()
  return row as HTMLElement
}

describe('SigningOfficialTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ text: vi.fn().mockResolvedValue('Data Provider Agreement') }))
    let appRoot = document.getElementById('root')
    if (!appRoot) {
      appRoot = document.createElement('div')
      appRoot.setAttribute('id', 'root')
      document.body.appendChild(appRoot)
    }
    Modal.setAppElement(appRoot)
    vi.spyOn(Notifications, 'showError').mockImplementation(() => undefined)
    vi.spyOn(Notifications, 'showSuccess').mockImplementation(() => undefined)
    vi.spyOn(Notifications, 'showWarning').mockImplementation(() => undefined)
  })

  it('shows Inactive status and unchecked toggle for researcher without a library card', async () => {
    renderTable()

    const row = await rowFor(mockResearcher1.displayName)
    expect(within(row).getAllByText('Inactive')).toHaveLength(2)
    expect(within(row).getByRole('switch', { name: 'Access Status' })).not.toBeChecked()
  })

  it('shows Active status and checked toggle for researcher with a library card', async () => {
    renderTable()

    const row = await rowFor(mockResearcher3.displayName)
    expect(within(row).getByText('Active')).toBeInTheDocument()
    expect(within(row).getByRole('switch', { name: 'Access Status' })).toBeChecked()
  })

  it('shows separate Access Status and Submitter Status notices', async () => {
    renderTable()

    expect(await screen.findAllByText('Access Status', { selector: 'b' })).toHaveLength(2)
    expect(screen.getByText('Submitter Status', { selector: 'b' })).toBeTruthy()
  })

  it('displays an error message when activating a researcher fails', async () => {
    vi.mocked(LibraryCardApi.createLibraryCard).mockRejectedValue(
      libraryCardError(`Failed to issue library card for ${mockResearcher1.email}`),
    )

    renderTable()

    const row = await rowFor(mockResearcher1.displayName)
    fireEvent.click(within(row).getByRole('switch', { name: 'Access Status' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm' }))

    await waitFor(() => {
      expect(Notifications.showError).toHaveBeenCalledWith({ text: 'Error issuing library card.' })
    })

    const updatedRow = await rowFor(mockResearcher1.displayName)
    expect(within(updatedRow).getAllByText('Inactive')).toHaveLength(2)
    expect(within(updatedRow).getByRole('switch', { name: 'Access Status' })).not.toBeChecked()
  })

  it('displays a success message when activating a researcher succeeds', async () => {
    const newCard = libraryCard({
      id: 102,
      userId: mockResearcher1.userId,
      userEmail: mockResearcher1.email,
      userName: mockResearcher1.displayName,
    })
    vi.mocked(LibraryCardApi.createLibraryCard).mockResolvedValue(newCard)

    renderTable()

    const row = await rowFor(mockResearcher1.displayName)
    fireEvent.click(within(row).getByRole('switch', { name: 'Access Status' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm' }))

    await waitFor(() => {
      expect(Notifications.showSuccess).toHaveBeenCalledWith({ text: 'Issued 1 library card' })
    })

    const updatedRow = await rowFor(mockResearcher1.displayName)
    expect(within(updatedRow).getByText('Active')).toBeInTheDocument()
    expect(within(updatedRow).getByRole('switch', { name: 'Access Status' })).toBeChecked()
  })

  it('displays a success message when deactivating a researcher succeeds', async () => {
    vi.mocked(LibraryCardApi.deleteLibraryCard).mockResolvedValue(libraryCard({ userId: mockResearcher3.userId }))

    renderTable()

    const row = await rowFor(mockResearcher3.displayName)
    fireEvent.click(within(row).getByRole('switch', { name: 'Access Status' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm' }))

    await waitFor(() => {
      expect(Notifications.showSuccess).toHaveBeenCalledWith({
        text: `Removed library card issued to ${mockResearcher3.displayName}`,
      })
    })

    const updatedRow = await rowFor(mockResearcher3.displayName)
    expect(within(updatedRow).getAllByText('Inactive')).toHaveLength(2)
    expect(within(updatedRow).getByRole('switch', { name: 'Access Status' })).not.toBeChecked()
  })

  it('displays an error message when deactivating a researcher fails', async () => {
    vi.mocked(LibraryCardApi.deleteLibraryCard).mockRejectedValue(
      libraryCardError(`Failed to delete library card for ${mockResearcher3.email}`),
    )

    renderTable()

    const row = await rowFor(mockResearcher3.displayName)
    fireEvent.click(within(row).getByRole('switch', { name: 'Access Status' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm' }))

    await waitFor(() => {
      expect(Notifications.showError).toHaveBeenCalledWith({
        text: expect.stringContaining(`Error deleting library card issued to ${mockResearcher3.displayName}`),
      })
    })

    const updatedRow = await rowFor(mockResearcher3.displayName)
    expect(within(updatedRow).getByText('Active')).toBeInTheDocument()
    expect(within(updatedRow).getByRole('switch', { name: 'Access Status' })).toBeChecked()
  })

  it('does not change researcher status when confirmation is cancelled', async () => {
    renderTable()

    const row = await rowFor(mockResearcher1.displayName)
    fireEvent.click(within(row).getByRole('switch', { name: 'Access Status' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))

    expect(LibraryCardApi.createLibraryCard).not.toHaveBeenCalled()

    const updatedRow = await rowFor(mockResearcher1.displayName)
    expect(within(updatedRow).getAllByText('Inactive')).toHaveLength(2)
    expect(within(updatedRow).getByRole('switch', { name: 'Access Status' })).not.toBeChecked()
  })

  it('issues and removes Data Submitter status from the table', async () => {
    const updatedSubmitter = user({ ...mockResearcher1, isDataSubmitter: true, roles: [role(), role({ roleId: 8, name: 'DataSubmitter' })] })
    vi.mocked(User.addRoleToUser).mockResolvedValue(updatedSubmitter)
    vi.mocked(User.deleteRoleFromUser).mockResolvedValue(mockResearcher1)

    renderTable()

    let row = await rowFor(mockResearcher1.displayName)
    fireEvent.click(within(row).getByRole('switch', { name: 'Submitter Status' }))
    expect(await screen.findByText('Issue Data Submitter')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    await waitFor(() => expect(User.addRoleToUser).toHaveBeenCalledWith(mockResearcher1.userId, 8))

    row = await rowFor(mockResearcher1.displayName)
    expect(within(row).getByRole('switch', { name: 'Submitter Status' })).toBeChecked()
    fireEvent.click(within(row).getByRole('switch', { name: 'Submitter Status' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm' }))
    await waitFor(() => expect(User.deleteRoleFromUser).toHaveBeenCalledWith(mockResearcher1.userId, 8))
  })
})
