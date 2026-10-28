import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CloseIconComponent from 'src/components/CloseIconComponent'

describe('CloseIconComponent', () => {
  it('renders a button with the correct class names', () => {
    render(<CloseIconComponent closeFn={vi.fn()} />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('modal-close-btn', 'close')
  })

  it('renders a button of type "button"', () => {
    render(<CloseIconComponent closeFn={vi.fn()} />)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('calls closeFn when the button is clicked', async () => {
    const closeFn = vi.fn()
    render(<CloseIconComponent closeFn={closeFn} />)
    await userEvent.click(screen.getByRole('button'))
    expect(closeFn).toHaveBeenCalledTimes(1)
  })

  it('names the button for screen readers, since the icon carries no text', () => {
    render(<CloseIconComponent closeFn={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('renders a decorative icon inside the button', () => {
    render(<CloseIconComponent closeFn={vi.fn()} />)
    const icon = screen.getByRole('button', { name: 'Close' }).querySelector('svg')
    expect(icon).toHaveClass('default-color')
    expect(icon).toHaveAttribute('aria-hidden', 'true')
  })
})
