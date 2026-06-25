import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmationDialog } from 'src/components/modals/ConfirmationDialog'

const defaultProps = {
  title: 'Delete Record',
  description: 'Are you sure you want to delete this record?',
  openState: true,
  close: vi.fn(),
  action: vi.fn(),
}

describe('ConfirmationDialog - Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the title when open', async () => {
    await act(async () => {
      render(<ConfirmationDialog {...defaultProps} />)
    })
    expect(screen.getByText('Delete Record')).toBeInTheDocument()
  })

  it('renders the description when open', async () => {
    await act(async () => {
      render(<ConfirmationDialog {...defaultProps} />)
    })
    expect(screen.getByText('Are you sure you want to delete this record?')).toBeInTheDocument()
  })

  it('renders Cancel and Confirm buttons when open', async () => {
    await act(async () => {
      render(<ConfirmationDialog {...defaultProps} />)
    })
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
  })

  it('does not render the dialog content when openState is false', () => {
    render(<ConfirmationDialog {...defaultProps} openState={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('calls close when Cancel is clicked', async () => {
    const user = userEvent.setup()
    await act(async () => {
      render(<ConfirmationDialog {...defaultProps} />)
    })
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(defaultProps.close).toHaveBeenCalledOnce()
  })

  it('calls action when Confirm is clicked', async () => {
    const user = userEvent.setup()
    await act(async () => {
      render(<ConfirmationDialog {...defaultProps} />)
    })
    await user.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(defaultProps.action).toHaveBeenCalledOnce()
  })

  it('calls close when the dialog backdrop is clicked', async () => {
    const user = userEvent.setup()
    await act(async () => {
      render(<ConfirmationDialog {...defaultProps} />)
    })
    await user.click(document.querySelector('.MuiBackdrop-root')!)
    expect(defaultProps.close).toHaveBeenCalledOnce()
  })
})
