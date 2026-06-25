import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Config } from 'src/libs/config'
import { fetchGet, fetchPost, fetchDelete } from 'src/libs/ajax/fetchAdapter'
import { LibraryCard } from 'src/libs/ajax/LibraryCard'
import { LibraryCard as LibraryCardModel } from 'src/types/model'
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
  fetchDelete: vi.fn(),
}))

const headers = {
  headers: {
    'Authorization': 'Bearer token',
    'Accept': 'application/json',
    'X-App-ID': 'DUOS',
  },
}

const mockCard: LibraryCardModel = {
  id: 1,
  userId: 42,
  userName: 'Jane Doe',
  userEmail: 'jane@example.org',
  createDate: new Date('2026-01-01T00:00:00.000Z'),
  createUserId: 7,
}

describe('LibraryCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Config.getApiUrl).mockResolvedValue('https://duos.example.org')
    vi.mocked(Config.authOpts).mockReturnValue(headers)
    vi.mocked(fetchGet).mockResolvedValue({ data: [mockCard] })
    vi.mocked(fetchPost).mockResolvedValue({ data: mockCard })
    vi.mocked(fetchDelete).mockResolvedValue({ data: mockCard })
  })

  describe('getAllLibraryCards', () => {
    it('fetches the library cards endpoint with auth options and returns data', async () => {
      const result = await LibraryCard.getAllLibraryCards()

      expect(Config.getApiUrl).toHaveBeenCalledOnce()
      expect(Config.authOpts).toHaveBeenCalledOnce()
      expect(fetchGet).toHaveBeenCalledWith(
        'https://duos.example.org/api/libraryCards',
        headers,
      )
      expect(result).toEqual([mockCard])
    })

    it('propagates fetch failures from the API call', async () => {
      vi.mocked(fetchGet).mockRejectedValueOnce(new Error('network failure'))

      await expect(LibraryCard.getAllLibraryCards()).rejects.toThrow('network failure')
    })

    it('propagates ConsentError rejections so callers can extract a useful error', async () => {
      const consentError = { message: 'Unauthorized to list library cards', code: 403 }
      vi.mocked(fetchGet).mockRejectedValueOnce(consentError)

      const error = await LibraryCard.getAllLibraryCards().then(
        () => {
          throw new Error('expected getAllLibraryCards to reject')
        },
        e => e,
      )

      expect(extractConsentError(error)).toEqual(consentError)
      expect(extractError(error)).toBe('Unauthorized to list library cards')
    })
  })

  describe('createLibraryCard', () => {
    it('posts to the library cards endpoint with the card payload and auth options', async () => {
      const result = await LibraryCard.createLibraryCard(mockCard)

      expect(Config.getApiUrl).toHaveBeenCalledOnce()
      expect(Config.authOpts).toHaveBeenCalledOnce()
      expect(fetchPost).toHaveBeenCalledWith(
        'https://duos.example.org/api/libraryCards',
        mockCard,
        headers,
      )
      expect(result).toEqual(mockCard)
    })

    it('propagates fetch failures from the API call', async () => {
      vi.mocked(fetchPost).mockRejectedValueOnce(new Error('network failure'))

      await expect(LibraryCard.createLibraryCard(mockCard)).rejects.toThrow('network failure')
    })

    it('propagates ConsentError rejections so callers can extract a useful error', async () => {
      const consentError = { message: 'Library card already exists for user', code: 409 }
      vi.mocked(fetchPost).mockRejectedValueOnce(consentError)

      const error = await LibraryCard.createLibraryCard(mockCard).then(
        () => {
          throw new Error('expected createLibraryCard to reject')
        },
        e => e,
      )

      expect(extractConsentError(error)).toEqual(consentError)
      expect(extractError(error)).toBe('Library card already exists for user')
    })
  })

  describe('deleteLibraryCard', () => {
    it('deletes the library card at the correct endpoint with auth options', async () => {
      const result = await LibraryCard.deleteLibraryCard(1)

      expect(Config.getApiUrl).toHaveBeenCalledOnce()
      expect(Config.authOpts).toHaveBeenCalledOnce()
      expect(fetchDelete).toHaveBeenCalledWith(
        'https://duos.example.org/api/libraryCards/1',
        headers,
      )
      expect(result).toEqual(mockCard)
    })

    it('propagates fetch failures from the API call', async () => {
      vi.mocked(fetchDelete).mockRejectedValueOnce(new Error('network failure'))

      await expect(LibraryCard.deleteLibraryCard(99)).rejects.toThrow('network failure')
    })

    it('propagates ConsentError rejections so callers can extract a useful error', async () => {
      const consentError = { message: 'Library card 99 not found', code: 404 }
      vi.mocked(fetchDelete).mockRejectedValueOnce(consentError)

      const error = await LibraryCard.deleteLibraryCard(99).then(
        () => {
          throw new Error('expected deleteLibraryCard to reject')
        },
        e => e,
      )

      expect(extractConsentError(error)).toEqual(consentError)
      expect(extractError(error)).toBe('Library card 99 not found')
    })
  })
})
