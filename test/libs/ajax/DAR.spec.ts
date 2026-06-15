import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Config } from 'src/libs/config'
import { fetchDelete, fetchGet, fetchMultipart, fetchPost, fetchPut } from 'src/libs/ajax/fetchAdapter'
import { DAR } from 'src/libs/ajax/DAR'
import { extractConsentError, extractError } from 'src/utils/ErrorUtils'

vi.mock('src/libs/config', () => ({
  Config: {
    getApiUrl: vi.fn(),
    authOpts: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/fetchAdapter', () => ({
  fetchGet: vi.fn(),
  fetchPost: vi.fn(),
  fetchPut: vi.fn(),
  fetchDelete: vi.fn(),
  fetchMultipart: vi.fn(),
}))

vi.mock('src/libs/ajax/Metrics', () => ({
  Metrics: { captureEvent: vi.fn() },
}))

vi.mock('src/utils/FileDownload', () => ({
  fileDownload: vi.fn(),
}))

vi.mock('src/libs/utils', () => ({
  isFileEmpty: vi.fn(),
}))

const headers = {
  headers: {
    'Authorization': 'Bearer token',
    'Accept': 'application/json',
    'X-App-ID': 'DUOS',
  },
}

const buildDar = (overrides = {}) => ({
  id: 1,
  referenceId: 'ref-001',
  collectionId: 10,
  draft: true,
  progressReport: false,
  expired: false,
  expiresAt: 0,
  userId: 42,
  createDate: 0,
  submissionDate: 0,
  updateDate: 0,
  datasetIds: [],
  elections: {},
  eraCommonsId: '',
  data: {} as never,
  ...overrides,
})

describe('DAR', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.mocked(Config.getApiUrl).mockResolvedValue('https://duos.example.org')
    vi.mocked(Config.authOpts).mockReturnValue(headers)
    vi.mocked(fetchGet).mockResolvedValue({ data: buildDar() })
    vi.mocked(fetchPost).mockResolvedValue({ data: buildDar() })
    vi.mocked(fetchPut).mockResolvedValue({ data: buildDar() })
    vi.mocked(fetchDelete).mockResolvedValue({ data: undefined })
    vi.mocked(fetchMultipart).mockResolvedValue({ data: buildDar() })
    const { isFileEmpty } = await import('src/libs/utils')
    vi.mocked(isFileEmpty).mockReturnValue(false)
  })

  describe('getPartialDarRequest', () => {
    it('fetches the DAR by id and returns the data', async () => {
      const dar = buildDar({ referenceId: 'ref-abc' })
      vi.mocked(fetchGet).mockResolvedValue({ data: dar })

      const result = await DAR.getPartialDarRequest('ref-abc')

      expect(fetchGet).toHaveBeenCalledWith(
        'https://duos.example.org/api/dar/v2/ref-abc',
        headers,
      )
      expect(result).toEqual(dar)
    })

    it('propagates fetch failures', async () => {
      vi.mocked(fetchGet).mockRejectedValueOnce(new Error('network failure'))
      await expect(DAR.getPartialDarRequest('ref-abc')).rejects.toThrow('network failure')
    })
  })

  describe('updateDarDraft', () => {
    it('fires a Metrics event, puts to the draft endpoint, and returns the data', async () => {
      const { Metrics } = await import('src/libs/ajax/Metrics')
      const dar = buildDar({ referenceId: 'ref-001' })
      vi.mocked(fetchPut).mockResolvedValue({ data: dar })
      const payload = { projectTitle: 'My Study' }

      const result = await DAR.updateDarDraft(payload, 'ref-001')

      expect(Metrics.captureEvent).toHaveBeenCalledWith(expect.anything(), { action: 'update' })
      expect(fetchPut).toHaveBeenCalledWith(
        'https://duos.example.org/api/dar/v2/draft/ref-001',
        payload,
        headers,
      )
      expect(result).toEqual(dar)
    })

    it('propagates fetch failures', async () => {
      vi.mocked(fetchPut).mockRejectedValueOnce(new Error('server error'))
      await expect(DAR.updateDarDraft({}, 'ref-001')).rejects.toThrow('server error')
    })
  })

  describe('postDarDraft', () => {
    it('fires a Metrics event, posts to the draft endpoint, and returns the data', async () => {
      const { Metrics } = await import('src/libs/ajax/Metrics')
      const dar = buildDar({ referenceId: 'ref-new' })
      vi.mocked(fetchPost).mockResolvedValue({ data: dar })
      const payload = { datasetId: [1, 2] }

      const result = await DAR.postDarDraft(payload)

      expect(Metrics.captureEvent).toHaveBeenCalledWith(expect.anything(), { action: 'draft' })
      expect(fetchPost).toHaveBeenCalledWith(
        'https://duos.example.org/api/dar/v2/draft',
        payload,
        headers,
      )
      expect(result.referenceId).toBe('ref-new')
    })

    it('propagates fetch failures', async () => {
      vi.mocked(fetchPost).mockRejectedValueOnce(new Error('network failure'))
      await expect(DAR.postDarDraft({})).rejects.toThrow('network failure')
    })
  })

  describe('deleteDar', () => {
    it('deletes the DAR by id and returns { status: 200 }', async () => {
      const result = await DAR.deleteDar('ref-001')

      expect(fetchDelete).toHaveBeenCalledWith(
        'https://duos.example.org/api/dar/v2/ref-001',
        headers,
      )
      expect(result).toEqual({ status: 200 })
    })

    it('propagates fetch failures', async () => {
      vi.mocked(fetchDelete).mockRejectedValueOnce(new Error('not found'))
      await expect(DAR.deleteDar('ref-001')).rejects.toThrow('not found')
    })
  })

  describe('postDar', () => {
    it('fires a Metrics event, strips forbidden fields, posts, and returns the data', async () => {
      const { Metrics } = await import('src/libs/ajax/Metrics')
      const dar = buildDar()
      vi.mocked(fetchPost).mockResolvedValue({ data: dar })
      const payload = { projectTitle: 'Study', createDate: 12345, data_access_request_id: 'old-id' }

      const result = await DAR.postDar(payload)

      expect(Metrics.captureEvent).toHaveBeenCalledWith(expect.anything(), { action: 'submit' })
      const postedBody = vi.mocked(fetchPost).mock.calls[0][1] as Record<string, unknown>
      expect(postedBody).not.toHaveProperty('createDate')
      expect(postedBody).not.toHaveProperty('data_access_request_id')
      expect(postedBody.projectTitle).toBe('Study')
      expect(fetchPost).toHaveBeenCalledWith(
        'https://duos.example.org/api/dar/v2',
        postedBody,
        headers,
      )
      expect(result).toEqual(dar)
    })

    it('propagates fetch failures', async () => {
      vi.mocked(fetchPost).mockRejectedValueOnce(new Error('server error'))
      await expect(DAR.postDar({})).rejects.toThrow('server error')
    })
  })

  describe('getAutoCompleteOT', () => {
    it('fetches autocomplete results and returns the data', async () => {
      const entries = [{ id: 'HP:0000001', label: 'All', definition: '', synonyms: [] }]
      vi.mocked(fetchGet).mockResolvedValue({ data: entries })

      const result = await DAR.getAutoCompleteOT('HP:')

      expect(fetchGet).toHaveBeenCalledWith(
        'https://duos.example.org/ontology/autocomplete?q=HP:',
        headers,
      )
      expect(result).toEqual(entries)
    })

    it('propagates fetch failures', async () => {
      vi.mocked(fetchGet).mockRejectedValueOnce(new Error('network failure'))
      await expect(DAR.getAutoCompleteOT('HP:')).rejects.toThrow('network failure')
    })
  })

  describe('searchOntologyIdList', () => {
    it('fetches ontology entries for provided ids and returns the data', async () => {
      const entries = [{ id: 'HP:0000001', label: 'All', definition: '', synonyms: [] }]
      vi.mocked(fetchGet).mockResolvedValue({ data: entries })

      const result = await DAR.searchOntologyIdList(['HP:0000001'])

      expect(fetchGet).toHaveBeenCalledWith(
        'https://duos.example.org/ontology/search?ids=HP:0000001',
        headers,
      )
      expect(result).toEqual(entries)
    })

    it('returns an empty array without fetching when ids is empty', async () => {
      const result = await DAR.searchOntologyIdList([])
      expect(fetchGet).not.toHaveBeenCalled()
      expect(result).toEqual([])
    })

    it('returns an empty array on fetch error', async () => {
      vi.mocked(fetchGet).mockRejectedValueOnce(new Error('ontology down'))
      const result = await DAR.searchOntologyIdList(['HP:0000001'])
      expect(result).toEqual([])
    })
  })

  describe('downloadDARDocument', () => {
    it('fetches the document as a blob and triggers fileDownload', async () => {
      const { fileDownload } = await import('src/utils/FileDownload')
      const blob = new Blob(['pdf content'], { type: 'application/pdf' })
      vi.mocked(fetchGet).mockResolvedValue({ data: blob })

      await DAR.downloadDARDocument('ref-001', 'irbDocument', 'irb.pdf')

      expect(fetchGet).toHaveBeenCalledWith(
        'https://duos.example.org/api/dar/v2/ref-001/irbDocument',
        expect.objectContaining({
          responseType: 'blob',
          headers: expect.objectContaining({
            'Content-Type': 'application/octet-stream',
            'Accept': 'application/octet-stream',
          }),
        }),
      )
      expect(fileDownload).toHaveBeenCalledWith(blob, 'irb.pdf')
    })

    it('propagates fetch failures', async () => {
      vi.mocked(fetchGet).mockRejectedValueOnce(new Error('network failure'))
      await expect(DAR.downloadDARDocument('ref-001', 'irbDocument', 'irb.pdf')).rejects.toThrow('network failure')
    })
  })

  describe('getDARDocumentAsBlob', () => {
    it('fetches the document as a blob and returns it', async () => {
      const blob = new Blob(['pdf content'], { type: 'application/pdf' })
      vi.mocked(fetchGet).mockResolvedValue({ data: blob })

      const result = await DAR.getDARDocumentAsBlob('ref-001', 'irbDocument')

      expect(fetchGet).toHaveBeenCalledWith(
        'https://duos.example.org/api/dar/v2/ref-001/irbDocument',
        expect.objectContaining({ responseType: 'blob' }),
      )
      expect(result).toBe(blob)
    })

    it('propagates fetch failures', async () => {
      vi.mocked(fetchGet).mockRejectedValueOnce(new Error('network failure'))
      await expect(DAR.getDARDocumentAsBlob('ref-001', 'irbDocument')).rejects.toThrow('network failure')
    })
  })

  describe('getDatasetDaaSnapshots', () => {
    it('fetches snapshots and returns the data', async () => {
      const snapshots = [{ datasetId: 1, daaId: 10, daaFileName: 'daa.pdf' }]
      vi.mocked(fetchGet).mockResolvedValue({ data: snapshots })

      const result = await DAR.getDatasetDaaSnapshots('ref-001')

      expect(fetchGet).toHaveBeenCalledWith(
        'https://duos.example.org/api/dar/v2/ref-001/dataset-daa-snapshots',
        headers,
      )
      expect(result).toEqual(snapshots)
    })

    it('propagates fetch failures', async () => {
      vi.mocked(fetchGet).mockRejectedValueOnce(new Error('not found'))
      await expect(DAR.getDatasetDaaSnapshots('ref-001')).rejects.toThrow('not found')
    })

    it('propagates ConsentError rejections so callers can extract a useful error', async () => {
      const consentError = { message: 'Snapshot not available for ref-001', code: 404 }
      vi.mocked(fetchGet).mockRejectedValueOnce(consentError)

      const error = await DAR.getDatasetDaaSnapshots('ref-001').then(
        () => { throw new Error('expected getDatasetDaaSnapshots to reject') },
        e => e,
      )

      expect(extractConsentError(error)).toEqual(consentError)
      expect(extractError(error)).toBe('Snapshot not available for ref-001')
    })
  })

  describe('uploadDARDocument', () => {
    it('uploads the file via multipart and returns the result', async () => {
      const dar = buildDar()
      vi.mocked(fetchMultipart).mockResolvedValue({ data: dar })
      const file = new File(['content'], 'irb.pdf', { type: 'application/pdf' })

      const result = await DAR.uploadDARDocument(file, 'ref-001', 'irbDocument')

      expect(fetchMultipart).toHaveBeenCalledWith(
        'https://duos.example.org/api/dar/v2/ref-001/irbDocument',
        expect.any(FormData),
        headers,
      )
      expect(result.data).toEqual(dar)
    })

    it('returns { data: null } without fetching when the file is empty', async () => {
      const { isFileEmpty } = await import('src/libs/utils')
      vi.mocked(isFileEmpty).mockReturnValue(true)
      const file = new File([], 'empty.pdf')

      const result = await DAR.uploadDARDocument(file, 'ref-001', 'irbDocument')

      expect(fetchMultipart).not.toHaveBeenCalled()
      expect(result).toEqual({ data: null })
    })

    it('propagates fetch failures', async () => {
      vi.mocked(fetchMultipart).mockRejectedValueOnce(new Error('upload failed'))
      const file = new File(['content'], 'irb.pdf', { type: 'application/pdf' })
      await expect(DAR.uploadDARDocument(file, 'ref-001', 'irbDocument')).rejects.toThrow('upload failed')
    })
  })

  describe('approveCloseout', () => {
    it('puts to the approveCloseout endpoint', async () => {
      await DAR.approveCloseout('ref-001')

      expect(fetchPut).toHaveBeenCalledWith(
        'https://duos.example.org/api/dar/ref-001/approveCloseout',
        {},
        headers,
      )
    })

    it('propagates fetch failures', async () => {
      vi.mocked(fetchPut).mockRejectedValueOnce(new Error('forbidden'))
      await expect(DAR.approveCloseout('ref-001')).rejects.toThrow('forbidden')
    })
  })
})
