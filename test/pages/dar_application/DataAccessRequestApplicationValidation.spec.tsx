import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter, Route, Routes } from 'react-router'
import DataAccessRequestApplication from 'src/pages/dar_application/DataAccessRequestApplication'
import rawDarCollection from './darCollection.json'
import { DarCollection } from 'src/types/model'
import { clickById, typeById, selectOptionByLabel } from '../../test-utils'
import { MockSelectOption, MockSelectProps, fillDarDataUseCheckboxes, setupTestEnvironment } from './DataAccessRequestApplicationTestUtils'

// The fixture is a hand-trimmed subset of a real API response, so it needs one bridging
// cast here rather than matching DarCollection's full shape field-for-field.
const darCollection = rawDarCollection as unknown as DarCollection

// react-select renders a combobox with no real <input>/<select> element, which jsdom's
// fireEvent can't drive directly. Swap it for a plain <select> sharing the same id/options
// contract, matching the pattern used in test/components/forms/formComponents.spec.tsx.
// Selection is round-tripped by array index rather than getOptionValue's output, since that
// value's exact string format is an internal implementation detail of FormInputSelect.
// className is forwarded since it's how FormInputSelect signals the "errored" validation state.
// This factory must stay inline (not imported) - vi.mock() is hoisted above other imports,
// so referencing an imported factory here throws a TDZ ReferenceError at module load time.
vi.mock('react-select', () => ({
  default: (props: MockSelectProps) => React.createElement(
    'select',
    {
      id: props.id,
      className: props.className,
      disabled: props.isDisabled,
      onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = props.options?.[Number(e.target.value)]
        props.onChange(selected)
      },
    },
    [
      React.createElement('option', { key: 'placeholder', value: '' }, ''),
      ...(props.options ?? []).map((option: MockSelectOption, index: number) =>
        React.createElement(
          'option',
          { key: index, value: String(index) },
          props.getOptionLabel?.(option),
        )),
    ],
  ),
}))

// Vitest automocks these - every exported function becomes vi.fn(), other exports pass
// through unchanged. Storage stays explicit below because DataAccessRequestApplication
// relies on Storage.getData() defaulting to null, not automock's default of undefined.
vi.mock('src/libs/ajax/DAR')
vi.mock('src/libs/ajax/DataSet')
vi.mock('src/libs/ajax/Metrics')
vi.mock('src/libs/notificationService')
vi.mock('src/libs/ajax/User')
vi.mock('src/libs/ajax/Countries')
vi.mock('src/libs/ajax/Collections')

vi.mock('src/libs/utils', async (importOriginal) => {
  const original = await importOriginal<typeof import('src/libs/utils')>()
  return {
    ...original,
    Navigation: {
      ...original.Navigation,
      console: vi.fn(),
    },
  }
})

vi.mock('src/libs/storage', () => ({
  Storage: {
    getCurrentUser: vi.fn(),
    getData: vi.fn(() => null),
    removeData: vi.fn(),
  },
}))

import { DAR } from 'src/libs/ajax/DAR'
import { DataSet } from 'src/libs/ajax/DataSet'
import { Metrics } from 'src/libs/ajax/Metrics'
import { NotificationService } from 'src/libs/notificationService'
import { Storage } from 'src/libs/storage'
import { User } from 'src/libs/ajax/User'
import { Countries } from 'src/libs/ajax/Countries'
import { Collections } from 'src/libs/ajax/Collections'

const props = {
  draftDar: true,
  isProgressReportApplication: false,
}

const darId = '011467b7-5544-499f-9210-3c2035810639'

const user = {
  userId: 5,
  displayName: 'Jane Doe',
  email: 'janedoe@gmail.com',
  eraCommonsId: 'asdg',
  libraryCard: {},
  properties: [
    {
      propertyId: 10350,
      userId: 5,
      propertyKey: 'eraAuthorized',
      propertyValue: 'true',
    },
    {
      propertyId: 10351,
      userId: 5,
      propertyKey: 'eraExpiration',
      propertyValue: '999980741397751',
    },
  ],
}

const userNoLibraryCard = {
  userId: 5,
  displayName: 'Jane Doe',
  email: 'janedoe@gmail.com',
  eraCommonsId: 'asdg',
  properties: [
    {
      propertyId: 10350,
      userId: 5,
      propertyKey: 'eraAuthorized',
      propertyValue: 'true',
    },
    {
      propertyId: 10351,
      userId: 5,
      propertyKey: 'eraExpiration',
      propertyValue: '999980741397751',
    },
  ],
}

const datasets = [
  {
    datasetId: 123456,
    datasetIdentifier: 'DUOS-123456',
    name: 'Some Dataset',
    dataUse: {},
  },
]

const userSigningOfficials = [
  {
    userId: 6,
    displayName: 'SO 1',
    email: 'so1@gmail.com',
  },
  {
    userId: 7,
    displayName: 'SO 2',
    email: 'so2@gmail.com',
  },
]

const fillResearcherInfoFields = async () => {
  await selectOptionByLabel('piCountryOfOperation', 'United States')
  await selectOptionByLabel('signingOfficial', 'SO 2')
  await typeById('itDirector', 'Some IT Director')
  await typeById('itDirectorEmail', 'it@good.org')
  await clickById('anvilUse_yes')
}

const fillResearchPurposeFields = async () => {
  await typeById('projectTitle', 'Title')
  await typeById('rus', 'asdf')
  await typeById('nonTechRus', 'asdf asdf')
}

const fillRequiredDarFields = async () => {
  await fillResearcherInfoFields()
  await fillResearchPurposeFields()
  await fillDarDataUseCheckboxes()
}

const mockCommonDarAjax = (currentUser: typeof user | typeof userNoLibraryCard) => {
  vi.mocked(User.getSOsForCurrentUser).mockResolvedValue(userSigningOfficials as Awaited<ReturnType<typeof User.getSOsForCurrentUser>>)
  vi.mocked(Collections.getCollectionById).mockResolvedValue(darCollection)
  vi.mocked(DAR.getPartialDarRequest).mockResolvedValue(
    darCollection.dars[darId],
  )
  vi.mocked(DataSet.getDatasetsByIds).mockResolvedValue(datasets as Awaited<ReturnType<typeof DataSet.getDatasetsByIds>>)
  vi.mocked(Storage.getCurrentUser).mockReturnValue(currentUser as ReturnType<typeof Storage.getCurrentUser>)
  vi.mocked(User.getMe).mockResolvedValue(currentUser as Awaited<ReturnType<typeof User.getMe>>)
  vi.mocked(DAR.updateDarDraft).mockResolvedValue({ referenceId: 'asdf' } as Awaited<ReturnType<typeof DAR.updateDarDraft>>)
  vi.mocked(DAR.uploadDARDocument).mockResolvedValue({ data: null })
  vi.mocked(DAR.postDarDraft).mockResolvedValue({ referenceId: 'asdf' } as Awaited<ReturnType<typeof DAR.postDarDraft>>)
  vi.mocked(DAR.postDar).mockResolvedValue({} as Awaited<ReturnType<typeof DAR.postDar>>)
  vi.mocked(NotificationService.getBannerObjectById).mockResolvedValue(undefined)
}

describe('Data Access Request - Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupTestEnvironment()
    vi.mocked(Countries.getCountries).mockResolvedValue(['United States of America (the)', 'Canada'])
  })

  describe('With Library Cards', () => {
    beforeEach(async () => {
      vi.mocked(Metrics.captureEvent).mockResolvedValue(undefined)
      mockCommonDarAjax(user)

      await act(async () => {
        render(
          <MemoryRouter initialEntries={[`/dar_application/${darId}`]}>
            <Routes>
              <Route path="/dar_application/:dataRequestId" element={<DataAccessRequestApplication {...props} />} />
            </Routes>
          </MemoryRouter>,
        )
      })
    })

    it('Submits given valid DAR', async () => {
      await fillRequiredDarFields()

      await clickById('btn_attest')
      await clickById('btn_openSubmitModal')
      await clickById('btn_submit')

      expect(DAR.postDar).toHaveBeenCalled()
    })

    it('Makes DAR editable POST to submit returns 400 error', async () => {
      // Mock postDar to reject with 400 error
      vi.mocked(DAR.postDar).mockRejectedValue({
        response: {
          status: 400,
          data: {
            code: 'VALIDATION_ERROR',
            message: 'Bad request error message',
          },
        },
      })

      await fillResearcherInfoFields()
      // Add an Internal Collaborator that lacks a Library Card,
      // which triggers a 400 error on submit
      await clickById('add-internalCollaborators-btn')
      await typeById('0_collaboratorName', 'No LibraryCard')
      await typeById('0_collaboratorEraCommonsId', 'nolibcard123')
      await typeById('0_collaboratorTitle', 'Research Assistant')
      await typeById('0_collaboratorEmail', 'nolibrarycard@broadinstitute.org')
      // Skip approval for now and save directly
      await clickById('collaborator-internalCollaborators-add-save')

      await fillResearchPurposeFields()
      await fillDarDataUseCheckboxes()

      // First attest to enable submit button
      await clickById('btn_attest')
      expect(document.getElementById('btn_openSubmitModal')).not.toBeNull()

      // Now the form should be attested and addendum tab should be visible
      expect(document.getElementById('addendum')).not.toBeNull()

      // Verify that collaborator form is read-only when attested
      expect(document.getElementById('0_summary')).not.toBeNull()

      // Try to submit and expect 400 error to reset attestation
      await clickById('btn_openSubmitModal')
      await clickById('btn_submit')

      // After 400 error, the form should no longer be attested
      // The addendum tab should be hidden again
      expect(document.getElementById('addendum')).toBeNull()

      // Should be able to attest again
      expect(document.getElementById('btn_attest')).not.toBeDisabled()

      // Verify we can attest again (proving the form is editable)
      await clickById('btn_attest')
      expect(document.getElementById('addendum')).not.toBeNull()
    })

    it('Required fields should not be errored when you open page', () => {
      expect(document.getElementById('piCountryOfOperation')).not.toHaveClass('errored')
      expect(document.getElementById('signingOfficial')).not.toHaveClass('errored')
      expect(document.getElementById('itDirector')).not.toHaveClass('errored')
      expect(document.getElementById('itDirectorEmail')).not.toHaveClass('errored')
      expect(document.getElementById('anvilUse')).not.toHaveClass('errored')
      expect(document.querySelector('[data-cy="selectable-datasets"]')).not.toHaveClass('errored')
      expect(document.querySelector('[data-cy="selectable-datasets"]')?.textContent).toContain(datasets[0].datasetIdentifier)
      expect(document.getElementById('projectTitle')).not.toHaveClass('errored')
      expect(document.getElementById('rus')).not.toHaveClass('errored')
      expect(document.getElementById('nonTechRus')).not.toHaveClass('errored')

      expect(document.getElementById('diseases')).not.toHaveClass('errored')

      expect(document.getElementById('aiLlmUse')).not.toHaveClass('errored')
      expect(document.getElementById('controls')).not.toHaveClass('errored')
      expect(document.getElementById('population')).not.toHaveClass('errored')
      expect(document.getElementById('oneGender')).not.toHaveClass('errored')
      expect(document.getElementById('forProfit')).not.toHaveClass('errored')
      expect(document.getElementById('pediatric')).not.toHaveClass('errored')
      expect(document.getElementById('vulnerablePopulation')).not.toHaveClass('errored')
      expect(document.getElementById('illegalBehavior')).not.toHaveClass('errored')
      expect(document.getElementById('sexualDiseases')).not.toHaveClass('errored')
      expect(document.getElementById('psychiatricTraits')).not.toHaveClass('errored')
      expect(document.getElementById('notHealth')).not.toHaveClass('errored')
      expect(document.getElementById('stigmatizedDiseases')).not.toHaveClass('errored')
    })

    it('Required fields get errors on submit', async () => {
      await clickById('btn_attest')

      // since we're setting a default value, this should not error on initial validation
      expect(document.getElementById('piCountryOfOperation')).not.toHaveClass('errored')
      expect(document.getElementById('signingOfficial')).toHaveClass('errored')
      expect(document.getElementById('itDirector')).toHaveClass('errored')
      expect(document.getElementById('itDirectorEmail')).toHaveClass('errored')
      expect(document.getElementById('anvilUse')).toHaveClass('errored')
      // This component cannot be set to errored since it is not a form input
      expect(document.querySelector('[data-cy="selectable-datasets"]')).not.toHaveClass('errored')
      expect(document.querySelector('[data-cy="selectable-datasets"]')?.textContent).toContain(datasets[0].datasetIdentifier)
      expect(document.getElementById('projectTitle')).toHaveClass('errored')
      expect(document.getElementById('rus')).toHaveClass('errored')
      expect(document.getElementById('nonTechRus')).toHaveClass('errored')

      expect(document.getElementById('diseases')).toHaveClass('errored')

      expect(document.getElementById('aiLlmUse')).toHaveClass('errored')
      expect(document.getElementById('controls')).toHaveClass('errored')
      expect(document.getElementById('population')).toHaveClass('errored')
      expect(document.getElementById('oneGender')).toHaveClass('errored')
      expect(document.getElementById('forProfit')).toHaveClass('errored')
      expect(document.getElementById('pediatric')).toHaveClass('errored')
      expect(document.getElementById('vulnerablePopulation')).toHaveClass('errored')
      expect(document.getElementById('illegalBehavior')).toHaveClass('errored')
      expect(document.getElementById('sexualDiseases')).toHaveClass('errored')
      expect(document.getElementById('psychiatricTraits')).toHaveClass('errored')
      expect(document.getElementById('notHealth')).toHaveClass('errored')
      expect(document.getElementById('stigmatizedDiseases')).toHaveClass('errored')
    })

    it('Internal / external / lab collaborators error properly', async () => {
      await clickById('add-labCollaborators-btn')

      // should not be errored when open
      expect(document.getElementById('0_collaboratorName')).not.toHaveClass('errored')
      expect(document.getElementById('0_collaboratorEraCommonsId')).not.toHaveClass('errored')
      expect(document.getElementById('0_collaboratorTitle')).not.toHaveClass('errored')
      expect(document.getElementById('0_collaboratorEmail')).not.toHaveClass('errored')
      expect(document.getElementById('0_collaboratorApproval')).not.toHaveClass('errored')
      expect(document.getElementById('0_collaboratorCountryOfOperation')).not.toHaveClass('errored')

      await clickById('collaborator-labCollaborators-add-save')

      // if clicked and nothing filled out, required field should error
      expect(document.getElementById('0_collaboratorName')).toHaveClass('errored')
      expect(document.getElementById('0_collaboratorEraCommonsId')).toHaveClass('errored')
      expect(document.getElementById('0_collaboratorTitle')).toHaveClass('errored')
      expect(document.getElementById('0_collaboratorEmail')).toHaveClass('errored')
      // we set a default value on countryOfOperation, so it does not error.
      expect(document.getElementById('0_collaboratorApproval')).toHaveClass('errored')

      // fill out fields
      await typeById('0_collaboratorName', 'asdf')
      await typeById('0_collaboratorEraCommonsId', 'asdgasdg')
      await typeById('0_collaboratorTitle', 'asdgasdgasdgas')
      await typeById('0_collaboratorEmail', 'asdgasdgasdgasdga') // not a valid email
      await clickById('0_collaboratorApproval_false')

      // should remove errors, except for email
      expect(document.getElementById('0_collaboratorName')).not.toHaveClass('errored')
      expect(document.getElementById('0_collaboratorEraCommonsId')).not.toHaveClass('errored')
      expect(document.getElementById('0_collaboratorTitle')).not.toHaveClass('errored')
      expect(document.getElementById('0_collaboratorApproval')).not.toHaveClass('errored')
      expect(document.getElementById('0_collaboratorEmail')).toHaveClass('errored')
      expect(document.getElementById('0_collaboratorCountryOfOperation')).not.toHaveClass('errored')

      // shouldn't submit since invalid email format
      await clickById('collaborator-labCollaborators-add-save')

      // fix email
      await typeById('0_collaboratorEmail', 'asdgasdgasdgasdga@gmail.com')
      expect(document.getElementById('0_collaboratorEmail')).not.toHaveClass('errored')

      // should save fine
      expect(document.getElementById('0_summary')).toBeNull()
      await clickById('collaborator-labCollaborators-add-save')
      expect(document.getElementById('0_summary')).not.toBeNull()
    })
  })

  describe('Without Library Cards', () => {
    beforeEach(async () => {
      mockCommonDarAjax(userNoLibraryCard)

      await act(async () => {
        render(
          <MemoryRouter initialEntries={['/']}>
            <DataAccessRequestApplication {...props} />
          </MemoryRouter>,
        )
      })
    })

    it('Cannot submit without library card', async () => {
      await fillResearcherInfoFields()
      await fillResearchPurposeFields()
      await fillDarDataUseCheckboxes()

      await clickById('btn_attest')

      expect(document.getElementById('btn_openSubmitModal')).toBeNull()
    })
  })
})
