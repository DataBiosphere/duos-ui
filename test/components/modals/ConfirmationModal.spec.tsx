import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { act, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from 'react-modal'
import ConfirmationModal from 'src/components/modals/ConfirmationModal'

beforeAll(() => {
  Modal.setAppElement(document.body)
})

const defaultProps = {
  showConfirmation: true,
  closeConfirmation: vi.fn(),
  title: 'Delete DAR',
  message: 'Are you sure you want to delete this DAR?',
  header: 'DAR-123 - Test Project',
  onConfirm: vi.fn().mockResolvedValue(undefined),
}

describe('ConfirmationModal - Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the modal and overlay with the correct CSS classes when open', async () => {
    await act(async () => {
      render(<ConfirmationModal {...defaultProps} />)
    })
    expect(document.querySelector('.confirmation-modal')).toBeInTheDocument()
    expect(document.querySelector('.confirmation-modal-overlay')).toBeInTheDocument()
  })

  it('renders the header', async () => {
    await act(async () => {
      render(<ConfirmationModal {...defaultProps} />)
    })
    expect(document.querySelector('.confirmation-modal-header')).toHaveTextContent('DAR-123 - Test Project')
  })

  it('renders the title', async () => {
    await act(async () => {
      render(<ConfirmationModal {...defaultProps} />)
    })
    expect(document.querySelector('.confirmation-modal-title')).toHaveTextContent('Delete DAR')
  })

  it('renders the message', async () => {
    await act(async () => {
      render(<ConfirmationModal {...defaultProps} />)
    })
    expect(document.querySelector('.confirmation-modal-message')).toHaveTextContent('Are you sure you want to delete this DAR?')
  })

  it('renders the Confirm button', async () => {
    await act(async () => {
      render(<ConfirmationModal {...defaultProps} />)
    })
    expect(document.querySelector('.confirmation-modal-primary-button')).toHaveTextContent('Confirm')
  })

  it('renders the Cancel button', async () => {
    await act(async () => {
      render(<ConfirmationModal {...defaultProps} />)
    })
    expect(document.querySelector('.confirmation-modal-secondary-button')).toHaveTextContent('Cancel')
  })

  it('does not render modal content when showConfirmation is false', () => {
    render(<ConfirmationModal {...defaultProps} showConfirmation={false} />)
    expect(document.querySelector('.confirmation-modal')).not.toBeInTheDocument()
  })

  it('calls closeConfirmation when Cancel is clicked', async () => {
    const user = userEvent.setup()
    await act(async () => {
      render(<ConfirmationModal {...defaultProps} />)
    })
    await user.click(document.querySelector('.confirmation-modal-secondary-button')!)
    expect(defaultProps.closeConfirmation).toHaveBeenCalledOnce()
  })

  it('calls onConfirm when Confirm is clicked', async () => {
    const user = userEvent.setup()
    await act(async () => {
      render(<ConfirmationModal {...defaultProps} />)
    })
    await user.click(document.querySelector('.confirmation-modal-primary-button')!)
    expect(defaultProps.onConfirm).toHaveBeenCalledOnce()
  })

  it('calls closeConfirmation when the close icon is clicked', async () => {
    const user = userEvent.setup()
    await act(async () => {
      render(<ConfirmationModal {...defaultProps} />)
    })
    await user.click(document.querySelector('.modal-close-btn')!)
    expect(defaultProps.closeConfirmation).toHaveBeenCalledOnce()
  })
})
