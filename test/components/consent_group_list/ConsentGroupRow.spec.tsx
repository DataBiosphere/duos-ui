import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ConsentGroup2 } from 'src/pages/data_submission/consent_group/consentGroupUtils'
import ConsentGroupRow from 'src/components/consent_group_list/ConsentGroupRow'
import { DataLocationType } from 'src/pages/data_submission/v2/v2-models'

vi.mock('src/libs/utils', async (importActual) => {
  const actual = await importActual<typeof import('src/libs/utils')>()
  return {
    ...actual,
    findOntologyTerms: vi.fn().mockResolvedValue([]),
    searchOntologyTerm: vi.fn().mockResolvedValue([]),
    Notifications: { showError: vi.fn(), showSuccess: vi.fn() },
  }
})

vi.mock('src/libs/ajax/DAC', () => ({
  DAC: { list: vi.fn().mockResolvedValue([]) },
}))

vi.mock('src/libs/ajax/DataSet', () => ({
  DataSet: { getNIHInstitutionalCertification: vi.fn().mockResolvedValue(undefined) },
}))

const sampleConsentGroup: ConsentGroup2 = {
  consentGroupId: 'cg1',
  consentGroupName: 'Test Consent Group',
  name: 'Test Consent Group',
  numberOfParticipants: 10,
  generalResearchUse: true,
  irb: false,
  accessManagement: 'open',
  dataLocation: DataLocationType.NotDetermined,
}

describe('ConsentGroupRow', () => {
  it('shows summary when not in edit mode and triggers editAction', async () => {
    const user = userEvent.setup()
    const editFn = vi.fn()
    const { container } = render(
      <MemoryRouter>
        <ConsentGroupRow
          id={0}
          editMode={false}
          consentGroup={sampleConsentGroup}
          consentGroups={[sampleConsentGroup]}
          columnsToShow={['consentGroupName']}
          editAction={editFn}
          deleteAction={vi.fn()}
          closeAction={vi.fn()}
          onConsentGroupChange={vi.fn()}
          disabled={false}
        />
      </MemoryRouter>,
    )
    expect(screen.getByText(sampleConsentGroup.consentGroupName)).toBeInTheDocument()
    await user.click(container.querySelector('.glyphicon-pencil')!)
    expect(editFn).toHaveBeenCalledTimes(1)
  })

  it('renders edit form when editMode true', () => {
    const { container } = render(
      <MemoryRouter>
        <ConsentGroupRow
          id={0}
          editMode={true}
          consentGroup={sampleConsentGroup}
          consentGroups={[sampleConsentGroup]}
          columnsToShow={['consentGroupName']}
          editAction={vi.fn()}
          deleteAction={vi.fn()}
          closeAction={vi.fn()}
          onConsentGroupChange={vi.fn()}
          disabled={false}
        />
      </MemoryRouter>,
    )
    expect(container.querySelector('#consentGroupName')).toHaveValue(sampleConsentGroup.consentGroupName)
  })

  it('renders view form when viewMode true and is read-only', () => {
    const { container } = render(
      <MemoryRouter>
        <ConsentGroupRow
          id={0}
          editMode={false}
          viewMode={true}
          consentGroup={sampleConsentGroup}
          consentGroups={[sampleConsentGroup]}
          columnsToShow={['consentGroupName']}
          editAction={vi.fn()}
          deleteAction={vi.fn()}
          closeAction={vi.fn()}
          viewAction={vi.fn()}
          onConsentGroupChange={vi.fn()}
          disabled={false}
        />
      </MemoryRouter>,
    )
    expect(container.querySelector('#consentGroupName')).toHaveValue(sampleConsentGroup.consentGroupName)
    expect(container.querySelector('#consentGroupName')).toBeDisabled()
    expect(container.querySelector('.collaborator-form-add-save-button')).not.toBeInTheDocument()
  })

  it('triggers viewAction when view button is clicked', async () => {
    const user = userEvent.setup()
    const viewFn = vi.fn()
    const { container } = render(
      <MemoryRouter>
        <ConsentGroupRow
          id={0}
          editMode={false}
          consentGroup={sampleConsentGroup}
          consentGroups={[sampleConsentGroup]}
          columnsToShow={['consentGroupName']}
          editAction={vi.fn()}
          deleteAction={vi.fn()}
          closeAction={vi.fn()}
          viewAction={viewFn}
          onConsentGroupChange={vi.fn()}
          disabled={false}
        />
      </MemoryRouter>,
    )
    await user.click(container.querySelector('.glyphicon-eye-open')!)
    expect(viewFn).toHaveBeenCalledTimes(1)
  })
})
