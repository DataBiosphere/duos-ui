import React from 'react'
import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataUseVoteStatusBadges } from 'src/components/dar_collection_table/DataUseVoteStatusBadges'
import { Vote } from 'src/types/model'

const makeVote = (overrides: Partial<Vote> = {}): Vote => ({
  voteId: 1,
  userId: 1,
  createDate: 0,
  electionId: 1,
  displayName: 'Member',
  type: 'DAC',
  ...overrides,
} as Vote)

describe('DataUseVoteStatusBadges', () => {
  it('renders an approve pill with the correct count and no label suffix', () => {
    const memberVotes = [
      makeVote({ userId: 1, displayName: 'Alice', vote: true }),
      makeVote({ userId: 2, displayName: 'Bob', vote: true }),
    ]
    const { container } = render(<DataUseVoteStatusBadges memberVotes={memberVotes} />)
    const approveChip = container.querySelector('.MuiChip-colorSuccess')
    expect(approveChip).toHaveTextContent('2')
    expect(container.querySelector('.MuiChip-colorError')).toBeNull()
    expect(container.querySelectorAll('.MuiChip-root')).toHaveLength(1)
  })

  it('renders approve, deny, and pending pills together with correct counts', () => {
    const memberVotes = [
      makeVote({ userId: 1, displayName: 'Alice', vote: true }),
      makeVote({ userId: 2, displayName: 'Bob', vote: false }),
      makeVote({ userId: 3, displayName: 'Carol', vote: undefined }),
    ]
    const { container } = render(<DataUseVoteStatusBadges memberVotes={memberVotes} />)
    expect(container.querySelector('.MuiChip-colorSuccess')).toHaveTextContent('1')
    expect(container.querySelector('.MuiChip-colorError')).toHaveTextContent('1')
    const pendingChip = Array.from(container.querySelectorAll('.MuiChip-root'))
      .find(chip => !chip.classList.contains('MuiChip-colorSuccess') && !chip.classList.contains('MuiChip-colorError'))
    expect(pendingChip).toHaveTextContent('1')
  })

  it('omits a pill entirely when its category has zero members', () => {
    const memberVotes = [makeVote({ userId: 1, displayName: 'Alice', vote: true })]
    const { container } = render(<DataUseVoteStatusBadges memberVotes={memberVotes} />)
    expect(container.querySelectorAll('.MuiChip-root')).toHaveLength(1)
    expect(container.querySelector('.MuiChip-colorSuccess')).toHaveTextContent('1')
  })

  it.each([
    ['MuiChip-colorSuccess', 'Approve: Alice, Bob'],
    ['MuiChip-colorError', 'Deny: Carol'],
    ['MuiChip-colorDefault', 'Pending: Dan'],
  ])('shows the %s members names on hover', async (chipClass, expected) => {
    const user = userEvent.setup()
    const memberVotes = [
      makeVote({ userId: 1, displayName: 'Alice', vote: true }),
      makeVote({ userId: 2, displayName: 'Bob', vote: true }),
      makeVote({ userId: 3, displayName: 'Carol', vote: false }),
      makeVote({ userId: 4, displayName: 'Dan', vote: undefined }),
    ]
    const { container } = render(<DataUseVoteStatusBadges memberVotes={memberVotes} />)

    await user.hover(container.querySelector(`.${chipClass}`)!)

    expect(await screen.findByRole('tooltip')).toHaveTextContent(expected)
  })

  it('renders nothing when there are no member votes', () => {
    const { container } = render(<DataUseVoteStatusBadges memberVotes={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
