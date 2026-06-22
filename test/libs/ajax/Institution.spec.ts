import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Config } from 'src/libs/config'
import { fetchGet, fetchPost, fetchPut, fetchPatch, fetchDelete } from 'src/libs/ajax/fetchAdapter'
import { Institution } from 'src/libs/ajax/Institution'
import { extractConsentError, extractError } from 'src/utils/ErrorUtils'
import type { InstitutionInterface } from 'src/types/model'

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
  fetchPatch: vi.fn(),
  fetchDelete: vi.fn(),
}))

const headers = {
  headers: {
    'Authorization': 'Bearer token',
    'Accept': 'application/json',
    'X-App-ID': 'DUOS',
  },
}

const mockInstitution: InstitutionInterface = {
  id: 1,
  name: 'Broad Institute',
  createUser: { userId: 10, displayName: 'Admin', email: 'admin@example.org' },
  createUserId: 10,
  createDate: '2024-01-01T00:00:00Z',
  signingOfficials: [],
}

describe('Institution', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Config.getApiUrl).mockResolvedValue('https://duos.example.org')
    vi.mocked(Config.authOpts).mockReturnValue(headers)
    vi.mocked(fetchGet).mockResolvedValue({ data: [mockInstitution] })
    vi.mocked(fetchPost).mockResolvedValue({ data: mockInstitution })
    vi.mocked(fetchPut).mockResolvedValue({ data: mockInstitution })
    vi.mocked(fetchPatch).mockResolvedValue({ data: mockInstitution })
    vi.mocked(fetchDelete).mockResolvedValue({ data: mockInstitution })
  })

  describe('list', () => {
    it('gets the institutions endpoint with auth options and returns the list', async () => {
      const result = await Institution.list()

      expect(Config.getApiUrl).toHaveBeenCalledOnce()
      expect(Config.authOpts).toHaveBeenCalledOnce()
      expect(fetchGet).toHaveBeenCalledWith(
        'https://duos.example.org/api/institutions',
        headers,
      )
      expect(result).toEqual([mockInstitution])
    })

    it('propagates fetch failures', async () => {
      vi.mocked(fetchGet).mockRejectedValueOnce(new Error('network failure'))
      await expect(Institution.list()).rejects.toThrow('network failure')
    })

    it('propagates ConsentError rejections so callers can extract a useful error', async () => {
      const consentError = { message: 'Institutions endpoint unavailable', code: 503 }
      vi.mocked(fetchGet).mockRejectedValueOnce(consentError)
      const error = await Institution.list().then(
        () => { throw new Error('expected rejection') },
        e => e,
      )
      expect(extractConsentError(error)).toEqual(consentError)
      expect(extractError(error)).toBe('Institutions endpoint unavailable')
    })
  })

  describe('getById', () => {
    it('gets the institution by ID endpoint with auth options and returns the institution', async () => {
      vi.mocked(fetchGet).mockResolvedValueOnce({ data: mockInstitution })

      const result = await Institution.getById(1)

      expect(Config.getApiUrl).toHaveBeenCalledOnce()
      expect(Config.authOpts).toHaveBeenCalledOnce()
      expect(fetchGet).toHaveBeenCalledWith(
        'https://duos.example.org/api/institutions/1',
        headers,
      )
      expect(result).toEqual(mockInstitution)
    })

    it('propagates fetch failures', async () => {
      vi.mocked(fetchGet).mockRejectedValueOnce(new Error('not found'))
      await expect(Institution.getById(999)).rejects.toThrow('not found')
    })

    it('propagates ConsentError rejections so callers can extract a useful error', async () => {
      const consentError = { message: 'Institution 999 not found', code: 404 }
      vi.mocked(fetchGet).mockRejectedValueOnce(consentError)
      const error = await Institution.getById(999).then(
        () => { throw new Error('expected rejection') },
        e => e,
      )
      expect(extractConsentError(error)).toEqual(consentError)
      expect(extractError(error)).toBe('Institution 999 not found')
    })
  })

  describe('postInstitution', () => {
    it('posts to the institutions endpoint with the payload and auth options and returns the created institution', async () => {
      const payload = { name: 'New Institute' }

      const result = await Institution.postInstitution(payload)

      expect(Config.getApiUrl).toHaveBeenCalledOnce()
      expect(Config.authOpts).toHaveBeenCalledOnce()
      expect(fetchPost).toHaveBeenCalledWith(
        'https://duos.example.org/api/institutions',
        payload,
        headers,
      )
      expect(result).toEqual(mockInstitution)
    })

    it('propagates fetch failures', async () => {
      vi.mocked(fetchPost).mockRejectedValueOnce(new Error('server error'))
      await expect(Institution.postInstitution({ name: 'New Institute' })).rejects.toThrow('server error')
    })

    it('propagates ConsentError rejections so callers can extract a useful error', async () => {
      const consentError = { message: 'Institution name already exists', code: 409 }
      vi.mocked(fetchPost).mockRejectedValueOnce(consentError)
      const error = await Institution.postInstitution({ name: 'Duplicate' }).then(
        () => { throw new Error('expected rejection') },
        e => e,
      )
      expect(extractConsentError(error)).toEqual(consentError)
      expect(extractError(error)).toBe('Institution name already exists')
    })
  })

  describe('putInstitution', () => {
    it('puts to the institution by ID endpoint with the payload and auth options and returns the updated institution', async () => {
      const payload = { name: 'Updated Institute' }

      const result = await Institution.putInstitution(1, payload)

      expect(Config.getApiUrl).toHaveBeenCalledOnce()
      expect(Config.authOpts).toHaveBeenCalledOnce()
      expect(fetchPut).toHaveBeenCalledWith(
        'https://duos.example.org/api/institutions/1',
        payload,
        headers,
      )
      expect(result).toEqual(mockInstitution)
    })

    it('propagates fetch failures', async () => {
      vi.mocked(fetchPut).mockRejectedValueOnce(new Error('server error'))
      await expect(Institution.putInstitution(1, {})).rejects.toThrow('server error')
    })

    it('propagates ConsentError rejections so callers can extract a useful error', async () => {
      const consentError = { message: 'Institution 1 is locked', code: 423 }
      vi.mocked(fetchPut).mockRejectedValueOnce(consentError)
      const error = await Institution.putInstitution(1, {}).then(
        () => { throw new Error('expected rejection') },
        e => e,
      )
      expect(extractConsentError(error)).toEqual(consentError)
      expect(extractError(error)).toBe('Institution 1 is locked')
    })
  })

  describe('patchInstitution', () => {
    it('patches the institution by ID endpoint with the payload and auth options and returns the updated institution', async () => {
      const payload = { name: 'Patched Institute' }

      const result = await Institution.patchInstitution(1, payload)

      expect(Config.getApiUrl).toHaveBeenCalledOnce()
      expect(Config.authOpts).toHaveBeenCalledOnce()
      expect(fetchPatch).toHaveBeenCalledWith(
        'https://duos.example.org/api/institutions/1',
        payload,
        headers,
      )
      expect(result).toEqual(mockInstitution)
    })

    it('propagates fetch failures', async () => {
      vi.mocked(fetchPatch).mockRejectedValueOnce(new Error('server error'))
      await expect(Institution.patchInstitution(1, {})).rejects.toThrow('server error')
    })

    it('propagates ConsentError rejections so callers can extract a useful error', async () => {
      const consentError = { message: 'Institution 1 patch not allowed', code: 403 }
      vi.mocked(fetchPatch).mockRejectedValueOnce(consentError)
      const error = await Institution.patchInstitution(1, {}).then(
        () => { throw new Error('expected rejection') },
        e => e,
      )
      expect(extractConsentError(error)).toEqual(consentError)
      expect(extractError(error)).toBe('Institution 1 patch not allowed')
    })
  })

  describe('deleteInstitution', () => {
    it('deletes the institution by ID endpoint with auth options and returns the deleted institution', async () => {
      const result = await Institution.deleteInstitution(1)

      expect(Config.getApiUrl).toHaveBeenCalledOnce()
      expect(Config.authOpts).toHaveBeenCalledOnce()
      expect(fetchDelete).toHaveBeenCalledWith(
        'https://duos.example.org/api/institutions/1',
        headers,
      )
      expect(result).toEqual(mockInstitution)
    })

    it('propagates fetch failures', async () => {
      vi.mocked(fetchDelete).mockRejectedValueOnce(new Error('server error'))
      await expect(Institution.deleteInstitution(1)).rejects.toThrow('server error')
    })

    it('propagates ConsentError rejections so callers can extract a useful error', async () => {
      const consentError = { message: 'Institution 1 cannot be deleted', code: 403 }
      vi.mocked(fetchDelete).mockRejectedValueOnce(consentError)
      const error = await Institution.deleteInstitution(1).then(
        () => { throw new Error('expected rejection') },
        e => e,
      )
      expect(extractConsentError(error)).toEqual(consentError)
      expect(extractError(error)).toBe('Institution 1 cannot be deleted')
    })
  })
})
