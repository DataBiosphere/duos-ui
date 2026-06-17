import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CollaboratorAddEdit from 'src/components/collaborator_list/CollaboratorAddEdit'
import { Collaborator } from 'src/types/model'

describe('CollaboratorAddEdit - Component Tests', () => {
  const mockCollaborator: Collaborator = {
    name: 'John Doe',
    title: 'Researcher',
    email: 'john.doe@example.com',
    uuid: '123e4567-e89b-12d3-a456-426614174000',
    eraCommonsId: 'jdoe123',
    countryOfOperation: 'United States of America (the)',
    approverStatus: false,
  }

  const mockCollaborators: Collaborator[] = [mockCollaborator]

  const defaultProps = {
    id: -1,
    collaborator: { countryOfOperation: 'United States of America (the)' } as Collaborator,
    collaboratorText: 'Collaborator',
    collaborators: mockCollaborators,
    closeAction: vi.fn(),
    countriesOfOperation: ['France', 'Canada', 'United States of America (the)'],
    onCollaboratorChange: vi.fn(),
    deleteAction: vi.fn(),
  }

  const approverProps = {
    ...defaultProps,
    showApproverStatus: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the component correctly for adding a new collaborator', () => {
    render(<CollaboratorAddEdit {...defaultProps} />)

    expect(screen.getByText('New Collaborator Information')).toBeInTheDocument()
    expect(screen.getByText(/Collaborator Name/)).toBeInTheDocument()
    expect(screen.getByText(/Collaborator Title/)).toBeInTheDocument()
    expect(screen.getByText(/Collaborator Email/)).toBeInTheDocument()
    expect(screen.getByText('Add')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('renders the component correctly for editing an existing collaborator', () => {
    render(
      <CollaboratorAddEdit
        {...defaultProps}
        id={0}
        collaborator={mockCollaborator}
      />,
    )

    expect(screen.getByText(`Edit ${mockCollaborator.name} Information`)).toBeInTheDocument()
    expect((document.getElementById('name') as HTMLInputElement).value).toBe(mockCollaborator.name)
    expect((document.getElementById('title') as HTMLInputElement).value).toBe(mockCollaborator.title)
    expect((document.getElementById('email') as HTMLInputElement).value).toBe(mockCollaborator.email)
    expect(screen.getByText('Save')).toBeInTheDocument()
  })

  it('calls closeAction when Cancel button is clicked', () => {
    const closeAction = vi.fn()
    render(<CollaboratorAddEdit {...defaultProps} closeAction={closeAction} />)

    fireEvent.click(screen.getByText('Cancel'))
    expect(closeAction).toHaveBeenCalledOnce()
  })

  it('calls onCollaboratorChange when Save button is clicked for existing collaborator', () => {
    const onCollaboratorChange = vi.fn()
    render(
      <CollaboratorAddEdit
        {...defaultProps}
        id={0}
        collaborator={mockCollaborator}
        onCollaboratorChange={onCollaboratorChange}
      />,
    )

    const nameInput = screen.getByRole('textbox', { name: /collaborator name/i })
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } })

    const eraInput = document.getElementById('eraCommonsId') as HTMLInputElement
    fireEvent.change(eraInput, { target: { value: 'janedoe456' } })

    const titleInput = screen.getByRole('textbox', { name: /collaborator title/i })
    fireEvent.change(titleInput, { target: { value: 'Senior Researcher' } })

    const emailInput = screen.getByRole('textbox', { name: /collaborator email/i })
    fireEvent.change(emailInput, { target: { value: 'janedoe@example.com' } })

    fireEvent.click(screen.getByText('Save'))

    expect(onCollaboratorChange).toHaveBeenCalledOnce()
  })

  it('calls both onCollaboratorChange and closeAction when Add button is clicked', () => {
    const closeAction = vi.fn()
    const onCollaboratorChange = vi.fn()

    render(
      <CollaboratorAddEdit
        {...defaultProps}
        closeAction={closeAction}
        onCollaboratorChange={onCollaboratorChange}
      />,
    )

    fireEvent.change(screen.getByRole('textbox', { name: /collaborator name/i }), { target: { value: 'Test Name' } })
    fireEvent.change(document.getElementById('eraCommonsId') as HTMLInputElement, { target: { value: 'example123' } })
    fireEvent.change(screen.getByRole('textbox', { name: /collaborator title/i }), { target: { value: 'Test Title' } })
    fireEvent.change(screen.getByRole('textbox', { name: /collaborator email/i }), { target: { value: 'test@example.com' } })

    fireEvent.click(screen.getByText('Add'))

    expect(onCollaboratorChange).toHaveBeenCalledOnce()
    expect(closeAction).toHaveBeenCalledOnce()
  })

  it('updates form fields when typing', () => {
    render(<CollaboratorAddEdit {...defaultProps} />)

    const nameInput = screen.getByRole('textbox', { name: /collaborator name/i }) as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'Test Name' } })
    expect(nameInput.value).toBe('Test Name')

    const titleInput = screen.getByRole('textbox', { name: /collaborator title/i }) as HTMLInputElement
    fireEvent.change(titleInput, { target: { value: 'Test Title' } })
    expect(titleInput.value).toBe('Test Title')

    const emailInput = screen.getByRole('textbox', { name: /collaborator email/i }) as HTMLInputElement
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    expect(emailInput.value).toBe('test@example.com')
  })

  it('shows validation error for empty required fields', () => {
    render(<CollaboratorAddEdit {...defaultProps} />)

    const nameInput = screen.getByRole('textbox', { name: /collaborator name/i })
    fireEvent.focus(nameInput)
    fireEvent.blur(nameInput)

    const titleInput = screen.getByRole('textbox', { name: /collaborator title/i })
    fireEvent.focus(titleInput)
    fireEvent.blur(titleInput)

    const emailInput = screen.getByRole('textbox', { name: /collaborator email/i })
    fireEvent.focus(emailInput)
    fireEvent.blur(emailInput)

    const errorMessages = document.querySelectorAll('.error-message')
    expect(errorMessages.length).toBeGreaterThan(0)
  })

  it('shows validation error for invalid email format', () => {
    render(<CollaboratorAddEdit {...defaultProps} />)

    const emailInput = screen.getByRole('textbox', { name: /collaborator email/i })
    fireEvent.change(emailInput, { target: { value: 'invalid' } })
    fireEvent.blur(emailInput)

    const emailParent = emailInput.closest('.form-group') || emailInput.parentElement
    const errorMessage = emailParent?.querySelector('.error-message')
    expect(errorMessage).toBeTruthy()
  })

  it('shows the approver status radio button, emits true for yes', () => {
    const onCollaboratorChange = vi.fn()
    render(<CollaboratorAddEdit {...approverProps} onCollaboratorChange={onCollaboratorChange} />)

    expect(document.getElementById('-1_collaboratorApproval')).toBeTruthy()

    fireEvent.change(screen.getByRole('textbox', { name: /collaborator name/i }), { target: { value: 'Test Name' } })
    const eraInputs = document.querySelectorAll('input[name="eraCommonsId"]')
    if (eraInputs.length > 0) {
      fireEvent.change(eraInputs[0], { target: { value: 'example123' } })
    }
    fireEvent.change(screen.getByRole('textbox', { name: /collaborator title/i }), { target: { value: 'Test Title' } })
    fireEvent.change(screen.getByRole('textbox', { name: /collaborator email/i }), { target: { value: 'test@example.com' } })

    const trueRadio = document.getElementById('-1_collaboratorApproval_true') as HTMLElement
    fireEvent.click(trueRadio)

    fireEvent.click(screen.getByText('Add'))

    expect(onCollaboratorChange).toHaveBeenCalledWith([
      {
        name: 'John Doe',
        title: 'Researcher',
        email: 'john.doe@example.com',
        uuid: '123e4567-e89b-12d3-a456-426614174000',
        eraCommonsId: 'jdoe123',
        countryOfOperation: 'United States of America (the)',
        approverStatus: false,
      },
      {
        countryOfOperation: 'United States of America (the)',
        name: 'Test Name',
        eraCommonsId: 'example123',
        title: 'Test Title',
        email: 'test@example.com',
        approverStatus: 'true',
      },
    ])
  })

  it('shows the approver status radio button, emits false for no', () => {
    const onCollaboratorChange = vi.fn()
    render(<CollaboratorAddEdit {...approverProps} onCollaboratorChange={onCollaboratorChange} />)

    expect(document.getElementById('-1_collaboratorApproval')).toBeTruthy()

    fireEvent.change(screen.getByRole('textbox', { name: /collaborator name/i }), { target: { value: 'Test Name' } })
    const eraInputs = document.querySelectorAll('input[name="eraCommonsId"]')
    if (eraInputs.length > 0) {
      fireEvent.change(eraInputs[0], { target: { value: 'example123' } })
    }
    fireEvent.change(screen.getByRole('textbox', { name: /collaborator title/i }), { target: { value: 'Test Title' } })
    fireEvent.change(screen.getByRole('textbox', { name: /collaborator email/i }), { target: { value: 'test@example.com' } })

    const falseRadio = document.getElementById('-1_collaboratorApproval_false') as HTMLElement
    fireEvent.click(falseRadio)

    fireEvent.click(screen.getByText('Add'))

    expect(onCollaboratorChange).toHaveBeenCalledWith([
      {
        name: 'John Doe',
        title: 'Researcher',
        email: 'john.doe@example.com',
        uuid: '123e4567-e89b-12d3-a456-426614174000',
        eraCommonsId: 'jdoe123',
        countryOfOperation: 'United States of America (the)',
        approverStatus: false,
      },
      {
        countryOfOperation: 'United States of America (the)',
        name: 'Test Name',
        eraCommonsId: 'example123',
        title: 'Test Title',
        email: 'test@example.com',
        approverStatus: 'false',
      },
    ])
  })
})
