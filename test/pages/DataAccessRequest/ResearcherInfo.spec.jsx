import React, { useEffect, useState } from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResearcherInfo from 'src/pages/dar_application/ResearcherInfo'
import { User } from 'src/libs/ajax/User.js'
import { renderWithRouter } from '../../test-utils'

vi.mock('src/libs/ajax/User.js', () => ({
  User: {
    getMe: vi.fn(),
  },
}))

const props = {
  allSigningOfficials: [],
  countriesOfOperation: ['United States of America (the)', 'France', 'Canada'],
  darCode: undefined,
  eRACommonsDestination: undefined,
  formFieldChange: vi.fn(),
  onNihStatusUpdate: vi.fn(),
  setLabCollaboratorsCompleted: vi.fn(),
  setInternalCollaboratorsCompleted: vi.fn(),
  setExternalCollaboratorsCompleted: vi.fn(),
  researcher: { displayName: 'Sample Researcher', email: 'researcher@example.test' },
  showValidationMessages: false,
  validation: {},
  formValidationChange: vi.fn(),
  formData: {
    cloudProviderType: '',
    cloudProvider: '',
    cloudProviderDescription: '',
    internalCollaborators: [],
    externalCollaborators: [],
    labCollaborators: [],
    piName: 'Sample Principal Investigator',
    piEmail: 'pi@example.test',
  },
}

const researcherWithLibraryCard = {
  libraryCard: {
    id: 1,
    userId: 1,
    institutionId: 150,
    eraCommonsId: 'user',
    userName: 'Sample User',
    userEmail: 'sample.user@example.test',
    institution: {
      id: 150,
      name: 'The Broad Institute of MIT and Harvard',
    },
  },
}

const renderResearcherInfo = (overrideProps = {}) => renderWithRouter(<ResearcherInfo {...props} {...overrideProps} />)

const byId = id => document.getElementById(id)
const getSection = dataCy => document.querySelector(`[data-cy="${dataCy}"]`)

const openAddCollaboratorForm = async (user, dataCy) => {
  const section = getSection(dataCy)
  expect(section).not.toBeNull()
  await user.click(within(section).getByRole('button', { name: /add/i }))
  return section
}

const fillCollaboratorForm = async (user, { name, eraCommonsId, title, email }) => {
  const nameInput = byId('0_collaboratorName')
  const eraInput = byId('0_collaboratorEraCommonsId')
  const titleInput = byId('0_collaboratorTitle')
  const emailInput = byId('0_collaboratorEmail')

  expect(nameInput).not.toBeNull()
  expect(eraInput).not.toBeNull()
  expect(titleInput).not.toBeNull()
  expect(emailInput).not.toBeNull()

  await user.clear(nameInput)
  await user.type(nameInput, name)
  await user.clear(eraInput)
  await user.type(eraInput, eraCommonsId)
  await user.clear(titleInput)
  await user.type(titleInput, title)
  await user.clear(emailInput)
  await user.type(emailInput, email)
}

const AsyncResearcherWrapper = (componentProps) => {
  const [asyncResearcher, setAsyncResearcher] = useState({})

  useEffect(() => {
    const timer = setTimeout(() => {
      setAsyncResearcher({ displayName: 'Sample Researcher', email: 'researcher@example.test' })
    }, 50)

    return () => clearTimeout(timer)
  }, [])

  return <ResearcherInfo {...componentProps} researcher={asyncResearcher} />
}

describe('Researcher Info', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    User.getMe.mockReturnValue({
      userId: 1,
      displayName: 'Sample User',
      email: 'sample.user@example.test',
    })
  })

  it('does not show the library card warning before async researcher load completes', async () => {
    renderWithRouter(<AsyncResearcherWrapper {...props} />)

    expect(document.querySelector('[data-cy="researcher-info-library-card-required"]')).toBeNull()

    await waitFor(() => {
      expect(document.querySelector('[data-cy="researcher-info-library-card-required"]')).not.toBeNull()
    }, { timeout: 2000 })
  })

  it('renders the library card required alert when researcher has no library card', () => {
    renderResearcherInfo({ formData: { ...props.formData } })
    expect(document.querySelector('[data-cy="researcher-info-library-card-required"]')).not.toBeNull()
  })

  it('does not render the library card required alert when researcher has a library card', () => {
    renderResearcherInfo({ researcher: researcherWithLibraryCard })
    expect(document.querySelector('[data-cy="researcher-info-library-card-required"]')).toBeNull()
  })

  it('hides the alert content inside the library card required section in read-only mode', () => {
    renderResearcherInfo({ readOnlyMode: true })
    expect(document.querySelector('[data-cy="researcher-info-library-card-required"]')).not.toBeNull()
    expect(document.querySelector('#libraryCardRequired')).toBeNull()
  })

  it('renders the internal lab staff button and form', async () => {
    const user = userEvent.setup()
    renderResearcherInfo()

    const section = await openAddCollaboratorForm(user, 'internal-lab-staff')
    await waitFor(() => {
      expect(section.querySelector('.form-group')).not.toBeNull()
    })
  })

  it('renders the internal collaborator button and form', async () => {
    const user = userEvent.setup()
    renderResearcherInfo()

    const section = await openAddCollaboratorForm(user, 'internal-collaborators')
    await waitFor(() => {
      expect(section.querySelector('.form-group')).not.toBeNull()
    })
  })

  it('renders the external collaborator button and form', async () => {
    const user = userEvent.setup()
    renderResearcherInfo()

    const section = await openAddCollaboratorForm(user, 'external-collaborators')
    await waitFor(() => {
      expect(section.querySelector('.form-group')).not.toBeNull()
    })
  })

  it('saves new collaborators properly', async () => {
    const user = userEvent.setup()
    renderResearcherInfo()

    await openAddCollaboratorForm(user, 'internal-lab-staff')
    await fillCollaboratorForm(user, {
      name: 'Sample Collaborator',
      eraCommonsId: '12345',
      title: 'Analyst',
      email: 'sample.collaborator@example.test',
    })

    const approval = byId('0_collaboratorApproval_true')
    const saveButton = document.querySelector('.collaborator-form-add-save-button')
    expect(approval).not.toBeNull()
    expect(saveButton).not.toBeNull()

    await user.click(approval)
    await user.click(saveButton)

    await waitFor(() => {
      expect(byId('0_summary')).not.toBeNull()
    })

    expect(byId('0_name')?.textContent).toBe('Sample Collaborator')
    expect(byId('0_title')?.textContent).toBe('Analyst')
    expect(byId('0_eraCommonsId')?.textContent).toBe('12345')
    expect(byId('0_email')?.textContent).toBe('sample.collaborator@example.test')
  })

  it('deletes saved collaborators properly', async () => {
    const user = userEvent.setup()
    renderResearcherInfo()

    await openAddCollaboratorForm(user, 'internal-lab-staff')
    await fillCollaboratorForm(user, {
      name: 'Sample Collaborator',
      eraCommonsId: '12345',
      title: 'Analyst',
      email: 'sample.collaborator@example.test',
    })

    const approval = byId('0_collaboratorApproval_true')
    const saveButton = document.querySelector('.collaborator-form-add-save-button')
    expect(approval).not.toBeNull()
    expect(saveButton).not.toBeNull()

    await user.click(approval)
    await user.click(saveButton)

    const deleteMember = byId('0_deleteMember')
    expect(deleteMember).not.toBeNull()
    await user.click(deleteMember)

    await waitFor(() => {
      expect(document.querySelector('.delete-modal-primary-button')).not.toBeNull()
    })
  })

  it('cancels adding new collaborators properly', async () => {
    const user = userEvent.setup()
    renderResearcherInfo()

    await openAddCollaboratorForm(user, 'internal-lab-staff')
    await fillCollaboratorForm(user, {
      name: 'Sample Collaborator',
      eraCommonsId: '12345',
      title: 'Analyst',
      email: 'sample.collaborator@example.test',
    })

    const approval = byId('0_collaboratorApproval_true')
    const cancelButton = document.querySelector('.collaborator-form-cancel-button')
    expect(approval).not.toBeNull()
    expect(cancelButton).not.toBeNull()

    await user.click(approval)
    await user.click(cancelButton)

    await waitFor(() => {
      expect(byId('0_collaboratorName')).toBeNull()
    })
    expect(byId('0_summary')).toBeNull()
  })

  it('updates collaborator properly', async () => {
    const user = userEvent.setup()
    renderResearcherInfo()

    await openAddCollaboratorForm(user, 'internal-lab-staff')
    await fillCollaboratorForm(user, {
      name: 'Sample Collaborator',
      eraCommonsId: '12345',
      title: 'Analyst',
      email: 'sample.collaborator@example.test',
    })

    const approval = byId('0_collaboratorApproval_true')
    const saveButton = document.querySelector('.collaborator-form-add-save-button')
    expect(approval).not.toBeNull()
    expect(saveButton).not.toBeNull()

    await user.click(approval)
    await user.click(saveButton)

    // edit and switch back to form view
    const editButton = byId('0_editCollaborator')
    expect(editButton).not.toBeNull()
    await user.click(editButton)

    await waitFor(() => {
      expect(byId('0_summary')).toBeNull()
    })

    const section = getSection('internal-lab-staff')
    expect(section).not.toBeNull()
    expect(section.querySelector('.form-group')).not.toBeNull()

    await fillCollaboratorForm(user, {
      name: 'Updated Collaborator',
      eraCommonsId: '12345',
      title: 'Analyst',
      email: 'sample.collaborator@example.test',
    })

    const saveButtonOnEdit = document.querySelector('.collaborator-form-add-save-button')
    expect(saveButtonOnEdit).not.toBeNull()
    await user.click(saveButtonOnEdit)

    await waitFor(() => {
      expect(byId('0_summary')).not.toBeNull()
    })
    expect(byId('0_name')?.textContent).toBe('Updated Collaborator')

    // also check delete on edit form
    const editAgain = byId('0_editCollaborator')
    expect(editAgain).not.toBeNull()
    await user.click(editAgain)

    const deleteMember = byId('0_deleteMember')
    expect(deleteMember).not.toBeNull()
    await user.click(deleteMember)

    const confirmDelete = document.querySelector('.delete-modal-primary-button')
    expect(confirmDelete).not.toBeNull()
    await user.click(confirmDelete)

    await waitFor(() => {
      expect(byId('0_summary')).toBeNull()
    })
  })

  it('renders researcher and pi as disabled with pi fields populated with the researcher data when not in read only mode', () => {
    renderResearcherInfo()
    expect(byId('researcherName')?.value).toBe(props.researcher.displayName)
    expect(byId('piName')?.value).toBe(props.researcher.displayName)
    expect(byId('piEmail')?.value).toBe(props.researcher.email)
  })

  it('renders researcher and pi as disabled with pi fields populated with saved pi info in read only mode', () => {
    renderResearcherInfo({ readOnlyMode: true, eraCommonsId: 'scoobydoo' })
    expect(byId('researcherName')?.value).toBe(props.researcher.displayName)
    expect(byId('piName')?.value).toBe(props.formData.piName)
    expect(byId('piEmail')?.value).toBe(props.formData.piEmail)
    expect(screen.getByText('scoobydoo')).not.toBeNull()
  })
})
