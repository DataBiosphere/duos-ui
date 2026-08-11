import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Metrics } from 'src/libs/ajax/Metrics'
import eventList, { MetricsEventName } from 'src/libs/events'
import { Config } from 'src/libs/config'
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

  it('Captures events anonymously with the persistent anonymousId as distinct_id', async () => {
    await Metrics.captureEvent('page:view' as MetricsEventName, { detailKey: 'detailValue' })

    expect(retryFetchPost).toHaveBeenCalledWith(
      `${bardUrl}/api/event`,
      expect.objectContaining({
        properties: expect.objectContaining({
          distinct_id: 'anon-id',
          appId: 'DUOS',
          detailKey: 'detailValue',
        }),
      }),
      expect.any(Object),
    )
    // No client-side bearer token — the request carries no Authorization header
    const options = vi.mocked(retryFetchPost).mock.calls[0][2]
    expect(options).not.toHaveProperty('headers')
    expect(Storage.setAnonymousId).not.toHaveBeenCalled()
  })

  it('Sets an anonymousId before capturing when one is missing', async () => {
    vi.mocked(Storage.getAnonymousId).mockReturnValueOnce(null).mockReturnValue('new-anon-id')

    await Metrics.captureEvent('page:view' as MetricsEventName)

    expect(Storage.setAnonymousId).toHaveBeenCalledOnce()
    expect(retryFetchPost).toHaveBeenCalledWith(
      `${bardUrl}/api/event`,
      expect.objectContaining({
        properties: expect.objectContaining({ distinct_id: 'new-anon-id' }),
      }),
      expect.any(Object),
    )
  })

  it('Sync Profile is inert (no fetch) without a client-side token', async () => {
    await expect(Metrics.syncProfile()).resolves.toBeUndefined()

    expect(retryFetchPost).not.toHaveBeenCalled()
  })

  it('Identify is inert (no fetch) without a client-side token', async () => {
    await expect(Metrics.identify('anonymousId')).resolves.toBeUndefined()

    expect(retryFetchPost).not.toHaveBeenCalled()
  })
})
