import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
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

describe('ConsentGroupAddEdit access management changes', () => {
  const renderForm = () => render(
    <MemoryRouter>
      <ConsentGroupAddEdit
        id={0}
        consentGroups={[]}
        closeAction={vi.fn()}
        onConsentGroupChange={vi.fn()}
      />
    </MemoryRouter>,
  )

  it.each(['controlled', 'external'])(
    'keeps a data use selected before %s access was chosen',
    async (strategy) => {
      const user = userEvent.setup()
      const { container } = renderForm()

      await user.click(container.querySelector('#primaryConsent_generalResearchUse')!)
      await user.click(container.querySelector(`#accessManagement_${strategy}`)!)

      const errored = Array.from(container.querySelectorAll('.errored')).map(el => el.textContent).join(' ')
      expect(errored).not.toContain('Primary Data Use Terms')
    },
  )

  it('clears the data use when switching to open access, which does not use it', async () => {
    const user = userEvent.setup()
    const { container } = renderForm()

    await user.click(container.querySelector('#primaryConsent_generalResearchUse')!)
    await user.click(container.querySelector('#accessManagement_open')!)

    expect(container.querySelector('#primaryConsent_generalResearchUse')).not.toBeInTheDocument()
  })

  it('drops the DAC when access management leaves controlled', async () => {
    const user = userEvent.setup()
    const { container } = renderForm()

    await user.click(container.querySelector('#accessManagement_controlled')!)
    expect(container.querySelector('#dataAccessCommitteeId')).toBeInTheDocument()

    await user.click(container.querySelector('#accessManagement_external')!)
    expect(container.querySelector('#dataAccessCommitteeId')).not.toBeInTheDocument()
  })

  // Re-checking the toggle writes the retained text back into the consent group, so text cleared
  // by a switch to open access must not come back with it
  it('does not restore secondary data use text cleared by open access', async () => {
    const user = userEvent.setup()
    const { container } = renderForm()

    await user.click(container.querySelector('#accessManagement_controlled')!)
    await user.click(container.querySelector('#gs')!)
    await user.type(container.querySelector('#gsText')!, 'USA only')

    await user.click(container.querySelector('#accessManagement_open')!)
    await user.click(container.querySelector('#accessManagement_controlled')!)
    await user.click(container.querySelector('#gs')!)

    expect(container.querySelector<HTMLInputElement>('#gsText')?.value ?? '').toBe('')
  })
})

// Consent rejects a write with more than one primary category, so the form must send exactly one
describe('ConsentGroupAddEdit primary data use exclusivity', () => {
  const renderList = (collected: ConsentGroup2[]) => render(
    <MemoryRouter>
      <ConsentGroupList
        consentGroups={[]}
        columnsToShow={['consentGroupName']}
        onConsentGroupChange={(items) => { collected.splice(0, collected.length, ...items) }}
        disabled={false}
      />
    </MemoryRouter>,
  )

  // External access keeps the primary fields visible without also requiring a DAC
  const fillRequiredFields = async (
    user: ReturnType<typeof userEvent.setup>,
    container: HTMLElement,
  ) => {
    await user.click(container.querySelector('#add-consent-group-btn')!)
    await user.type(container.querySelector('#consentGroupName')!, 'Exclusivity Group')
    await user.click(container.querySelector('#accessManagement_external')!)
    await user.clear(container.querySelector('#numberOfParticipants')!)
    await user.type(container.querySelector('#numberOfParticipants')!, '25')
  }

  it('clears the previous primary when a new one is selected', async () => {
    const user = userEvent.setup()
    const collected: ConsentGroup2[] = []
    const { container } = renderList(collected)
    await fillRequiredFields(user, container)

    await user.click(container.querySelector('#primaryConsent_hmb')!)
    await user.click(container.querySelector('#primaryConsent_generalResearchUse')!)
    await clickSaveButton(user, container)

    expect(collected).toHaveLength(1)
    expect(collected[0].generalResearchUse).toBe(true)
    expect(collected[0].hmb).toBe(false)
    expect(collected[0].poa).toBe(false)
    expect(collected[0].diseaseSpecificUse).toBeUndefined()
    expect(collected[0].otherPrimary).toBeUndefined()
  })

  it('clears a primary Other and its text when another primary is selected', async () => {
    const user = userEvent.setup()
    const collected: ConsentGroup2[] = []
    const { container } = renderList(collected)
    await fillRequiredFields(user, container)

    await user.click(container.querySelector('#primaryConsent_otherPrimary')!)
    await user.type(container.querySelector('#otherPrimaryText')!, 'Bespoke restriction')
    await user.click(container.querySelector('#primaryConsent_hmb')!)
    await clickSaveButton(user, container)

    expect(collected).toHaveLength(1)
    expect(collected[0].hmb).toBe(true)
    expect(collected[0].otherPrimary).toBeUndefined()
    expect(container.querySelector('#otherPrimaryText')).not.toBeInTheDocument()
  })

  it('clears a boolean primary when Other is selected', async () => {
    const user = userEvent.setup()
    const collected: ConsentGroup2[] = []
    const { container } = renderList(collected)
    await fillRequiredFields(user, container)

    await user.click(container.querySelector('#primaryConsent_generalResearchUse')!)
    await user.click(container.querySelector('#primaryConsent_otherPrimary')!)
    await user.type(container.querySelector('#otherPrimaryText')!, 'Bespoke restriction')
    await clickSaveButton(user, container)

    expect(collected).toHaveLength(1)
    expect(collected[0].otherPrimary).toBe('Bespoke restriction')
    expect(collected[0].generalResearchUse).toBe(false)
    expect(collected[0].hmb).toBe(false)
  })
})
