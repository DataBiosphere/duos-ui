import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ToS, ToSStatus } from 'src/libs/ajax/ToS'
import { Config } from 'src/libs/config'
import type { UserStatusInfo } from 'src/types/model'
import type { FetchData } from 'src/libs/ajax/fetchAdapter'
import { fetchGet, fetchPost, fetchDelete } from 'src/libs/ajax/fetchAdapter'

vi.mock('src/libs/ajax/fetchAdapter', () => ({
  fetchGet: vi.fn(),
  fetchPost: vi.fn(),
  fetchDelete: vi.fn(),
}))

const apiUrl = 'https://api.example.test'
const textPlainHeaders = { headers: { Accept: 'text/plain' } } as ReturnType<typeof Config.textPlain>

describe('ToS ajax module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Config, 'getApiUrl').mockResolvedValue(apiUrl)
    vi.spyOn(Config, 'textPlain').mockReturnValue(textPlainHeaders)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('getDUOSText fetches the DUOS ToS text', async () => {
    vi.mocked(fetchGet).mockResolvedValue({ data: 'DUOS Terms of Service text.' } as FetchData<string>)

    const result = await ToS.getDUOSText()

    expect(result).toBe('DUOS Terms of Service text.')
    expect(fetchGet).toHaveBeenCalledWith(`${apiUrl}/tos/text/duos`, textPlainHeaders)
  })

  it('acceptToS posts and returns UserStatusInfo', async () => {
    const expected: UserStatusInfo = {
      enabled: false,
      userEmail: 'test@duos.org',
      userSubjectId: '123',
      tosAccepted: true,
    }
    vi.mocked(fetchPost).mockResolvedValue({ data: expected } as FetchData<UserStatusInfo>)

    const result = await ToS.acceptToS()

    expect(result).toEqual(expected)
    expect(fetchPost).toHaveBeenCalledWith(`${apiUrl}/api/sam/register/self/tos`, {})
  })

  it('rejectToS deletes and returns ToSStatus', async () => {
    const expected: ToSStatus = {
      acceptedOn: '2026-04-30T12:00:00.000Z',
      isCurrentVersion: false,
      latestAcceptedVersion: 'v2',
      permitsSystemUsage: false,
    }
    vi.mocked(fetchDelete).mockResolvedValue({ data: expected } as FetchData<ToSStatus>)

    const result = await ToS.rejectToS()

    expect(result).toEqual(expected)
    expect(fetchDelete).toHaveBeenCalledWith(`${apiUrl}/api/sam/register/self/tos`)
  })
})
