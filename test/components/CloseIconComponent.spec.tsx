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

  it('renders the glyphicon span inside the button', () => {
    const { container } = render(<CloseIconComponent closeFn={vi.fn()} />)
    const span = container.querySelector('span.glyphicon.glyphicon-remove.default-color')
    expect(span).toBeInTheDocument()
  })
})
