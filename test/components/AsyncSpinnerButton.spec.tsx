import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen, fireEvent } from '@testing-library/react'
import { AsyncSpinnerButton } from 'src/components/AsyncSpinnerButton'

describe('AsyncSpinnerButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the button with default styling', async () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined)

    await act(async () => {
      render(
        <AsyncSpinnerButton onClick={mockOnClick}>
          Test Button
        </AsyncSpinnerButton>,
      )
    })

    const button = screen.getByRole('button', { name: 'Test Button' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('Test Button')
    expect(button).toHaveAttribute('aria-label', 'Test Button')
    expect(button).not.toBeDisabled()
  })

  it('takes its accessible name from element children instead of labelling them "Button"', async () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined)
    await act(async () => {
      render(
        <AsyncSpinnerButton onClick={mockOnClick}>
          <span>
            <svg aria-hidden="true" />
            Yes as Chair
          </span>
        </AsyncSpinnerButton>,
      )
    })

    expect(screen.getByRole('button', { name: 'Yes as Chair' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Button' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Yes as Chair' })).not.toHaveAttribute('aria-label')
  })

  it('still honours an explicit aria-label over element children', async () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined)
    await act(async () => {
      render(
        <AsyncSpinnerButton onClick={mockOnClick} aria-label="Clear account link">
          <span className="glyphicon glyphicon-remove-circle" />
        </AsyncSpinnerButton>,
      )
    })

    expect(screen.getByRole('button', { name: 'Clear account link' })).toBeInTheDocument()
  })

  it('applies custom style and className', async () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined)
    const customStyle = { backgroundColor: 'red', color: 'white' }

    await act(async () => {
      render(
        <AsyncSpinnerButton
          onClick={mockOnClick}
          style={customStyle}
          className="custom-button-class"
        >
          Styled Button
        </AsyncSpinnerButton>,
      )
    })

    const button = screen.getByRole('button', { name: 'Styled Button' })
    expect(button).toHaveClass('custom-button-class')
    // jsdom normalises colour names to rgb in computed styles
    expect(button).toHaveStyle({ color: 'rgb(255, 255, 255)', backgroundColor: 'rgb(255, 0, 0)' })
  })

  it('accepts custom data-cy and aria-label attributes', async () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined)

    await act(async () => {
      render(
        <AsyncSpinnerButton
          onClick={mockOnClick}
          data-cy="custom-test-id"
          aria-label="Custom accessible label"
        >
          Custom Button
        </AsyncSpinnerButton>,
      )
    })

    const button = screen.getByRole('button', { name: 'Custom accessible label' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-label', 'Custom accessible label')
  })

  it('shows spinner and becomes disabled during async operation', async () => {
    let resolvePromise: () => void
    const asyncAction = new Promise<void>((resolve) => {
      resolvePromise = resolve
    })
    const mockOnClick = vi.fn().mockReturnValue(asyncAction)

    await act(async () => {
      render(
        <AsyncSpinnerButton onClick={mockOnClick}>
          Loading Button
        </AsyncSpinnerButton>,
      )
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Loading Button' }))
    })

    // Should be disabled and aria-busy during loading
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')

    // Text should not be visible during loading
    expect(button).not.toHaveTextContent('Loading Button')

    // Resolve the promise
    await act(async () => {
      resolvePromise!()
    })
  })

  it('disappears after successful action completion', async () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined)

    await act(async () => {
      render(
        <AsyncSpinnerButton onClick={mockOnClick}>
          Success Button
        </AsyncSpinnerButton>,
      )
    })

    const button = screen.getByRole('button', { name: 'Success Button' })
    expect(button).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(button)
    })

    // Button should disappear after successful completion
    expect(screen.queryByRole('button', { name: 'Success Button' })).not.toBeInTheDocument()
  })

  it('becomes clickable again after action failure', async () => {
    const error = new Error('Test error')
    let shouldReject = true
    const mockOnClick = vi.fn().mockImplementation(() => {
      if (shouldReject) {
        return Promise.reject(error)
      }
      return Promise.resolve()
    })

    await act(async () => {
      render(
        <AsyncSpinnerButton onClick={mockOnClick}>
          Error Button
        </AsyncSpinnerButton>,
      )
    })

    // First click should fail
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Error Button' }))
    })

    // Should become clickable again after error
    const button = screen.getByRole('button', { name: 'Error Button' })
    expect(button).not.toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'false')
    expect(button).toHaveTextContent('Error Button')

    // Next click will succeed
    shouldReject = false

    await act(async () => {
      fireEvent.click(button)
    })

    // Should disappear on successful retry
    expect(screen.queryByRole('button', { name: 'Error Button' })).not.toBeInTheDocument()
  })

  it('respects disabled prop', async () => {
    const mockOnClick = vi.fn()

    await act(async () => {
      render(
        <AsyncSpinnerButton onClick={mockOnClick} disabled={true}>
          Disabled Button
        </AsyncSpinnerButton>,
      )
    })

    const button = screen.getByRole('button', { name: 'Disabled Button' })
    expect(button).toBeDisabled()

    // Click the disabled button
    fireEvent.click(button)

    expect(mockOnClick).not.toHaveBeenCalled()
  })

  it('prevents multiple clicks during loading state', async () => {
    let resolvePromise: () => void
    const asyncAction = new Promise<void>((resolve) => {
      resolvePromise = resolve
    })
    const mockOnClick = vi.fn().mockReturnValue(asyncAction)

    await act(async () => {
      render(
        <AsyncSpinnerButton onClick={mockOnClick}>
          Multi Click Button
        </AsyncSpinnerButton>,
      )
    })

    // First click starts the action
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Multi Click Button' }))
    })

    // Multiple additional clicks (button is disabled, so they should not trigger)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    fireEvent.click(button)
    fireEvent.click(button)

    expect(mockOnClick).toHaveBeenCalledOnce()

    await act(async () => {
      resolvePromise!()
    })
  })

  it('handles accessibility attributes correctly', async () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined)

    await act(async () => {
      render(
        <AsyncSpinnerButton
          onClick={mockOnClick}
          id="accessible-button"
          aria-label="Accessible action button"
        >
          Accessible Button
        </AsyncSpinnerButton>,
      )
    })

    const button = screen.getByRole('button', { name: 'Accessible action button' })
    expect(button).toHaveAttribute('type', 'button')
    expect(button).toHaveAttribute('aria-label', 'Accessible action button')
    expect(button).toHaveAttribute('aria-busy', 'false')
  })

  it('calls onError callback when action fails', async () => {
    const error = new Error('Test callback error')
    const mockOnClick = vi.fn().mockRejectedValue(error)
    const mockOnError = vi.fn()

    await act(async () => {
      render(
        <AsyncSpinnerButton onClick={mockOnClick} onError={mockOnError}>
          Error Callback Button
        </AsyncSpinnerButton>,
      )
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Error Callback Button' }))
    })

    expect(mockOnError).toHaveBeenCalledOnce()
    expect(mockOnError).toHaveBeenCalledWith(error)
  })

  it('does not call onError callback when action succeeds', async () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined)
    const mockOnError = vi.fn()

    await act(async () => {
      render(
        <AsyncSpinnerButton onClick={mockOnClick} onError={mockOnError}>
          Success Callback Button
        </AsyncSpinnerButton>,
      )
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Success Callback Button' }))
    })

    expect(mockOnError).not.toHaveBeenCalled()
  })

  it('hides button after successful action when hideOnSuccess is true', async () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined)

    await act(async () => {
      render(
        <AsyncSpinnerButton onClick={mockOnClick} hideOnSuccess={true}>
          Hide True Button
        </AsyncSpinnerButton>,
      )
    })

    const button = screen.getByRole('button', { name: 'Hide True Button' })
    expect(button).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(button)
    })

    expect(screen.queryByRole('button', { name: 'Hide True Button' })).not.toBeInTheDocument()
  })

  it('keeps button visible after successful action when hideOnSuccess is false', async () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined)

    await act(async () => {
      render(
        <AsyncSpinnerButton onClick={mockOnClick} hideOnSuccess={false}>
          Stay Visible Button
        </AsyncSpinnerButton>,
      )
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Stay Visible Button' }))
    })

    const button = screen.getByRole('button', { name: 'Stay Visible Button' })
    expect(button).toBeInTheDocument()
    expect(button).not.toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'false')
    expect(button).toHaveTextContent('Stay Visible Button')
  })

  it('allows multiple clicks when hideOnSuccess is false', async () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined)

    await act(async () => {
      render(
        <AsyncSpinnerButton onClick={mockOnClick} hideOnSuccess={false}>
          Multi Use Button
        </AsyncSpinnerButton>,
      )
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Multi Use Button' }))
    })

    const button = screen.getByRole('button', { name: 'Multi Use Button' })
    expect(button).toBeInTheDocument()
    expect(button).not.toBeDisabled()

    await act(async () => {
      fireEvent.click(button)
    })

    expect(mockOnClick).toHaveBeenCalledTimes(2)
  })

  it('shows loading state correctly when hideOnSuccess is false', async () => {
    let resolvePromise: () => void
    const asyncAction = new Promise<void>((resolve) => {
      resolvePromise = resolve
    })
    const mockOnClick = vi.fn().mockReturnValue(asyncAction)

    await act(async () => {
      render(
        <AsyncSpinnerButton onClick={mockOnClick} hideOnSuccess={false}>
          Loading Stay Button
        </AsyncSpinnerButton>,
      )
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Loading Stay Button' }))
    })

    const loadingButton = screen.getByRole('button')
    expect(loadingButton).toBeDisabled()
    expect(loadingButton).toHaveAttribute('aria-busy', 'true')

    await act(async () => {
      resolvePromise!()
    })

    const resolvedButton = screen.getByRole('button', { name: 'Loading Stay Button' })
    expect(resolvedButton).toBeInTheDocument()
    expect(resolvedButton).not.toBeDisabled()
    expect(resolvedButton).toHaveAttribute('aria-busy', 'false')
    expect(resolvedButton).toHaveTextContent('Loading Stay Button')
  })

  it('keeps button visible after error regardless of hideOnSuccess value', async () => {
    const error = new Error('Test error')
    const mockOnClick = vi.fn().mockRejectedValue(error)

    await act(async () => {
      render(
        <AsyncSpinnerButton onClick={mockOnClick} hideOnSuccess={true}>
          Error With Hide Button
        </AsyncSpinnerButton>,
      )
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Error With Hide Button' }))
    })

    const button = screen.getByRole('button', { name: 'Error With Hide Button' })
    expect(button).toBeInTheDocument()
    expect(button).not.toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'false')
    expect(button).toHaveTextContent('Error With Hide Button')
  })
})
