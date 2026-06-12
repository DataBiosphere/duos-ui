import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CollaboratorSummary from 'src/components/collaborator_list/CollaboratorSummary'
import { Collaborator } from 'src/types/model'

vi.mock('react-modal', () => {
  const Modal = ({
    isOpen,
    children,
    className,
  }: {
    isOpen: boolean
    children?: React.ReactNode
    className?: string
  }) => {
    if (!isOpen) return null
    return <div className={className}>{children}</div>
  }
  Modal.setAppElement = () => {}
  return { default: Modal }
})

type PartialCollaborator = {
  name: string
  title?: string | null
  institution?: string | null
  email?: string | null
  uuid?: string
  eraCommonsId?: string
}

describe('CollaboratorSummary - Component Tests', () => {
  const mockCollaborator: Collaborator = {
    name: 'John Doe',
    title: 'Researcher',
    email: 'john.doe@example.com',
    uuid: '123e4567-e89b-12d3-a456-426614174000',
    eraCommonsId: 'jdoe123',
    approverStatus: false,
    countryOfOperation: 'United States of America (the)',
  }

  const defaultProps = {
    collaborator: mockCollaborator,
    columnsToShow: ['name', 'title', 'email', 'eraCommonsId'],
    editAction: vi.fn(),
    deleteAction: vi.fn(),
    readOnly: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the component correctly with specified columns', () => {
    render(<CollaboratorSummary {...defaultProps} />)

    expect(screen.getByText(mockCollaborator.name)).toBeInTheDocument()
    expect(screen.getByText(mockCollaborator.title!)).toBeInTheDocument()
    expect(screen.getByText(mockCollaborator.email!)).toBeInTheDocument()
    expect(screen.getByText(mockCollaborator.eraCommonsId!)).toBeInTheDocument()

    expect(document.querySelector('.collaborator-summary-edit-delete-buttons')).toBeInTheDocument()
    expect(document.querySelector('.glyphicon-pencil')).toBeInTheDocument()
    expect(document.querySelector('.glyphicon-trash')).toBeInTheDocument()
  })

  it('renders different columns when columnsToShow changes', () => {
    const customProps = {
      ...defaultProps,
      columnsToShow: ['name', 'email', 'eraCommonsId'],
    }

    render(<CollaboratorSummary {...customProps} />)

    expect(screen.getByText(mockCollaborator.name)).toBeInTheDocument()

    expect(screen.queryByText(mockCollaborator.title!)).not.toBeInTheDocument()
    expect(screen.getByText(mockCollaborator.email!)).toBeInTheDocument()
    expect(screen.getByText(mockCollaborator.eraCommonsId!)).toBeInTheDocument()
  })

  it('calls editAction when edit button is clicked', () => {
    const editAction = vi.fn()

    render(
      <CollaboratorSummary
        {...defaultProps}
        editAction={editAction}
      />,
    )

    fireEvent.click(document.querySelector('.glyphicon-pencil')!.closest('a')!)
    expect(editAction).toHaveBeenCalledOnce()
  })

  it('shows delete modal when delete button is clicked', () => {
    render(<CollaboratorSummary {...defaultProps} />)

    expect(document.querySelector('.delete-modal')).not.toBeInTheDocument()

    fireEvent.click(document.querySelector('.glyphicon-trash')!.closest('a')!)

    expect(document.querySelector('.delete-modal')).toBeInTheDocument()
    expect(document.querySelector('.delete-modal-title')).toBeInTheDocument()
    expect(screen.getByText(mockCollaborator.name, { selector: 'strong' })).toBeInTheDocument()
  })

  it('calls deleteAction when confirming deletion', () => {
    const deleteAction = vi.fn()

    render(
      <CollaboratorSummary
        {...defaultProps}
        deleteAction={deleteAction}
      />,
    )

    fireEvent.click(document.querySelector('.glyphicon-trash')!.closest('a')!)

    fireEvent.click(screen.getByText('Delete'))

    expect(deleteAction).toHaveBeenCalledOnce()

    expect(document.querySelector('.delete-modal')).not.toBeInTheDocument()
  })

  it('closes delete modal when cancel is clicked', () => {
    render(<CollaboratorSummary {...defaultProps} />)

    fireEvent.click(document.querySelector('.glyphicon-trash')!.closest('a')!)
    expect(document.querySelector('.delete-modal')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Cancel'))

    expect(document.querySelector('.delete-modal')).not.toBeInTheDocument()
  })

  it('shows view icon and calls editAction in read-only mode', () => {
    const editAction = vi.fn()
    const deleteAction = vi.fn()

    render(
      <CollaboratorSummary
        {...defaultProps}
        editAction={editAction}
        deleteAction={deleteAction}
        readOnly={true}
      />,
    )

    // Should show eye-open icon for viewing
    expect(document.querySelector('.glyphicon-eye-open')).toBeInTheDocument()
    expect(document.querySelector('.glyphicon-eye-open')!.closest('a')).toBeInTheDocument()

    // Should not show edit or delete icons at all in read-only mode
    expect(document.querySelector('.glyphicon-pencil')).not.toBeInTheDocument()
    expect(document.querySelector('.glyphicon-trash')).not.toBeInTheDocument()

    // Clicking the eye icon should call editAction (to open in view mode)
    fireEvent.click(document.querySelector('.glyphicon-eye-open')!.closest('a')!)
    expect(editAction).toHaveBeenCalled()

    // Delete modal should never appear in read-only mode
    expect(document.querySelector('.delete-modal')).not.toBeInTheDocument()
  })

  it('displays null or undefined column values gracefully', () => {
    const incompleteCollaborator: PartialCollaborator = {
      name: 'Jane Doe',
      title: '',
      institution: undefined,
      email: null,
    }

    render(
      <CollaboratorSummary
        {...defaultProps}
        collaborator={incompleteCollaborator as Collaborator}
      />,
    )

    expect(screen.getByText('Jane Doe')).toBeInTheDocument()

    // 1 data div (name) + buttons div = 2 children
    const card = document.querySelector('.collaborator-summary-card')
    expect(card!.children).toHaveLength(1 + 1)
  })
})
