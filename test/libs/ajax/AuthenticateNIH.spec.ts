import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AuthenticateNIH } from 'src/libs/ajax/AuthenticateNIH'
import { Config } from 'src/libs/config'
import type { FetchData } from 'src/libs/ajax/fetchAdapter'
import { fetchGet, fetchPost, fetchDelete } from 'src/libs/ajax/fetchAdapter'

vi.mock('src/libs/ajax/fetchAdapter', () => ({
  fetchGet: vi.fn(),
  fetchPost: vi.fn(),
  fetchDelete: vi.fn(),
}))

const apiUrl = 'https://api'
const ecmUrl = 'https://ecm'
const authHeaders = { headers: { Authorization: 'Bearer test' } } as ReturnType<typeof Config.authOpts>

describe('AuthenticateNIH', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Config, 'getApiUrl').mockResolvedValue(apiUrl)
    vi.spyOn(Config, 'getECMUrl').mockResolvedValue(ecmUrl)
    vi.spyOn(Config, 'authOpts').mockReturnValue(authHeaders)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('deleteAccountLinkage sends DELETE request with auth header', async () => {
    vi.mocked(fetchDelete).mockResolvedValue({} as FetchData<void>)

    await AuthenticateNIH.deleteAccountLinkage()

    expect(fetchDelete).toHaveBeenCalledWith(
      `${apiUrl}/api/nih`,
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test' }) }),
    )
  })

  it('getECMProviderAuthUrl sends correct request and returns value', async () => {
    const redirectUri = 'https://app/callback'
    const redirectTo = '/home'
    const response = 'https://auth.url'
    vi.mocked(fetchPost).mockResolvedValue({ data: response })

    const result = await AuthenticateNIH.getECMProviderAuthUrl(redirectUri, redirectTo)

    expect(result).toBe(response)
    expect(fetchPost).toHaveBeenCalledWith(
      expect.stringContaining(`redirectUri=${redirectUri}`),
      { redirectTo },
      expect.objectContaining({ headers: expect.objectContaining({ Accept: '*/*' }) }),
    )
  })

  it('getECMProviderAuthUrl throws when response is empty', async () => {
    vi.mocked(fetchPost).mockResolvedValue({ data: '' })

    await expect(AuthenticateNIH.getECMProviderAuthUrl('uri', '/home')).rejects.toThrow()
  })

  it('getECMProviderLinkInfo sends correct request and returns data', async () => {
    const code = 'abc'
    const state = 'xyz'
    const mockResponse = { additionalState: { redirectTo: '/dashboard' } }
    vi.mocked(fetchPost).mockResolvedValue({ data: mockResponse })

    const result = await AuthenticateNIH.getECMProviderLinkInfo(code, state)

    expect(result).toEqual(mockResponse)
    expect(fetchPost).toHaveBeenCalledWith(
      expect.stringContaining(`state=${state}`),
      null,
      authHeaders,
    )
    expect(fetchPost).toHaveBeenCalledWith(
      expect.stringContaining(`oauthcode=${code}`),
      null,
      authHeaders,
    )
  })

  it('getSyncedUser fetches user correctly', async () => {
    const mockUser = { userId: '123', email: 'test@example.com' }
    vi.mocked(fetchGet).mockResolvedValue({ data: mockUser })

    const result = await AuthenticateNIH.getSyncedUser()

    expect(result).toEqual(mockUser)
    expect(fetchGet).toHaveBeenCalledWith(`${apiUrl}/api/nih/sync`, authHeaders)
  })
})
