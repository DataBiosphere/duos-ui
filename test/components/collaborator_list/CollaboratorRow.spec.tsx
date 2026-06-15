import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CollaboratorRow from 'src/components/collaborator_list/CollaboratorRow'
import { Collaborator } from 'src/types/model'

vi.mock('react-modal', () => {
  const Modal = ({
    isOpen,
    children,
  }: {
    isOpen: boolean
    children?: React.ReactNode
  }) => {
    if (!isOpen) return null
    return <div>{children}</div>
  }
  Modal.setAppElement = () => {}
  return { default: Modal }
})

describe('CollaboratorRow - Component Tests', () => {
  const mockCollaborator: Collaborator = {
    name: 'John Doe',
    title: 'Researcher',
    email: 'john.doe@example.com',
    uuid: '123e4567-e89b-12d3-a456-426614174000',
    eraCommonsId: 'jdoe123',
    countryOfOperation: 'United States of America (the)',
    approverStatus: true,
  }

  const mockCollaborators: Collaborator[] = [mockCollaborator]

  const columnsToShow = ['name', 'title', 'email']

  const defaultProps = {
    id: 0,
    editMode: false,
    readOnly: false,
    collaborator: mockCollaborator,
    collaboratorText: 'Collaborator',
    collaborators: mockCollaborators,
    columnsToShow: columnsToShow,
    countriesOfOperation: ['United States of America (the)', 'Canada', 'France'],
    showApproverStatus: false,
    editAction: vi.fn(),
    deleteAction: vi.fn(),
    closeAction: vi.fn(),
    onCollaboratorChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders CollaboratorSummary when not in edit mode', () => {
    render(<CollaboratorRow {...defaultProps} />)

    expect(screen.getByText(mockCollaborator.name)).toBeInTheDocument()
    expect(screen.getByText(mockCollaborator.title!)).toBeInTheDocument()
    expect(screen.getByText(mockCollaborator.email!)).toBeInTheDocument()

    expect(document.querySelector('.glyphicon-pencil')).toBeInTheDocument()
    expect(document.querySelector('.glyphicon-trash')).toBeInTheDocument()

    expect(screen.queryByText('New Collaborator Information')).not.toBeInTheDocument()
    expect(screen.queryByText('Edit Collaborator Information')).not.toBeInTheDocument()
  })

  it('renders CollaboratorAddEdit when in edit mode', () => {
    render(<CollaboratorRow {...defaultProps} editMode={true} />)

    expect(screen.getByText(`Edit ${mockCollaborator.name} Information`)).toBeInTheDocument()
    expect((document.getElementById('name') as HTMLInputElement).value).toBe(mockCollaborator.name)
    expect((document.getElementById('title') as HTMLInputElement).value).toBe(mockCollaborator.title)
    expect((document.getElementById('email') as HTMLInputElement).value).toBe(mockCollaborator.email)

    const countrySelect = document.getElementById('countryOfOperation')
    expect(countrySelect).toHaveTextContent(mockCollaborator.countryOfOperation!)
    expect(countrySelect).not.toHaveTextContent('France')

    expect(screen.getByText('Save')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()

    expect(document.querySelector('.glyphicon-pencil')).not.toBeInTheDocument()
    expect(document.querySelector('.glyphicon-trash')).not.toBeInTheDocument()
  })

  it('passes editAction to CollaboratorSummary and triggers it on edit button click', () => {
    const editAction = vi.fn()

    render(
      <CollaboratorRow
        {...defaultProps}
        editAction={editAction}
      />,
    )

    const pencilIcon = document.querySelector('.glyphicon-pencil')!
    fireEvent.click(pencilIcon.closest('a')!)

    expect(editAction).toHaveBeenCalledOnce()
  })

  it('passes deleteAction to CollaboratorSummary and triggers it on delete confirmation', () => {
    const deleteAction = vi.fn()

    render(
      <CollaboratorRow
        {...defaultProps}
        deleteAction={deleteAction}
      />,
    )

    const trashIcon = document.querySelector('.glyphicon-trash')!
    fireEvent.click(trashIcon.closest('a')!)

    const deleteButton = document.querySelector('.delete-modal-primary-button')!
    fireEvent.click(deleteButton)

    expect(deleteAction).toHaveBeenCalledOnce()
  })

  it('passes closeAction to CollaboratorAddEdit and triggers it on cancel', () => {
    const closeAction = vi.fn()

    render(
      <CollaboratorRow
        {...defaultProps}
        editMode={true}
        closeAction={closeAction}
      />,
    )

    fireEvent.click(screen.getByText('Cancel'))

    expect(closeAction).toHaveBeenCalledOnce()
  })

  it('passes onCollaboratorChange to CollaboratorAddEdit and triggers it on save', () => {
    const onCollaboratorChange = vi.fn()

    render(
      <CollaboratorRow
        {...defaultProps}
        editMode={true}
        onCollaboratorChange={onCollaboratorChange}
      />,
    )

    const nameInput = document.getElementById('name') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } })

    fireEvent.click(screen.getByText('Save'))

    expect(onCollaboratorChange).toHaveBeenCalledOnce()
  })

  it('respects the disabled prop for CollaboratorSummary', () => {
    const editAction = vi.fn()
    const deleteAction = vi.fn()

    render(
      <CollaboratorRow
        {...defaultProps}
        editAction={editAction}
        deleteAction={deleteAction}
        readOnly={true}
      />,
    )

    // In read-only mode, should show eye icon instead of edit/delete icons
    expect(document.querySelector('.glyphicon-eye-open')).toBeInTheDocument()
    expect(document.querySelector('.glyphicon-pencil')).not.toBeInTheDocument()
    expect(document.querySelector('.glyphicon-trash')).not.toBeInTheDocument()

    // Clicking the eye icon should call editAction (to view details)
    const eyeIcon = document.querySelector('.glyphicon-eye-open')!
    fireEvent.click(eyeIcon.closest('a')!)
    expect(editAction).toHaveBeenCalledOnce()
    expect(deleteAction).not.toHaveBeenCalled()
  })

  it('renders CollaboratorAddEdit with new collaborator in edit mode with id=-1', () => {
    const newProps = {
      ...defaultProps,
      id: -1,
      collaborator: { countryOfOperation: 'United States of America (the)' } as Collaborator,
      editMode: true,
    }

    render(<CollaboratorRow {...newProps} />)

    expect(screen.getByText('New Collaborator Information')).toBeInTheDocument()

    expect((document.getElementById('name') as HTMLInputElement).value).toBe('')
    expect((document.getElementById('title') as HTMLInputElement).value).toBe('')
    expect((document.getElementById('email') as HTMLInputElement).value).toBe('')

    expect(screen.getByText('Add')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })
})
