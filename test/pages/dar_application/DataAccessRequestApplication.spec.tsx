import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
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

// Vitest automocks these - every exported function becomes vi.fn(), other exports
// (e.g. Countries.DEFAULT_COUNTRY) pass through unchanged. Storage stays explicit below
// because DataAccessRequestApplication relies on Storage.getData() defaulting to null,
// not automock's default of undefined.
vi.mock('src/libs/ajax/DAR')
vi.mock('src/libs/ajax/DAA')
vi.mock('src/libs/ajax/User')
vi.mock('src/libs/ajax/Collections')
vi.mock('src/libs/ajax/DataSet')
vi.mock('src/libs/ajax/Countries')
vi.mock('src/libs/notificationService')
vi.mock('src/libs/ajax/Metrics')

vi.mock('src/libs/storage', () => ({
  Storage: {
    getCurrentUser: vi.fn(),
    getData: vi.fn(() => null),
    removeData: vi.fn(),
  },
}))

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

import { DAR } from 'src/libs/ajax/DAR'
import { DAA } from 'src/libs/ajax/DAA'
import { Storage } from 'src/libs/storage'
import { User } from 'src/libs/ajax/User'
import { Collections } from 'src/libs/ajax/Collections'
import { DataSet } from 'src/libs/ajax/DataSet'
import { Countries } from 'src/libs/ajax/Countries'
import { NotificationService } from 'src/libs/notificationService'
import { Metrics } from 'src/libs/ajax/Metrics'

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

const datasets = [
  {
    datasetId: 123456,
    datasetIdentifier: 'DUOS-123456',
    name: 'Some Dataset',
    dacId: 1,
    dataUse: {},
  },
]

const userSigningOfficials = [
  {
    userId: 6,
    displayName: 'SO 1',
    email: 'so1@gmail.com',
  },
]

describe('DataAccessRequestApplication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupTestEnvironment()
  })

  it('shows spinner when submitting', async () => {
    // Mocks
    vi.mocked(Countries.getCountries).mockResolvedValue(['United States of America (the)', 'Canada'])
    vi.mocked(Storage.getCurrentUser).mockReturnValue(user as ReturnType<typeof Storage.getCurrentUser>)
    vi.mocked(User.getMe).mockResolvedValue(user as Awaited<ReturnType<typeof User.getMe>>)
    vi.mocked(User.getSOsForCurrentUser).mockResolvedValue(userSigningOfficials as Awaited<ReturnType<typeof User.getSOsForCurrentUser>>)
    vi.mocked(Collections.getCollectionById).mockResolvedValue(darCollection)
    vi.mocked(DataSet.getDatasetsByIds).mockResolvedValue(datasets as Awaited<ReturnType<typeof DataSet.getDatasetsByIds>>)
    vi.mocked(NotificationService.getBannerObjectById).mockResolvedValue(undefined)
    vi.mocked(DAR.getPartialDarRequest).mockResolvedValue(
      darCollection.dars[darId],
    )
    vi.mocked(DAA.getDaas).mockResolvedValue([
      {
        daaId: 100,
        createUserId: 1,
        createDate: '1',
        updateUserId: 1,
        updateDate: '1',
        initialDacId: 1,
        dacs: [{ dacId: 1, dacName: 'Test DAC', email: 'dac@test.com' }],
        file: { fileStorageObjectId: 1, entityId: '1', fileName: 'TestDAA.pdf', category: 'dataAccessAgreement', mediaType: 'application/pdf', createUserId: 1, createDate: 1 },
      },
    ] as Awaited<ReturnType<typeof DAA.getDaas>>)
    vi.mocked(Metrics.captureEvent).mockResolvedValue(undefined)

    // Make updateDarDraft hang until we resolve it so we can assert the spinner during save
    let resolveSave: (value: { referenceId: string }) => void
    const savePromise = new Promise<{ referenceId: string }>((resolve) => {
      resolveSave = resolve
    })
    vi.mocked(DAR.updateDarDraft).mockImplementation(async () => {
      return savePromise as unknown as ReturnType<typeof DAR.updateDarDraft> extends Promise<infer T> ? T : never
    })
    vi.mocked(DAR.uploadDARDocument).mockResolvedValue({ data: null })
    vi.mocked(DAR.postDarDraft).mockResolvedValue({ referenceId: 'ref-123' } as Awaited<ReturnType<typeof DAR.postDarDraft>>)

    // Mock DAR submission to hang so we can see the spinner
    let resolveSubmit: (value: unknown) => void
    const submitPromise = new Promise((resolve) => {
      resolveSubmit = resolve
    })
    vi.mocked(DAR.postDar).mockImplementation(async () => {
      return submitPromise as unknown as ReturnType<typeof DAR.postDar> extends Promise<infer T> ? T : never
    })

    await act(async () => {
      render(
        <MemoryRouter initialEntries={[`/dar_application/${darId}`]}>
          <Routes>
            <Route
              path="/dar_application/:dataRequestId"
              element={(
                <DataAccessRequestApplication
                  draftDar={true}
                  isProgressReportApplication={false}
                  existingDarsReadOnlyMode={false}
                />
              )}
            />
          </Routes>
        </MemoryRouter>,
      )
    })

    // Wait for data to load
    expect(screen.getByText('Data Access Request Application')).toBeInTheDocument()

    // Fill out required fields
    await selectOptionByLabel('piCountryOfOperation', 'United States')
    await selectOptionByLabel('signingOfficial', 'SO 1')
    await typeById('itDirector', 'Some IT Director')
    await typeById('itDirectorEmail', 'it@good.org')
    await clickById('anvilUse_yes')
    await typeById('projectTitle', 'Title')
    await typeById('rus', 'asdf')
    await typeById('nonTechRus', 'asdf asdf')
    await fillDarDataUseCheckboxes()

    // Click "Save" to save the draft and assert spinner shows while saving
    await clickById('btn_saveDar')
    expect(screen.getByText('Save changes?')).toBeInTheDocument()
    await act(async () => {
      fireEvent.click(document.getElementById('btn_submit')!)
    })

    // Spinner should be visible while save is in progress
    await waitFor(() => {
      expect(document.getElementById('btn_submit')).toHaveAttribute('aria-busy', 'true')
    })

    // Verify that updateDarDraft was called and then resolve the save
    expect(DAR.updateDarDraft).toHaveBeenCalled()
    await act(async () => {
      resolveSave({ referenceId: 'ref-123' })
    })

    // Click "Attest"
    await clickById('btn_attest')

    // Now on Addendum tab, click "Submit"
    await clickById('btn_openSubmitModal')

    // The dialog should be open.
    expect(screen.getByText('Submit Data Access Request?')).toBeInTheDocument()

    // Click "Yes" in the dialog
    await act(async () => {
      fireEvent.click(document.getElementById('btn_submit')!)
    })

    // Now verify the spinner is visible for submit.
    await waitFor(() => {
      expect(document.getElementById('btn_submit')).toHaveAttribute('aria-busy', 'true')
    })

    // Verify that postDar was called
    expect(DAR.postDar).toHaveBeenCalled()
    const submittedDar = vi.mocked(DAR.postDar).mock.calls[0][0] as { daaIds: number[] }
    expect(submittedDar.daaIds).toEqual([100])
    await act(async () => {
      resolveSubmit({})
    })
  })

  it('loads dataset/DAA snapshots in submitted read-only DAR review container', async () => {
    vi.mocked(Countries.getCountries).mockResolvedValue(['United States of America (the)', 'Canada'])
    vi.mocked(Storage.getCurrentUser).mockReturnValue(user as ReturnType<typeof Storage.getCurrentUser>)
    vi.mocked(Collections.getCollectionById).mockResolvedValue(darCollection)
    vi.mocked(DataSet.getDatasetsByIds).mockResolvedValue([
      {
        datasetId: 2352,
        datasetIdentifier: 'DUOS-READONLY-2352',
        name: 'Read-only Dataset',
        dacId: 1,
        dataUse: {},
      },
    ] as Awaited<ReturnType<typeof DataSet.getDatasetsByIds>>)
    vi.mocked(NotificationService.getBannerObjectById).mockResolvedValue(undefined)
    vi.mocked(DAR.getPartialDarRequest).mockResolvedValue(
      darCollection.dars[darId],
    )
    vi.mocked(DAR.getDatasetDaaSnapshots).mockResolvedValue([
      {
        datasetId: 2352,
        daaId: 100,
        daaFileName: 'ReadonlyDAA.pdf',
      },
    ] as Awaited<ReturnType<typeof DAR.getDatasetDaaSnapshots>>)

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/dar_application_review/211']}>
          <Routes>
            <Route
              path="/dar_application_review/:collectionId"
              element={(
                <DataAccessRequestApplication
                  draftDar={false}
                  isProgressReportApplication={false}
                  existingDarsReadOnlyMode={true}
                />
              )}
            />
          </Routes>
        </MemoryRouter>,
      )
    })

    expect(document.querySelector('.dar-summary')).not.toBeNull()
    expect(DAR.getDatasetDaaSnapshots).toHaveBeenCalledWith(darId)
  })
})
