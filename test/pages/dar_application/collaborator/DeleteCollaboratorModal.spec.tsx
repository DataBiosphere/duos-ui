import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { act, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from 'react-modal'
import DeleteCollaboratorModal from 'src/pages/dar_application/collaborator/DeleteCollaboratorModal'

beforeAll(() => {
  Modal.setAppElement(document.body)
})

const defaultProps = {
  showDelete: true,
  closeDelete: vi.fn(),
  header: 'Delete Entry',
  title: <div>Are you sure you want to delete?</div>,
  message: <div>This action is permanent and cannot be undone.</div>,
  onConfirm: vi.fn(),
}

describe('DeleteCollaboratorModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the modal with header, title, and message when open', async () => {
    await act(async () => {
      render(<DeleteCollaboratorModal {...defaultProps} />)
    })

    expect(document.querySelector('.delete-modal-header')).toHaveTextContent('Delete Entry')
    expect(document.querySelector('.delete-modal-title')).toHaveTextContent('Are you sure you want to delete?')
    expect(document.querySelector('.delete-modal-message')).toHaveTextContent('This action is permanent and cannot be undone.')
  })

  it('renders the Delete and Cancel buttons', async () => {
    await act(async () => {
      render(<DeleteCollaboratorModal {...defaultProps} />)
    })

    expect(document.querySelector('.delete-modal-primary-button')).toHaveTextContent('Delete')
    expect(document.querySelector('.delete-modal-secondary-button')).toHaveTextContent('Cancel')
  })

  it('does not render modal content when showDelete is false', () => {
    render(<DeleteCollaboratorModal {...defaultProps} showDelete={false} />)

    expect(document.querySelector('.delete-modal-header')).not.toBeInTheDocument()
  })

  it('calls onConfirm when Delete is clicked', async () => {
    const user = userEvent.setup()
    await act(async () => {
      render(<DeleteCollaboratorModal {...defaultProps} />)
    })

    await user.click(document.querySelector('.delete-modal-primary-button')!)

    expect(defaultProps.onConfirm).toHaveBeenCalledOnce()
    expect(defaultProps.closeDelete).not.toHaveBeenCalled()
  })

  it('calls closeDelete when Cancel is clicked', async () => {
    const user = userEvent.setup()
    await act(async () => {
      render(<DeleteCollaboratorModal {...defaultProps} />)
    })

    await user.click(document.querySelector('.delete-modal-secondary-button')!)

    expect(defaultProps.closeDelete).toHaveBeenCalledOnce()
    expect(defaultProps.onConfirm).not.toHaveBeenCalled()
  })

  it('calls closeDelete when the close icon is clicked', async () => {
    const user = userEvent.setup()
    await act(async () => {
      render(<DeleteCollaboratorModal {...defaultProps} />)
    })

    await user.click(document.querySelector('.modal-close-btn')!)

    expect(defaultProps.closeDelete).toHaveBeenCalledOnce()
  })

  it('applies a styleOverride to the modal content', async () => {
    await act(async () => {
      render(<DeleteCollaboratorModal {...defaultProps} styleOverride={{ height: '35%' }} />)
    })

    expect(document.querySelector('.delete-modal')).toHaveStyle({ height: '35%' })
  })
})
