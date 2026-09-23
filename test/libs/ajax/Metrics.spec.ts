import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Metrics } from 'src/libs/ajax/Metrics'
import eventList, { MetricsEventName } from 'src/libs/events'
import { Config, Token } from 'src/libs/config'
import { Storage } from 'src/libs/storage'
import { retryFetchPost } from 'src/libs/ajax/fetchAdapter'

// Shared with the `default timeout signal` block, which re-registers the mock
// after a module reset so a freshly loaded Metrics sees this same function.
const { retryFetchPostMock } = vi.hoisted(() => ({ retryFetchPostMock: vi.fn() }))

vi.mock('src/libs/ajax/fetchAdapter', () => ({
  retryFetchPost: retryFetchPostMock,
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
      vi.spyOn(Storage, 'userIsLogged').mockReturnValue(false)

      await Metrics.captureEvent(Object.keys(eventList)[0] as MetricsEventName)

      expect(retryFetchPost).toHaveBeenCalledWith(
        '/public/metrics/event',
        expect.any(Object),
        expect.any(Object),
      )
    })

    it('sends no Authorization header on the anonymous event', async () => {
      vi.spyOn(Storage, 'userIsLogged').mockReturnValue(false)

      await Metrics.captureEvent(Object.keys(eventList)[0] as MetricsEventName)

      const [url, , options] = vi.mocked(retryFetchPost).mock.calls[0]
      expect(url).toBe('/public/metrics/event')
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

  describe('default timeout signal', () => {
    // AbortSignal.timeout runs on Node's internal clock, which vitest's fake
    // timers do not drive. Stand in a setTimeout-backed equivalent so the
    // fake clock controls when a signal fires. The module is loaded fresh
    // under the fake clock so module-evaluation time is a known instant.
    const controllableTimeout = (ms: number): AbortSignal => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(new DOMException('Timed out', 'TimeoutError')), ms)
      return controller.signal
    }

    type MetricsModule = typeof import('src/libs/ajax/Metrics')
    const post = retryFetchPostMock

    const loadFreshMetrics = async (): Promise<MetricsModule['Metrics']> => {
      vi.resetModules()
      vi.doMock('src/libs/ajax/fetchAdapter', () => ({ retryFetchPost: retryFetchPostMock }))
      const [{ Metrics: metrics }, { Config: freshConfig }, { Storage: freshStorage }] = await Promise.all([
        import('src/libs/ajax/Metrics'),
        import('src/libs/config'),
        import('src/libs/storage'),
      ])
      post.mockResolvedValue({ data: undefined } as never)
      vi.spyOn(freshConfig, 'getBardApiUrl').mockResolvedValue(bardUrl)
      vi.spyOn(freshConfig, 'isBffEnabled').mockResolvedValue(false)
      vi.spyOn(freshStorage, 'userIsLogged').mockReturnValue(false)
      vi.spyOn(freshStorage, 'getCurrentUser').mockReturnValue({ userId: 0 } as ReturnType<typeof Storage.getCurrentUser>)
      vi.spyOn(freshStorage, 'getAnonymousId').mockReturnValue('anon-id')
      return metrics
    }

    const signalOfCall = (index: number): AbortSignal | undefined => post.mock.calls.at(index)?.[2]?.signal

    beforeEach(() => {
      vi.useFakeTimers()
      vi.spyOn(AbortSignal, 'timeout').mockImplementation(controllableTimeout)
    })

    afterEach(() => {
      vi.useRealTimers()
      vi.doUnmock('src/libs/ajax/fetchAdapter')
      vi.resetModules()
    })

    it('posts an event fired more than 30 s after module load with a live signal', async () => {
      const metrics = await loadFreshMetrics()

      vi.advanceTimersByTime(30_001)
      await metrics.captureEvent(Object.keys(eventList)[0] as MetricsEventName)

      expect(post).toHaveBeenCalledTimes(1)
      expect(signalOfCall(0)?.aborted).toBe(false)
    })

    it('gives each call its own 30 s timeout', async () => {
      const metrics = await loadFreshMetrics()

      await metrics.captureEvent(Object.keys(eventList)[0] as MetricsEventName)
      const first = signalOfCall(0)
      vi.advanceTimersByTime(29_999)
      await metrics.syncProfile()
      const second = signalOfCall(1)

      expect(first).not.toBe(second)
      expect(first?.aborted).toBe(false)
      vi.advanceTimersByTime(1)
      expect(first?.aborted).toBe(true)
      expect(second?.aborted).toBe(false)
    })

    it('honours a caller-supplied signal', async () => {
      const metrics = await loadFreshMetrics()
      const controller = new AbortController()

      vi.advanceTimersByTime(30_001)
      await metrics.captureEvent(Object.keys(eventList)[0] as MetricsEventName, {}, controller.signal)
      await metrics.identify('anonymousId', controller.signal)

      expect(signalOfCall(0)).toBe(controller.signal)
      expect(signalOfCall(1)).toBe(controller.signal)
      expect(controller.signal.aborted).toBe(false)
    })
  })
})
