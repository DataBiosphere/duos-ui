import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Notifications } from 'src/libs/utils'
import { votingColors } from 'src/libs/VotingColors'
import { Vote } from 'src/types/model'
import { VOTE_TYPES } from 'src/utils/DarUtils'

vi.mock('src/libs/ajax/Votes', () => ({
  Votes: {
    updateVotesByIds: vi.fn().mockResolvedValue(undefined),
    updateRationaleByIds: vi.fn().mockResolvedValue(undefined),
  },
}))

import CollectionSubmitVoteBox from 'src/components/collection_vote_box/CollectionSubmitVoteBox'

const votesMatch: Vote[] = [
  { vote: true, voteId: 1, rationale: 'test', electionStatus: 'Open' } as Vote,
  { vote: true, voteId: 2, rationale: 'test', electionStatus: 'Open' } as Vote,
  { vote: true, voteId: 3, rationale: 'test', electionStatus: 'Open' } as Vote,
]

const votesMixed: Vote[] = [
  { vote: true, voteId: 1, rationale: 'test1', electionStatus: 'Open' } as Vote,
  { vote: false, voteId: 2, rationale: 'test2', electionStatus: 'Open' } as Vote,
]

const defaultProps = {
  question: 'question',
  isFinal: false,
  isLoading: false,
  isDisabled: false,
  adminPage: false,
  bucketKey: 'collection-submit-vote-box',
  updateFinalVote: vi.fn(),
  reloadFn: vi.fn(),
}

const mountComponent = (customProps = {}) =>
  render(<CollectionSubmitVoteBox {...defaultProps} votes={votesMixed} {...customProps} />)

beforeEach(() => {
  vi.spyOn(Notifications, 'showSuccess').mockImplementation(() => {})
  vi.spyOn(Notifications, 'showError').mockImplementation(() => {})
})

afterEach(() => vi.clearAllMocks())

describe('CollectionSubmitVoteBox - Tests', () => {
  it('renders yes vote button as selected if all vote values are true and voting is not final', () => {
    const { container } = mountComponent({ votes: votesMatch, isFinal: false })
    expect(container.querySelector('[data-cy="vote-subsection-heading"]')).toBeEmptyDOMElement()
    expect(container.querySelector('[data-cy="yes-collection-vote-button"]')).toHaveStyle({ backgroundColor: votingColors.yes })
    expect(container.querySelector('[data-cy="no-collection-vote-button"]')).toHaveStyle({ backgroundColor: votingColors.default })
  })

  it('renders unselected buttons if vote values are different and voting is not final', () => {
    const { container } = mountComponent({ votes: votesMixed, isFinal: false })
    expect(container.querySelector('[data-cy="vote-subsection-heading"]')).toBeEmptyDOMElement()
    expect(container.querySelector('[data-cy="yes-collection-vote-button"]')).toHaveStyle({ backgroundColor: votingColors.default })
    expect(container.querySelector('[data-cy="no-collection-vote-button"]')).toHaveStyle({ backgroundColor: votingColors.default })
  })

  it('renders unselected buttons if vote values are null and voting is not disabled', () => {
    const { container } = mountComponent({ votes: [{ voteId: 4 } as Vote], isFinal: false })
    expect(container.querySelector('[data-cy="collection-vote-box"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="yes-collection-vote-button"]')).toHaveStyle({ backgroundColor: votingColors.default })
    expect(container.querySelector('[data-cy="no-collection-vote-button"]')).toHaveStyle({ backgroundColor: votingColors.default })
  })

  it('renders unselected buttons if list of votes is empty and voting is not disabled', () => {
    const { container } = mountComponent({ votes: [], isFinal: false })
    expect(container.querySelector('[data-cy="collection-vote-box"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="yes-collection-vote-button"]')).toHaveStyle({ backgroundColor: votingColors.default })
    expect(container.querySelector('[data-cy="no-collection-vote-button"]')).toHaveStyle({ backgroundColor: votingColors.default })
  })

  it('renders unselected buttons if list of votes is null and voting is not disabled', () => {
    const { container } = mountComponent({ votes: [], isFinal: false })
    expect(container.querySelector('[data-cy="collection-vote-box"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="yes-collection-vote-button"]')).toHaveStyle({ backgroundColor: votingColors.default })
    expect(container.querySelector('[data-cy="no-collection-vote-button"]')).toHaveStyle({ backgroundColor: votingColors.default })
  })

  it('renders existing rationale if rationale is the same for all votes', () => {
    mountComponent({ votes: votesMatch, isFinal: false })
    expect(screen.getByRole('textbox')).toHaveValue('test')
  })

  it('does not render existing rationale in textarea if rationale different between votes', () => {
    mountComponent({ votes: votesMixed, isFinal: false })
    expect(screen.getByRole('textbox')).toHaveValue('')
  })

  it('can always edit rationale textarea when vote is not final', async () => {
    const user = userEvent.setup()
    const { container } = mountComponent({ votes: votesMatch, isFinal: false })
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveValue('test')

    await user.type(textarea, 'sample text')
    await act(async () => fireEvent.blur(textarea))
    expect(textarea).toHaveValue('testsample text')

    await user.type(textarea, ' hello')
    await act(async () => fireEvent.blur(textarea))
    expect(textarea).toHaveValue('testsample text hello')

    await user.click(container.querySelector('[data-cy="yes-collection-vote-button"]')!)
    await waitFor(() =>
      expect(container.querySelector('[data-cy="yes-collection-vote-button"]')).toHaveStyle({ backgroundColor: votingColors.yes }),
    )

    await user.type(textarea, '{Backspace}{Backspace}')
    await act(async () => fireEvent.blur(textarea))
    expect(textarea).toHaveValue('testsample text hel')
  })

  it('can always edit vote value when vote is not final', async () => {
    const user = userEvent.setup()
    const { container } = mountComponent({ votes: votesMixed, isFinal: false })
    const yesBtn = container.querySelector('[data-cy="yes-collection-vote-button"]')!
    const noBtn = container.querySelector('[data-cy="no-collection-vote-button"]')!

    expect(yesBtn).toHaveStyle({ backgroundColor: votingColors.default })
    expect(noBtn).toHaveStyle({ backgroundColor: votingColors.default })

    await user.click(yesBtn)
    await waitFor(() => expect(yesBtn).toHaveStyle({ backgroundColor: votingColors.yes }))
    expect(noBtn).toHaveStyle({ backgroundColor: votingColors.default })

    await user.click(noBtn)
    await waitFor(() => expect(noBtn).toHaveStyle({ backgroundColor: votingColors.no }))
  })

  it('can edit rationale textarea multiple times before voting when vote is final', async () => {
    const user = userEvent.setup()
    mountComponent({ votes: votesMixed, isFinal: true })
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveValue('')

    await user.type(textarea, 'sample text')
    await act(async () => fireEvent.blur(textarea))
    expect(textarea).toHaveValue('sample text')

    await user.type(textarea, ' test')
    await act(async () => fireEvent.blur(textarea))
    expect(textarea).toHaveValue('sample text test')
  })

  it('can not edit rationale textarea after voting when vote is final', async () => {
    const user = userEvent.setup()
    const { container } = mountComponent({ votes: votesMixed, isFinal: true })
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveValue('')

    await user.type(textarea, 'sample text')
    await act(async () => fireEvent.blur(textarea))
    expect(textarea).toHaveValue('sample text')

    await user.click(container.querySelector('[data-cy="no-collection-vote-button"]')!)
    await waitFor(() => expect(textarea).toBeDisabled())
  })

  it('replaces buttons with vote result text after voting when isFinal is true', async () => {
    const user = userEvent.setup()
    const { container } = mountComponent({ votes: votesMixed, isFinal: true })

    expect(container.querySelector('[data-cy="chair-vote-caveat"]')).toHaveTextContent(
      '(Vote and Rationale cannot be updated after submitting)',
    )
    expect(container.querySelector('[data-cy="yes-collection-vote-button"]')).toHaveStyle({ backgroundColor: votingColors.default })
    expect(container.querySelector('[data-cy="no-collection-vote-button"]')).toHaveStyle({ backgroundColor: votingColors.default })

    await user.click(container.querySelector('[data-cy="no-collection-vote-button"]')!)
    await waitFor(() => expect(container.querySelector('[data-cy="vote-subsection-heading"]')).toHaveTextContent('NO'))
    expect(container.querySelector('[data-cy="yes-collection-vote-button"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-cy="no-collection-vote-button"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-cy="chair-vote-caveat"]')).not.toBeInTheDocument()
  })

  it('renders the vote/rationale caveat in light grey italic text below the vote buttons', () => {
    const { container } = mountComponent({ votes: votesMixed, isFinal: true })
    const caveat = container.querySelector('[data-cy="chair-vote-caveat"]') as HTMLElement
    expect(caveat).toHaveTextContent('(Vote and Rationale cannot be updated after submitting)')
    expect(caveat.style.fontStyle).toBe('italic')
    expect(caveat.style.color).toBe('rgb(138, 138, 138)')
  })

  it('does not render the vote/rationale caveat for non-final (member) vote boxes', () => {
    const { container } = mountComponent({ votes: votesMixed, isFinal: false })
    expect(container.querySelector('[data-cy="chair-vote-caveat"]')).not.toBeInTheDocument()
  })

  it('renders vote result text instead of buttons when vote values match and isFinal is true', () => {
    const { container } = mountComponent({ votes: votesMatch, isFinal: true })
    expect(container.querySelector('[data-cy="vote-subsection-heading"]')).toHaveTextContent('YES')
    expect(container.querySelector('[data-cy="yes-collection-vote-button"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-cy="no-collection-vote-button"]')).not.toBeInTheDocument()
  })

  it('disables vote buttons and text area if page is loading', () => {
    const { container } = mountComponent({ votes: votesMixed, isFinal: false, isLoading: true })
    expect(container.querySelector('[data-cy="yes-collection-vote-button"]')).toHaveStyle({ backgroundColor: votingColors.default })
    expect(container.querySelector('[data-cy="no-collection-vote-button"]')).toHaveStyle({ backgroundColor: votingColors.default })
    expect(container.querySelector('[data-cy="yes-collection-vote-button"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="yes-collection-vote-button"]')).toBeDisabled()
    expect(container.querySelector('[data-cy="no-collection-vote-button"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="no-collection-vote-button"]')).toBeDisabled()
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('replaces buttons with vote result text if isDisabled prop is true', () => {
    const { container } = mountComponent({ votes: votesMixed, isFinal: false, isDisabled: true })
    expect(container.querySelector('[data-cy="vote-subsection-heading"]')).toHaveTextContent('NOT SELECTED')
    expect(screen.getByRole('textbox')).toBeDisabled()
    expect(container.querySelector('[data-cy="yes-collection-vote-button"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-cy="no-collection-vote-button"]')).not.toBeInTheDocument()
  })

  it('disables yes vote button if isApprovalDisabled is true', async () => {
    const user = userEvent.setup()
    const { container } = mountComponent({ votes: votesMixed, isFinal: false, isApprovalDisabled: true })
    const yesBtn = container.querySelector('[data-cy="yes-collection-vote-button"]')!
    const noBtn = container.querySelector('[data-cy="no-collection-vote-button"]')!

    expect(yesBtn).toHaveStyle({ backgroundColor: votingColors.default })
    expect(noBtn).toHaveStyle({ backgroundColor: votingColors.default })
    expect(yesBtn).toBeInTheDocument()
    expect(yesBtn).toBeDisabled()
    expect(noBtn).toBeInTheDocument()
    expect(noBtn).not.toBeDisabled()

    await user.click(yesBtn)
    expect(yesBtn).toBeDisabled()
    expect(noBtn).not.toBeDisabled()
  })

  it('does not disable no vote button if isApprovalDisabled is true', async () => {
    const user = userEvent.setup()
    const { container } = mountComponent({ votes: votesMixed, isFinal: false, isApprovalDisabled: true })
    const yesBtn = container.querySelector('[data-cy="yes-collection-vote-button"]')!
    const noBtn = container.querySelector('[data-cy="no-collection-vote-button"]')!

    expect(yesBtn).toBeDisabled()
    expect(noBtn).not.toBeDisabled()

    await user.click(noBtn)
    await waitFor(() => expect(noBtn).not.toBeDisabled())
    expect(yesBtn).toBeDisabled()
    expect(screen.getByRole('textbox')).not.toBeDisabled()
  })

  it('renders a different heading if user is viewing from the admin page (Dataset)', () => {
    const { container } = mountComponent({ votes: votesMixed, isFinal: true, adminPage: true })
    expect(container.querySelector('[data-cy="vote-subsection-heading"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="vote-subsection-heading"]')).toHaveTextContent('The vote has not been finalized')
    expect(container.querySelector('[data-cy="yes-collection-vote-button"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-cy="no-collection-vote-button"]')).not.toBeInTheDocument()
  })

  it('renders a different heading if user is viewing from the admin page (RP)', () => {
    const { container } = mountComponent({ votes: votesMixed, isFinal: false, adminPage: true })
    expect(container.querySelector('[data-cy="vote-subsection-heading"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="vote-subsection-heading"]')).toHaveTextContent('The vote has not been finalized')
    expect(container.querySelector('[data-cy="yes-collection-vote-button"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-cy="no-collection-vote-button"]')).not.toBeInTheDocument()
  })

  it('shows the final vote and renders the component read-only for admin page', () => {
    const { container } = mountComponent({ votes: votesMatch, isFinal: true, adminPage: true, isApprovalDisabled: true })
    expect(container.querySelector('[data-cy="vote-subsection-heading"]')).toHaveTextContent('The final vote is: YES')
    expect(screen.getByRole('textbox')).toBeDisabled()
    expect(container.querySelector('[data-cy="yes-collection-vote-button"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-cy="no-collection-vote-button"]')).not.toBeInTheDocument()
  })

  it('shows the radar vote icon when the vote type is radar', () => {
    const { container } = mountComponent({
      votes: [{ vote: true, voteId: 1, type: VOTE_TYPES.RADAR_APPROVE, rationale: 'Radar Approve' } as Vote],
      isFinal: true,
      adminPage: true,
      isApprovalDisabled: true,
    })
    expect(container.querySelector('[data-cy="radar-icon"]')).toBeInTheDocument()
  })

  it('renders a blank placeholder on the rationale textarea when voting is disabled and no rationale exists', () => {
    mountComponent({ votes: [{ voteId: 5, rationale: undefined } as Vote], isFinal: false, isDisabled: true })
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveAttribute('placeholder', '')
    expect(textarea).toHaveValue('')
  })

  it('renders existing rationale in the textarea when voting is disabled', () => {
    mountComponent({ votes: votesMatch, isFinal: false, isDisabled: true })
    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeDisabled()
    expect(textarea).toHaveValue('test')
  })

  it('shows disabled Yes/No buttons as member when election is closed', async () => {
    const updateFinalVote = vi.fn()
    const user = userEvent.setup()
    const { container } = mountComponent({
      votes: [{ type: VOTE_TYPES.FINAL, rationale: 'Approved', electionStatus: 'closed' } as Vote],
      isFinal: true,
      isApprovalDisabled: true,
      updateFinalVote,
    })
    const yesBtn = container.querySelector('[data-cy="yes-collection-vote-button"]')!
    const noBtn = container.querySelector('[data-cy="no-collection-vote-button"]')!

    expect(yesBtn).toBeInTheDocument()
    expect(yesBtn).toBeDisabled()
    await user.click(yesBtn)
    expect(updateFinalVote).not.toHaveBeenCalled()

    expect(noBtn).toBeInTheDocument()
    expect(noBtn).toBeDisabled()
    await user.click(noBtn)
    expect(updateFinalVote).not.toHaveBeenCalled()
  })

  it('renders role-labeled vote buttons when roleLabel is provided', () => {
    mountComponent({ votes: votesMixed, isFinal: false, roleLabel: 'Member' })
    expect(screen.getByText('Yes as Member')).toBeInTheDocument()
    expect(screen.getByText('No as Member')).toBeInTheDocument()
  })

  it('renders plain Yes/No vote buttons when roleLabel is not provided', () => {
    mountComponent({ votes: votesMixed, isFinal: false })
    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
  })

  it('renders the Rationale section above the vote buttons', () => {
    const { container } = mountComponent({ votes: votesMixed, isFinal: false })
    const rationaleTitle = screen.getByText('Rationale (optional):')
    const yesButton = container.querySelector('[data-cy="yes-collection-vote-button"]')!
    // DOCUMENT_POSITION_FOLLOWING (4) means yesButton comes after rationaleTitle in the DOM.
    expect(rationaleTitle.compareDocumentPosition(yesButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('re-syncs the vote and rationale when the votes prop changes', () => {
    const { container, rerender } = render(
      <CollectionSubmitVoteBox {...defaultProps} votes={votesMixed} isFinal={false} />,
    )
    // Mixed votes -> nothing selected, empty rationale.
    expect(container.querySelector('[data-cy="yes-collection-vote-button"]')).toHaveStyle({ backgroundColor: votingColors.default })
    expect(screen.getByRole('textbox')).toHaveValue('')

    // All-matching "true" votes with a shared rationale -> re-derive selection + rationale.
    rerender(<CollectionSubmitVoteBox {...defaultProps} votes={votesMatch} isFinal={false} />)
    expect(container.querySelector('[data-cy="yes-collection-vote-button"]')).toHaveStyle({ backgroundColor: votingColors.yes })
    expect(screen.getByRole('textbox')).toHaveValue('test')
  })
})
