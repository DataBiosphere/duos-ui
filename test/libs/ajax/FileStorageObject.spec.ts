import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  EntityType,
  FileCategory,
  FileStorageObject,
  deleteDocument,
  getDocument,
  getDocumentFile,
  listDocuments,
  updateDocumentCategory,
  uploadDocument,
} from 'src/libs/ajax/FileStorageObject'
import { Config } from 'src/libs/config'
import type { FetchData } from 'src/libs/ajax/fetchAdapter'
import { fetchGet, fetchPut, fetchDelete, fetchMultipart } from 'src/libs/ajax/fetchAdapter'

vi.mock('src/libs/ajax/fetchAdapter', () => ({
  fetchGet: vi.fn(),
  fetchPut: vi.fn(),
  fetchDelete: vi.fn(),
  fetchMultipart: vi.fn(),
}))

const authHeaders = { headers: { Authorization: 'Bearer test' } } as ReturnType<typeof Config.authOpts>
const multiPartHeaders = { headers: { Authorization: 'Bearer test' } } as ReturnType<typeof Config.multiPartOpts>

const mockFso: FileStorageObject = {
  fileStorageObjectId: 1,
  entityId: '42',
  fileName: 'test.pdf',
  category: FileCategory.IRB_COLLABORATION_LETTER,
  mediaType: 'application/pdf',
  createDate: 1735689600000,
  updateDate: 1735689600000,
  createUserId: 1,
  updateUserId: 1,
  deleted: false,
}

const mockDeletedFso: FileStorageObject = {
  ...mockFso,
  deleted: true,
  deleteUserId: 1,
  deleteDate: 1735689660000,
}

describe('FileStorageObject ajax', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Config, 'getApiUrl').mockResolvedValue('')
    vi.spyOn(Config, 'authOpts').mockReturnValue(authHeaders)
    vi.spyOn(Config, 'multiPartOpts').mockReturnValue(multiPartHeaders)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('uploadDocument', () => {
    it('sends multipart POST and returns the created FSO', async () => {
      vi.mocked(fetchMultipart).mockResolvedValue({ data: mockFso } as FetchData<FileStorageObject>)
      const file = new File(['data'], 'test.pdf', { type: 'application/pdf' })

      const result = await uploadDocument(EntityType.DATASET, '42', file, FileCategory.IRB_COLLABORATION_LETTER)

      expect(result).toEqual(mockFso)
      expect(fetchMultipart).toHaveBeenCalledWith(
        '/api/document/dataset/42',
        expect.any(FormData),
        multiPartHeaders,
      )
    })
  })

  describe('updateDocumentCategory', () => {
    it('sends PUT with JSON body and returns the updated FSO', async () => {
      vi.mocked(fetchPut).mockResolvedValue({ data: mockFso } as FetchData<FileStorageObject>)

      const result = await updateDocumentCategory(EntityType.DATASET, '42', 1, FileCategory.DATA_ACCESS_AGREEMENT)

      expect(result).toEqual(mockFso)
      expect(fetchPut).toHaveBeenCalledWith(
        '/api/document/dataset/42/1',
        { category: FileCategory.DATA_ACCESS_AGREEMENT },
        authHeaders,
      )
    })
  })

  describe('getDocument', () => {
    it('sends GET and returns the FSO metadata', async () => {
      vi.mocked(fetchGet).mockResolvedValue({ data: mockFso } as FetchData<FileStorageObject>)

      const result = await getDocument(EntityType.DAC, '10', 1)

      expect(result).toEqual(mockFso)
      expect(fetchGet).toHaveBeenCalledWith('/api/document/dac/10/1', authHeaders)
    })
  })

  describe('getDocumentFile', () => {
    it('sends GET with blob responseType and returns a Blob', async () => {
      const fakeBlob = new Blob(['file content'], { type: 'application/pdf' })
      vi.mocked(fetchGet).mockResolvedValue({ data: fakeBlob } as FetchData<Blob>)

      const result = await getDocumentFile(EntityType.STUDY, '7', 2)

      expect(result).toBeInstanceOf(Blob)
      expect(fetchGet).toHaveBeenCalledWith(
        '/api/document/study/7/2/file',
        expect.objectContaining({
          responseType: 'blob',
          headers: expect.objectContaining({ Accept: 'application/octet-stream' }),
        }),
      )
    })
  })

  describe('listDocuments', () => {
    it('sends GET and returns an array of FSOs', async () => {
      vi.mocked(fetchGet).mockResolvedValue({ data: [mockFso] } as FetchData<FileStorageObject[]>)

      const result = await listDocuments(EntityType.DAR, '99')

      expect(result).toEqual([mockFso])
      expect(fetchGet).toHaveBeenCalledWith('/api/document/dar/99', authHeaders)
    })
  })

  describe('deleteDocument', () => {
    it('sends DELETE and returns the soft-deleted FSO', async () => {
      vi.mocked(fetchDelete).mockResolvedValue({ data: mockDeletedFso } as FetchData<FileStorageObject>)

      const result = await deleteDocument(EntityType.DATASET, '42', 1)

      expect(result).toEqual(mockDeletedFso)
      expect(fetchDelete).toHaveBeenCalledWith('/api/document/dataset/42/1', authHeaders)
    })
  })
})
