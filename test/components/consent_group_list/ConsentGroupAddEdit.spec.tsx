import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ConsentGroupAddEdit from 'src/components/consent_group_list/ConsentGroupAddEdit'
import { ConsentGroup2 } from 'src/pages/data_submission/consent_group/consentGroupUtils'
import ConsentGroupList from 'src/components/consent_group_list/ConsentGroupList'
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

async function fillConsentGroupForm(
  user: ReturnType<typeof userEvent.setup>,
  container: HTMLElement,
  overrides: Partial<ConsentGroup2> = {},
) {
  await user.type(container.querySelector('#consentGroupName')!, overrides.consentGroupName ?? 'New Consent Group')
  await user.click(container.querySelector('#accessManagement_open')!)
  await user.clear(container.querySelector('#numberOfParticipants')!)
  await user.type(container.querySelector('#numberOfParticipants')!, (overrides.numberOfParticipants ?? 25).toString())
  await user.click(container.querySelector('#dataLocation')!)
  await user.type(container.querySelector('#dataLocation')!, (overrides.dataLocation ?? 'Terra Workspace') + '{Enter}')
  await user.type(container.querySelector('#url')!, overrides.url ?? 'https://www.example.com')
  await user.type(container.querySelector('#tags')!, 'tag1{Enter}tag2{Enter}')
}

async function clickSaveButton(user: ReturnType<typeof userEvent.setup>, container: HTMLElement) {
  await user.click(container.querySelector('.collaborator-form-add-save-button')!)
}

describe('ConsentGroupAddEdit requestLocation', () => {
  it('renders the Request Location field', () => {
    const { container } = render(
      <MemoryRouter>
        <ConsentGroupAddEdit
          id={0}
          consentGroups={[]}
          closeAction={vi.fn()}
          onConsentGroupChange={vi.fn()}
        />
      </MemoryRouter>,
    )
    expect(container.querySelector('#requestLocation')).toBeInTheDocument()
  })

  it('pre-fills Request Location when editing an existing consent group', () => {
    const existingGroup: ConsentGroup2 = {
      ...sampleConsentGroup,
      requestLocation: 'https://request.example.org/apply',
    }
    const { container } = render(
      <MemoryRouter>
        <ConsentGroupAddEdit
          consentGroup={existingGroup}
          consentGroups={[existingGroup]}
          id={0}
          closeAction={vi.fn()}
          onConsentGroupChange={vi.fn()}
        />
      </MemoryRouter>,
    )
    expect(container.querySelector('#requestLocation')).toHaveValue('https://request.example.org/apply')
  })

  it('saves a new consent group with a requestLocation value', async () => {
    const user = userEvent.setup()
    const collected: ConsentGroup2[] = []
    const { container } = render(
      <MemoryRouter>
        <ConsentGroupList
          consentGroups={[]}
          columnsToShow={['consentGroupName']}
          onConsentGroupChange={(items) => { collected.splice(0, collected.length, ...items) }}
          disabled={false}
        />
      </MemoryRouter>,
    )
    await user.click(container.querySelector('#add-consent-group-btn')!)
    await fillConsentGroupForm(user, container)
    await user.type(container.querySelector('#requestLocation')!, 'https://request.example.org/apply')
    await clickSaveButton(user, container)

    expect(collected).toHaveLength(1)
    expect(collected[0].requestLocation).toBe('https://request.example.org/apply')
  })

  it('saves a consent group without requestLocation when field is left empty', async () => {
    const user = userEvent.setup()
    const collected: ConsentGroup2[] = []
    const { container } = render(
      <MemoryRouter>
        <ConsentGroupList
          consentGroups={[]}
          columnsToShow={['consentGroupName']}
          onConsentGroupChange={(items) => { collected.splice(0, collected.length, ...items) }}
          disabled={false}
        />
      </MemoryRouter>,
    )
    await user.click(container.querySelector('#add-consent-group-btn')!)
    await fillConsentGroupForm(user, container)
    // Leave requestLocation blank
    await clickSaveButton(user, container)

    expect(collected).toHaveLength(1)
    expect(collected[0].requestLocation).toBeUndefined()
  })
})
