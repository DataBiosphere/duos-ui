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
    vi.spyOn(Config, 'isBffEnabled').mockResolvedValue(false)
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

  describe('BFF mode', () => {
    beforeEach(() => {
      vi.spyOn(Config, 'isBffEnabled').mockResolvedValue(true)
    })

    it('routes syncProfile through the Bard proxy', async () => {
      await Metrics.syncProfile()

      expect(retryFetchPost).toHaveBeenCalledWith(
        '/bard-api/api/syncProfile',
        undefined,
        expect.any(Object),
      )
    })

    it('routes identify through the Bard proxy', async () => {
      await Metrics.identify('anonymousId')

      expect(retryFetchPost).toHaveBeenCalledWith(
        '/bard-api/api/identify',
        { anonId: 'anonymousId' },
        expect.any(Object),
      )
    })

    it('routes identified events through the Bard proxy', async () => {
      vi.spyOn(Storage, 'userIsLogged').mockReturnValue(true)

      await Metrics.captureEvent(Object.keys(eventList)[0] as MetricsEventName)

      expect(retryFetchPost).toHaveBeenCalledWith(
        '/bard-api/api/event',
        expect.any(Object),
        expect.any(Object),
      )
    })

    it('routes anonymous events through the public endpoint, not the direct Bard URL', async () => {
      // Story 5-F6: the anonymous event carried no credentials and so went
      // straight to Bard, which is what kept bardApiUrl in the BFF connect-src
      // allowlist. The public endpoint injects no token either, so the call is
      // same-origin now. The path is a single named route rather than a mirror
      // of Bard's /api/event — it must match server/src/proxy/publicProxy.ts.
      vi.spyOn(Storage, 'userIsLogged').mockReturnValue(false)

      await Metrics.captureEvent(Object.keys(eventList)[0] as MetricsEventName)

      expect(retryFetchPost).toHaveBeenCalledWith(
        '/public/metrics/event',
        expect.any(Object),
        expect.any(Object),
      )
    })

    it('sends no Authorization header on the anonymous event', async () => {
      // The public endpoint takes no credential, and the identified branch is
      // the only one that has a token to send.
      vi.spyOn(Storage, 'userIsLogged').mockReturnValue(false)

      await Metrics.captureEvent(Object.keys(eventList)[0] as MetricsEventName)

      const [url, , options] = vi.mocked(retryFetchPost).mock.calls[0]
      expect(url).toBe('/public/metrics/event')
      // Asserts the absence of the header, not the absence of a headers
      // object: passing `headers: {}` or an unrelated header stays correct.
      const headers = (options as { headers?: Record<string, string> } | undefined)?.headers ?? {}
      expect(Object.keys(headers).map(key => key.toLowerCase())).not.toContain('authorization')
    })

    it('keeps identify and syncProfile off the public endpoint, which exposes only the event path', async () => {
      await Metrics.identify('anonymousId')
      await Metrics.syncProfile()

      for (const [url] of vi.mocked(retryFetchPost).mock.calls) {
        expect(url).not.toContain('/public/metrics')
      }
    })

    it('treats a persisted registered profile as signed in — the legacy token check is always false under the BFF', async () => {
      // The legacy oidc keys are purged in BFF mode, so userIsLogged() is
      // false for every signed-in BFF user. The stored profile is the
      // identity: the event must post identified (proxy URL, no anonymous
      // distinct_id), matching identify/syncProfile in the same flow.
      vi.spyOn(Storage, 'userIsLogged').mockReturnValue(false)
      vi.spyOn(Storage, 'getCurrentUser').mockReturnValue({ userId: 7 } as ReturnType<typeof Storage.getCurrentUser>)

      await Metrics.captureEvent(Object.keys(eventList)[0] as MetricsEventName)

      expect(retryFetchPost).toHaveBeenCalledWith(
        '/bard-api/api/event',
        expect.objectContaining({
          properties: expect.objectContaining({ distinct_id: undefined }),
        }),
        expect.any(Object),
      )
    })
  })
})
