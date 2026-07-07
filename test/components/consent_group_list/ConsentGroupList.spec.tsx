import React from 'react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from 'react-modal'
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

const ConsentGroupListHarness: React.FC<{ initial: ConsentGroup2[] }> = ({ initial }) => {
  const [items, setItems] = React.useState<ConsentGroup2[]>(initial)
  return (
    <ConsentGroupList
      consentGroups={items}
      columnsToShow={['consentGroupName']}
      onConsentGroupChange={setItems}
      disabled={false}
    />
  )
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

beforeAll(() => Modal.setAppElement(document.body))

describe('ConsentGroupList component', () => {
  it('Edits without saving', async () => {
    const user = userEvent.setup()
    const onConsentGroupChange = vi.fn()
    const { container } = render(
      <MemoryRouter>
        <ConsentGroupAddEdit
          id={0}
          consentGroups={[]}
          closeAction={vi.fn()}
          onConsentGroupChange={onConsentGroupChange}
        />
      </MemoryRouter>,
    )
    await user.type(container.querySelector('#consentGroupName')!, 'Hello!')
    await user.type(container.querySelector('#url')!, 'https://www.asdf.gov')
    await user.type(container.querySelector('#tags')!, 'tag4{Enter}tag5{Enter}')
    expect(container.querySelector('#consentGroupName')).toHaveValue('Hello!')
    expect(container.querySelector('#url')).toHaveValue('https://www.asdf.gov')
    expect(onConsentGroupChange).not.toHaveBeenCalled()
  })

  it('Shows conditional fields only when checked', async () => {
    const user = userEvent.setup()
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
    await user.click(container.querySelector('#primaryConsent_generalResearchUse')!)

    const conditionalFields = [
      { checkbox: '#gs', textField: '#gsText' },
      { checkbox: '#otherSecondary', textField: '#otherSecondaryText' },
      { checkbox: '#primaryConsent_otherPrimary', textField: '#otherPrimaryText' },
      { checkbox: '#primaryConsent_diseaseSpecificUse', textField: '#diseaseSpecificUseText' },
    ]

    for (const { checkbox, textField } of conditionalFields) {
      expect(container.querySelector(textField)).not.toBeInTheDocument()
      await user.click(container.querySelector(checkbox)!)
      expect(container.querySelector(textField)).toBeInTheDocument()
    }
  })

  it('renders existing consent groups', () => {
    render(
      <MemoryRouter>
        <ConsentGroupListHarness initial={[sampleConsentGroup]} />
      </MemoryRouter>,
    )
    expect(screen.getByText(sampleConsentGroup.consentGroupName)).toBeInTheDocument()
  })

  it('opens consent group in view mode when view button is clicked', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <MemoryRouter>
        <ConsentGroupListHarness initial={[sampleConsentGroup]} />
      </MemoryRouter>,
    )
    await user.click(container.querySelector('.glyphicon-eye-open')!)
    expect(screen.getByText(sampleConsentGroup.consentGroupName)).toBeInTheDocument()
    expect(container.querySelector('#consentGroupName')).toBeDisabled()
    expect(container.querySelector('.collaborator-form-add-save-button')).not.toBeInTheDocument()
    expect(container.querySelector('.collaborator-form-cancel-button')).toHaveTextContent('Close')
  })

  it('closes view mode when close button is clicked', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <MemoryRouter>
        <ConsentGroupListHarness initial={[sampleConsentGroup]} />
      </MemoryRouter>,
    )
    await user.click(container.querySelector('.glyphicon-eye-open')!)
    await user.click(container.querySelector('.collaborator-form-cancel-button')!)
    expect(container.querySelector('#consentGroupName')).not.toBeInTheDocument()
    expect(container.querySelector('.glyphicon-eye-open')).toBeInTheDocument()
  })

  it('adds a new consent group', async () => {
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
    await clickSaveButton(user, container)

    expect(collected).toHaveLength(1)
    expect(collected[0].consentGroupName).toBe('New Consent Group')
    expect(collected[0].data?.cloud).toBeUndefined()
  })

  it('saves selected cloud values', async () => {
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
    expect(screen.getByText('Cloud')).toBeInTheDocument()
    await fillConsentGroupForm(user, container)
    await user.type(container.querySelector('#cloud input')!, 'Azure{Enter}')
    await user.type(container.querySelector('#cloud input')!, 'AWS{Enter}')
    await clickSaveButton(user, container)

    expect(collected).toHaveLength(1)
    expect(collected[0].data?.cloud).toEqual(['Azure', 'AWS'])
  })

  it('edits existing consent group and saves changes', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <MemoryRouter>
        <ConsentGroupListHarness initial={[sampleConsentGroup]} />
      </MemoryRouter>,
    )
    await user.click(container.querySelector('.glyphicon-pencil')!)
    expect(container.querySelector('#consentGroupName')).toBeInTheDocument()
    await user.clear(container.querySelector('#consentGroupName')!)
    await user.type(container.querySelector('#consentGroupName')!, 'Test Consent Group Edited')
    await user.clear(container.querySelector('#numberOfParticipants')!)
    await user.type(container.querySelector('#numberOfParticipants')!, '15')
    await user.type(container.querySelector('#tags')!, 'editedTag1{Enter}editedTag2{Enter}')
    await clickSaveButton(user, container)
    expect(container.querySelector('#consentGroupName')).not.toBeInTheDocument()
    expect(screen.getByText('Test Consent Group Edited')).toBeInTheDocument()
  })

  it('deletes a consent group via modal confirmation', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <MemoryRouter>
        <ConsentGroupListHarness initial={[sampleConsentGroup]} />
      </MemoryRouter>,
    )
    await user.click(container.querySelector('.glyphicon-trash')!)
    await waitFor(() => expect(document.querySelector('.ReactModal__Content')).toBeInTheDocument())
    const modal = document.querySelector('.ReactModal__Content')!
    const deleteBtn = Array.from(modal.querySelectorAll('button')).find(b => /delete/i.test(b.textContent || ''))!
    await user.click(deleteBtn)
    await waitFor(() => expect(screen.queryByText(sampleConsentGroup.consentGroupName)).not.toBeInTheDocument())
  })
})
