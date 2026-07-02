import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import CollaboratorForm from 'src/pages/dar_application/collaborator/CollaboratorForm'

interface MockSelectOption {
  key?: string
  value?: string
  displayText?: string
}

interface MockSelectProps {
  id?: string
  onChange: (value: unknown) => void
  options?: MockSelectOption[]
  isDisabled?: boolean
  getOptionLabel?: (option: MockSelectOption) => string
}

// react-select renders a combobox with no real <input>/<select> element, which jsdom's
// fireEvent can't drive directly. Swap it for a plain <select>, matching the pattern used
// in test/pages/dar_application/DataAccessRequestApplication*.spec.tsx.
vi.mock('react-select', () => ({
  default: (props: MockSelectProps) => React.createElement(
    'select',
    {
      id: props.id,
      disabled: props.isDisabled,
      onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = props.options?.[Number(e.target.value)]
        props.onChange(selected)
      },
    },
    [
      React.createElement('option', { key: 'placeholder', value: '' }, ''),
      ...(props.options ?? []).map((option, index) =>
        React.createElement(
          'option',
          { key: index, value: String(index) },
          props.getOptionLabel?.(option),
        )),
    ],
  ),
}))

// DeleteCollaboratorModal renders a react-modal Modal; swap it for a plain div so the
// confirmation content is always in the DOM without needing Modal.setAppElement().
vi.mock('react-modal', () => {
  const Modal = ({ isOpen, children }: { isOpen: boolean, children?: React.ReactNode }) => {
    if (!isOpen) return null
    return <div>{children}</div>
  }
  Modal.setAppElement = () => {}
  return { default: Modal }
})

const clickById = async (id: string) => {
  await act(async () => {
    fireEvent.click(document.getElementById(id)!)
  })
}

const typeById = async (id: string, value: string) => {
  await act(async () => {
    fireEvent.change(document.getElementById(id)!, { target: { value } })
  })
}

const selectOptionByLabel = async (selectId: string, labelSubstring: string) => {
  const select = document.getElementById(selectId) as HTMLSelectElement
  const option = Array.from(select.options).find(o => o.textContent?.includes(labelSubstring))
  await act(async () => {
    fireEvent.change(select, { target: { value: option!.value } })
  })
}

const baseProps = {
  index: 0,
  collaboratorKey: 'internalCollaborators',
  collaboratorLabel: 'Internal Collaborator',
  countriesOfOperation: ['United States of America (the)', 'Canada'],
  validation: {},
  // Matches real usage in ResearcherInfo.tsx, where Internal/External Collaborator lists pass
  // showApproval={false}. computeCollaboratorErrors defaults needsApproverStatus to true when
  // this is omitted, which would otherwise block every save in these tests.
  showApproval: false,
  onCollaboratorValidationChange: vi.fn(),
  saveCollaborator: vi.fn(),
  updateEditState: vi.fn(),
}

const fillRequiredFields = async () => {
  await typeById('0_collaboratorName', 'Jane Doe')
  await typeById('0_collaboratorEraCommonsId', 'janedoe')
  await typeById('0_collaboratorTitle', 'Research Assistant')
  await typeById('0_collaboratorEmail', 'jane@example.com')
  await selectOptionByLabel('0_collaboratorCountryOfOperation', 'United States')
}

describe('CollaboratorForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the "New" header and Add button when no collaborator is provided', () => {
    render(<CollaboratorForm {...baseProps} />)

    expect(screen.getByText('New Internal Collaborator Information')).toBeInTheDocument()
    expect(document.getElementById('collaborator-internalCollaborators-add-save')).toHaveTextContent('Add')
  })

  it('does not render the delete trigger for a new collaborator', () => {
    render(<CollaboratorForm {...baseProps} />)

    expect(document.getElementById('0_deleteMember')).not.toBeInTheDocument()
  })

  it('reports required-field errors and does not save when Add is clicked with empty fields', async () => {
    render(<CollaboratorForm {...baseProps} />)

    await clickById('collaborator-internalCollaborators-add-save')

    // countryOfOperation isn't included: it autopopulates with Countries.DEFAULT_COUNTRY on
    // mount for a new collaborator, so it's never empty by the time Add can be clicked.
    expect(baseProps.onCollaboratorValidationChange).toHaveBeenCalledWith(
      expect.objectContaining({
        index: 0,
        validation: {
          name: { valid: false, failed: ['required'] },
          eraCommonsId: { valid: false, failed: ['required'] },
          title: { valid: false, failed: ['required'] },
          email: { valid: false, failed: ['required'] },
        },
      }),
    )
    expect(baseProps.saveCollaborator).not.toHaveBeenCalled()
    expect(baseProps.updateEditState).not.toHaveBeenCalled()
  })

  it('saves a valid new collaborator and resets edit state', async () => {
    render(<CollaboratorForm {...baseProps} />)

    await fillRequiredFields()
    await clickById('collaborator-internalCollaborators-add-save')

    expect(baseProps.saveCollaborator).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Jane Doe',
        eraCommonsId: 'janedoe',
        title: 'Research Assistant',
        email: 'jane@example.com',
        countryOfOperation: 'United States of America (the)',
      }),
    )
    expect(baseProps.updateEditState).toHaveBeenCalledWith(false)
  })

  it('Cancel button resets edit state without saving', async () => {
    render(<CollaboratorForm {...baseProps} />)

    await act(async () => {
      fireEvent.click(document.querySelector('.collaborator-form-cancel-button')!)
    })

    expect(baseProps.updateEditState).toHaveBeenCalledWith(false)
    expect(baseProps.saveCollaborator).not.toHaveBeenCalled()
  })

  it('requires an approver status when showApproval is true, and accepts a selection', async () => {
    render(<CollaboratorForm {...baseProps} showApproval={true} />)

    await fillRequiredFields()
    await clickById('collaborator-internalCollaborators-add-save')
    expect(baseProps.onCollaboratorValidationChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        validation: expect.objectContaining({
          approverStatus: { valid: false, failed: ['required'] },
        }),
      }),
    )
    expect(baseProps.saveCollaborator).not.toHaveBeenCalled()

    await clickById('0_collaboratorApproval_true')
    await clickById('collaborator-internalCollaborators-add-save')

    expect(baseProps.saveCollaborator).toHaveBeenCalledWith(
      expect.objectContaining({ approverStatus: 'true' }),
    )
  })
})
