import React, { useState } from 'react'
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

// MemberVoteSummary is a controlled component (expanded/onToggle owned by the parent). This harness
// mirrors how MultiDatasetVoteSlab drives it, so the unit tests can still click-to-toggle.
function ControlledMemberVoteSummary(props: Omit<React.ComponentProps<typeof MemberVoteSummary>, 'expanded' | 'onToggle'>) {
  const [expanded, setExpanded] = useState(false)
  return (
    <MemberVoteSummary
      {...props}
      expanded={expanded}
      onToggle={() => setExpanded(value => !value)}
    />
  )
}

describe('MemberVoteSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the default title', () => {
    render(<ControlledMemberVoteSummary dacVotes={dacVotes} />)
    expect(screen.getByText('DAC Member Votes (detail)')).toBeInTheDocument()
  })

  it('renders a custom title', () => {
    render(<ControlledMemberVoteSummary dacVotes={dacVotes} title="Custom Title" />)
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
  })

  it('does not show the vote table when collapsed', () => {
    render(<ControlledMemberVoteSummary dacVotes={dacVotes} />)
    expect(screen.queryByTestId('vote-summary-table')).not.toBeInTheDocument()
  })

  it('shows the vote table after clicking the toggle', () => {
    render(<ControlledMemberVoteSummary dacVotes={dacVotes} />)
    fireEvent.click(screen.getByRole('button', { name: /DAC Member Votes/i }))
    expect(screen.getByTestId('vote-summary-table')).toBeInTheDocument()
  })

  it('hides the vote table after clicking the toggle twice', () => {
    render(<ControlledMemberVoteSummary dacVotes={dacVotes} />)
    const toggle = screen.getByRole('button', { name: /DAC Member Votes/i })
    fireEvent.click(toggle)
    fireEvent.click(toggle)
    expect(screen.queryByTestId('vote-summary-table')).not.toBeInTheDocument()
  })

  it('has aria-expanded=false when collapsed', () => {
    render(<ControlledMemberVoteSummary dacVotes={dacVotes} />)
    expect(screen.getByRole('button', { name: /DAC Member Votes/i })).toHaveAttribute('aria-expanded', 'false')
  })

  it('has aria-expanded=true when expanded', () => {
    render(<ControlledMemberVoteSummary dacVotes={dacVotes} />)
    const toggle = screen.getByRole('button', { name: /DAC Member Votes/i })
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })

  it('applies sort-icon-down class when collapsed', () => {
    render(<ControlledMemberVoteSummary dacVotes={dacVotes} />)
    expect(screen.getByRole('button', { name: /DAC Member Votes/i })).toHaveClass('sort-icon-down')
  })

  it('applies sort-icon-up class when expanded', () => {
    render(<ControlledMemberVoteSummary dacVotes={dacVotes} />)
    const toggle = screen.getByRole('button', { name: /DAC Member Votes/i })
    fireEvent.click(toggle)
    expect(toggle).toHaveClass('sort-icon-up')
  })

  it('calls onToggle when clicked, without managing its own state', () => {
    const onToggle = vi.fn()
    render(<MemberVoteSummary dacVotes={dacVotes} expanded={false} onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('button', { name: /DAC Member Votes/i }))
    expect(onToggle).toHaveBeenCalledOnce()
    expect(screen.queryByTestId('vote-summary-table')).not.toBeInTheDocument()
  })

  it('does not add its own top margin, so it sits flush against the summary graph above it', () => {
    const { container } = render(<MemberVoteSummary dacVotes={dacVotes} expanded={false} onToggle={vi.fn()} />)
    const box = container.firstElementChild as HTMLElement
    expect(box.style.marginTop).toBe('')
  })

  it('has no background fill and a light grey outline instead', () => {
    const { container } = render(<MemberVoteSummary dacVotes={dacVotes} expanded={false} onToggle={vi.fn()} />)
    const box = container.firstElementChild as HTMLElement
    expect(box.style.backgroundColor).toBe('')
    expect(box.style.borderRadius).toBe('6px')
    expect(box.style.border).toBe('1px solid rgb(208, 208, 208)')
  })
})
