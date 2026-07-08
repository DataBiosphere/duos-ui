import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Metrics } from 'src/libs/ajax/Metrics'
import eventList, { MetricsEventName } from 'src/libs/events'
import { Config, Token } from 'src/libs/config'
import { Storage } from 'src/libs/storage'
import { retryFetchPost } from 'src/libs/ajax/fetchAdapter'

vi.mock('src/libs/ajax/fetchAdapter', () => ({
  retryFetchPost: vi.fn(),
}))

vi.mock('@databiosphere/bard-client', () => ({
  getDefaultProperties: vi.fn().mockReturnValue({}),
}))

const bardUrl = 'https://bard.example.test'

describe('Metrics Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(retryFetchPost).mockResolvedValue({ data: undefined } as never)
    vi.spyOn(Config, 'getBardApiUrl').mockResolvedValue(bardUrl)
    vi.spyOn(Token, 'getToken').mockReturnValue('test-token')
    vi.spyOn(Storage, 'userIsLogged').mockReturnValue(false)
    vi.spyOn(Storage, 'getCurrentUser').mockReturnValue({ userId: 0 } as ReturnType<typeof Storage.getCurrentUser>)
    vi.spyOn(Storage, 'getAnonymousId').mockReturnValue('anon-id')
    vi.spyOn(Storage, 'setAnonymousId').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each(Object.keys(eventList))('Captures %s Event', async (eventType) => {
    await Metrics.captureEvent(eventType as MetricsEventName)

    expect(retryFetchPost).toHaveBeenCalledWith(
      `${bardUrl}/api/event`,
      expect.objectContaining({ event: eventType }),
      expect.any(Object),
    )
  })

  it('Sync Profile', async () => {
    await Metrics.syncProfile()

    expect(retryFetchPost).toHaveBeenCalledWith(
      `${bardUrl}/api/syncProfile`,
      undefined,
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-token' }) }),
    )
  })

  it('Identify', async () => {
    await Metrics.identify('anonymousId')

    expect(retryFetchPost).toHaveBeenCalledWith(
      `${bardUrl}/api/identify`,
      { anonId: 'anonymousId' },
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-token' }) }),
    )
  })
})
