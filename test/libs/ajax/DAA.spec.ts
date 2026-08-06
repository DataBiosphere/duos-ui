import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { DAA } from 'src/libs/ajax/DAA'
import { Config } from 'src/libs/config'
import type { DAAObject, DaaBulkRelationResult } from 'src/types/model'
import type { FetchData } from 'src/libs/ajax/fetchAdapter'
import { fetchBlob, fetchGet, fetchPost, fetchPut, fetchDelete, fetchMultipart } from 'src/libs/ajax/fetchAdapter'
import * as FileDownload from 'src/utils/FileDownload'

vi.mock('src/libs/ajax/fetchAdapter', () => ({
  fetchBlob: vi.fn(),
  fetchGet: vi.fn(),
  fetchPost: vi.fn(),
  fetchPut: vi.fn(),
  fetchDelete: vi.fn(),
  fetchMultipart: vi.fn(),
}))

vi.mock('src/utils/FileDownload', () => ({
  fileDownload: vi.fn(),
}))

const apiUrl = 'https://api.example.test'
const authHeaders = { headers: { 'Authorization': 'Bearer test-token', 'Accept': 'application/json', 'X-App-ID': 'DUOS' } } as ReturnType<typeof Config.authOpts>

const mockDaa: DAAObject = {
  daaId: 12,
  createUserId: 1001,
  createDate: '2026-01-01',
  updateUserId: 1001,
  updateDate: '2026-01-10',
  initialDacId: 42,
  file: {
    fileStorageObjectId: 88,
    entityId: '12',
    fileName: 'Sample_DAA.pdf',
    category: 'dataAccessAgreement',
    mediaType: 'application/pdf',
    createUserId: 1001,
    createDate: 1700000000000,
  },
  dacs: [],
}

describe('DAA ajax', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Config, 'getApiUrl').mockResolvedValue(apiUrl)
    vi.spyOn(Config, 'authOpts').mockReturnValue(authHeaders)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('getDaas sends a GET request and returns data', async () => {
    vi.mocked(fetchGet).mockResolvedValue({ data: [mockDaa] } as FetchData<DAAObject[]>)

    const result = await DAA.getDaas()

    expect(result).toEqual([mockDaa])
    expect(fetchGet).toHaveBeenCalledWith(`${apiUrl}/api/daa`, authHeaders)
  })

  it('getDaaById sends a GET request and returns one DAA', async () => {
    vi.mocked(fetchGet).mockResolvedValue({ data: mockDaa } as FetchData<DAAObject>)

    const result = await DAA.getDaaById(mockDaa.daaId)

    expect(result).toEqual(mockDaa)
    expect(fetchGet).toHaveBeenCalledWith(`${apiUrl}/api/daa/${mockDaa.daaId}`, authHeaders)
  })

  it('createDaaLcLink sends a PUT request with empty body and returns DAA', async () => {
    vi.mocked(fetchPut).mockResolvedValue({ data: mockDaa } as FetchData<DAAObject>)

    const result = await DAA.createDaaLcLink(mockDaa.daaId, 2001)

    expect(result).toEqual(mockDaa)
    expect(fetchPut).toHaveBeenCalledWith(`${apiUrl}/api/daa/${mockDaa.daaId}/2001`, {}, authHeaders)
  })

  it('deleteDaaLcLink sends a DELETE request and returns 200', async () => {
    vi.mocked(fetchDelete).mockResolvedValue({} as FetchData<void>)

    const result = await DAA.deleteDaaLcLink(mockDaa.daaId, 2001)

    expect(result).toBe(200)
    expect(fetchDelete).toHaveBeenCalledWith(`${apiUrl}/api/daa/${mockDaa.daaId}/2001`, authHeaders)
  })

  it('bulkAddUsersToDaa sends a POST request with user ids and returns the result body', async () => {
    const users = [1, 2, 3]
    const summary: DaaBulkRelationResult = { requested: 3, applied: 3, skipped: 0, errors: [] }
    vi.mocked(fetchPost).mockResolvedValue({ data: summary } as FetchData<DaaBulkRelationResult>)

    const result = await DAA.bulkAddUsersToDaa(mockDaa.daaId, users)

    expect(result).toEqual(summary)
    expect(fetchPost).toHaveBeenCalledWith(`${apiUrl}/api/daa/bulk/${mockDaa.daaId}`, { users }, authHeaders)
  })

  it('bulkRemoveUsersFromDaa sends a DELETE request with user ids in body and returns the result body', async () => {
    const users = [3, 4]
    const summary: DaaBulkRelationResult = { requested: 2, applied: 2, skipped: 0, errors: [] }
    vi.mocked(fetchDelete).mockResolvedValue({ data: summary } as FetchData<DaaBulkRelationResult>)

    const result = await DAA.bulkRemoveUsersFromDaa(mockDaa.daaId, users)

    expect(result).toEqual(summary)
    expect(fetchDelete).toHaveBeenCalledWith(
      `${apiUrl}/api/daa/bulk/${mockDaa.daaId}`,
      expect.objectContaining({ data: { users } }),
    )
  })

  it('bulkAddDaasToUser sends a POST request with daa ids and returns the result body', async () => {
    const daas = [10, 11]
    const summary: DaaBulkRelationResult = { requested: 2, applied: 2, skipped: 0, errors: [] }
    vi.mocked(fetchPost).mockResolvedValue({ data: summary } as FetchData<DaaBulkRelationResult>)

    const result = await DAA.bulkAddDaasToUser(2001, daas)

    expect(result).toEqual(summary)
    expect(fetchPost).toHaveBeenCalledWith(`${apiUrl}/api/daa/bulk/user/2001`, { daaList: daas }, authHeaders)
  })

  it('bulkRemoveDaasFromUser sends a DELETE request with daa ids in body and returns the result body', async () => {
    const daas = [10, 11]
    const summary: DaaBulkRelationResult = { requested: 2, applied: 2, skipped: 0, errors: [] }
    vi.mocked(fetchDelete).mockResolvedValue({ data: summary } as FetchData<DaaBulkRelationResult>)

    const result = await DAA.bulkRemoveDaasFromUser(2001, daas)

    expect(result).toEqual(summary)
    expect(fetchDelete).toHaveBeenCalledWith(
      `${apiUrl}/api/daa/bulk/user/2001`,
      expect.objectContaining({ data: { daaList: daas } }),
    )
  })

  it('getDaaFileById fetches a blob via fetchBlob and triggers download', async () => {
    const fakeBlob = new Blob(['fake-binary-content'], { type: 'application/octet-stream' })
    vi.mocked(fetchBlob).mockResolvedValue(fakeBlob)

    await DAA.getDaaFileById(mockDaa.daaId, 'Sample_DAA.pdf')

    expect(fetchBlob).toHaveBeenCalledWith(
      `${apiUrl}/api/daa/${mockDaa.daaId}/file`,
      authHeaders,
    )
    expect(FileDownload.fileDownload).toHaveBeenCalledWith(fakeBlob, 'Sample_DAA.pdf')
  })

  it('getDaaFileBlob fetches a blob via fetchBlob and returns it', async () => {
    const fakeBlob = new Blob(['fake-binary-content'], { type: 'application/octet-stream' })
    vi.mocked(fetchBlob).mockResolvedValue(fakeBlob)

    const result = await DAA.getDaaFileBlob(mockDaa.daaId)

    expect(fetchBlob).toHaveBeenCalledWith(
      `${apiUrl}/api/daa/${mockDaa.daaId}/file`,
      authHeaders,
    )
    expect(result).toBe(fakeBlob)
  })

  it('createDaa returns null payload for null file', async () => {
    const result = await DAA.createDaa(null, 42)

    expect(result).toEqual({ data: null })
    expect(fetchMultipart).not.toHaveBeenCalled()
  })

  it('createDaa uploads form-data and returns created DAA', async () => {
    vi.mocked(fetchMultipart).mockResolvedValue({ data: mockDaa } as FetchData<DAAObject>)
    const file = new File(['test-data'], 'my-daa.pdf', { type: 'application/pdf' })

    const result = await DAA.createDaa(file, 42)

    expect(result).toEqual({ data: mockDaa })
    expect(fetchMultipart).toHaveBeenCalledWith(
      `${apiUrl}/api/daa/dac/42`,
      expect.any(FormData),
      authHeaders,
    )
    const formData = vi.mocked(fetchMultipart).mock.calls[0][1] as FormData
    expect(formData.get('file')).toBe(file)
  })

  it('addDaaToDac sends a PUT request and returns 200', async () => {
    vi.mocked(fetchPut).mockResolvedValue({} as FetchData<void>)

    const result = await DAA.addDaaToDac(mockDaa.daaId, 42)

    expect(result).toBe(200)
    expect(fetchPut).toHaveBeenCalledWith(`${apiUrl}/api/daa/${mockDaa.daaId}/dac/42`, {}, authHeaders)
  })

  it('sendDaaUpdateEmails sends a POST request and returns 200', async () => {
    vi.mocked(fetchPost).mockResolvedValue({} as FetchData<void>)

    const result = await DAA.sendDaaUpdateEmails(42, 11, 'New-DAA.pdf')

    expect(result).toBe(200)
    expect(fetchPost).toHaveBeenCalledWith(`${apiUrl}/api/daa/42/updated/11/New-DAA.pdf`, {}, authHeaders)
  })
})
