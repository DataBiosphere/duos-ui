import React from 'react'
import { render, fireEvent, screen, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import userEvent from '@testing-library/user-event'
import {
  GeneralStudyInformation,
  GeneralStudyInformationProps,
} from 'src/pages/data_submission/v2/GeneralStudyInformation'
import { Study } from 'src/pages/data_submission/v2/v2-models'

// Swap MUI DatePicker for a plain input so CALENDAR fields can be driven with fireEvent.change
vi.mock('src/components/DuosDatePicker', () => ({
  DuosDatePicker: ({ id, onChange }: { id: string, onChange: (v: string) => void }) => (
    <input data-testid={`date-picker-${id}`} onChange={e => onChange(e.target.value)} />
  ),
}))

const FIELD_IDS = [
  'name',
  'studyType',
  'description',
  'tags',
  'dataTypes',
  'phenotypeIndication',
  'anatomicalAreas',
  'species',
  'dataCollectionContext',
  'doi',
  'pi-0-firstName',
  'pi-0-lastName',
  'pi-0-email',
  'pi-0-orcids',
  'custodian-0-firstName',
  'custodian-0-lastName',
  'custodian-0-email',
  'alternativeDataSharingPlanTargetDeliveryDate',
  'alternativeDataSharingPlanTargetPublicReleaseDate',
  'publicVisibility',
  'throughBioId',
  'populationSameAcrossAssets',
  'study-population-ageRange',
  'study-population-sex',
  'study-population-ancestry',
  'study-population-geography',
]

const buildProps = (overrides: Partial<GeneralStudyInformationProps> = {}): GeneralStudyInformationProps => ({
  setStudy: vi.fn(),
  study: { piName: '', piEmail: '', data: {} } as Study,
  ...overrides,
})

describe('GeneralStudyInformation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mounts with each of the form fields individually present', () => {
    render(<GeneralStudyInformation {...buildProps()} />)
    for (const id of FIELD_IDS) {
      expect(document.querySelector(`.formField-${id}`), `missing field: ${id}`).toBeInTheDocument()
    }
  })

  it('calls setStudy when each editable field is changed', async () => {
    const user = userEvent.setup()
    const setStudySpy = vi.fn()
    render(<GeneralStudyInformation {...buildProps({ setStudy: setStudySpy })} />)

    let prevCount = 0
    const assertCalledMore = (fieldId: string) => {
      const newCount = setStudySpy.mock.calls.length
      expect(newCount, `setStudy not called after interacting with '${fieldId}'`).toBeGreaterThan(prevCount)
      prevCount = newCount
    }

    // 1. name (TEXT input)
    fireEvent.change(document.getElementById('name')!, { target: { value: 'Test Study' } })
    assertCalledMore('name')

    // 2. studyType (BUTTONGROUP — click an option)
    await user.click(within(document.querySelector('.formField-studyType')!).getByRole('button', { name: 'Prospective' }))
    assertCalledMore('studyType')

    // 3. description (TEXTAREA)
    fireEvent.change(document.getElementById('description')!, { target: { value: 'A test description' } })
    assertCalledMore('description')

    // 4. dataTypes (BUTTONGROUP, isMulti, with Other… for a typed value)
    await user.click(within(document.querySelector('.formField-dataTypes')!).getByRole('button', { name: 'Other…' }))
    await user.type(document.getElementById('dataTypes-custom-input')!, 'Genomic{Enter}')
    assertCalledMore('dataTypes')

    // 5. phenotypeIndication and anatomicalAreas (BUTTONGROUP, isMulti — click an option)
    fireEvent.click(within(document.querySelector('.formField-phenotypeIndication')!).getByRole('button', { name: 'Type 2 diabetes' }))
    assertCalledMore('phenotypeIndication')
    fireEvent.click(within(document.querySelector('.formField-anatomicalAreas')!).getByRole('button', { name: 'Pancreas' }))
    assertCalledMore('anatomicalAreas')

    // 6. species (BUTTONGROUP, isMulti — click an option)
    fireEvent.click(within(document.querySelector('.formField-species')!).getByRole('button', { name: 'Human (Homo sapiens)' }))
    assertCalledMore('species')

    // 7. PI name parts (TEXT inputs)
    for (const id of ['pi-0-firstName', 'pi-0-lastName']) {
      fireEvent.change(document.getElementById(id)!, { target: { value: 'Smith' } })
      assertCalledMore(id)
    }

    // 7a. piOrcids (SELECT creatable, isMulti, ORCID-validated; a valid checksum so the value is kept)
    await user.type(
      within(document.querySelector('.formField-pi-0-orcids')!).getByRole('combobox'),
      '0000-0002-1825-0097{Enter}',
    )
    assertCalledMore('pi-0-orcids')

    // 7c. Add PI appends a row
    fireEvent.click(document.getElementById('add-pi-btn')!)
    assertCalledMore('add-pi-btn')

    // 7b. dataCollectionContext (TEXTAREA) and doi (TEXT, DOI-validated)
    fireEvent.change(document.getElementById('dataCollectionContext')!, { target: { value: 'Clinic-recruited cohort' } })
    assertCalledMore('dataCollectionContext')
    fireEvent.change(document.getElementById('doi')!, { target: { value: '10.1000/xyz123' } })
    assertCalledMore('doi')

    // 8. PI email (TEXT input — setStudy is called regardless of email validity)
    fireEvent.change(document.getElementById('pi-0-email')!, { target: { value: 'smith@test.com' } })
    assertCalledMore('pi-0-email')

    // 9. Data Custodian row (TEXT inputs) and Add Data Custodian
    for (const [id, value] of [['custodian-0-firstName', 'Grace'], ['custodian-0-lastName', 'Hopper'], ['custodian-0-email', 'custodian@test.com']]) {
      fireEvent.change(document.getElementById(id)!, { target: { value } })
      assertCalledMore(id)
    }
    fireEvent.click(document.getElementById('add-custodian-btn')!)
    assertCalledMore('add-custodian-btn')

    // 10. alternativeDataSharingPlanTargetDeliveryDate (CALENDAR, mocked to plain input)
    fireEvent.change(
      screen.getByTestId('date-picker-alternativeDataSharingPlanTargetDeliveryDate'),
      { target: { value: '2026-01-01' } },
    )
    assertCalledMore('alternativeDataSharingPlanTargetDeliveryDate')

    // 11. alternativeDataSharingPlanTargetPublicReleaseDate (CALENDAR, mocked to plain input)
    fireEvent.change(
      screen.getByTestId('date-picker-alternativeDataSharingPlanTargetPublicReleaseDate'),
      { target: { value: '2027-01-01' } },
    )
    assertCalledMore('alternativeDataSharingPlanTargetPublicReleaseDate')

    // 12. publicVisibility (RADIOGROUP — click the first radio input)
    fireEvent.click(document.getElementById('publicVisibility_true')!)
    assertCalledMore('publicVisibility')

    // 13. tags (SELECT creatable, isMulti, Menu: () => null — no dropdown shown, creation via Enter)
    await user.type(
      within(document.querySelector('.formField-tags')!).getByRole('combobox'),
      'cancer{Enter}',
    )
    assertCalledMore('tags')

    // 14. throughBioId (TEXT — plain non-URL string passes extractThroughBioId, so setStudy is called)
    fireEvent.change(document.getElementById('throughBioId')!, { target: { value: 'my-study-id' } })
    assertCalledMore('throughBioId')
  })
})
