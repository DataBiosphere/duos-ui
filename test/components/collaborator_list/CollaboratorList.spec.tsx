import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CollaboratorList from 'src/components/collaborator_list/CollaboratorList'
import { Collaborator } from 'src/types/model'

// react-modal requires an app element; stub ModalWrapper to avoid modal portal issues
vi.mock('src/components/collaborator_list/ModalWrapper', () => ({
  default: ({ children, isOpen }: { children: React.ReactNode, isOpen: boolean }) =>
    isOpen ? <>{children}</> : null,
}))

describe('CollaboratorList - Component Tests', () => {
  const mockCollaborators: Collaborator[] = [
    {
      name: 'John Doe',
      title: 'Researcher',
      email: 'john.doe@example.com',
      uuid: '123e4567-e89b-12d3-a456-426614174001',
      eraCommonsId: 'jdoe123',
      countryOfOperation: 'Canada',
      approverStatus: true,
    },
    {
      name: 'Jane Smith',
      title: 'Professor',
      email: 'jane.smith@example.com',
      uuid: '123e4567-e89b-12d3-a456-426614174002',
      eraCommonsId: 'jsmith456',
      countryOfOperation: 'United States of America (the)',
      approverStatus: true,
    },
  ]

  const defaultProps = {
    collaborators: mockCollaborators,
    collaboratorText: 'Collaborator',
    columnsToShow: ['name', 'title', 'email'],
    countriesOfOperation: ['France', 'Canada', 'United States of America (the)'],
    onCollaboratorChange: vi.fn(),
    readOnly: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the component with a list of collaborators', () => {
    render(<CollaboratorList {...defaultProps} />)

    expect(screen.getByRole('button', { name: /add collaborator/i })).toBeInTheDocument()

    expect(screen.getByText(mockCollaborators[0].name)).toBeInTheDocument()
    expect(screen.getByText(mockCollaborators[0].title!)).toBeInTheDocument()
    expect(screen.getByText(mockCollaborators[0].email!)).toBeInTheDocument()

    expect(screen.getByText(mockCollaborators[1].name)).toBeInTheDocument()
    expect(screen.getByText(mockCollaborators[1].title!)).toBeInTheDocument()
    expect(screen.getByText(mockCollaborators[1].email!)).toBeInTheDocument()

    expect(document.querySelectorAll('.collaborator-summary-card')).toHaveLength(2)
  })

  it('opens the add form when Add button is clicked', () => {
    render(<CollaboratorList {...defaultProps} />)

    expect(screen.queryByText('New Collaborator Information')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /add collaborator/i }))

    expect(screen.getByText('New Collaborator Information')).toBeInTheDocument()
  })

  it('switches to edit mode when edit button is clicked for a collaborator', () => {
    render(<CollaboratorList {...defaultProps} />)

    expect(screen.getByText(mockCollaborators[0].name)).toBeInTheDocument()

    const firstCard = document.querySelectorAll('.collaborator-summary-card')[0]
    expect(firstCard.querySelector('.glyphicon-pencil')).toBeTruthy()

    const pencilIcon = document.querySelectorAll('.glyphicon-pencil')[0]
    fireEvent.click(pencilIcon.parentElement as HTMLElement)

    expect(screen.getByText(`Edit ${mockCollaborators[0].name} Information`)).toBeInTheDocument()
    expect((document.getElementById('name') as HTMLInputElement).value).toBe(mockCollaborators[0].name)
    expect((document.getElementById('title') as HTMLInputElement).value).toBe(mockCollaborators[0].title)
  })

  it('deletes a collaborator when delete is confirmed', async () => {
    const onCollaboratorChange = vi.fn()

    render(
      <CollaboratorList
        {...defaultProps}
        onCollaboratorChange={onCollaboratorChange}
      />,
    )

    expect(document.querySelectorAll('.collaborator-summary-card')).toHaveLength(2)

    const trashIcon = document.querySelectorAll('.glyphicon-trash')[0]
    fireEvent.click(trashIcon.parentElement as HTMLElement)

    const deleteButton = document.querySelector('.delete-modal-primary-button') as HTMLElement
    fireEvent.click(deleteButton)

    expect(onCollaboratorChange).toHaveBeenCalledOnce()
  })

  it('adds a new collaborator when adding through the form', () => {
    const onCollaboratorChange = vi.fn()

    render(
      <CollaboratorList
        {...defaultProps}
        onCollaboratorChange={onCollaboratorChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /add collaborator/i }))

    const nameInput = document.getElementById('name') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'New Person' } })
    fireEvent.blur(nameInput)

    const eraInput = document.getElementById('eraCommonsId') as HTMLInputElement
    fireEvent.change(eraInput, { target: { value: 'newperson123' } })
    fireEvent.blur(eraInput)

    const titleInput = document.getElementById('title') as HTMLInputElement
    fireEvent.change(titleInput, { target: { value: 'New Title' } })
    fireEvent.blur(titleInput)

    const emailInput = document.getElementById('email') as HTMLInputElement
    fireEvent.change(emailInput, { target: { value: 'new.person@example.com' } })
    fireEvent.blur(emailInput)

    const saveButton = document.querySelector('.collaborator-form-add-save-button') as HTMLElement
    fireEvent.click(saveButton)

    expect(onCollaboratorChange).toHaveBeenCalled()
  })

  it('updates a collaborator when editing through the form', () => {
    const onCollaboratorChange = vi.fn()

    render(
      <CollaboratorList
        {...defaultProps}
        onCollaboratorChange={onCollaboratorChange}
      />,
    )

    const pencilIcon = document.querySelectorAll('.glyphicon-pencil')[0]
    fireEvent.click(pencilIcon.parentElement as HTMLElement)

    const nameInput = document.getElementById('name') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } })

    fireEvent.click(screen.getByText('Save'))

    expect(onCollaboratorChange).toHaveBeenCalledOnce()
  })

  it('closes the add form when Cancel is clicked', () => {
    render(<CollaboratorList {...defaultProps} />)

    fireEvent.click(screen.getByRole('button', { name: /add collaborator/i }))
    expect(screen.getByText('New Collaborator Information')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Cancel'))

    expect(screen.queryByText('New Collaborator Information')).not.toBeInTheDocument()
  })

  it('disables the Add button when readOnly prop is true', () => {
    render(<CollaboratorList {...defaultProps} readOnly={true} />)

    const addButton = screen.getByRole('button', { name: /add collaborator/i })
    expect(addButton).toBeInTheDocument()
    expect(addButton).toBeDisabled()
  })

  it('renders correctly with empty collaborators list', () => {
    render(
      <CollaboratorList
        {...defaultProps}
        collaborators={[]}
      />,
    )

    expect(screen.getByRole('button', { name: /add collaborator/i })).toBeInTheDocument()

    expect(document.querySelectorAll('.collaborator-summary-card')).toHaveLength(0)
  })

  it('renders correctly with custom columnsToShow', () => {
    render(
      <CollaboratorList
        {...defaultProps}
        columnsToShow={['name']}
      />,
    )

    expect(screen.getByText(mockCollaborators[0].name)).toBeInTheDocument()
    expect(screen.queryByText(mockCollaborators[0].title!)).not.toBeInTheDocument()
    expect(screen.queryByText(mockCollaborators[0].email!)).not.toBeInTheDocument()
  })

  it('clears edit state after a successful edit', () => {
    render(<CollaboratorList {...defaultProps} />)

    const pencilIcon = document.querySelectorAll('.glyphicon-pencil')[0]
    fireEvent.click(pencilIcon.parentElement as HTMLElement)
    expect(screen.getByText(`Edit ${mockCollaborators[0].name} Information`)).toBeInTheDocument()

    fireEvent.click(screen.getByText('Save'))

    expect(screen.queryByText(`Edit ${mockCollaborators[0].name} Information`)).not.toBeInTheDocument()
    expect(screen.getByText(mockCollaborators[0].name)).toBeInTheDocument()
  })

  it('maintains proper edit state when editing multiple collaborators', () => {
    render(<CollaboratorList {...defaultProps} />)

    const pencilIcons = document.querySelectorAll('.glyphicon-pencil')
    fireEvent.click(pencilIcons[0].parentElement as HTMLElement)
    expect(screen.getByText(`Edit ${mockCollaborators[0].name} Information`)).toBeInTheDocument()

    expect(screen.getByText(mockCollaborators[1].name)).toBeInTheDocument()

    fireEvent.click(screen.getByText('Cancel'))

    expect(screen.getByText(mockCollaborators[0].name)).toBeInTheDocument()
    expect(screen.getByText(mockCollaborators[1].name)).toBeInTheDocument()

    const pencilIconsAfter = document.querySelectorAll('.glyphicon-pencil')
    fireEvent.click(pencilIconsAfter[1].parentElement as HTMLElement)

    expect(screen.getByText(mockCollaborators[0].name)).toBeInTheDocument()
    expect(screen.getByText(`Edit ${mockCollaborators[1].name} Information`)).toBeInTheDocument()
  })

  it('displays view icon instead of edit/delete icons in read-only mode', () => {
    const readOnlyProps = {
      ...defaultProps,
      readOnly: true,
    }

    render(<CollaboratorList {...readOnlyProps} />)

    // Should show Add button but disabled in read-only mode
    const addButton = screen.getByRole('button', { name: /add collaborator/i })
    expect(addButton).toBeInTheDocument()
    expect(addButton).toBeDisabled()

    expect(document.querySelectorAll('.collaborator-summary-card')).toHaveLength(2)

    // Should show view icon (eye) instead of edit/delete icons
    const firstCard = document.querySelectorAll('.collaborator-summary-card')[0]
    expect(firstCard.querySelector('.glyphicon-eye-open')).toBeTruthy()
    expect(firstCard.querySelector('.glyphicon-pencil')).toBeNull()
    expect(firstCard.querySelector('.glyphicon-trash')).toBeNull()
  })

  it('opens read-only collaborator details when view icon is clicked', () => {
    const readOnlyProps = {
      ...defaultProps,
      readOnly: true,
    }

    render(<CollaboratorList {...readOnlyProps} />)

    expect(document.querySelectorAll('.collaborator-summary-card')).toHaveLength(2)
    expect(document.querySelector('.glyphicon-eye-open')).toBeTruthy()

    // Click the view icon
    const eyeIcon = document.querySelectorAll('.glyphicon-eye-open')[0]
    fireEvent.click(eyeIcon.parentElement as HTMLElement)

    // Should open read-only view with correct header
    expect(screen.getByText(`View ${mockCollaborators[0].name} Information`)).toBeInTheDocument()

    // Form fields should be disabled
    expect((document.getElementById('name') as HTMLInputElement).disabled).toBe(true)
    expect((document.getElementById('email') as HTMLInputElement).disabled).toBe(true)

    // Within the collaborator form, only Close button should be present (no Add/Save)
    const formCard = document.querySelector('.collaborator-form-card') as HTMLElement
    expect(formCard.querySelector('button[class*="collaborator-form-add-save-button"]')).toBeNull()
    expect(screen.getByText('Close')).toBeInTheDocument()
  })
})
