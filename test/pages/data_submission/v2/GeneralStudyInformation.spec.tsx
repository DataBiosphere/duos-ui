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
  'species',
  'piName',
  'piEmail',
  'dataCustodianEmail',
  'alternativeDataSharingPlanTargetDeliveryDate',
  'alternativeDataSharingPlanTargetPublicReleaseDate',
  'publicVisibility',
  'throughBioId',
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

  it('mounts with each of the 14 form fields individually present', () => {
    render(<GeneralStudyInformation {...buildProps()} />)
    for (const id of FIELD_IDS) {
      expect(document.querySelector(`.formField-${id}`), `missing field: ${id}`).toBeInTheDocument()
    }
  })

  it('calls setStudy when each of the 13 editable fields is changed', async () => {
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

    // 2. studyType (SELECT creatable — type a value and confirm with Enter)
    await user.type(
      within(document.querySelector('.formField-studyType')!).getByRole('combobox'),
      'Prospective{Enter}',
    )
    assertCalledMore('studyType')

    // 3. description (TEXTAREA)
    fireEvent.change(document.getElementById('description')!, { target: { value: 'A test description' } })
    assertCalledMore('description')

    // 4. dataTypes (SELECT creatable, isMulti, optionsAreString)
    await user.type(
      within(document.querySelector('.formField-dataTypes')!).getByRole('combobox'),
      'Genomic{Enter}',
    )
    assertCalledMore('dataTypes')

    // 5. phenotypeIndication (TEXT via generateStudyPropertyFormTextField)
    fireEvent.change(document.getElementById('phenotypeIndication')!, { target: { value: 'diabetes' } })
    assertCalledMore('phenotypeIndication')

    // 6. species (TEXT via generateStudyPropertyFormTextField)
    fireEvent.change(document.getElementById('species')!, { target: { value: 'Homo sapiens' } })
    assertCalledMore('species')

    // 7. piName (TEXT input)
    fireEvent.change(document.getElementById('piName')!, { target: { value: 'Dr. Smith' } })
    assertCalledMore('piName')

    // 8. piEmail (TEXT input — setStudy is called regardless of email validity)
    fireEvent.change(document.getElementById('piEmail')!, { target: { value: 'smith@test.com' } })
    assertCalledMore('piEmail')

    // 9. dataCustodianEmail (SELECT creatable, isMulti, email-validated; use a valid email so
    //    setStudyPropertyByKey's isValid guard is satisfied)
    await user.type(
      within(document.querySelector('.formField-dataCustodianEmail')!).getByRole('combobox'),
      'custodian@test.com{Enter}',
    )
    assertCalledMore('dataCustodianEmail')

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
