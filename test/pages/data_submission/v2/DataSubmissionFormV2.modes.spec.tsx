import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { Route, Routes } from 'react-router'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { DataSubmissionFormV2 } from 'src/pages/data_submission/v2/DataSubmissionFormV2'
import { Draft } from 'src/libs/ajax/Draft'
import { Notifications } from 'src/libs/utils'
import { DataSet } from 'src/libs/ajax/DataSet'
import { Study } from 'src/pages/data_submission/v2/v2-models'
import { DraftDetail } from 'src/types/draft'
import { renderWithRouter } from '../../../test-utils'

vi.mock('src/libs/ajax/Draft', () => ({ Draft: { getDraft: vi.fn(), deleteDraft: vi.fn() } }))
vi.mock('src/libs/ajax/DataSet', () => ({ DataSet: { getStudyById: vi.fn(), registerDataset: vi.fn(), updateStudy: vi.fn() } }))
vi.mock('src/libs/utils', async () => {
  const actual = await vi.importActual<typeof import('src/libs/utils')>('src/libs/utils')
  return { ...actual, Notifications: { showNotification: vi.fn(), showError: vi.fn() } }
})

vi.mock('src/libs/storage', () => ({
  Storage: {
    getCurrentUser: () => ({}),
    userIsLogged: () => false,
  },
}))

// The form's sections are exercised by their own specs. Here one only has to show what the form
// handed it, so the assertions are about which study was loaded rather than how it renders.
vi.mock('src/pages/data_submission/v2/GeneralStudyInformation', () => ({
  GeneralStudyInformation: ({ study }: { study: Study }) => <div data-testid="study-name">{study?.name}</div>,
}))
vi.mock('src/pages/data_submission/v2/NihAnvilUseRelated', () => ({ NihAnvilUseRelated: () => <div /> }))
vi.mock('src/pages/data_submission/v2/NihAdministrativeInformation', () => ({ NihAdministrativeInformation: () => <div /> }))
vi.mock('src/pages/data_submission/v2/NihDataManagement', () => ({ NihDataManagement: () => <div /> }))
vi.mock('src/pages/data_submission/v2/StudyAssetManagement', () => ({ StudyAssetManagement: () => <div /> }))

const DRAFT_ID = '0393c587-343b-4c85-8969-e69e3f4f5aa8'
const DRAFT_ROUTE = `/data_submission_form/draft/study-dataset/${DRAFT_ID}`

const draftDetail = (): DraftDetail => JSON.parse(readFileSync(
  resolve(__dirname, '../../../fixtures/study-template/v1/draft/minimal-valid-draft-detail.json'),
  'utf8',
))

const renderDraftRoute = () => renderWithRouter(
  <Routes>
    <Route path="/data_submission_form/draft/study-dataset/:draftId" element={<DataSubmissionFormV2 />} />
    <Route path="/data_submission_form" element={<DataSubmissionFormV2 />} />
  </Routes>,
  { route: DRAFT_ROUTE },
)

describe('DataSubmissionFormV2 in draft mode', () => {
  beforeEach(() => vi.clearAllMocks())

  it('loads the draft by id rather than treating it as a study id', async () => {
    vi.mocked(Draft.getDraft).mockResolvedValue(draftDetail())

    renderDraftRoute()

    await waitFor(() => expect(Draft.getDraft).toHaveBeenCalledWith(DRAFT_ID))
    expect(DataSet.getStudyById).not.toHaveBeenCalled()
  })

  it('populates the form from the draft document', async () => {
    vi.mocked(Draft.getDraft).mockResolvedValue(draftDetail())

    renderDraftRoute()

    expect(await screen.findByTestId('study-name')).toHaveTextContent('Synthetic Minimal Study')
  })

  it('says the registration is a draft', async () => {
    vi.mocked(Draft.getDraft).mockResolvedValue(draftDetail())

    renderDraftRoute()

    expect(await screen.findByText('Study Registration Draft')).toBeInTheDocument()
  })

  it('offers creation rather than update, since a draft was never submitted', async () => {
    vi.mocked(Draft.getDraft).mockResolvedValue(draftDetail())

    renderDraftRoute()

    expect(await screen.findByText('Create Study')).toBeInTheDocument()
    expect(screen.queryByText('Update Study')).not.toBeInTheDocument()
  })

  it('refuses a draft of another type without offering the form', async () => {
    const draft = draftDetail()
    draft.meta.draftType = 'SomeOtherSubmissionV1'
    vi.mocked(Draft.getDraft).mockResolvedValue(draft)

    renderDraftRoute()

    expect(await screen.findByText('Draft could not be loaded')).toBeInTheDocument()
    expect(screen.queryByText('Create Study')).not.toBeInTheDocument()
    expect(screen.queryByTestId('study-name')).not.toBeInTheDocument()
  })

  it('reports a missing or unauthorized draft the same recoverable way', async () => {
    vi.mocked(Draft.getDraft).mockRejectedValue(new Error('Request failed with status 404'))

    renderDraftRoute()

    expect(await screen.findByText('Draft could not be loaded')).toBeInTheDocument()
    expect(screen.getByText('Back to My Data Submissions')).toBeInTheDocument()
  })
})

describe('DataSubmissionFormV2 outside draft mode', () => {
  beforeEach(() => vi.clearAllMocks())

  it('still renders the blank create form, loading nothing', async () => {
    renderWithRouter(
      <Routes>
        <Route path="/data_submission_form" element={<DataSubmissionFormV2 />} />
      </Routes>,
      { route: '/data_submission_form' },
    )

    expect(await screen.findByText('Study Registration Form')).toBeInTheDocument()
    expect(Draft.getDraft).not.toHaveBeenCalled()
    expect(DataSet.getStudyById).not.toHaveBeenCalled()
    expect(screen.getByText('Create Study')).toBeInTheDocument()
  })

  it('deletes no draft when a study is created without one', async () => {
    vi.mocked(DataSet.registerDataset).mockResolvedValue({} as never)

    renderWithRouter(
      <Routes>
        <Route path="/data_submission_form" element={<DataSubmissionFormV2 />} />
      </Routes>,
      { route: '/data_submission_form' },
    )
    expect(await screen.findByText('Create Study')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Create Study'))

    await waitFor(() => expect(Notifications.showNotification).toHaveBeenCalled())
    expect(DataSet.registerDataset).toHaveBeenCalled()
    expect(Draft.deleteDraft).not.toHaveBeenCalled()
  })
})

describe('DataSubmissionFormV2 editing a persisted study', () => {
  const STUDY_ID = '1'
  const persistedStudy = () => ({
    studyId: 1,
    name: 'Persisted Study',
    datasets: [],
    properties: [],
    data: {},
  } as unknown as Study)

  const renderStudyRoute = () => renderWithRouter(
    <Routes>
      <Route path="/data_submission_form/:studyId" element={<DataSubmissionFormV2 />} />
    </Routes>,
    { route: `/data_submission_form/${STUDY_ID}` },
  )

  beforeEach(() => vi.clearAllMocks())

  it('still loads by study id, with no draft involved', async () => {
    vi.mocked(DataSet.getStudyById).mockResolvedValue(persistedStudy())

    renderStudyRoute()

    expect(await screen.findByTestId('study-name')).toHaveTextContent('Persisted Study')
    expect(DataSet.getStudyById).toHaveBeenCalledWith(STUDY_ID)
    expect(Draft.getDraft).not.toHaveBeenCalled()
    expect(screen.getByText('Study Registration Form')).toBeInTheDocument()
  })

  it('still offers update rather than creation', async () => {
    vi.mocked(DataSet.getStudyById).mockResolvedValue(persistedStudy())

    renderStudyRoute()

    expect(await screen.findByText('Update Study')).toBeInTheDocument()
    expect(screen.queryByText('Create Study')).not.toBeInTheDocument()
  })

  it('still updates the study it loaded, deleting no draft', async () => {
    vi.mocked(DataSet.getStudyById).mockResolvedValue(persistedStudy())
    vi.mocked(DataSet.updateStudy).mockResolvedValue({} as never)

    renderStudyRoute()
    expect(await screen.findByText('Update Study')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Update Study'))

    expect(DataSet.updateStudy).toHaveBeenCalledWith(STUDY_ID, expect.any(FormData))
    expect(Draft.deleteDraft).not.toHaveBeenCalled()
  })

  it('still reports a failed load inline, keeping the form on the page', async () => {
    // Only the draft path replaces the form with an error page; this one is unchanged.
    vi.mocked(DataSet.getStudyById).mockRejectedValue(new Error('Request failed with status 404'))

    renderStudyRoute()

    expect(await screen.findByText('Error Loading Page')).toBeInTheDocument()
    expect(screen.queryByText('Draft could not be loaded')).not.toBeInTheDocument()
    expect(screen.getByText('Create Study')).toBeInTheDocument()
  })
})

describe('creating a study from a draft', () => {
  // fireEvent wraps its own act(); the click handler is async, so its continuation is awaited
  // through what it does rather than by wrapping the click again.
  const createStudy = async () => {
    expect(await screen.findByText('Create Study')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Create Study'))
    await waitFor(() => expect(DataSet.registerDataset).toHaveBeenCalled())
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Draft.getDraft).mockResolvedValue(draftDetail())
  })

  it('removes the source draft once the study exists', async () => {
    vi.mocked(DataSet.registerDataset).mockResolvedValue({} as never)
    vi.mocked(Draft.deleteDraft).mockResolvedValue(undefined)

    renderDraftRoute()
    await createStudy()

    await waitFor(() => expect(Draft.deleteDraft).toHaveBeenCalledWith(DRAFT_ID))
    expect(vi.mocked(DataSet.registerDataset).mock.invocationCallOrder[0])
      .toBeLessThan(vi.mocked(Draft.deleteDraft).mock.invocationCallOrder[0])
  })

  it('submits what the form holds rather than the document it was loaded from', async () => {
    vi.mocked(DataSet.registerDataset).mockResolvedValue({} as never)
    vi.mocked(Draft.deleteDraft).mockResolvedValue(undefined)

    renderDraftRoute()
    await createStudy()

    // Built from the Study the form edits, so an edit made before submitting is what gets sent.
    const formData = vi.mocked(DataSet.registerDataset).mock.calls[0][0] as FormData
    const submitted = JSON.parse(formData.get('dataset') as string)
    expect(submitted.studyName).toBe('Synthetic Minimal Study')
    expect(submitted.consentGroups).toHaveLength(1)
  })

  it('keeps the draft when creation fails, so it can be tried again', async () => {
    vi.mocked(DataSet.registerDataset).mockRejectedValue(new Error('Study creation failed'))

    renderDraftRoute()
    await createStudy()

    await waitFor(() => expect(Notifications.showError).toHaveBeenCalled())
    expect(Draft.deleteDraft).not.toHaveBeenCalled()
  })

  it('reports a failed cleanup without presenting the study as failed', async () => {
    vi.mocked(DataSet.registerDataset).mockResolvedValue({} as never)
    vi.mocked(Draft.deleteDraft).mockRejectedValue(new Error('Request failed with status 500'))

    renderDraftRoute()
    await createStudy()

    await waitFor(() => expect(Notifications.showError).toHaveBeenCalled())
    expect(Notifications.showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Study created successfully', type: 'success' }),
    )
    expect(Notifications.showError).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('could not be removed') }),
    )
  })

  it('does not retry a failed cleanup', async () => {
    vi.mocked(DataSet.registerDataset).mockResolvedValue({} as never)
    vi.mocked(Draft.deleteDraft).mockRejectedValue(new Error('Request failed with status 500'))

    renderDraftRoute()
    await createStudy()

    await waitFor(() => expect(Draft.deleteDraft).toHaveBeenCalled())
    expect(Draft.deleteDraft).toHaveBeenCalledTimes(1)
  })
})
