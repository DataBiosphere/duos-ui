import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Config } from 'src/libs/config'
import { fetchDelete, fetchGet, fetchMultipart, fetchPost } from 'src/libs/ajax/fetchAdapter'
import { DataSet } from 'src/libs/ajax/DataSet'
import { extractConsentError, extractError } from 'src/utils/ErrorUtils'

vi.mock('src/libs/config', () => ({
  Config: {
    getApiUrl: vi.fn(),
    authOpts: vi.fn(),
    multiPartOpts: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/fetchAdapter', () => ({
  fetchGet: vi.fn(),
  fetchPost: vi.fn(),
  fetchDelete: vi.fn(),
  fetchMultipart: vi.fn(),
}))

vi.mock('src/utils/FileDownload', () => ({
  fileDownload: vi.fn(),
}))

const headers = {
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

const buildDataset = (overrides = {}) => ({
  datasetId: 1,
  name: 'Test Dataset',
  createUserId: 1,
  createUser: {} as never,
  createDate: new Date('2026-01-01'),
  dacId: 1,
  translatedDataUse: '',
  deletable: true,
  properties: [],
  study: {} as never,
  alias: 1,
  datasetIdentifier: 'DUOS-000001',
  dataUse: {},
  ...overrides,
})

const buildStudy = (overrides = {}) => ({
  studyId: 1,
  name: 'Test Study',
  description: 'A study',
  dataTypes: [],
  piName: 'Dr. PI',
  piEmail: 'pi@example.org',
  publicVisibility: true,
  datasetIds: [],
  datasets: [],
  properties: [],
  createDate: '2026-01-01',
  createUserId: 1,
  data: {},
  ...overrides,
})

describe('DataSet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Config.getApiUrl).mockResolvedValue('https://duos.example.org')
    vi.mocked(Config.authOpts).mockReturnValue(headers)
    vi.mocked(Config.multiPartOpts).mockReturnValue(multiPartHeaders)
    vi.mocked(fetchGet).mockResolvedValue({ data: undefined })
    vi.mocked(fetchPost).mockResolvedValue({ data: undefined })
    vi.mocked(fetchDelete).mockResolvedValue({ data: undefined })
    vi.mocked(fetchMultipart).mockResolvedValue({ data: undefined })
  })

  describe('getDatasetNames', () => {
    it('fetches dataset names and returns the data', async () => {
      vi.mocked(fetchGet).mockResolvedValue({ data: ['Dataset A', 'Dataset B'] })

      const result = await DataSet.getDatasetNames()

      expect(fetchGet).toHaveBeenCalledWith(
        'https://duos.example.org/api/dataset/datasetNames',
        headers,
      )
      expect(result).toEqual(['Dataset A', 'Dataset B'])
    })

    it('propagates fetch failures', async () => {
      vi.mocked(fetchGet).mockRejectedValueOnce(new Error('network failure'))
      await expect(DataSet.getDatasetNames()).rejects.toThrow('network failure')
    })

    it('propagates ConsentError rejections so callers can extract a useful error', async () => {
      const consentError = { message: 'Unauthorized to list dataset names', code: 403 }
      vi.mocked(fetchGet).mockRejectedValueOnce(consentError)
      const error = await DataSet.getDatasetNames().then(
        () => { throw new Error('expected rejection') },
        e => e,
      )
      expect(extractConsentError(error)).toEqual(consentError)
      expect(extractError(error)).toBe('Unauthorized to list dataset names')
    })
  })

  describe('getRegistrationSchema', () => {
    it('fetches the registration schema and returns the data', async () => {
      const schema = { studyName: 'My Study', studyDescription: 'desc', dataTypes: [], piName: 'Dr. PI', publicVisibility: true }
      vi.mocked(fetchGet).mockResolvedValue({ data: schema })

      const result = await DataSet.getRegistrationSchema()

      expect(fetchGet).toHaveBeenCalledWith(
        'https://duos.example.org/schemas/dataset-registration/v1',
        headers,
      )
      expect(result).toEqual(schema)
    })

    it('propagates fetch failures', async () => {
      vi.mocked(fetchGet).mockRejectedValueOnce(new Error('network failure'))
      await expect(DataSet.getRegistrationSchema()).rejects.toThrow('network failure')
    })

    it('propagates ConsentError rejections so callers can extract a useful error', async () => {
      const consentError = { message: 'Schema not found', code: 404 }
      vi.mocked(fetchGet).mockRejectedValueOnce(consentError)
      const error = await DataSet.getRegistrationSchema().then(
        () => { throw new Error('expected rejection') },
        e => e,
      )
      expect(extractConsentError(error)).toEqual(consentError)
      expect(extractError(error)).toBe('Schema not found')
    })
  })

  describe('registerDataset', () => {
    it('posts multipart form data and returns the created dataset', async () => {
      const dataset = buildDataset()
      vi.mocked(fetchMultipart).mockResolvedValue({ data: dataset })
      const formData = new FormData()

      const result = await DataSet.registerDataset(formData)

      expect(fetchMultipart).toHaveBeenCalledWith(
        'https://duos.example.org/api/dataset/v3',
        formData,
        multiPartHeaders,
      )
      expect(result).toEqual(dataset)
    })

    it('propagates fetch failures', async () => {
      vi.mocked(fetchMultipart).mockRejectedValueOnce(new Error('upload failed'))
      await expect(DataSet.registerDataset(new FormData())).rejects.toThrow('upload failed')
    })

    it('propagates ConsentError rejections so callers can extract a useful error', async () => {
      const consentError = { message: 'Dataset registration failed', code: 422 }
      vi.mocked(fetchMultipart).mockRejectedValueOnce(consentError)
      const error = await DataSet.registerDataset(new FormData()).then(
        () => { throw new Error('expected rejection') },
        e => e,
      )
      expect(extractConsentError(error)).toEqual(consentError)
      expect(extractError(error)).toBe('Dataset registration failed')
    })
  })

  describe('getDatasetsByIds', () => {
    it('fetches datasets by ids and returns the data', async () => {
      const datasets = [buildDataset({ datasetId: 1 }), buildDataset({ datasetId: 2 })]
      vi.mocked(fetchGet).mockResolvedValue({ data: datasets })

      const result = await DataSet.getDatasetsByIds([1, 2])

      expect(fetchGet).toHaveBeenCalledWith(
        'https://duos.example.org/api/dataset/batch?ids=1&ids=2',
        headers,
      )
      expect(result).toEqual(datasets)
    })

    it('propagates fetch failures', async () => {
      vi.mocked(fetchGet).mockRejectedValueOnce(new Error('network failure'))
      await expect(DataSet.getDatasetsByIds([1])).rejects.toThrow('network failure')
    })

    it('propagates ConsentError rejections so callers can extract a useful error', async () => {
      const consentError = { message: 'Dataset 1 not found', code: 404 }
      vi.mocked(fetchGet).mockRejectedValueOnce(consentError)
      const error = await DataSet.getDatasetsByIds([1]).then(
        () => { throw new Error('expected rejection') },
        e => e,
      )
      expect(extractConsentError(error)).toEqual(consentError)
      expect(extractError(error)).toBe('Dataset 1 not found')
    })
  })

  describe('searchDatasetIndex', () => {
    const query = { query: { bool: { must: [] } } }

    it('posts the query and returns the data', async () => {
      const results = [{ datasetId: 1 }]
      vi.mocked(fetchPost).mockResolvedValue({ data: results })

      const result = await DataSet.searchDatasetIndex(query)

      expect(fetchPost).toHaveBeenCalledWith(
        'https://duos.example.org/api/dataset/search/index',
        query,
        headers,
      )
      expect(result).toEqual(results)
    })

    it('merges extra options (e.g. signal) into the fetch config', async () => {
      vi.mocked(fetchPost).mockResolvedValue({ data: [] })
      const signal = AbortSignal.timeout(5000)

      await DataSet.searchDatasetIndex(query, { signal })

      expect(fetchPost).toHaveBeenCalledWith(
        'https://duos.example.org/api/dataset/search/index',
        query,
        { ...headers, signal },
      )
    })

    it('propagates fetch failures', async () => {
      vi.mocked(fetchPost).mockRejectedValueOnce(new Error('network failure'))
      await expect(DataSet.searchDatasetIndex(query)).rejects.toThrow('network failure')
    })

    it('propagates ConsentError rejections so callers can extract a useful error', async () => {
      const consentError = { message: 'Search index unavailable', code: 503 }
      vi.mocked(fetchPost).mockRejectedValueOnce(consentError)
      const error = await DataSet.searchDatasetIndex(query).then(
        () => { throw new Error('expected rejection') },
        e => e,
      )
      expect(extractConsentError(error)).toEqual(consentError)
      expect(extractError(error)).toBe('Search index unavailable')
    })
  })

  describe('searchDatasetIndexV2', () => {
    const query = { query: { bool: { must: [] } } }

    it('posts the query and returns the elasticsearch response', async () => {
      const esResponse = { items: [], total: 0, aggregations: {} }
      vi.mocked(fetchPost).mockResolvedValue({ data: esResponse })

      const result = await DataSet.searchDatasetIndexV2(query)

      expect(fetchPost).toHaveBeenCalledWith(
        'https://duos.example.org/api/dataset/search/index/v2',
        query,
        headers,
      )
      expect(result).toEqual(esResponse)
    })

    it('propagates fetch failures', async () => {
      vi.mocked(fetchPost).mockRejectedValueOnce(new Error('network failure'))
      await expect(DataSet.searchDatasetIndexV2(query)).rejects.toThrow('network failure')
    })

    it('propagates ConsentError rejections so callers can extract a useful error', async () => {
      const consentError = { message: 'Search index v2 unavailable', code: 503 }
      vi.mocked(fetchPost).mockRejectedValueOnce(consentError)
      const error = await DataSet.searchDatasetIndexV2(query).then(
        () => { throw new Error('expected rejection') },
        e => e,
      )
      expect(extractConsentError(error)).toEqual(consentError)
      expect(extractError(error)).toBe('Search index v2 unavailable')
    })
  })

  describe('getDataSetsByDatasetId', () => {
    it('fetches a dataset by id and returns the data', async () => {
      const dataset = buildDataset({ datasetId: 42 })
      vi.mocked(fetchGet).mockResolvedValue({ data: dataset })

      const result = await DataSet.getDataSetsByDatasetId(42)

      expect(fetchGet).toHaveBeenCalledWith(
        'https://duos.example.org/api/dataset/v2/42',
        headers,
      )
      expect(result).toEqual(dataset)
    })

    it('propagates fetch failures', async () => {
      vi.mocked(fetchGet).mockRejectedValueOnce(new Error('network failure'))
      await expect(DataSet.getDataSetsByDatasetId(42)).rejects.toThrow('network failure')
    })

    it('propagates ConsentError rejections so callers can extract a useful error', async () => {
      const consentError = { message: 'Dataset 42 not found', code: 404 }
      vi.mocked(fetchGet).mockRejectedValueOnce(consentError)
      const error = await DataSet.getDataSetsByDatasetId(42).then(
        () => { throw new Error('expected rejection') },
        e => e,
      )
      expect(extractConsentError(error)).toEqual(consentError)
      expect(extractError(error)).toBe('Dataset 42 not found')
    })
  })

  describe('deleteDataset', () => {
    it('deletes the dataset and returns { status: 200 }', async () => {
      vi.mocked(fetchDelete).mockResolvedValue({ data: undefined })

      const result = await DataSet.deleteDataset(7)

      expect(fetchDelete).toHaveBeenCalledWith(
        'https://duos.example.org/api/dataset/7',
        headers,
      )
      expect(result).toEqual({ status: 200 })
    })

    it('propagates fetch failures', async () => {
      vi.mocked(fetchDelete).mockRejectedValueOnce(new Error('network failure'))
      await expect(DataSet.deleteDataset(7)).rejects.toThrow('network failure')
    })

    it('propagates ConsentError rejections so callers can extract a useful error', async () => {
      const consentError = { message: 'Dataset 7 cannot be deleted', code: 409 }
      vi.mocked(fetchDelete).mockRejectedValueOnce(consentError)
      const error = await DataSet.deleteDataset(7).then(
        () => { throw new Error('expected rejection') },
        e => e,
      )
      expect(extractConsentError(error)).toEqual(consentError)
      expect(extractError(error)).toBe('Dataset 7 cannot be deleted')
    })
  })

  describe('updateDatasetV3', () => {
    it('puts multipart form data and returns the updated dataset', async () => {
      const dataset = buildDataset({ datasetId: 3 })
      vi.mocked(fetchMultipart).mockResolvedValue({ data: dataset })
      const formData = new FormData()

      const result = await DataSet.updateDatasetV3(3, formData)

      expect(fetchMultipart).toHaveBeenCalledWith(
        'https://duos.example.org/api/dataset/v3/3',
        formData,
        multiPartHeaders,
        'PUT',
      )
      expect(result).toEqual(dataset)
    })

    it('propagates fetch failures', async () => {
      vi.mocked(fetchMultipart).mockRejectedValueOnce(new Error('upload failed'))
      await expect(DataSet.updateDatasetV3(3, new FormData())).rejects.toThrow('upload failed')
    })

    it('propagates ConsentError rejections so callers can extract a useful error', async () => {
      const consentError = { message: 'Dataset 3 update rejected', code: 403 }
      vi.mocked(fetchMultipart).mockRejectedValueOnce(consentError)
      const error = await DataSet.updateDatasetV3(3, new FormData()).then(
        () => { throw new Error('expected rejection') },
        e => e,
      )
      expect(extractConsentError(error)).toEqual(consentError)
      expect(extractError(error)).toBe('Dataset 3 update rejected')
    })
  })

  describe('getStudyById', () => {
    it('fetches a study by id and returns the data', async () => {
      const study = buildStudy({ studyId: 10 })
      vi.mocked(fetchGet).mockResolvedValue({ data: study })

      const result = await DataSet.getStudyById(10)

      expect(fetchGet).toHaveBeenCalledWith(
        'https://duos.example.org/api/dataset/study/10',
        headers,
      )
      expect(result).toEqual(study)
    })

    it('propagates fetch failures', async () => {
      vi.mocked(fetchGet).mockRejectedValueOnce(new Error('network failure'))
      await expect(DataSet.getStudyById(10)).rejects.toThrow('network failure')
    })

    it('propagates ConsentError rejections so callers can extract a useful error', async () => {
      const consentError = { message: 'Study 10 not found', code: 404 }
      vi.mocked(fetchGet).mockRejectedValueOnce(consentError)
      const error = await DataSet.getStudyById(10).then(
        () => { throw new Error('expected rejection') },
        e => e,
      )
      expect(extractConsentError(error)).toEqual(consentError)
      expect(extractError(error)).toBe('Study 10 not found')
    })
  })

  describe('updateStudy', () => {
    it('puts multipart form data and returns the updated study', async () => {
      const study = buildStudy({ studyId: 10 })
      vi.mocked(fetchMultipart).mockResolvedValue({ data: study })
      const formData = new FormData()

      const result = await DataSet.updateStudy(10, formData)

      expect(fetchMultipart).toHaveBeenCalledWith(
        'https://duos.example.org/api/dataset/study/10',
        formData,
        multiPartHeaders,
        'PUT',
      )
      expect(result).toEqual(study)
    })

    it('propagates fetch failures', async () => {
      vi.mocked(fetchMultipart).mockRejectedValueOnce(new Error('upload failed'))
      await expect(DataSet.updateStudy(10, new FormData())).rejects.toThrow('upload failed')
    })

    it('propagates ConsentError rejections so callers can extract a useful error', async () => {
      const consentError = { message: 'Study 10 update rejected', code: 403 }
      vi.mocked(fetchMultipart).mockRejectedValueOnce(consentError)
      const error = await DataSet.updateStudy(10, new FormData()).then(
        () => { throw new Error('expected rejection') },
        e => e,
      )
      expect(extractConsentError(error)).toEqual(consentError)
      expect(extractError(error)).toBe('Study 10 update rejected')
    })
  })

  describe('getNIHInstitutionalCertification', () => {
    it('fetches the dataset, then downloads the certification file', async () => {
      const { fileDownload } = await import('src/utils/FileDownload')
      const dataset = buildDataset({
        datasetId: 5,
        nihInstitutionalCertificationFile: { fileName: 'cert.pdf' },
      })
      vi.mocked(fetchGet)
        .mockResolvedValueOnce({ data: dataset })
        .mockResolvedValueOnce({ data: new Blob(['pdf content']) })

      await DataSet.getNIHInstitutionalCertification(5)

      expect(fetchGet).toHaveBeenNthCalledWith(
        1,
        'https://duos.example.org/api/dataset/v2/5',
        headers,
      )
      expect(fetchGet).toHaveBeenNthCalledWith(
        2,
        'https://duos.example.org/api/dataset/5/nihInstitutionalCertification',
        expect.objectContaining({
          responseType: 'blob',
          headers: expect.objectContaining({
            'Content-Type': 'application/octet-stream',
            'Accept': 'application/octet-stream',
          }),
        }),
      )
      expect(fileDownload).toHaveBeenCalledWith(expect.any(Blob), 'cert.pdf')
    })

    it('returns immediately without fetching when datasetId is undefined', async () => {
      await DataSet.getNIHInstitutionalCertification(undefined)

      expect(fetchGet).not.toHaveBeenCalled()
    })

    it('falls back to an empty filename when nihInstitutionalCertificationFile is absent', async () => {
      const { fileDownload } = await import('src/utils/FileDownload')
      vi.mocked(fetchGet)
        .mockResolvedValueOnce({ data: buildDataset({ datasetId: 5 }) })
        .mockResolvedValueOnce({ data: new Blob() })

      await DataSet.getNIHInstitutionalCertification(5)

      expect(fileDownload).toHaveBeenCalledWith(expect.any(Blob), '')
    })

    it('propagates fetch failures from the dataset lookup', async () => {
      vi.mocked(fetchGet).mockRejectedValueOnce(new Error('dataset not found'))
      await expect(DataSet.getNIHInstitutionalCertification(5)).rejects.toThrow('dataset not found')
    })

    it('propagates ConsentError rejections so callers can extract a useful error', async () => {
      const consentError = { message: 'Dataset 5 not found', code: 404 }
      vi.mocked(fetchGet).mockRejectedValueOnce(consentError)
      const error = await DataSet.getNIHInstitutionalCertification(5).then(
        () => { throw new Error('expected rejection') },
        e => e,
      )
      expect(extractConsentError(error)).toEqual(consentError)
      expect(extractError(error)).toBe('Dataset 5 not found')
    })
  })
})
