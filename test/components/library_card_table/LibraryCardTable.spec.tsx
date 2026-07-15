import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import Modal from 'react-modal'
import LibraryCardTable, { LibraryCardTableProps } from 'src/components/library_card_table/LibraryCardTable'
import { LibraryCard as LibraryCardModel } from 'src/types/model'

vi.mock('src/libs/ajax/LibraryCard', () => ({
  LibraryCard: {
    deleteLibraryCard: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('src/libs/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('src/libs/utils')>()
  return {
    ...actual,
    Notifications: {
      showError: vi.fn(),
    },
  }
})

const libraryCardList: LibraryCardModel[] = [
  {
    id: 1,
    userId: 1,
    userName: 'foo foo',
    userEmail: 'test.user.1@test.com',
    createUserId: 2,
    createDate: new Date(),
  },
  {
    id: 2,
    userId: 2,
    userName: 'bar bar',
    userEmail: 'test.user.2@test.com',
    createUserId: 2,
    createDate: new Date(),
  },
  {
    id: 3,
    userId: 3,
    userName: 'baz baz',
    userEmail: 'test.user.3@test.com',
    createUserId: 2,
    createDate: new Date(),
  },
]

describe('Library Card Table Tests', () => {
  beforeAll(() => {
    Modal.setAppElement(document.body)
  })

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render the Library Card Table with a list of users', async () => {
    const props: LibraryCardTableProps = {
      libraryCards: libraryCardList,
    }
    await act(async () => {
      render(<LibraryCardTable {...props} />)
    })
    expect(document.querySelector('[data-cy="manage-library-card-table"]')).not.toBeNull()
    libraryCardList.forEach((card) => {
      expect(screen.getByText(card.userName)).toBeInTheDocument()
      expect(screen.getByText(card.userEmail)).toBeInTheDocument()
    })
  })

  it('should allow deleting a library card', async () => {
    const props: LibraryCardTableProps = {
      libraryCards: libraryCardList,
    }

    await act(async () => {
      render(<LibraryCardTable {...props} />)
    })

    expect(screen.getByText(libraryCardList[0].userName)).toBeInTheDocument()

    await act(async () => {
      const deleteButton = document.querySelector('[id="show-delete-modal-1"]') as HTMLElement
      fireEvent.click(deleteButton)
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Confirm'))
    })

    // Verify that the card is removed from the table
    expect(screen.queryByText(libraryCardList[0].userName)).not.toBeInTheDocument()

    // Verify that the remaining cards are still present
    libraryCardList.slice(1).forEach((card) => {
      expect(screen.getByText(card.userName)).toBeInTheDocument()
      expect(screen.getByText(card.userEmail)).toBeInTheDocument()
    })
  })

  it('should allow searching for a library card by email', async () => {
    const props: LibraryCardTableProps = {
      libraryCards: libraryCardList,
    }

    await act(async () => {
      render(<LibraryCardTable {...props} />)
    })

    await act(async () => {
      fireEvent.change(screen.getByRole('textbox', { name: /search/i }), {
        target: { value: libraryCardList[0].userEmail },
      })
      // Advance past the 300ms debounce delay in SearchBar
      vi.advanceTimersByTime(300)
    })

    // Verify that only the matching card is displayed
    expect(screen.getByText(libraryCardList[0].userName)).toBeInTheDocument()

    // Remaining cards should not be displayed
    libraryCardList.slice(1).forEach((card) => {
      expect(screen.queryByText(card.userName)).not.toBeInTheDocument()
      expect(screen.queryByText(card.userEmail)).not.toBeInTheDocument()
    })
  })

  it('should allow searching for a library card by user name', async () => {
    const props: LibraryCardTableProps = {
      libraryCards: libraryCardList,
    }

    await act(async () => {
      render(<LibraryCardTable {...props} />)
    })

    await act(async () => {
      fireEvent.change(screen.getByRole('textbox', { name: /search/i }), {
        target: { value: libraryCardList[0].userName },
      })
      // Advance past the 300ms debounce delay in SearchBar
      vi.advanceTimersByTime(300)
    })

    // Verify that only the matching card is displayed
    expect(screen.getByText(libraryCardList[0].userName)).toBeInTheDocument()

    // Remaining cards should not be displayed
    libraryCardList.slice(1).forEach((card) => {
      expect(screen.queryByText(card.userName)).not.toBeInTheDocument()
      expect(screen.queryByText(card.userEmail)).not.toBeInTheDocument()
    })
  })

  it('shows a loading state until the library cards prop is provided', async () => {
    let view!: ReturnType<typeof render>
    await act(async () => {
      view = render(<LibraryCardTable />)
    })

    expect(document.querySelector('.table-loading-placeholder')).toBeInTheDocument()
    expect(screen.queryByText('foo foo')).not.toBeInTheDocument()

    await act(async () => {
      view.rerender(<LibraryCardTable libraryCards={libraryCardList} />)
    })

    expect(document.querySelector('.table-loading-placeholder')).not.toBeInTheDocument()
    expect(screen.getByText('foo foo')).toBeInTheDocument()
  })

  it('updates the displayed cards when the libraryCards prop changes', async () => {
    let view!: ReturnType<typeof render>
    await act(async () => {
      view = render(<LibraryCardTable libraryCards={[libraryCardList[0]]} />)
    })

    expect(screen.getByText('foo foo')).toBeInTheDocument()
    expect(screen.queryByText('bar bar')).not.toBeInTheDocument()

    await act(async () => {
      view.rerender(<LibraryCardTable libraryCards={[libraryCardList[1]]} />)
    })

    expect(screen.queryByText('foo foo')).not.toBeInTheDocument()
    expect(screen.getByText('bar bar')).toBeInTheDocument()
  })
})
