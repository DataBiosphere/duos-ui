import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import CollaboratorList from 'src/pages/dar_application/collaborator/CollaboratorList'
import { Collaborator } from 'src/types/model'

// DeleteCollaboratorModal (used by the local Add form) and CollaboratorDelete/ModalWrapper
// (used by existing-row summaries, from src/components/collaborator_list) both render a
// react-modal Modal under the hood; mock it once at that shared boundary.
vi.mock('react-modal', () => {
  const Modal = ({ isOpen, children }: { isOpen: boolean, children?: React.ReactNode }) => {
    if (!isOpen) return null
    return <div>{children}</div>
  }
  Modal.setAppElement = () => {}
  return { default: Modal }
})

const existingCollaborators: Collaborator[] = [
  {
    name: 'John Doe',
    title: 'Researcher',
    email: 'john.doe@example.com',
    uuid: '123e4567-e89b-12d3-a456-426614174001',
    eraCommonsId: 'jdoe123',
    countryOfOperation: 'Canada',
    approverStatus: false,
  },
]

const defaultProps = {
  formFieldChange: vi.fn(),
  collaboratorLabel: 'Internal Collaborator',
  collaboratorKey: 'internalCollaborators',
  countriesOfOperation: ['France', 'Canada', 'United States of America (the)'],
  showApproval: false,
  setCompleted: vi.fn(),
  validation: {},
  onValidationChange: vi.fn(),
}

describe('CollaboratorList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the Add button and existing collaborators', () => {
    render(<CollaboratorList {...defaultProps} collaborators={existingCollaborators} />)

    expect(screen.getByRole('button', { name: /Add Internal Collaborator/i })).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Researcher')).toBeInTheDocument()
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument()
  })

  it('renders no summary cards with an empty collaborators list', () => {
    render(<CollaboratorList {...defaultProps} collaborators={[]} />)

    expect(document.querySelectorAll('.collaborator-summary-card')).toHaveLength(0)
  })

  it('shows the Add form when the Add button is clicked, and Cancel closes it without changes', () => {
    const formFieldChange = vi.fn()
    render(<CollaboratorList {...defaultProps} collaborators={[]} formFieldChange={formFieldChange} />)

    fireEvent.click(screen.getByRole('button', { name: /Add Internal Collaborator/i }))
    expect(screen.getByText('New Internal Collaborator Information')).toBeInTheDocument()

    formFieldChange.mockClear()
    fireEvent.click(screen.getByText('Cancel'))

    expect(screen.queryByText('New Internal Collaborator Information')).not.toBeInTheDocument()
    expect(formFieldChange).not.toHaveBeenCalled()
  })

  it('marks the section incomplete while the Add form is open, and complete again once closed', () => {
    const setCompleted = vi.fn()
    render(<CollaboratorList {...defaultProps} collaborators={[]} setCompleted={setCompleted} />)

    expect(setCompleted).toHaveBeenLastCalledWith(true)

    fireEvent.click(screen.getByRole('button', { name: /Add Internal Collaborator/i }))
    expect(setCompleted).toHaveBeenLastCalledWith(false)

    fireEvent.click(screen.getByText('Cancel'))
    expect(setCompleted).toHaveBeenLastCalledWith(true)
  })

  it('adds a new collaborator through the form and reports the updated list', () => {
    const formFieldChange = vi.fn()
    render(<CollaboratorList {...defaultProps} collaborators={[]} formFieldChange={formFieldChange} />)

    fireEvent.click(screen.getByRole('button', { name: /Add Internal Collaborator/i }))

    fireEvent.change(document.getElementById('0_collaboratorName')!, { target: { value: 'New Person' } })
    fireEvent.change(document.getElementById('0_collaboratorEraCommonsId')!, { target: { value: 'newperson' } })
    fireEvent.change(document.getElementById('0_collaboratorTitle')!, { target: { value: 'New Title' } })
    fireEvent.change(document.getElementById('0_collaboratorEmail')!, { target: { value: 'new.person@example.com' } })

    fireEvent.click(document.getElementById('collaborator-internalCollaborators-add-save')!)

    expect(screen.queryByText('New Internal Collaborator Information')).not.toBeInTheDocument()
    expect(formFieldChange).toHaveBeenLastCalledWith({
      key: 'internalCollaborators',
      value: [expect.objectContaining({ name: 'New Person', title: 'New Title', email: 'new.person@example.com' })],
    })
  })

  it('deletes an existing collaborator and reports the updated list', () => {
    const formFieldChange = vi.fn()
    render(<CollaboratorList {...defaultProps} collaborators={existingCollaborators} formFieldChange={formFieldChange} />)

    fireEvent.click(document.querySelectorAll('.glyphicon-trash')[0].parentElement as HTMLElement)
    fireEvent.click(document.querySelector('.delete-modal-primary-button') as HTMLElement)

    expect(document.querySelectorAll('.collaborator-summary-card')).toHaveLength(0)
    expect(formFieldChange).toHaveBeenLastCalledWith({ key: 'internalCollaborators', value: [] })
  })

  it('updates an existing collaborator in place when edited and saved', () => {
    const formFieldChange = vi.fn()
    render(<CollaboratorList {...defaultProps} collaborators={existingCollaborators} formFieldChange={formFieldChange} />)

    fireEvent.click(document.querySelectorAll('.glyphicon-pencil')[0].parentElement as HTMLElement)

    // collaboratorKey is passed through, so CollaboratorAddEdit renders DAR-compatible field
    // IDs (0_collaboratorName) instead of its default bare 'name'.
    const nameInput = document.getElementById('0_collaboratorName') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } })
    fireEvent.click(screen.getByText('Save'))

    expect(screen.getByText('Updated Name')).toBeInTheDocument()
    expect(formFieldChange).toHaveBeenLastCalledWith({
      key: 'internalCollaborators',
      value: [expect.objectContaining({ name: 'Updated Name' })],
    })
  })

  it('does not open the Add form when disabled', () => {
    render(<CollaboratorList {...defaultProps} collaborators={[]} disabled={true} />)

    const addButton = screen.getByRole('button', { name: /Add Internal Collaborator/i })
    expect(addButton).toBeDisabled()

    fireEvent.click(addButton)
    expect(screen.queryByText('New Internal Collaborator Information')).not.toBeInTheDocument()
  })
})
