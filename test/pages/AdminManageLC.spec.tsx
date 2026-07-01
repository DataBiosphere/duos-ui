import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import AdminManageLC from 'src/pages/AdminManageLC'
import { LibraryCard as LibraryCardAPI } from 'src/libs/ajax/LibraryCard'
import { Notifications } from 'src/libs/utils'
import { LibraryCard } from 'src/types/model'

vi.mock('src/libs/ajax/LibraryCard', () => ({
  LibraryCard: {
    getAllLibraryCards: vi.fn(),
  },
}))

vi.mock('src/libs/utils', async (importActual) => {
  const actual = await importActual<typeof import('src/libs/utils')>()
  return {
    ...actual,
    Notifications: { showError: vi.fn(), showSuccess: vi.fn() },
  }
})

vi.mock('src/hooks/usePageTitle', () => ({
  usePageTitle: vi.fn(),
}))

vi.mock('src/components/library_card_table/LibraryCardTable', () => ({
  default: ({ libraryCards }: { libraryCards: LibraryCard[] }) =>
    React.createElement(
      'div',
      { 'data-testid': 'library-card-table' },
      (libraryCards ?? []).map(c =>
        React.createElement('span', { key: c.id }, c.userEmail),
      ),
    ),
}))

const makeCard = (id: number): LibraryCard => ({
  id,
  userId: id * 10,
  userName: `User ${id}`,
  userEmail: `user${id}@example.com`,
  createDate: new Date('2024-01-01'),
  createUserId: 1,
})

const testCards = [makeCard(1), makeCard(2)]

describe('AdminManageLC', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the LibraryCardTable', async () => {
    vi.mocked(LibraryCardAPI.getAllLibraryCards).mockResolvedValue([])
    await act(async () => render(<AdminManageLC />))
    expect(screen.getByTestId('library-card-table')).toBeInTheDocument()
  })

  it('fetches library cards on mount', async () => {
    vi.mocked(LibraryCardAPI.getAllLibraryCards).mockResolvedValue([])
    await act(async () => render(<AdminManageLC />))
    expect(LibraryCardAPI.getAllLibraryCards).toHaveBeenCalledTimes(1)
  })

  it('passes fetched cards to the table', async () => {
    vi.mocked(LibraryCardAPI.getAllLibraryCards).mockResolvedValue(testCards)
    await act(async () => render(<AdminManageLC />))
    expect(screen.getByText('user1@example.com')).toBeInTheDocument()
    expect(screen.getByText('user2@example.com')).toBeInTheDocument()
  })

  it('shows an error notification when the fetch fails', async () => {
    vi.mocked(LibraryCardAPI.getAllLibraryCards).mockRejectedValue(new Error('network error'))
    await act(async () => render(<AdminManageLC />))
    expect(Notifications.showError).toHaveBeenCalledWith({
      text: 'Error: Failed to get Library Cards',
    })
  })

  it('renders an empty table while loading', () => {
    vi.mocked(LibraryCardAPI.getAllLibraryCards).mockReturnValue(new Promise(() => {}))
    render(<AdminManageLC />)
    expect(screen.getByTestId('library-card-table')).toBeInTheDocument()
    expect(screen.queryByText('user1@example.com')).not.toBeInTheDocument()
  })
})
