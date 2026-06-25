import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen, fireEvent } from '@testing-library/react'
import CollectionVoteNoButton from 'src/components/collection_vote_box/CollectionVoteNoButton'
import { votingColors } from 'src/libs/VotingColors'

describe('CollectionVoteNoButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with No text', async () => {
    await act(async () => {
      render(<CollectionVoteNoButton onClick={vi.fn().mockResolvedValue(undefined)} />)
    })

    expect(screen.getByText('No')).toBeInTheDocument()
  })

  it('renders the CancelOutlined icon', async () => {
    await act(async () => {
      render(<CollectionVoteNoButton onClick={vi.fn().mockResolvedValue(undefined)} />)
    })

    expect(document.querySelector('[data-testid="CancelOutlinedIcon"]')).toBeInTheDocument()
  })

  it('has data-cy="no-collection-vote-button"', async () => {
    await act(async () => {
      render(<CollectionVoteNoButton onClick={vi.fn().mockResolvedValue(undefined)} />)
    })

    expect(document.querySelector('[data-cy="no-collection-vote-button"]')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined)

    await act(async () => {
      render(<CollectionVoteNoButton onClick={mockOnClick} />)
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button'))
    })

    expect(mockOnClick).toHaveBeenCalledOnce()
  })

  it('is disabled when disabled=true', async () => {
    await act(async () => {
      render(<CollectionVoteNoButton onClick={vi.fn()} disabled={true} />)
    })

    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('does not call onClick when disabled', async () => {
    const mockOnClick = vi.fn()

    await act(async () => {
      render(<CollectionVoteNoButton onClick={mockOnClick} disabled={true} />)
    })

    fireEvent.click(screen.getByRole('button'))
    expect(mockOnClick).not.toHaveBeenCalled()
  })

  it('shows red background when isSelected=true', async () => {
    await act(async () => {
      render(<CollectionVoteNoButton onClick={vi.fn().mockResolvedValue(undefined)} isSelected={true} />)
    })

    expect(screen.getByRole('button')).toHaveStyle({ backgroundColor: votingColors.no })
  })

  it('shows white background when isSelected=false', async () => {
    await act(async () => {
      render(<CollectionVoteNoButton onClick={vi.fn().mockResolvedValue(undefined)} isSelected={false} />)
    })

    expect(screen.getByRole('button')).toHaveStyle({ backgroundColor: votingColors.default })
  })

  it('calls onError when onClick throws', async () => {
    const error = new Error('Vote failed')
    const mockOnError = vi.fn()

    await act(async () => {
      render(
        <CollectionVoteNoButton
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
