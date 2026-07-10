import React from 'react'
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from 'react-modal'
import CollaboratorDelete from 'src/components/collaborator_list/CollaboratorDelete'

beforeAll(() => Modal.setAppElement(document.body))

afterEach(() => vi.restoreAllMocks())

const defaultProps = {
  collaboratorName: 'John Doe',
  showDelete: true,
  confirmAction: vi.fn(),
  closeAction: vi.fn(),
}

describe('CollaboratorDelete - Component Tests', () => {
  it('renders the component correctly when showDelete is true', async () => {
    render(<CollaboratorDelete {...defaultProps} />)
    await waitFor(() => expect(document.querySelector('.delete-modal')).toBeInTheDocument())
    expect(document.querySelector('.delete-modal-header')).toHaveTextContent('Delete Collaborator')
    expect(document.querySelector('.delete-modal-title')).toHaveTextContent('Are you sure you want to delete')
    expect(document.querySelector('.delete-modal-title')).toBeVisible()
    expect(document.querySelector('.delete-modal-title strong')).toHaveTextContent('John Doe')
    expect(document.querySelector('.delete-modal-message')).toHaveTextContent('This action is permanent')
    expect(document.querySelector('.delete-modal-message')).toBeVisible()
  })

  it('does not render when showDelete is false', () => {
    render(<CollaboratorDelete {...defaultProps} showDelete={false} />)
    expect(document.querySelector('.delete-modal')).not.toBeInTheDocument()
  })

  it('calls confirmAction when Delete button is clicked', async () => {
    const confirmAction = vi.fn()
    const user = userEvent.setup()
    render(<CollaboratorDelete {...defaultProps} confirmAction={confirmAction} />)
    await waitFor(() => expect(document.querySelector('.delete-modal-primary-button')).toBeInTheDocument())
    expect(document.querySelector('.delete-modal-primary-button')).toHaveTextContent('Delete')
    await user.click(document.querySelector('.delete-modal-primary-button')!)
    expect(confirmAction).toHaveBeenCalledTimes(1)
  })

  it('calls closeAction when Cancel button is clicked', async () => {
    const closeAction = vi.fn()
    const user = userEvent.setup()
    render(<CollaboratorDelete {...defaultProps} closeAction={closeAction} />)
    await waitFor(() => expect(document.querySelector('.delete-modal-secondary-button')).toBeInTheDocument())
    expect(document.querySelector('.delete-modal-secondary-button')).toHaveTextContent('Cancel')
    await user.click(document.querySelector('.delete-modal-secondary-button')!)
    expect(closeAction).toHaveBeenCalledTimes(1)
  })

  it('calls closeAction when modal overlay is clicked', async () => {
    const closeAction = vi.fn()
    const user = userEvent.setup()
    render(<CollaboratorDelete {...defaultProps} closeAction={closeAction} />)
    await waitFor(() => expect(document.querySelector('.ReactModal__Overlay')).toBeInTheDocument())
    await user.click(document.querySelector('.ReactModal__Overlay')!)
    expect(closeAction).toHaveBeenCalledTimes(1)
  })

  it('calls closeAction when ESC key is pressed', async () => {
    const closeAction = vi.fn()
    const user = userEvent.setup()
    render(<CollaboratorDelete {...defaultProps} closeAction={closeAction} />)
    await waitFor(() => expect(document.querySelector('.ReactModal__Content')).toBeInTheDocument())
    await user.keyboard('{Escape}')
    expect(closeAction).toHaveBeenCalledTimes(1)
  })

  it('displays different collaborator names correctly', async () => {
    render(<CollaboratorDelete {...defaultProps} collaboratorName="Jane Smith" />)
    await waitFor(() => expect(document.querySelector('.delete-modal-title strong')).toBeInTheDocument())
    expect(document.querySelector('.delete-modal-title strong')).toHaveTextContent('Jane Smith')
  })

  it('has the correct styling on buttons', async () => {
    render(<CollaboratorDelete {...defaultProps} />)
    await waitFor(() => expect(document.querySelector('.delete-modal-primary-button')).toBeInTheDocument())
    const primary = document.querySelector('.delete-modal-primary-button')!
    const secondary = document.querySelector('.delete-modal-secondary-button')!
    expect(primary).toHaveTextContent('Delete')
    expect(primary).toHaveClass('MuiButton-contained')
    expect(secondary).toHaveTextContent('Cancel')
    expect(secondary).toHaveClass('MuiButton-outlined')
  })

  it('displays permanent action warning message', async () => {
    render(<CollaboratorDelete {...defaultProps} />)
    await waitFor(() => expect(document.querySelector('.delete-modal-message')).toBeInTheDocument())
    expect(document.querySelector('.delete-modal-message')).toHaveTextContent('This action is permanent and cannot be undone')
  })
})
