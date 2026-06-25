import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import VoteSummaryTable from 'src/components/vote_summary_table/VoteSummaryTable'

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
})
