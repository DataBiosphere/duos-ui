import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import VoteSummaryTable from 'src/components/vote_summary_table/VoteSummaryTable'
import { Email } from 'src/libs/ajax/Email'
import { Notifications } from 'src/libs/utils'

vi.mock('src/libs/ajax/Email', () => ({
  Email: { sendReminderEmail: vi.fn() },
}))

vi.mock('src/libs/utils', async (importActual) => {
  const actual = await importActual<typeof import('src/libs/utils')>()
  return {
    ...actual,
    Notifications: {
      showError: vi.fn(),
      showSuccess: vi.fn(),
    },
  }
})

const dacVotes = [
  {
    displayName: 'John Doe',
    updateDate: 1642032000000,
    vote: false,
    voteId: 1,
  },
]

describe('VoteSummaryTable - Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Renders four columns of data', () => {
    render(<VoteSummaryTable dacVotes={dacVotes} isLoading={false} />)
    expect(document.querySelectorAll('.column-header')).toHaveLength(4)
  })

  it('Renders member decision in the vote column', () => {
    render(<VoteSummaryTable dacVotes={dacVotes} isLoading={false} />)
    expect(screen.getByText('No')).toBeInTheDocument()
  })

  it('Renders filler content for missing rationale', () => {
    render(<VoteSummaryTable dacVotes={dacVotes} isLoading={false} />)
    expect(screen.getAllByText('- -').length).toBeGreaterThan(0)
  })

  it('Renders skeleton table if isLoading is true', () => {
    render(<VoteSummaryTable isLoading={true} />)
    expect(document.querySelector('.table-data')).toBeInTheDocument()
    expect(document.querySelector('.table-loading-placeholder')).toBeInTheDocument()
  })

  it('lets a chair send a reminder and re-derives the sending/sent state', async () => {
    vi.mocked(Email.sendReminderEmail).mockResolvedValue(undefined as never)
    const pendingVotes = [
      { displayName: 'Jane Roe', voteId: 5, vote: undefined, updateDate: 1642032000000 },
    ]
    render(<VoteSummaryTable dacVotes={pendingVotes} isLoading={false} isChair={true} />)

    const button = screen.getByRole('button', { name: /send reminder/i })
    fireEvent.click(button)

    // Reminder state change should re-derive the row into its "sending" state.
    expect(screen.getByText('Sending...')).toBeInTheDocument()
    expect(Email.sendReminderEmail).toHaveBeenCalledWith(5)

    // Once the email resolves, the row re-derives into its "sent" state.
    await waitFor(() => expect(screen.getByText('Sent Reminder')).toBeInTheDocument())
    expect(Notifications.showSuccess).toHaveBeenCalledWith({ text: 'Successfully sent reminder.' })
  })
})
