import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter, Routes, Route } from 'react-router'
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
    Notifications: {
      showError: vi.fn(),
      showSuccess: vi.fn(),
      showWarning: vi.fn(),
      showInformation: vi.fn(),
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
import { Notifications } from 'src/libs/utils'

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

const daaList = [
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
] as Awaited<ReturnType<typeof DAA.getDaas>>

interface ServiceOverrides {
  collection?: DarCollection
  partialDar?: unknown
}

const mockServices = ({ collection, partialDar }: ServiceOverrides = {}) => {
  vi.mocked(Countries.getCountries).mockResolvedValue(['United States of America (the)', 'Canada'])
  vi.mocked(Storage.getCurrentUser).mockReturnValue(user as ReturnType<typeof Storage.getCurrentUser>)
  vi.mocked(User.getMe).mockResolvedValue(user as Awaited<ReturnType<typeof User.getMe>>)
  vi.mocked(User.getSOsForCurrentUser).mockResolvedValue(userSigningOfficials as Awaited<ReturnType<typeof User.getSOsForCurrentUser>>)
  // The progress-report history renders DarCloseout, which reaches for the institution's SOs.
  vi.mocked(User.getSOsForInstitution).mockResolvedValue(userSigningOfficials as Awaited<ReturnType<typeof User.getSOsForInstitution>>)
  vi.mocked(Collections.getCollectionById).mockResolvedValue(collection ?? darCollection)
  vi.mocked(DataSet.getDatasetsByIds).mockResolvedValue(datasets as Awaited<ReturnType<typeof DataSet.getDatasetsByIds>>)
  vi.mocked(NotificationService.getBannerObjectById).mockResolvedValue(undefined)
  vi.mocked(DAR.getPartialDarRequest).mockResolvedValue(
    (partialDar ?? darCollection.dars[darId]) as Awaited<ReturnType<typeof DAR.getPartialDarRequest>>,
  )
  vi.mocked(DAR.getDatasetDaaSnapshots).mockResolvedValue([] as Awaited<ReturnType<typeof DAR.getDatasetDaaSnapshots>>)
  vi.mocked(DAA.getDaas).mockResolvedValue(daaList)
  vi.mocked(Metrics.captureEvent).mockResolvedValue(undefined)
  vi.mocked(DAR.uploadDARDocument).mockResolvedValue({ data: null })
  vi.mocked(DAR.updateDarDraft).mockResolvedValue({ referenceId: 'ref-123' } as Awaited<ReturnType<typeof DAR.updateDarDraft>>)
  vi.mocked(DAR.postDarDraft).mockResolvedValue({ referenceId: 'ref-new' } as Awaited<ReturnType<typeof DAR.postDarDraft>>)
  vi.mocked(DAR.postDar).mockResolvedValue({} as Awaited<ReturnType<typeof DAR.postDar>>)
}

type AppProps = Partial<React.ComponentProps<typeof DataAccessRequestApplication>>

const renderAt = async (path: string, route: string, props: AppProps = {}) => {
  const result = render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path={route}
          element={(
            <DataAccessRequestApplication
              draftDar={true}
              isProgressReportApplication={false}
              {...props}
            />
          )}
        />
      </Routes>
    </MemoryRouter>,
  )
  await screen.findAllByRole('tab')
  return result
}

const renderDraft = (props: AppProps = {}) =>
  renderAt(`/dar_application/${darId}`, '/dar_application/:dataRequestId', props)

const renderNewDar = (props: AppProps = {}) =>
  renderAt('/dar_application', '/dar_application', props)

const renderReview = (props: AppProps = {}) =>
  renderAt('/dar_application_review/211', '/dar_application_review/:collectionId', {
    draftDar: false,
    existingDarsReadOnlyMode: true,
    ...props,
  })

/** A collection carrying several DARs, so the progress-report history renders. */
const multiDarCollection = (): DarCollection => {
  const base = darCollection.dars[darId]
  return {
    ...darCollection,
    dars: {
      [darId]: base,
      'second-ref': { ...base, id: 1765, referenceId: 'second-ref' },
      'third-ref': { ...base, id: 1766, referenceId: 'third-ref' },
    },
  } as unknown as DarCollection
}

/** userEvent.upload cannot express "no file", so clearing goes through a change event. */
const clearFileInput = async (id: string) => {
  fireEvent.change(document.getElementById(id)!, { target: { files: [] } })
  await waitFor(() => expect(document.getElementById(id)).toBeInTheDocument())
}

const clickDialogNo = () => userEvent.click(screen.getByRole('button', { name: 'No' }))

const clickDialogYes = () => userEvent.click(document.getElementById('btn_submit')!)

/** Fills every required field, so only the case under test can fail validation. */
const completeTheForm = async () => {
  await selectOptionByLabel('piCountryOfOperation', 'United States')
  await selectOptionByLabel('signingOfficial', 'SO 1')
  await typeById('itDirector', 'Some IT Director')
  await typeById('itDirectorEmail', 'it@good.org')
  await clickById('anvilUse_yes')
  await typeById('projectTitle', 'Title')
  await typeById('rus', 'asdf')
  await typeById('nonTechRus', 'asdf asdf')
  await fillDarDataUseCheckboxes()
}

const selectedTabName = (): string =>
  screen.getAllByRole('tab').find(tab => tab.getAttribute('aria-selected') === 'true')?.textContent ?? ''

const docDatasets = [
  {
    datasetId: 123456,
    datasetIdentifier: 'DUOS-123456',
    name: 'Some Dataset',
    dacId: 1,
    dataUse: { ethicsApprovalRequired: true, collaboratorRequired: true },
  },
] as Awaited<ReturnType<typeof DataSet.getDatasetsByIds>>

const uploadTo = async (id: string, fileName: string) => {
  const input = await waitFor(() => {
    const found = document.getElementById(id)
    expect(found).not.toBeNull()
    return found as HTMLInputElement
  })
  await userEvent.upload(input, new File(['x'], fileName, { type: 'application/pdf' }))
}

beforeEach(() => {
  vi.clearAllMocks()
  setupTestEnvironment()
  mockServices()
})

describe('DataAccessRequestApplication', () => {
  it('shows spinner when submitting', async () => {
    // Both writes hang until released, so the spinner can be asserted mid-flight.
    let resolveSave: (value: { referenceId: string }) => void = () => {}
    vi.mocked(DAR.updateDarDraft).mockReturnValue(new Promise((resolve) => {
      resolveSave = resolve as (value: { referenceId: string }) => void
    }) as ReturnType<typeof DAR.updateDarDraft>)
    let resolveSubmit: (value: never) => void = () => {}
    vi.mocked(DAR.postDar).mockReturnValue(new Promise((resolve) => {
      resolveSubmit = resolve as (value: never) => void
    }) as ReturnType<typeof DAR.postDar>)

    await renderDraft()
    expect(screen.getByText('Data Access Request Application')).toBeInTheDocument()
    await completeTheForm()

    await clickById('btn_saveDar')
    expect(screen.getByText('Save changes?')).toBeInTheDocument()
    await clickDialogYes()

    await waitFor(() => {
      expect(document.getElementById('btn_submit')).toHaveAttribute('aria-busy', 'true')
    })
    expect(DAR.updateDarDraft).toHaveBeenCalled()
    await act(async () => {
      resolveSave({ referenceId: 'ref-123' })
    })

    // The Addendum tab is not shown until the user attests.
    expect(screen.queryByRole('tab', { name: /Addendum/i })).not.toBeInTheDocument()
    await clickById('btn_attest')
    expect(screen.getByRole('tab', { name: /Addendum/i })).toBeInTheDocument()

    await clickById('btn_openSubmitModal')
    expect(screen.getByText('Submit Data Access Request?')).toBeInTheDocument()
    await clickDialogYes()

    await waitFor(() => {
      expect(document.getElementById('btn_submit')).toHaveAttribute('aria-busy', 'true')
    })
    expect(DAR.postDar).toHaveBeenCalled()
    const submittedDar = vi.mocked(DAR.postDar).mock.calls[0][0] as { daaIds: number[] }
    expect(submittedDar.daaIds).toEqual([100])
    await act(async () => {
      resolveSubmit({} as never)
    })
  })

  const renderAndSaveDraft = async () => {
    await renderDraft()
    await completeTheForm()
    await clickById('btn_saveDar')
    expect(screen.getByText('Save changes?')).toBeInTheDocument()
    await clickDialogYes()
  }

  it('surfaces the server validation message when saving a draft fails with a validation error', async () => {
    vi.mocked(DAR.updateDarDraft).mockRejectedValue(Object.assign(new Error('File name is invalid'), {
      response: { data: { code: 400, message: 'File name is invalid' } },
    }))

    await renderAndSaveDraft()

    await waitFor(() => expect(Notifications.showError).toHaveBeenCalled())
    const call = vi.mocked(Notifications.showError).mock.calls[0][0] as { text: React.ReactElement<{ children: string }> }
    expect(call.text.props.children).toBe('File name is invalid')
  })

  it('falls back to the generic save-failure toast for an unexpected error', async () => {
    vi.mocked(DAR.updateDarDraft).mockRejectedValue(new Error('network exploded'))

    await renderAndSaveDraft()

    await waitFor(() => expect(Notifications.showError).toHaveBeenCalled())
    const call = vi.mocked(Notifications.showError).mock.calls[0][0] as { text: string }
    expect(call.text).toBe('Error saving Data Access Request. Please try again in a few moments.')
  })

  it('loads dataset/DAA snapshots in submitted read-only DAR review container', async () => {
    vi.mocked(DataSet.getDatasetsByIds).mockResolvedValue([
      { datasetId: 2352, datasetIdentifier: 'DUOS-READONLY-2352', name: 'Read-only Dataset', dacId: 1, dataUse: {} },
    ] as Awaited<ReturnType<typeof DataSet.getDatasetsByIds>>)
    vi.mocked(DAR.getDatasetDaaSnapshots).mockResolvedValue([
      { datasetId: 2352, daaId: 100, daaFileName: 'ReadonlyDAA.pdf' },
    ] as Awaited<ReturnType<typeof DAR.getDatasetDaaSnapshots>>)

    await renderReview()

    expect(document.querySelector('.dar-summary')).not.toBeNull()
    expect(DAR.getDatasetDaaSnapshots).toHaveBeenCalledWith(darId)
  })

  // PageHeading suffixes the id it is given.
  const pageHeading = () => document.getElementById('dar-application-heading_heading')

  it('keeps its own heading, side panel and voting history on the standalone read-only route', async () => {
    await renderReview()

    expect(pageHeading()).toBeInTheDocument()
    expect(document.querySelector('.multi-step-buttons-container')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Voting History' })).toBeInTheDocument()
  })

  it('labels every step section by the tab that scrolls to it', async () => {
    await renderReview()

    const tabs = screen.getAllByRole('tab')
    expect(tabs.length).toBeGreaterThan(1)
    tabs.forEach((tab) => {
      const panel = document.getElementById(tab.getAttribute('aria-controls') ?? '')
      expect(panel).toHaveAttribute('role', 'tabpanel')
      expect(panel).toHaveAttribute('aria-labelledby', tab.id)
    })
  })

  it('drops the heading, stacks the step tabs and defers voting history when embedded in the Full DAR tab', async () => {
    await renderReview({ embedded: true })

    expect(pageHeading()).not.toBeInTheDocument()
    expect(document.querySelector('.step-tabs-container--horizontal')).toBeInTheDocument()
    expect(document.querySelector('.multi-step-buttons-container')).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Voting History' })).not.toBeInTheDocument()
  })
})

describe('DataAccessRequestApplication - page modes', () => {
  it('titles the page Progress Report when building one', async () => {
    await renderReview({ isProgressReportApplication: true })

    expect(document.title).toContain('Progress Report')
    expect(screen.getByRole('tab', { name: /Progress Report/ })).toBeInTheDocument()
  })

  it('titles the page DAR Application Review in read-only mode', async () => {
    await renderReview()

    expect(document.title).toContain('DAR Application Review')
  })

  it('widens the heading when the DAR has no code yet', async () => {
    mockServices({ partialDar: { ...darCollection.dars[darId], darCode: null } })

    await renderDraft()

    expect(document.getElementById('dar-application-heading_heading')?.closest('.col-sm-12')).not.toBeNull()
  })

  it('lists each previous progress report alongside the current DAR', async () => {
    mockServices({ collection: multiDarCollection() })

    await renderReview()

    expect(screen.getByText('Previous Updates')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Progress Report 1' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Progress Report 2' })).toBeInTheDocument()
  })

  it('navigates back when the Back button is used', async () => {
    render(
      <MemoryRouter initialEntries={['/dar_collection/1', `/dar_application/${darId}`]} initialIndex={1}>
        <Routes>
          <Route path="/dar_collection/:collectionId" element={<div>Where we came from</div>} />
          <Route
            path="/dar_application/:dataRequestId"
            element={<DataAccessRequestApplication draftDar={true} isProgressReportApplication={false} />}
          />
        </Routes>
      </MemoryRouter>,
    )
    await screen.findAllByRole('tab')

    await userEvent.click(document.getElementById('btn_back')!)

    expect(await screen.findByText('Where we came from')).toBeInTheDocument()
  })

  it('warns when the researcher cannot be loaded', async () => {
    vi.mocked(User.getMe).mockRejectedValue(new Error('user service down'))

    await renderDraft()

    expect(Notifications.showError).toHaveBeenCalledWith({
      text: 'Error displaying user information. Please try again in a few moments.',
    })
  })

  it('starts from an empty form when there is no DAR id and nothing stored', async () => {
    await renderNewDar()

    expect(Storage.removeData).toHaveBeenCalledWith('dar_application')
    expect(DAR.getPartialDarRequest).not.toHaveBeenCalled()
  })
})

// The addendum's Save button shares btn_save with the dialog's No, so this matches on the label.
describe('DataAccessRequestApplication - dialogs and attestation', () => {
  it('closes the save dialog without saving when the user declines', async () => {
    await renderDraft()
    await completeTheForm()

    await clickById('btn_saveDar')
    expect(screen.getByText('Save changes?')).toBeInTheDocument()

    await clickDialogNo()

    expect(DAR.updateDarDraft).not.toHaveBeenCalled()
    expect(screen.queryByText('Save changes?')).not.toBeInTheDocument()
  })

  it('closes the submit dialog without submitting when the user declines', async () => {
    await renderDraft()
    await completeTheForm()

    await clickById('btn_attest')
    await clickById('btn_openSubmitModal')
    expect(screen.getByText('Submit Data Access Request?')).toBeInTheDocument()

    await clickDialogNo()

    expect(DAR.postDar).not.toHaveBeenCalled()
    expect(screen.queryByText('Submit Data Access Request?')).not.toBeInTheDocument()
  })

  it('sends the user to Researcher Information when their details are incomplete', async () => {
    await renderDraft()

    await clickById('btn_attest')

    expect(selectedTabName()).toContain('Researcher Information')
    expect(screen.queryByRole('tab', { name: /Addendum/i })).not.toBeInTheDocument()
  })

  it('sends the user to the Research Purpose Statement when only that section fails', async () => {
    await renderDraft()
    await completeTheForm()
    // A single-gender study with no gender chosen is a RUS error and nothing else.
    await clickById('oneGender_yes')

    await clickById('btn_attest')

    expect(selectedTabName()).toContain('Research Purpose Statement')
  })

  it('does not open the submit dialog while the form is still invalid', async () => {
    await renderDraft()
    await completeTheForm()
    await clickById('btn_attest')
    await typeById('projectTitle', '')

    await clickById('btn_openSubmitModal')

    expect(screen.queryByText('Submit Data Access Request?')).not.toBeInTheDocument()
  })

  it('drops the addendum tab when the user cancels their attestation', async () => {
    await renderDraft()
    await completeTheForm()

    await clickById('btn_attest')
    expect(screen.getByRole('tab', { name: /Addendum/i })).toBeInTheDocument()

    await clickById('btn_cancelAttest')

    expect(screen.queryByRole('tab', { name: /Addendum/i })).not.toBeInTheDocument()
  })

  it('opens the save dialog from the addendum tab', async () => {
    await renderDraft()
    await completeTheForm()
    await clickById('btn_attest')

    await clickById('btn_save')

    expect(screen.getByText('Save changes?')).toBeInTheDocument()
  })
})

describe('DataAccessRequestApplication - submission failures', () => {
  const attestAndSubmit = async () => {
    await renderDraft()
    await completeTheForm()
    await clickById('btn_attest')
    await clickById('btn_openSubmitModal')
    await clickDialogYes()
  }

  it('reopens the form for editing when the server rejects the DAR as invalid', async () => {
    vi.mocked(DAR.postDar).mockRejectedValue({ response: { status: 400 } })

    await attestAndSubmit()

    expect(document.getElementById('btn_openSubmitModal')).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: /Addendum/i })).not.toBeInTheDocument()
  })

  it('surfaces the server message when submission fails with one', async () => {
    vi.mocked(DAR.postDar).mockRejectedValue({
      response: { status: 500, data: { code: 500, message: 'Datasets are no longer available' } },
    })

    await attestAndSubmit()

    const call = vi.mocked(Notifications.showError).mock.calls[0][0] as { text: React.ReactElement<{ children: string }> }
    expect(call.text.props.children).toBe('Datasets are no longer available')
  })

  it('falls back to the generic submit-failure toast', async () => {
    vi.mocked(DAR.postDar).mockRejectedValue(new Error('network exploded'))

    await attestAndSubmit()

    const call = vi.mocked(Notifications.showError).mock.calls[0][0] as { text: string }
    expect(call.text).toBe('Error saving Data Access Request. Please try again in a few moments.')
  })
})

describe('DataAccessRequestApplication - supporting documents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupTestEnvironment()
    mockServices()
    vi.mocked(DataSet.getDatasetsByIds).mockResolvedValue(docDatasets)
  })

  it('uploads the IRB approval and collaboration letter alongside a saved draft', async () => {
    vi.mocked(DAR.uploadDARDocument).mockResolvedValue({ data: null })

    await renderDraft()
    await uploadTo('irbDocument', 'irb.pdf')
    await uploadTo('collaborationLetter', 'collab.pdf')
    await completeTheForm()

    await clickById('btn_saveDar')
    await clickDialogYes()

    expect(DAR.uploadDARDocument).toHaveBeenCalledWith(expect.any(File), 'ref-123', 'irbDocument')
    expect(DAR.uploadDARDocument).toHaveBeenCalledWith(expect.any(File), 'ref-123', 'collaborationDocument')
  })

  it('uploads the documents again when the DAR is submitted', async () => {
    await renderDraft()
    await uploadTo('irbDocument', 'irb.pdf')
    await uploadTo('collaborationLetter', 'collab.pdf')
    await completeTheForm()

    await clickById('btn_attest')
    await clickById('btn_openSubmitModal')
    await clickDialogYes()

    expect(DAR.uploadDARDocument).toHaveBeenCalledWith(expect.any(File), expect.any(String), 'irbDocument')
    expect(DAR.postDar).toHaveBeenCalled()
  })

  it('clears the previously stored document names when new files replace them', async () => {
    await renderDraft()
    await uploadTo('irbDocument', 'replacement.pdf')
    await uploadTo('collaborationLetter', 'replacement-collab.pdf')
    await completeTheForm()

    await clickById('btn_saveDar')
    await clickDialogYes()

    const saved = vi.mocked(DAR.updateDarDraft).mock.calls[0][0] as Record<string, unknown>
    expect(saved.irbDocumentName).toBe('')
    expect(saved.collaborationLetterName).toBe('')
  })
})

describe('DataAccessRequestApplication - draft creation', () => {
  it('posts a new draft and routes to it when the DAR has no reference id yet', async () => {
    vi.mocked(Storage.getData).mockReturnValue({ datasetIds: [123456] } as ReturnType<typeof Storage.getData>)

    await renderNewDar()
    await completeTheForm()

    await clickById('btn_saveDar')
    await clickDialogYes()

    expect(DAR.postDarDraft).toHaveBeenCalled()
    expect(DAR.updateDarDraft).not.toHaveBeenCalled()
  })

  it('treats a collection with no DARs as an empty form', async () => {
    mockServices({ collection: { ...darCollection, dars: undefined } as unknown as DarCollection })

    await renderReview()

    expect(DAR.getPartialDarRequest).not.toHaveBeenCalled()
    expect(screen.queryByText('Previous Updates')).not.toBeInTheDocument()
  })

  it('copes with a DAR that carries no dataset or agreement ids', async () => {
    mockServices({ partialDar: { referenceId: darId, darCode: 'DAR-1', datasetIds: undefined, daaIds: undefined } })

    await renderDraft()
    await completeTheForm()

    await clickById('btn_saveDar')
    await clickDialogYes()

    const saved = vi.mocked(DAR.updateDarDraft).mock.calls[0][0] as { daaIds: number[] }
    expect(saved.daaIds).toEqual([])
  })
})

describe('DataAccessRequestApplication - unmounting mid-flight', () => {
  const renderThenUnmount = async (settle: () => void) => {
    const { unmount } = render(
      <MemoryRouter initialEntries={[`/dar_application/${darId}`]}>
        <Routes>
          <Route
            path="/dar_application/:dataRequestId"
            element={<DataAccessRequestApplication draftDar={true} isProgressReportApplication={false} />}
          />
        </Routes>
      </MemoryRouter>,
    )
    unmount()
    await act(async () => {
      settle()
      await Promise.resolve()
    })
  }

  // Every fetch below is fire-and-forget, so a late resolution must not write to a gone component.
  it('drops a late user response', async () => {
    let resolveMe: (value: never) => void = () => {}
    vi.mocked(User.getMe).mockReturnValue(new Promise((resolve) => {
      resolveMe = resolve as (value: never) => void
    }))

    await renderThenUnmount(() => resolveMe(user as never))

    expect(Notifications.showError).not.toHaveBeenCalled()
  })

  it('drops a late user failure', async () => {
    let rejectMe: (reason: unknown) => void = () => {}
    vi.mocked(User.getMe).mockReturnValue(new Promise((_resolve, reject) => {
      rejectMe = reject
    }))

    await renderThenUnmount(() => rejectMe(new Error('too late')))

    expect(Notifications.showError).not.toHaveBeenCalled()
  })

  it('drops a late banner, country and DAR response', async () => {
    let resolveBanner: (value: never) => void = () => {}
    let resolveCountries: (value: never) => void = () => {}
    let resolveDar: (value: never) => void = () => {}
    vi.mocked(NotificationService.getBannerObjectById).mockReturnValue(new Promise((resolve) => {
      resolveBanner = resolve as (value: never) => void
    }))
    vi.mocked(Countries.getCountries).mockReturnValue(new Promise((resolve) => {
      resolveCountries = resolve as (value: never) => void
    }))
    vi.mocked(DAR.getPartialDarRequest).mockReturnValue(new Promise((resolve) => {
      resolveDar = resolve as (value: never) => void
    }))

    await renderThenUnmount(() => {
      resolveBanner({ id: 'eRACommonsOutage', active: true, message: 'late', level: 'info' } as never)
      resolveCountries(['Canada'] as never)
      resolveDar(darCollection.dars[darId] as never)
    })

    expect(screen.queryByText('late')).not.toBeInTheDocument()
  })
})

describe('DataAccessRequestApplication - review-mode edge cases', () => {
  it('renders a review whose collection names no creating user', async () => {
    mockServices({ collection: { ...darCollection, createUser: undefined } as unknown as DarCollection })

    await renderReview()

    expect(document.querySelector('.dar-summary')).not.toBeNull()
  })

  it('drops a late collection response after the review unmounts', async () => {
    let resolveCollection: (value: never) => void = () => {}
    vi.mocked(Collections.getCollectionById).mockReturnValue(new Promise((resolve) => {
      resolveCollection = resolve as (value: never) => void
    }))

    const { unmount } = render(
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
    unmount()
    await act(async () => {
      resolveCollection(darCollection as never)
      await Promise.resolve()
    })

    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
  })

  it('clears an uploaded document when the file picker is emptied', async () => {
    vi.mocked(DataSet.getDatasetsByIds).mockResolvedValue(docDatasets)

    await renderDraft()
    await uploadTo('irbDocument', 'irb.pdf')

    await clearFileInput('irbDocument')
    await clearFileInput('collaborationLetter')
    await completeTheForm()

    await clickById('btn_saveDar')
    await clickDialogYes()

    expect(DAR.uploadDARDocument).not.toHaveBeenCalled()
  })
})
