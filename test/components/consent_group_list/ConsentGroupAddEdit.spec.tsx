import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import ConsentGroupAddEdit from 'src/components/consent_group_list/ConsentGroupAddEdit'
import { ConsentGroup2 } from 'src/pages/data_submission/consent_group/consentGroupUtils'
import ConsentGroupList from 'src/components/consent_group_list/ConsentGroupList'
import { DataLocationType } from 'src/pages/data_submission/v2/v2-models'
import { findOntologyTerms } from 'src/libs/utils'
import { renderWithRouter } from '../../test-utils'

vi.mock('src/libs/utils', async (importActual) => {
  const actual = await importActual<typeof import('src/libs/utils')>()
  return {
    ...actual,
    findOntologyTerms: vi.fn().mockResolvedValue([]),
    searchOntologyTerm: vi.fn().mockResolvedValue([]),
    Notifications: { showError: vi.fn(), showSuccess: vi.fn() },
  }
})

vi.mock('src/libs/ajax/Countries', () => ({
  Countries: { getCountries: vi.fn().mockResolvedValue(['Japan', 'United States of America (the)']) },
}))

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

  it('keeps a stored DAC when a term changes before access management is set', async () => {
    const user = userEvent.setup()
    const onConsentGroupChange = vi.fn()
    const stored: ConsentGroup2 = {
      consentGroupId: 'cg-1',
      consentGroupName: 'Stored',
      numberOfParticipants: 10,
      generalResearchUse: true,
      dataAccessCommitteeId: 5,
      datasetId: 1,
      dataLocation: DataLocationType.NotDetermined,
    } as ConsentGroup2
    const { container } = render(
      <MemoryRouter>
        <ConsentGroupAddEdit id={0} consentGroup={stored} consentGroups={[stored]} closeAction={vi.fn()} onConsentGroupChange={onConsentGroupChange} />
      </MemoryRouter>,
    )

    await user.click(container.querySelector('#primaryConsent_hmb')!)
    await user.click(container.querySelector('#accessManagement_controlled')!)
    await clickSaveButton(user, container)

    expect(onConsentGroupChange).toHaveBeenCalledWith([expect.objectContaining({ dataAccessCommitteeId: 5 })])
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

  // The radio handed its own field name over as the answer, defeating the required check
  it('does not accept the Other radio as its own free-text answer', async () => {
    const user = userEvent.setup()
    const collected: ConsentGroup2[] = []
    const { container } = renderList(collected)
    await fillRequiredFields(user, container)

    await user.click(container.querySelector('#primaryConsent_otherPrimary')!)
    await clickSaveButton(user, container)

    expect(collected).toHaveLength(0)
    expect(container.querySelector('#otherPrimaryText')).toBeInTheDocument()
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

// A stored record can carry more than one primary, and only the one the radios light may be saved
describe('ConsentGroupAddEdit legacy multi-primary records', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderEdit = (consentGroup: ConsentGroup2, collected: ConsentGroup2[]) => renderWithRouter(
    <ConsentGroupAddEdit
      id={0}
      consentGroup={consentGroup}
      consentGroups={[consentGroup]}
      closeAction={vi.fn()}
      onConsentGroupChange={(items) => { collected.splice(0, collected.length, ...items) }}
    />,
  )

  const diseaseSpecificGroup: ConsentGroup2 = {
    consentGroupId: 'cg1',
    consentGroupName: 'Legacy Group',
    name: 'Legacy Group',
    numberOfParticipants: 10,
    accessManagement: 'external',
    diseaseSpecificUse: ['DOID_1'],
    dataLocation: DataLocationType.NotDetermined,
  }

  it('hides the disease searchbar when another primary takes precedence', () => {
    const { container } = renderEdit({ ...diseaseSpecificGroup, poa: true }, [])

    expect(container.querySelector<HTMLInputElement>('#primaryConsent_poa')?.checked).toBe(true)
    expect(container.querySelector('#diseaseSpecificUseText')).not.toBeInTheDocument()
  })

  it('hides the Other text box when another primary takes precedence', () => {
    const { container } = renderEdit({ ...diseaseSpecificGroup, hmb: true, otherPrimary: 'Bespoke' }, [])

    expect(container.querySelector<HTMLInputElement>('#primaryConsent_hmb')?.checked).toBe(true)
    expect(container.querySelector('#otherPrimaryText')).not.toBeInTheDocument()
  })

  // Consent stores DOIDs, but the radio used to write the searchbar's option objects back
  it('keeps disease selections as DOIDs when the radio is re-selected', async () => {
    const user = userEvent.setup()
    vi.mocked(findOntologyTerms).mockResolvedValue([{ displayText: 'Breast Cancer', id: 'DOID_1' }])
    const collected: ConsentGroup2[] = []
    const { container } = renderEdit(diseaseSpecificGroup, collected)

    await user.click(container.querySelector('#primaryConsent_diseaseSpecificUse')!)
    await clickSaveButton(user, container)

    expect(collected).toHaveLength(1)
    expect(collected[0].diseaseSpecificUse).toEqual(['DOID_1'])
  })
})

describe('ConsentGroupAddEdit study form enhancements', () => {
  // A react-select container takes no focus in jsdom, so its input is reached by role.
  const combobox = (container: HTMLElement, fieldId: string) =>
    within(container.querySelector(`.formField-${fieldId}`) as HTMLElement).getByRole('combobox')
  const option = (container: HTMLElement, fieldId: string, name: string) =>
    within(container.querySelector(`.formField-${fieldId}`) as HTMLElement).getByRole('button', { name })

  const renderList = (collected: ConsentGroup2[], props: Partial<React.ComponentProps<typeof ConsentGroupList>> = {}) => render(
    <MemoryRouter>
      <ConsentGroupList
        consentGroups={[]}
        columnsToShow={['consentGroupName']}
        onConsentGroupChange={(items) => { collected.splice(0, collected.length, ...items) }}
        disabled={false}
        {...props}
      />
    </MemoryRouter>,
  )

  it('labels the file table File Type/Format and no longer offers Functional Equivalence', () => {
    const { container } = render(
      <MemoryRouter>
        <ConsentGroupAddEdit id={-1} consentGroups={[]} closeAction={vi.fn()} onConsentGroupChange={vi.fn()} />
      </MemoryRouter>,
    )
    expect(container).toHaveTextContent('File Type/Format')
    expect(container).not.toHaveTextContent('Functional Equivalence')
    expect(container.querySelector('[id*="functionalEquivalence"]')).toBeNull()
  })

  it('presents the certification upload as generic consent documentation with examples', () => {
    const { container } = render(
      <MemoryRouter>
        <ConsentGroupAddEdit id={-1} consentGroups={[]} closeAction={vi.fn()} onConsentGroupChange={vi.fn()} />
      </MemoryRouter>,
    )
    expect(container).toHaveTextContent('Consent / Data Use Documentation')
    expect(container).toHaveTextContent('NIH Institutional Certification')
    expect(container).toHaveTextContent('Institutional Data Use Letter')
  })

  it('saves description, context and DOI into the data bag', async () => {
    const user = userEvent.setup()
    const collected: ConsentGroup2[] = []
    const { container } = renderList(collected)
    await user.click(container.querySelector('#add-consent-group-btn')!)
    await fillConsentGroupForm(user, container)
    await user.type(container.querySelector('#description')!, 'Synthetic annotations')
    await user.type(container.querySelector('#dataCollectionContext')!, 'Recruited from clinics')
    await user.type(container.querySelector('#doi')!, 'https://doi.org/10.1000/xyz123')
    await clickSaveButton(user, container)

    expect(collected).toHaveLength(1)
    expect(collected[0].data).toMatchObject({
      description: 'Synthetic annotations',
      dataCollectionContext: 'Recruited from clinics',
      doi: '10.1000/xyz123',
    })
  })

  it('saves several file/storage profiles and derives the file types from them', async () => {
    const user = userEvent.setup()
    const collected: ConsentGroup2[] = []
    const { container } = renderList(collected)
    await user.click(container.querySelector('#add-consent-group-btn')!)
    await fillConsentGroupForm(user, container)

    await user.click(option(container, 'storage-0-fileType', 'Genome'))
    await user.type(combobox(container, 'storage-0-storageClass'), 'Coldline{Enter}')
    await user.click(option(container, 'storage-0-storageType', 'Cloud'))
    await user.type(combobox(container, 'storage-0-region'), 'us-central1{Enter}')
    await user.type(container.querySelector('#storage-0-fileCount')!, '42')
    await user.type(container.querySelector('#storage-0-aggregateFileSize')!, '1.5')

    await user.click(container.querySelector('#add-storage-profile-btn')!)
    await user.click(option(container, 'storage-1-fileType', 'Exome'))
    await user.click(option(container, 'storage-1-storageType', 'On-prem'))
    await clickSaveButton(user, container)

    expect(collected).toHaveLength(1)
    expect(collected[0].data?.storageProfiles).toEqual([
      { fileType: 'Genome', storageClass: 'Coldline', storageType: 'Cloud', region: 'us-central1', fileCount: 42, aggregateFileSizeBytes: 1.5e9 },
      { fileType: 'Exome', storageType: 'On-prem' },
    ])
    expect(collected[0].fileTypes).toEqual([{ fileType: 'Genome' }, { fileType: 'Exome' }])
  })

  it('removes a file/storage profile', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const existing: ConsentGroup2 = {
      ...sampleConsentGroup,
      data: { storageProfiles: [{ fileType: 'Genome' }, { fileType: 'Exome' }] },
    }
    const { container } = render(
      <MemoryRouter>
        <ConsentGroupAddEdit id={0} consentGroup={existing} consentGroups={[existing]} closeAction={vi.fn()} onConsentGroupChange={onChange} />
      </MemoryRouter>,
    )
    await user.click(container.querySelector('#storage-0-remove')!)
    await clickSaveButton(user, container)
    expect(onChange.mock.calls[0][0][0].data.storageProfiles).toEqual([{ fileType: 'Exome' }])
    expect(onChange.mock.calls[0][0][0].fileTypes).toEqual([{ fileType: 'Exome' }])
  })

  it('labels the tags with the asset type', () => {
    const { container } = render(
      <MemoryRouter>
        <ConsentGroupAddEdit id={-1} consentGroups={[]} closeAction={vi.fn()} onConsentGroupChange={vi.fn()} />
      </MemoryRouter>,
    )
    expect(container).toHaveTextContent('Dataset Tags')
  })

  it('shows the study population read-only when it is shared across assets', () => {
    const { container } = render(
      <MemoryRouter>
        <ConsentGroupAddEdit
          id={-1}
          consentGroups={[]}
          closeAction={vi.fn()}
          onConsentGroupChange={vi.fn()}
          inheritance={{
            populationSameAcrossAssets: true,
            studyPopulation: { ageRange: { min: 18, max: 65 } },
            targetDatesSameAcrossAssets: true,
            publicVisibilitySameAcrossAssets: true,
          }}
        />
      </MemoryRouter>,
    )
    expect(container.querySelector('#dataset-population-ageRange-value')).toHaveTextContent('18 – 65 years')
    const thumbs = within(container.querySelector('.formField-dataset-population-ageRange') as HTMLElement).getAllByRole('slider')
    expect(thumbs.map(thumb => (thumb as HTMLInputElement).value)).toEqual(['18', '65'])
    thumbs.forEach(thumb => expect(thumb).toBeDisabled())
  })

  it('requires a population on the dataset when it is not shared across assets', async () => {
    const user = userEvent.setup()
    const collected: ConsentGroup2[] = []
    const { container } = renderList(collected, { inheritance: { populationSameAcrossAssets: false, targetDatesSameAcrossAssets: true, publicVisibilitySameAcrossAssets: true } })
    await user.click(container.querySelector('#add-consent-group-btn')!)
    await fillConsentGroupForm(user, container)
    await clickSaveButton(user, container)
    expect(collected).toHaveLength(0)

    const [, maxThumb] = within(container.querySelector('.formField-dataset-population-ageRange') as HTMLElement).getAllByRole('slider')
    fireEvent.change(maxThumb, { target: { value: 17 } })
    await user.click(option(container, 'dataset-population-sex', 'Female'))
    await user.click(option(container, 'dataset-population-ancestry', 'East Asian'))
    // A row counts as a place once it has a country.
    await user.type(combobox(container, 'dataset-population-geography-0-country'), 'Japan')
    await user.click(await screen.findByText('Japan', { selector: '.form-select__option' }))
    await clickSaveButton(user, container)

    expect(collected).toHaveLength(1)
    expect(collected[0].data?.population).toEqual({
      ageRange: { min: 0, max: 17 }, sex: ['Female'], ancestry: ['East Asian'], geography: [{ country: 'Japan' }],
    })
  })
})

describe('ConsentGroupAddEdit release and visibility inheritance', () => {
  const shared = { populationSameAcrossAssets: true, targetDatesSameAcrossAssets: true, publicVisibilitySameAcrossAssets: true }

  it('shows the study dates and visibility read-only when they apply to all assets', () => {
    const { container } = render(
      <MemoryRouter>
        <ConsentGroupAddEdit
          id={-1}
          consentGroups={[]}
          closeAction={vi.fn()}
          onConsentGroupChange={vi.fn()}
          inheritance={{ ...shared, studyTargetDeliveryDate: '2030-01-01', studyPublicVisibility: true }}
        />
      </MemoryRouter>,
    )
    const release = container.querySelector('[data-cy="dataset-release"]') as HTMLElement
    const visibility = container.querySelector('[data-cy="dataset-visibility"]') as HTMLElement
    expect(release).toHaveTextContent('Target Release Dates')
    expect(release).toHaveTextContent('Set for all assets in this study.')
    expect(visibility).toHaveTextContent('Public Visibility')
    expect(visibility).toHaveTextContent('Set for all assets in this study.')
    expect(release.contains(visibility)).toBe(false)
    expect(release).toHaveTextContent('The date you expect researchers to be able to request access to the data')
    expect(visibility).toHaveTextContent('Whether this dataset is searchable and visible in DUOS data libraries')
    expect(container.querySelector('#publicVisibility_true')).toBeChecked()
    expect(container.querySelector('#publicVisibility_true')).toBeDisabled()
  })

  it('requires the dataset to set its own visibility when the study does not', async () => {
    const user = userEvent.setup()
    const collected: ConsentGroup2[] = []
    const { container } = render(
      <MemoryRouter>
        <ConsentGroupList
          consentGroups={[]}
          columnsToShow={['consentGroupName']}
          onConsentGroupChange={(items) => { collected.splice(0, collected.length, ...items) }}
          disabled={false}
          inheritance={{ ...shared, publicVisibilitySameAcrossAssets: false }}
        />
      </MemoryRouter>,
    )
    await user.click(container.querySelector('#add-consent-group-btn')!)
    await fillConsentGroupForm(user, container)
    await clickSaveButton(user, container)
    expect(collected).toHaveLength(0)

    await user.click(container.querySelector('#publicVisibility_false')!)
    await clickSaveButton(user, container)
    expect(collected).toHaveLength(1)
    expect(collected[0].data?.publicVisibility).toBe(false)
  })
})

describe('ConsentGroupAddEdit button groups', () => {
  it('shows every Data Location at once and clears it when the selection is pressed again', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const existing: ConsentGroup2 = { ...sampleConsentGroup, dataLocation: DataLocationType.TerraWorkspace }
    const { container } = render(
      <MemoryRouter>
        <ConsentGroupAddEdit id={0} consentGroup={existing} consentGroups={[existing]} closeAction={vi.fn()} onConsentGroupChange={onChange} />
      </MemoryRouter>,
    )
    const location = within(container.querySelector('.formField-dataLocation') as HTMLElement)
    for (const name of ['AnVIL Workspace', 'Terra Workspace', 'TDR Location', 'Not Determined', 'Other']) {
      expect(location.getByRole('button', { name })).toBeVisible()
    }
    await user.click(location.getByRole('button', { name: 'Terra Workspace' }))
    await clickSaveButton(user, container)
    expect(onChange.mock.calls[0][0][0]).not.toHaveProperty('dataLocation')
  })
})

describe('ConsentGroupAddEdit layout', () => {
  it('frames every part of the dataset form in a box', () => {
    const { container } = render(
      <MemoryRouter>
        <ConsentGroupAddEdit id={-1} consentGroups={[]} closeAction={vi.fn()} onConsentGroupChange={vi.fn()} />
      </MemoryRouter>,
    )
    const boxes = Array.from(container.querySelectorAll('.dsf-group')).map(box => box.getAttribute('data-cy'))
    expect(boxes).toEqual(expect.arrayContaining([
      'dataset-details', 'dataset-population', 'dataset-release', 'dataset-visibility',
      'dataset-data-use', 'dataset-location', 'storage-profiles', 'dataset-participants',
    ]))
    for (const id of ['consentGroupName', 'dataLocation', 'numberOfParticipants']) {
      expect(container.querySelector(`.formField-${id}`)?.closest('.dsf-group'), id).not.toBeNull()
    }
  })

  it('tells users how to add a tag', () => {
    const { container } = render(
      <MemoryRouter>
        <ConsentGroupAddEdit id={-1} consentGroups={[]} closeAction={vi.fn()} onConsentGroupChange={vi.fn()} />
      </MemoryRouter>,
    )
    expect(container.querySelector('.formField-tags')).toHaveTextContent('Type a tag, then press Enter or Tab to add it.')
  })
})
