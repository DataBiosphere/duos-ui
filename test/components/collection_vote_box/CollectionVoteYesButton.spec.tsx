import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen, fireEvent } from '@testing-library/react'
import CollectionVoteYesButton from 'src/components/collection_vote_box/CollectionVoteYesButton'
import { votingColors } from 'src/libs/VotingColors'

describe('CollectionVoteYesButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with Yes text', async () => {
    await act(async () => {
      render(<CollectionVoteYesButton onClick={vi.fn().mockResolvedValue(undefined)} />)
    })

    expect(screen.getByText('Yes')).toBeInTheDocument()
  })

  it('renders the CheckCircleOutlined icon', async () => {
    await act(async () => {
      render(<CollectionVoteYesButton onClick={vi.fn().mockResolvedValue(undefined)} />)
    })

    expect(document.querySelector('[data-testid="CheckCircleOutlinedIcon"]')).toBeInTheDocument()
  })

  it('has data-cy="yes-collection-vote-button"', async () => {
    await act(async () => {
      render(<CollectionVoteYesButton onClick={vi.fn().mockResolvedValue(undefined)} />)
    })

    expect(document.querySelector('[data-cy="yes-collection-vote-button"]')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined)

    await act(async () => {
      render(<CollectionVoteYesButton onClick={mockOnClick} />)
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button'))
    })

    expect(mockOnClick).toHaveBeenCalledOnce()
  })

  it('is disabled when disabled=true', async () => {
    await act(async () => {
      render(<CollectionVoteYesButton onClick={vi.fn()} disabled={true} />)
    })

    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('does not call onClick when disabled', async () => {
    const mockOnClick = vi.fn()

    await act(async () => {
      render(<CollectionVoteYesButton onClick={mockOnClick} disabled={true} />)
    })

    fireEvent.click(screen.getByRole('button'))
    expect(mockOnClick).not.toHaveBeenCalled()
  })

  it('shows green background when isSelected=true', async () => {
    await act(async () => {
      render(<CollectionVoteYesButton onClick={vi.fn().mockResolvedValue(undefined)} isSelected={true} />)
    })

    expect(screen.getByRole('button')).toHaveStyle({ backgroundColor: votingColors.yes })
  })

  it('shows white background when isSelected=false', async () => {
    await act(async () => {
      render(<CollectionVoteYesButton onClick={vi.fn().mockResolvedValue(undefined)} isSelected={false} />)
    })

    expect(screen.getByRole('button')).toHaveStyle({ backgroundColor: votingColors.default })
  })

  it('calls onError when onClick throws', async () => {
    const error = new Error('Vote failed')
    const mockOnError = vi.fn()

    await act(async () => {
      render(
        <CollectionVoteYesButton
          onClick={vi.fn().mockRejectedValue(error)}
          onError={mockOnError}
        />,
      )
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button'))
    })

    expect(mockOnError).toHaveBeenCalledWith(error)
  })
})
