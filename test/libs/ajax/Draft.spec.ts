import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { Config } from 'src/libs/config'
import { fetchDelete, fetchGet, fetchMultipart } from 'src/libs/ajax/fetchAdapter'
import { Draft } from 'src/libs/ajax/Draft'
import { DraftDetail } from 'src/types/draft'
import { TemplateValidationResponse } from 'src/types/studyTemplate'

vi.mock('src/libs/config', () => ({
  Config: {
    getApiUrl: vi.fn(),
    multiPartOpts: vi.fn(),
    authOpts: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/fetchAdapter', () => ({
  fetchMultipart: vi.fn(),
  fetchGet: vi.fn(),
  fetchDelete: vi.fn(),
}))

const authHeaders = {
  headers: {
    'Authorization': 'Bearer token',
    'Accept': 'application/json',
    'X-App-ID': 'DUOS',
  },
}

const multiPartHeaders = {
  headers: {
    'Authorization': 'Bearer token',
    'Content-Type': 'multipart/form-data',
    'X-App-ID': 'DUOS',
  },
}

const VALIDATION_URL = 'http://localhost/api/draft/v1/study-dataset/template-validation'

const buildTemplateFile = (name = 'template.csv') =>
  new File(['templateVersion,recordType,recordId,parentRecordId,field,value\r\n'], name, { type: 'text/csv' })

describe('Draft.validateStudyDatasetTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Config.getApiUrl).mockResolvedValue('http://localhost')
    vi.mocked(Config.multiPartOpts).mockReturnValue(multiPartHeaders)
  })

  it('posts the file as multipart to the typed validation path', async () => {
    vi.mocked(fetchMultipart).mockResolvedValue({ data: { valid: false, errors: [] } })

    await Draft.validateStudyDatasetTemplate(buildTemplateFile())

    expect(fetchMultipart).toHaveBeenCalledWith(
      VALIDATION_URL,
      expect.any(FormData),
      multiPartHeaders,
    )
  })

  it('sends the CSV under the "file" part name', async () => {
    vi.mocked(fetchMultipart).mockResolvedValue({ data: { valid: false, errors: [] } })
    const file = buildTemplateFile('my-study.csv')

    await Draft.validateStudyDatasetTemplate(file)

    const formData = vi.mocked(fetchMultipart).mock.calls[0][1]
    expect(formData.get('file')).toBe(file)
  })

  it('returns structured validation errors rather than throwing', async () => {
    const response: TemplateValidationResponse = {
      valid: false,
      errors: [
        { row: 3, column: 'piEmail', message: 'Must be a valid email address.' },
        { message: 'Study name is required.' },
      ],
    }
    vi.mocked(fetchMultipart).mockResolvedValue({ data: response })

    const result = await Draft.validateStudyDatasetTemplate(buildTemplateFile())

    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(2)
    expect(result.errors[0].row).toBe(3)
    expect(result.errors[1].row).toBeUndefined()
  })

  it('returns the typed draft reference for a valid template', async () => {
    const response: TemplateValidationResponse = {
      valid: true,
      errors: [],
      draft: { id: 'c2e4583a-20b9-4705-8280-e6a5753f10c9', draftType: 'StudyDatasetSubmissionV1' },
    }
    vi.mocked(fetchMultipart).mockResolvedValue({ data: response })

    const result = await Draft.validateStudyDatasetTemplate(buildTemplateFile())

    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.draft.id).toBe('c2e4583a-20b9-4705-8280-e6a5753f10c9')
      expect(result.draft.draftType).toBe('StudyDatasetSubmissionV1')
    }
  })

  it('surfaces the truncation flag when the error cap is reached', async () => {
    vi.mocked(fetchMultipart).mockResolvedValue({
      data: { valid: false, errors: [{ message: 'too many' }], truncated: true },
    })

    const result = await Draft.validateStudyDatasetTemplate(buildTemplateFile())

    expect(result.truncated).toBe(true)
  })

  it('propagates request failures', async () => {
    vi.mocked(fetchMultipart).mockRejectedValue(new Error('Request failed with status 413'))

    await expect(Draft.validateStudyDatasetTemplate(buildTemplateFile()))
      .rejects.toThrow('Request failed with status 413')
  })
})

describe('Draft.getDraft', () => {
  const DRAFT_ID = '0393c587-343b-4c85-8969-e69e3f4f5aa8'
  const DRAFT_URL = `http://localhost/api/draft/v1/${DRAFT_ID}`

  // The response Consent actually returns for a validated template, captured rather than written.
  const draftDetail = (): DraftDetail => JSON.parse(readFileSync(
    resolve(__dirname, '../../fixtures/study-template/v1/draft/minimal-valid-draft-detail.json'),
    'utf8',
  ))

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Config.getApiUrl).mockResolvedValue('http://localhost')
    vi.mocked(Config.authOpts).mockReturnValue(authHeaders)
  })

  it('gets the draft by id from the generic draft path', async () => {
    vi.mocked(fetchGet).mockResolvedValue({ data: draftDetail() })

    await Draft.getDraft(DRAFT_ID)

    expect(fetchGet).toHaveBeenCalledWith(DRAFT_URL, authHeaders)
  })

  it('returns the document and the metadata that says what it is', async () => {
    vi.mocked(fetchGet).mockResolvedValue({ data: draftDetail() })

    const result = await Draft.getDraft(DRAFT_ID)

    expect(result.meta.draftType).toBe('StudyDatasetSubmissionV1')
    expect(result.meta.uuid).toBe(DRAFT_ID)
    expect(result.document).toMatchObject({ studyName: 'Synthetic Minimal Study' })
  })

  it('leaves a field the producer left empty absent rather than null', async () => {
    const document = draftDetail().document as Record<string, unknown>

    // Consent serializes with NON_NULL, so hydration reads absence as unset. A mapper written
    // against a hand-made fixture full of nulls would not notice the difference until runtime.
    expect('piEmail' in document).toBe(false)
    expect('embargoReleaseDate' in document).toBe(false)
  })

  it('propagates request failures', async () => {
    vi.mocked(fetchGet).mockRejectedValue(new Error('Request failed with status 404'))

    await expect(Draft.getDraft(DRAFT_ID)).rejects.toThrow('Request failed with status 404')
  })
})

describe('Draft.deleteDraft', () => {
  const DRAFT_ID = '0393c587-343b-4c85-8969-e69e3f4f5aa8'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Config.getApiUrl).mockResolvedValue('http://localhost')
    vi.mocked(Config.authOpts).mockReturnValue(authHeaders)
  })

  it('deletes the draft by id', async () => {
    vi.mocked(fetchDelete).mockResolvedValue({ data: undefined })

    await Draft.deleteDraft(DRAFT_ID)

    expect(fetchDelete).toHaveBeenCalledWith(`http://localhost/api/draft/v1/${DRAFT_ID}`, authHeaders)
  })

  it('propagates request failures so cleanup can be reported on its own', async () => {
    vi.mocked(fetchDelete).mockRejectedValue(new Error('Request failed with status 500'))

    await expect(Draft.deleteDraft(DRAFT_ID)).rejects.toThrow('Request failed with status 500')
  })
})
