import React from 'react'
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SigningOfficialTable from 'src/pages/signing_official_console/SigningOfficialTable'
import { LibraryCard as LibraryCardApi } from 'src/libs/ajax/LibraryCard'
import { Notifications } from 'src/libs/utils'
import { DuosUser, DuosUserWithInstitutionId, LibraryCard, UserRole } from 'src/types/model'

vi.mock('src/components/modals/LibraryCardFormModal', () => ({
  default: ({
    showModal,
    createOnClick,
    users,
  }: {
    showModal: boolean
    createOnClick: (cards: LibraryCard[], newUser: DuosUser | false | undefined) => Promise<void>
    users: DuosUser[]
  }) => {
    if (!showModal) {
      return null
    }

    const cards = users.map(user => ({
      id: 0,
      userId: user.userId,
      userEmail: user.email,
      userName: user.displayName,
      createDate: new Date('2022-01-01T00:00:00.000Z'),
      createUserId: 1,
    }))

    return (
      <div data-testid="library-card-form-modal">
        <h2>Add Library Cards</h2>
        <button id="Add-button" type="button" onClick={() => createOnClick([cards[0]], undefined)}>
          Add First
        </button>
        <button id="Add-two-button" type="button" onClick={() => createOnClick(cards.slice(0, 2), undefined)}>
          Add Two
        </button>
      </div>
    )
  },
}))

vi.mock('src/libs/ajax/LibraryCard', () => ({
  LibraryCard: {
    createLibraryCard: vi.fn(),
    deleteLibraryCard: vi.fn(),
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
    vi.spyOn(Notifications, 'showError').mockImplementation(() => undefined)
    vi.spyOn(Notifications, 'showSuccess').mockImplementation(() => undefined)
    vi.spyOn(Notifications, 'showWarning').mockImplementation(() => undefined)
  })

  it('renders the modal when Add Users button is clicked', async () => {
    renderTable()

    fireEvent.click(screen.getByRole('button', { name: 'ADD LIBRARY CARD' }))

    expect(await screen.findByText('Add Library Cards')).toBeInTheDocument()
    expect(screen.getByTestId('library-card-form-modal')).toBeInTheDocument()
  })

  it('displays an error message when issuing a library card fails', async () => {
    vi.mocked(LibraryCardApi.createLibraryCard).mockRejectedValue(
      libraryCardError(`Failed to issue library card for ${mockResearcher1.email}`),
    )

    renderTable()

    fireEvent.click(screen.getByRole('button', { name: 'ADD LIBRARY CARD' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Add First' }))

    expect(await screen.findByText(mockResearcher1.displayName)).toBeInTheDocument()
    await waitFor(() => {
      expect(Notifications.showError).toHaveBeenCalledWith({ text: 'Error issuing library card.' })
    })

    const row = await rowFor(mockResearcher1.displayName)
    expect(within(row).getByRole('button', { name: 'Issue' })).toHaveAttribute('id', `issue-card-${mockResearcher1.email}`)
  })

  it('displays a success message when issuing a library card succeeds', async () => {
    const newCard = libraryCard({
      id: 102,
      userId: mockResearcher1.userId,
      userEmail: mockResearcher1.email,
      userName: mockResearcher1.displayName,
    })
    vi.mocked(LibraryCardApi.createLibraryCard).mockResolvedValue(newCard)

    renderTable()

    fireEvent.click(screen.getByRole('button', { name: 'ADD LIBRARY CARD' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Add First' }))

    await waitFor(() => {
      expect(Notifications.showSuccess).toHaveBeenCalledWith({ text: 'Issued 1 library card' })
    })

    const row = await rowFor(mockResearcher1.displayName)
    expect(within(row).getByRole('button', { name: 'Deactivate' })).toHaveAttribute('id', `deactivate-card-${newCard.id}`)
  })

  it('displays a warning when there are both failures and successes bulk-issuing library cards', async () => {
    const newCard = libraryCard({
      id: 103,
      userId: mockResearcher1.userId,
      userEmail: mockResearcher1.email,
      userName: mockResearcher1.displayName,
    })
    vi.mocked(LibraryCardApi.createLibraryCard).mockImplementation((card: LibraryCard) => {
      if (card.userEmail === mockResearcher1.email) {
        return Promise.resolve(newCard)
      }
      return Promise.reject(libraryCardError(`Failed to issue library card for ${card.userEmail}`))
    })

    renderTable()

    fireEvent.click(screen.getByRole('button', { name: 'ADD LIBRARY CARD' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Add Two' }))

    await waitFor(() => {
      expect(Notifications.showWarning).toHaveBeenCalledWith({
        text: `Issued 1 library card, but encountered errors issuing library cards to ${mockResearcher2.email}`,
      })
    })

    const successRow = await rowFor(mockResearcher1.displayName)
    expect(within(successRow).getByRole('button', { name: 'Deactivate' })).toHaveAttribute('id', `deactivate-card-${newCard.id}`)

    const failedRow = await rowFor(mockResearcher2.displayName)
    expect(within(failedRow).getByRole('button', { name: 'Issue' })).toHaveAttribute('id', `issue-card-${mockResearcher2.email}`)
  })
})
