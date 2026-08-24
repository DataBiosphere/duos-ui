import { describe, expect, it } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { DraftDetail, isStudyDatasetDraft } from 'src/types/draft'

const draftDetail = (): DraftDetail => JSON.parse(readFileSync(
  resolve(__dirname, '../fixtures/study-template/v1/draft/minimal-valid-draft-detail.json'),
  'utf8',
))

describe('isStudyDatasetDraft', () => {
  it('accepts the draft a validated template produces', () => {
    expect(isStudyDatasetDraft(draftDetail())).toBe(true)
  })

  it('rejects a draft of another type', () => {
    const draft = draftDetail()
    draft.meta.draftType = 'SomeOtherSubmissionV1'

    expect(isStudyDatasetDraft(draft)).toBe(false)
  })

  it('rejects a draft whose type is missing rather than assuming this one', () => {
    const draft = draftDetail()
    delete (draft.meta as Partial<DraftDetail['meta']>).draftType

    expect(isStudyDatasetDraft(draft)).toBe(false)
  })
})
