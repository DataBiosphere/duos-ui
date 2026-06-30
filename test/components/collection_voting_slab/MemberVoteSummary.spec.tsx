import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemberVoteSummary } from 'src/components/collection_voting_slab/MemberVoteSummary'
import { Vote } from 'src/types/model'

vi.mock('src/components/vote_summary_table/VoteSummaryTable', () => ({
  default: () => <div data-testid="vote-summary-table" />,
}))

vi.mock('src/utils/DarCollectionUtils', () => ({
  collapseVotesByUser: vi.fn(votes => votes),
}))

const voteBase = { userId: 1, createDate: '', electionId: 1, displayName: 'A', type: 'DAC' }
const dacVotes: Vote[] = [
  { ...voteBase, voteId: 1, vote: true },
  { ...voteBase, voteId: 2, vote: false },
]

describe('MemberVoteSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the default title', () => {
    render(<MemberVoteSummary dacVotes={dacVotes} />)
    expect(screen.getByText('DAC Member Votes (detail)')).toBeInTheDocument()
  })

  it('renders a custom title', () => {
    render(<MemberVoteSummary dacVotes={dacVotes} title="Custom Title" />)
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
  })

  it('does not show the vote table when collapsed', () => {
    render(<MemberVoteSummary dacVotes={dacVotes} />)
    expect(screen.queryByTestId('vote-summary-table')).not.toBeInTheDocument()
  })

  it('shows the vote table after clicking the toggle', () => {
    render(<MemberVoteSummary dacVotes={dacVotes} />)
    fireEvent.click(screen.getByRole('button', { name: /DAC Member Votes/i }))
    expect(screen.getByTestId('vote-summary-table')).toBeInTheDocument()
  })

  it('hides the vote table after clicking the toggle twice', () => {
    render(<MemberVoteSummary dacVotes={dacVotes} />)
    const toggle = screen.getByRole('button', { name: /DAC Member Votes/i })
    fireEvent.click(toggle)
    fireEvent.click(toggle)
    expect(screen.queryByTestId('vote-summary-table')).not.toBeInTheDocument()
  })

  it('has aria-expanded=false when collapsed', () => {
    render(<MemberVoteSummary dacVotes={dacVotes} />)
    expect(screen.getByRole('button', { name: /DAC Member Votes/i })).toHaveAttribute('aria-expanded', 'false')
  })

  it('has aria-expanded=true when expanded', () => {
    render(<MemberVoteSummary dacVotes={dacVotes} />)
    const toggle = screen.getByRole('button', { name: /DAC Member Votes/i })
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })

  it('applies sort-icon-down class when collapsed', () => {
    render(<MemberVoteSummary dacVotes={dacVotes} />)
    expect(screen.getByRole('button', { name: /DAC Member Votes/i })).toHaveClass('sort-icon-down')
  })

  it('applies sort-icon-up class when expanded', () => {
    render(<MemberVoteSummary dacVotes={dacVotes} />)
    const toggle = screen.getByRole('button', { name: /DAC Member Votes/i })
    fireEvent.click(toggle)
    expect(toggle).toHaveClass('sort-icon-up')
  })
})
