import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChairVoteInfo } from 'src/components/collection_voting_slab/ChairVoteInfo'

vi.mock('src/components/common/VotesPieChart', () => ({
  default: () => <div data-testid="votes-pie-chart" />,
}))

const voteBase = { voteId: 1, userId: 1, createDate: '', electionId: 1, displayName: 'A', type: 'DAC' }
const votedYes = { ...voteBase, vote: true }
const votedNo = { ...voteBase, voteId: 2, vote: false }
const notYetVoted = { ...voteBase, voteId: 3, vote: undefined }

describe('ChairVoteInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when isChair is false', () => {
    const { container } = render(
      <ChairVoteInfo dacVotes={[votedYes]} isChair={false} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when no votes have been cast', () => {
    const { container } = render(
      <ChairVoteInfo dacVotes={[notYetVoted]} isChair={true} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when dacVotes is empty', () => {
    const { container } = render(
      <ChairVoteInfo dacVotes={[]} isChair={true} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the vote info when isChair is true and votes have been cast', () => {
    render(<ChairVoteInfo dacVotes={[votedYes]} isChair={true} />)
    expect(document.querySelector('[data-cy="chair-vote-info"]')).toBeInTheDocument()
  })

  it('renders VotesPieChart with dacVotes', () => {
    render(<ChairVoteInfo dacVotes={[votedYes, votedNo]} isChair={true} />)
    expect(screen.getByTestId('votes-pie-chart')).toBeInTheDocument()
  })

  it('shows member label by default', () => {
    render(<ChairVoteInfo dacVotes={[votedYes]} isChair={true} />)
    expect(screen.getByText('My DAC\'s Votes (summary)')).toBeInTheDocument()
  })

  it('shows admin label when adminPage is true', () => {
    render(<ChairVoteInfo dacVotes={[votedYes]} isChair={true} adminPage={true} />)
    expect(screen.getByText('DAC Votes (summary)')).toBeInTheDocument()
  })

  it('renders when only some votes are cast', () => {
    render(<ChairVoteInfo dacVotes={[votedYes, notYetVoted]} isChair={true} />)
    expect(document.querySelector('[data-cy="chair-vote-info"]')).toBeInTheDocument()
  })
})
