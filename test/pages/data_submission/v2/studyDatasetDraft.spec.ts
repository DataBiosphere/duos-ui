import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { Draft } from 'src/libs/ajax/Draft'
import { WrongDraftTypeError, loadStudyDatasetDraft } from 'src/pages/data_submission/v2/studyDatasetDraft'
import { DraftDetail } from 'src/types/draft'

vi.mock('src/libs/ajax/Draft', () => ({ Draft: { getDraft: vi.fn() } }))
vi.mock('src/libs/storage', () => ({ Storage: { getCurrentUser: () => ({}) } }))

const DRAFT_ID = '0393c587-343b-4c85-8969-e69e3f4f5aa8'

const draftDetail = (): DraftDetail => JSON.parse(readFileSync(
  resolve(__dirname, '../../../fixtures/study-template/v1/draft/minimal-valid-draft-detail.json'),
  'utf8',
))

describe('loadStudyDatasetDraft', () => {
  beforeEach(() => vi.clearAllMocks())

  it('maps a study/dataset draft into the form model', async () => {
    vi.mocked(Draft.getDraft).mockResolvedValue(draftDetail())

    const study = await loadStudyDatasetDraft(DRAFT_ID)

    expect(study.name).toBe('Synthetic Minimal Study')
    expect(study.assets?.consentGroups).toHaveLength(1)
  })

  it('refuses a draft belonging to another workflow', async () => {
    const draft = draftDetail()
    draft.meta.draftType = 'SomeOtherSubmissionV1'
    vi.mocked(Draft.getDraft).mockResolvedValue(draft)

    await expect(loadStudyDatasetDraft(DRAFT_ID)).rejects.toBeInstanceOf(WrongDraftTypeError)
  })

  it('refuses a draft that does not say what it is', async () => {
    const draft = draftDetail()
    delete (draft.meta as Partial<DraftDetail['meta']>).draftType
    vi.mocked(Draft.getDraft).mockResolvedValue(draft)

    await expect(loadStudyDatasetDraft(DRAFT_ID)).rejects.toBeInstanceOf(WrongDraftTypeError)
  })

  it('propagates a missing or unauthorized draft', async () => {
    vi.mocked(Draft.getDraft).mockRejectedValue(new Error('Request failed with status 404'))

    await expect(loadStudyDatasetDraft(DRAFT_ID)).rejects.toThrow('Request failed with status 404')
  })
})
