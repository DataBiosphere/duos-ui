import '@testing-library/jest-dom/vitest'
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { page } from 'vitest/browser'
import CollectionSubmitVoteBox from 'src/components/collection_vote_box/CollectionSubmitVoteBox'
import { Vote } from 'src/types/model'

vi.mock('src/libs/ajax/Votes', () => ({ Votes: { updateVotesByIds: vi.fn(), updateRationaleByIds: vi.fn() } }))
vi.mock('src/libs/utils', () => ({ Notifications: { showSuccess: vi.fn(), showError: vi.fn() } }))

const openVotes = [{ voteId: 1, electionStatus: 'Open' }] as Vote[]

const renderVoteBox = () =>
  render(
    <CollectionSubmitVoteBox
      votes={openVotes}
      isFinal={false}
      isLoading={false}
      isDisabled={false}
      adminPage={false}
      bucketKey="bucket"
      updateFinalVote={vi.fn()}
    />,
  )

const voteButtonsDirection = () => {
  const voteButtons = document.querySelector('.vote-buttons') as HTMLElement
  expect(voteButtons).not.toBeNull()
  return window.getComputedStyle(voteButtons).flexDirection
}

describe('CollectionSubmitVoteBox - responsive vote buttons (browser)', () => {
  it('stacks the vote buttons on narrow viewports', async () => {
    await page.viewport(900, 800)
    renderVoteBox()

    expect(await screen.findByText(/^Yes/)).toBeInTheDocument()
    // The media query has to beat the base rule with no !important, so .vote-buttons must not
    // carry an inline style: inline styles win over any stylesheet regardless of specificity.
    expect(document.querySelector('.vote-buttons')).not.toHaveAttribute('style')
    expect(voteButtonsDirection()).toBe('column')

    // `gap` rather than `column-gap`: the latter separates columns, so it leaves stacked
    // buttons flush against each other, and neither button style supplies a margin.
    const [yesButton, noButton] = Array.from(document.querySelectorAll('.vote-buttons button'))
    const verticalGap = noButton.getBoundingClientRect().top - yesButton.getBoundingClientRect().bottom
    expect(verticalGap).toBeGreaterThan(0)
  })

  it('lays the vote buttons out in a row on wide viewports', async () => {
    await page.viewport(1400, 800)
    renderVoteBox()

    expect(await screen.findByText(/^Yes/)).toBeInTheDocument()
    expect(voteButtonsDirection()).toBe('row')
  })
})
