import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { Route, Routes } from 'react-router'
import { screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { DataSubmissionFormV2 } from 'src/pages/data_submission/v2/DataSubmissionFormV2'
import { Draft } from 'src/libs/ajax/Draft'
import { DataSet } from 'src/libs/ajax/DataSet'
import { Study } from 'src/pages/data_submission/v2/v2-models'
import { DraftDetail } from 'src/types/draft'
import { renderWithRouter } from '../../../test-utils'

vi.mock('src/libs/ajax/Draft', () => ({ Draft: { getDraft: vi.fn() } }))
vi.mock('src/libs/ajax/DataSet', () => ({ DataSet: { getStudyById: vi.fn(), registerDataset: vi.fn(), updateStudy: vi.fn() } }))
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

    await waitFor(() => expect(screen.getByTestId('study-name')).toHaveTextContent('Synthetic Minimal Study'))
  })

  it('says the registration is a draft', async () => {
    vi.mocked(Draft.getDraft).mockResolvedValue(draftDetail())

    renderDraftRoute()

    await waitFor(() => expect(screen.getByText('Study Registration Draft')).toBeInTheDocument())
  })

  it('offers creation rather than update, since a draft was never submitted', async () => {
    vi.mocked(Draft.getDraft).mockResolvedValue(draftDetail())

    renderDraftRoute()

    await waitFor(() => expect(screen.getByText('Create Study')).toBeInTheDocument())
    expect(screen.queryByText('Update Study')).not.toBeInTheDocument()
  })

  it('refuses a draft of another type without offering the form', async () => {
    const draft = draftDetail()
    draft.meta.draftType = 'SomeOtherSubmissionV1'
    vi.mocked(Draft.getDraft).mockResolvedValue(draft)

    renderDraftRoute()

    await waitFor(() => expect(screen.getByText('Draft could not be loaded')).toBeInTheDocument())
    expect(screen.queryByText('Create Study')).not.toBeInTheDocument()
    expect(screen.queryByTestId('study-name')).not.toBeInTheDocument()
  })

  it('reports a missing or unauthorized draft the same recoverable way', async () => {
    vi.mocked(Draft.getDraft).mockRejectedValue(new Error('Request failed with status 404'))

    renderDraftRoute()

    await waitFor(() => expect(screen.getByText('Draft could not be loaded')).toBeInTheDocument())
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

    await waitFor(() => expect(screen.getByText('Study Registration Form')).toBeInTheDocument())
    expect(Draft.getDraft).not.toHaveBeenCalled()
    expect(DataSet.getStudyById).not.toHaveBeenCalled()
    expect(screen.getByText('Create Study')).toBeInTheDocument()
  })
})
