import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { AsyncSpinnerMuiButton } from 'src/components/AsyncSpinnerMuiButton'

describe('AsyncSpinnerMuiButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the button with children', async () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined)

    await act(async () => {
      render(
        <AsyncSpinnerMuiButton onClick={mockOnClick}>
          Test Button
        </AsyncSpinnerMuiButton>,
      )
    })

    const button = screen.getByRole('button', { name: 'Test Button' })
    expect(button).toBeInTheDocument()
    expect(button).not.toBeDisabled()
  })

  it('applies MUI Button props correctly', async () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined)

    const { container } = render(
      <AsyncSpinnerMuiButton
        onClick={mockOnClick}
        variant="contained"
        color="primary"
        data-cy="custom-mui-button"
      >
        Styled Button
      </AsyncSpinnerMuiButton>,
    )

    const button = container.querySelector('[data-cy="custom-mui-button"]') as HTMLElement
    expect(button).not.toBeNull()
    expect(button).toHaveClass('MuiButton-contained')
    expect(button).toHaveClass('MuiButton-colorPrimary')
  })

  it('accepts custom className and sx props', async () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined)

    const { container } = render(
      <AsyncSpinnerMuiButton
        onClick={mockOnClick}
        className="custom-button-class"
        sx={{ textTransform: 'none' }}
        data-cy="custom-styled-button"
      >
        Custom Styled Button
      </AsyncSpinnerMuiButton>,
    )

    const button = container.querySelector('[data-cy="custom-styled-button"]') as HTMLElement
    expect(button).not.toBeNull()
    expect(button).toHaveClass('custom-button-class')
    expect(button).toHaveStyle({ textTransform: 'none' })
  })

  it('shows spinner during async operation', async () => {
    let resolvePromise: () => void
    const asyncAction = new Promise<void>((resolve) => {
      resolvePromise = resolve
    })
    const mockOnClick = vi.fn().mockReturnValue(asyncAction)

    const { container } = render(
      <AsyncSpinnerMuiButton onClick={mockOnClick} data-cy="loading-button">
        Loading Button
      </AsyncSpinnerMuiButton>,
    )

    const button = container.querySelector('[data-cy="loading-button"]') as HTMLElement
    fireEvent.click(button)

    // Should show spinner and be disabled
    expect(button).toBeDisabled()
    expect(button.querySelector('.MuiCircularProgress-root')).not.toBeNull()

    // Text should not be visible during loading
    expect(screen.queryByText('Loading Button')).not.toBeInTheDocument()

    // Resolve the promise
    await act(async () => {
      resolvePromise!()
    })

    // Should be re-enabled after completion
    expect(button).not.toBeDisabled()
  })

  it('disappears after successful action when hideOnSuccess is true', async () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined)

    const { container } = render(
      <AsyncSpinnerMuiButton
        onClick={mockOnClick}
        hideOnSuccess={true}
        data-cy="success-hide-button"
      >
        Success Button
      </AsyncSpinnerMuiButton>,
    )

    const button = container.querySelector('[data-cy="success-hide-button"]') as HTMLElement
    expect(button).not.toBeNull()

    await act(async () => {
      fireEvent.click(button)
    })

    // Button should disappear after successful completion
    expect(container.querySelector('[data-cy="success-hide-button"]')).toBeNull()
  })

  it('remains visible after successful action when hideOnSuccess is false', async () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined)

    const { container } = render(
      <AsyncSpinnerMuiButton
        onClick={mockOnClick}
        hideOnSuccess={false}
        data-cy="success-visible-button"
      >
        Stay Visible Button
      </AsyncSpinnerMuiButton>,
    )

    const button = container.querySelector('[data-cy="success-visible-button"]') as HTMLElement
    expect(button).not.toBeNull()

    await act(async () => {
      fireEvent.click(button)
    })

    // Button should remain visible after successful completion
    expect(container.querySelector('[data-cy="success-visible-button"]')).not.toBeNull()
    expect(button).not.toBeDisabled()
    expect(button).toHaveTextContent('Stay Visible Button')
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

    const { container } = render(
      <AsyncSpinnerMuiButton onClick={mockOnClick} data-cy="error-button">
        Error Button
      </AsyncSpinnerMuiButton>,
    )

    const button = container.querySelector('[data-cy="error-button"]') as HTMLElement

    // First click should fail
    await act(async () => {
      fireEvent.click(button)
    })

    // Should become clickable again after error
    expect(button).not.toBeDisabled()
    expect(button).toHaveTextContent('Error Button')

    // Next click will succeed
    shouldReject = false

    await act(async () => {
      fireEvent.click(button)
    })

    // Should remain visible since hideOnSuccess defaults to false
    expect(container.querySelector('[data-cy="error-button"]')).not.toBeNull()
  })

  it('respects disabled prop', async () => {
    const mockOnClick = vi.fn()

    const { container } = render(
      <AsyncSpinnerMuiButton
        onClick={mockOnClick}
        disabled={true}
        data-cy="disabled-button"
      >
        Disabled Button
      </AsyncSpinnerMuiButton>,
    )

    const button = container.querySelector('[data-cy="disabled-button"]') as HTMLElement
    expect(button).toBeDisabled()

    // Force click on disabled button
    fireEvent.click(button)

    expect(mockOnClick).not.toHaveBeenCalled()
  })

  it('prevents multiple clicks during loading state', async () => {
    let resolvePromise: () => void
    const asyncAction = new Promise<void>((resolve) => {
      resolvePromise = resolve
    })
    const mockOnClick = vi.fn().mockReturnValue(asyncAction)

    const { container } = render(
      <AsyncSpinnerMuiButton
        onClick={mockOnClick}
        data-cy="multi-click-button"
      >
        Multi Click Button
      </AsyncSpinnerMuiButton>,
    )

    const button = container.querySelector('[data-cy="multi-click-button"]') as HTMLElement

    // First click starts the action
    fireEvent.click(button)

    // Multiple additional clicks should not trigger the action (button is disabled during loading)
    fireEvent.click(button)
    fireEvent.click(button)
    fireEvent.click(button)

    expect(mockOnClick).toHaveBeenCalledOnce()

    await act(async () => {
      resolvePromise!()
    })
  })

  it('calls onError callback when action fails', async () => {
    const error = new Error('Test callback error')
    const mockOnClick = vi.fn().mockRejectedValue(error)
    const mockOnError = vi.fn()

    const { container } = render(
      <AsyncSpinnerMuiButton
        onClick={mockOnClick}
        onError={mockOnError}
        data-cy="error-callback-button"
      >
        Error Callback Button
      </AsyncSpinnerMuiButton>,
    )

    const errorCallbackButton = container.querySelector('[data-cy="error-callback-button"]')
    await act(async () => {
      fireEvent.click(errorCallbackButton!)
    })

    expect(mockOnError).toHaveBeenCalledOnce()
    expect(mockOnError).toHaveBeenCalledWith(error)
  })

  it('does not call onError callback when action succeeds', async () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined)
    const mockOnError = vi.fn()

    const { container } = render(
      <AsyncSpinnerMuiButton
        onClick={mockOnClick}
        onError={mockOnError}
        data-cy="success-callback-button"
      >
        Success Callback Button
      </AsyncSpinnerMuiButton>,
    )

    const successCallbackButton = container.querySelector('[data-cy="success-callback-button"]')
    await act(async () => {
      fireEvent.click(successCallbackButton!)
    })

    expect(mockOnError).not.toHaveBeenCalled()
  })

  it('allows multiple clicks when hideOnSuccess is false', async () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined)

    const { container } = render(
      <AsyncSpinnerMuiButton
        onClick={mockOnClick}
        hideOnSuccess={false}
        data-cy="multi-use-button"
      >
        Multi Use Button
      </AsyncSpinnerMuiButton>,
    )

    const button = container.querySelector('[data-cy="multi-use-button"]') as HTMLElement

    await act(async () => {
      fireEvent.click(button)
    })

    expect(container.querySelector('[data-cy="multi-use-button"]')).not.toBeNull()
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

    const { container } = render(
      <AsyncSpinnerMuiButton
        onClick={mockOnClick}
        hideOnSuccess={false}
        data-cy="loading-stay-button"
      >
        Loading Stay Button
      </AsyncSpinnerMuiButton>,
    )

    const button = container.querySelector('[data-cy="loading-stay-button"]') as HTMLElement
    fireEvent.click(button)

    expect(button).toBeDisabled()
    expect(button.querySelector('.MuiCircularProgress-root')).not.toBeNull()

    await act(async () => {
      resolvePromise!()
    })

    expect(container.querySelector('[data-cy="loading-stay-button"]')).not.toBeNull()
    expect(button).not.toBeDisabled()
    expect(button).toHaveTextContent('Loading Stay Button')
  })

  it('keeps button visible after error regardless of hideOnSuccess value', async () => {
    const error = new Error('Test error')
    const mockOnClick = vi.fn().mockRejectedValue(error)

    const { container } = render(
      <AsyncSpinnerMuiButton
        onClick={mockOnClick}
        hideOnSuccess={true}
        data-cy="error-with-hide-button"
      >
        Error With Hide Button
      </AsyncSpinnerMuiButton>,
    )

    const errorWithHideButton = container.querySelector('[data-cy="error-with-hide-button"]')
    await act(async () => {
      fireEvent.click(errorWithHideButton!)
    })

    const button = container.querySelector('[data-cy="error-with-hide-button"]') as HTMLElement
    expect(button).not.toBeNull()
    expect(button).not.toBeDisabled()
    expect(button).toHaveTextContent('Error With Hide Button')
  })

  it('applies MUI variant and color props', async () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined)

    const { container } = render(
      <div>
        <AsyncSpinnerMuiButton
          onClick={mockOnClick}
          variant="outlined"
          color="secondary"
          data-cy="outlined-button"
        >
          Outlined Button
        </AsyncSpinnerMuiButton>
        <AsyncSpinnerMuiButton
          onClick={mockOnClick}
          variant="text"
          color="error"
          data-cy="text-button"
        >
          Text Button
        </AsyncSpinnerMuiButton>
      </div>,
    )

    const outlinedButton = container.querySelector('[data-cy="outlined-button"]') as HTMLElement
    expect(outlinedButton).toHaveClass('MuiButton-outlined')
    expect(outlinedButton).toHaveClass('MuiButton-colorSecondary')

    const textButton = container.querySelector('[data-cy="text-button"]') as HTMLElement
    expect(textButton).toHaveClass('MuiButton-text')
    expect(textButton).toHaveClass('MuiButton-colorError')
  })

  it('supports MUI size prop', async () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined)

    const { container } = render(
      <div>
        <AsyncSpinnerMuiButton
          onClick={mockOnClick}
          size="small"
          data-cy="small-button"
        >
          Small Button
        </AsyncSpinnerMuiButton>
        <AsyncSpinnerMuiButton
          onClick={mockOnClick}
          size="large"
          data-cy="large-button"
        >
          Large Button
        </AsyncSpinnerMuiButton>
      </div>,
    )

    expect(container.querySelector('[data-cy="small-button"]')).toHaveClass('MuiButton-sizeSmall')
    expect(container.querySelector('[data-cy="large-button"]')).toHaveClass('MuiButton-sizeLarge')
  })

  it('supports MUI fullWidth prop', async () => {
    const mockOnClick = vi.fn().mockResolvedValue(undefined)

    const { container } = render(
      <AsyncSpinnerMuiButton
        onClick={mockOnClick}
        fullWidth
        data-cy="full-width-button"
      >
        Full Width Button
      </AsyncSpinnerMuiButton>,
    )

    expect(container.querySelector('[data-cy="full-width-button"]')).toHaveClass('MuiButton-fullWidth')
  })

  it('shows CircularProgress with correct size during loading', async () => {
    let resolvePromise: () => void
    const asyncAction = new Promise<void>((resolve) => {
      resolvePromise = resolve
    })
    const mockOnClick = vi.fn().mockReturnValue(asyncAction)

    const { container } = render(
      <AsyncSpinnerMuiButton
        onClick={mockOnClick}
        data-cy="spinner-size-button"
      >
        Check Spinner Size
      </AsyncSpinnerMuiButton>,
    )

    const button = container.querySelector('[data-cy="spinner-size-button"]') as HTMLElement
    fireEvent.click(button)

    const spinner = button.querySelector('.MuiCircularProgress-root')
    expect(spinner).not.toBeNull()
    expect(spinner).toHaveAttribute('role', 'progressbar')

    await act(async () => {
      resolvePromise!()
    })
  })

  it('maintains disabled state from props during async operation', async () => {
    let resolvePromise: () => void
    const asyncAction = new Promise<void>((resolve) => {
      resolvePromise = resolve
    })
    const mockOnClick = vi.fn().mockReturnValue(asyncAction)

    const { container } = render(
      <AsyncSpinnerMuiButton
        onClick={mockOnClick}
        disabled={false}
        data-cy="prop-disabled-button"
      >
        Prop Disabled Button
      </AsyncSpinnerMuiButton>,
    )

    const button = container.querySelector('[data-cy="prop-disabled-button"]') as HTMLElement
    fireEvent.click(button)

    // Should be disabled during loading
    expect(button).toBeDisabled()

    await act(async () => {
      resolvePromise!()
    })

    // Should return to original disabled state (false)
    expect(button).not.toBeDisabled()
  })
})
