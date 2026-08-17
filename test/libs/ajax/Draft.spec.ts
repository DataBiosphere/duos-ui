import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Config } from 'src/libs/config'
import { fetchMultipart } from 'src/libs/ajax/fetchAdapter'
import { Draft } from 'src/libs/ajax/Draft'
import { TemplateValidationResponse } from 'src/types/studyTemplate'

vi.mock('src/libs/config', () => ({
  Config: {
    getApiUrl: vi.fn(),
    multiPartOpts: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/fetchAdapter', () => ({
  fetchMultipart: vi.fn(),
}))

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
