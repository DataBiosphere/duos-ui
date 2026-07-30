import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { FastifyRequest, Session } from 'fastify'
import type { Configuration } from 'openid-client'
import { ResponseBodyError } from 'openid-client'
import { refreshAccessToken, RefreshFailedError, resetInFlightRefreshes } from '../src/auth/refresh.js'

// Only getOidcConfig() is replaced — left real it would attempt B2C discovery
// over the network. The rest of the module is spread through rather than
// stubbed out, so anything refresh.ts imports from it in future keeps its real
// implementation instead of silently arriving as undefined.
vi.mock('../src/auth/oidcClient.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/auth/oidcClient.js')>()
  return { ...actual, getOidcConfig: vi.fn() }
})

// Only refreshTokenGrant is mocked — ResponseBodyError stays the real class so
// the instanceof checks in refresh.ts are exercised rather than stubbed.
vi.mock('openid-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('openid-client')>()
  return { ...actual, refreshTokenGrant: vi.fn() }
})

const NOW_MS = 1_800_000_000_000
const NOW_S = Math.floor(NOW_MS / 1000)

function makeTokens(overrides: {
  access_token?: string
  refresh_token?: string
  id_token?: string
  expiresIn?: number | undefined
} = {}) {
  return {
    access_token: overrides.access_token ?? 'new-access-token',
    refresh_token: 'refresh_token' in overrides ? overrides.refresh_token : 'new-refresh-token',
    id_token: 'id_token' in overrides ? overrides.id_token : 'new-id-token',
    expiresIn: () => ('expiresIn' in overrides ? overrides.expiresIn : 3600),
  } as never
}

/**
 * A promise with its resolver exposed, for holding a mocked async call open
 * while the test observes what happens mid-flight.
 */
function deferred(): { promise: Promise<void>, resolve: () => void } {
  let resolve: () => void = () => {}
  const promise = new Promise<void>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

function oauthError(error: string): ResponseBodyError {
  return new ResponseBodyError(error, {
    cause: { error },
    response: new Response(null, { status: 400 }),
  })
}

type FakeSession = Session & {
  sessionId: string
  save: ReturnType<typeof vi.fn>
  destroy: ReturnType<typeof vi.fn>
}

interface FakeRequest {
  request: FastifyRequest
  /** Held separately because destroy() nulls `request.session`, as the real one does. */
  session: FakeSession
  storeGet: ReturnType<typeof vi.fn>
}

function makeRequest(overrides: {
  sessionId?: string
  accessToken?: string
  refreshToken?: string
  idToken?: string
  tokenExpiry?: number
  /** What sessionStore.get yields: a session snapshot, null, or an error. */
  stored?: Partial<Session> | null
  storeError?: Error
} = {}): FakeRequest {
  const session = {
    sessionId: overrides.sessionId ?? 'sid-1',
    accessToken: 'accessToken' in overrides ? overrides.accessToken : 'old-access-token',
    refreshToken: 'refreshToken' in overrides ? overrides.refreshToken : 'old-refresh-token',
    idToken: 'idToken' in overrides ? overrides.idToken : 'old-id-token',
    tokenExpiry: overrides.tokenExpiry ?? NOW_S + 30,
    save: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn().mockImplementation(async () => {
      // The real destroy() sets request.session to null — mirror that so a
      // regression that touched the session after destroying it would throw.
      ;(request as { session: Session | null }).session = null
    }),
  } as unknown as FakeSession

  const storeGet = vi.fn().mockImplementation(
    (_sid: string, callback: (err: unknown, stored?: Partial<Session> | null) => void) => {
      if (overrides.storeError) callback(overrides.storeError)
      else callback(null, overrides.stored ?? null)
    },
  )

  const request = {
    session,
    sessionStore: { get: storeGet },
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  } as unknown as FastifyRequest

  return { request, session, storeGet }
}

describe('refreshAccessToken', () => {
  const fakeConfig = {} as Configuration

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW_MS)
    resetInFlightRefreshes()

    const oidcClient = await import('../src/auth/oidcClient.js')
    vi.mocked(oidcClient.getOidcConfig).mockReset().mockResolvedValue(fakeConfig)

    const oidc = await import('openid-client')
    vi.mocked(oidc.refreshTokenGrant).mockReset().mockResolvedValue(makeTokens())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('updates the access token and expiry, and persists the session', async () => {
    const { request, session } = makeRequest()

    await refreshAccessToken(request)

    expect(session.accessToken).toBe('new-access-token')
    expect(session.tokenExpiry).toBe(NOW_S + 3600)
    expect(session.save).toHaveBeenCalledOnce()
  })

  it('redeems the session refresh token against B2C', async () => {
    const { request } = makeRequest({ refreshToken: 'the-stored-refresh-token' })

    await refreshAccessToken(request)

    const oidc = await import('openid-client')
    expect(oidc.refreshTokenGrant).toHaveBeenCalledWith(fakeConfig, 'the-stored-refresh-token')
  })

  it('stores the rotated refresh token when B2C issues a new one', async () => {
    const { request, session } = makeRequest()

    await refreshAccessToken(request)

    expect(session.refreshToken).toBe('new-refresh-token')
  })

  it('keeps the existing refresh token when the response omits one', async () => {
    const oidc = await import('openid-client')
    vi.mocked(oidc.refreshTokenGrant).mockResolvedValue(makeTokens({ refresh_token: undefined }))
    const { request, session } = makeRequest({ refreshToken: 'still-valid-refresh-token' })

    await refreshAccessToken(request)

    expect(session.refreshToken).toBe('still-valid-refresh-token')
  })

  it('updates the id token when B2C returns one, and keeps the old one otherwise', async () => {
    const oidc = await import('openid-client')
    const withIdToken = makeRequest()
    await refreshAccessToken(withIdToken.request)
    expect(withIdToken.session.idToken).toBe('new-id-token')

    vi.mocked(oidc.refreshTokenGrant).mockResolvedValue(makeTokens({ id_token: undefined }))
    resetInFlightRefreshes()
    const withoutIdToken = makeRequest({ sessionId: 'sid-2', idToken: 'kept-id-token' })
    await refreshAccessToken(withoutIdToken.request)
    expect(withoutIdToken.session.idToken).toBe('kept-id-token')
  })

  it('treats a response with no expires_in as already expired rather than never expiring', async () => {
    const oidc = await import('openid-client')
    vi.mocked(oidc.refreshTokenGrant).mockResolvedValue(makeTokens({ expiresIn: undefined }))
    const { request, session } = makeRequest()

    await refreshAccessToken(request)

    expect(session.tokenExpiry).toBe(NOW_S)
  })

  describe('when there is no refresh token', () => {
    it('destroys the session and reports a fatal failure without calling B2C', async () => {
      const { request, session } = makeRequest({ refreshToken: undefined })

      await expect(refreshAccessToken(request)).rejects.toThrow(RefreshFailedError)

      expect(session.destroy).toHaveBeenCalledOnce()
      const oidc = await import('openid-client')
      expect(oidc.refreshTokenGrant).not.toHaveBeenCalled()
    })
  })

  describe('when B2C rejects the refresh token with invalid_grant', () => {
    beforeEach(async () => {
      const oidc = await import('openid-client')
      vi.mocked(oidc.refreshTokenGrant).mockRejectedValue(oauthError('invalid_grant'))
    })

    it('destroys the session and throws RefreshFailedError', async () => {
      const { request, session } = makeRequest()

      await expect(refreshAccessToken(request)).rejects.toThrow(RefreshFailedError)

      expect(session.destroy).toHaveBeenCalledOnce()
    })

    it('adopts the stored tokens instead of destroying when another refresher already rotated them', async () => {
      const { request, session } = makeRequest({
        stored: {
          accessToken: 'winner-access-token',
          refreshToken: 'winner-refresh-token',
          idToken: 'winner-id-token',
          tokenExpiry: NOW_S + 3000,
        },
      })

      await refreshAccessToken(request)

      expect(session.destroy).not.toHaveBeenCalled()
      expect(session.accessToken).toBe('winner-access-token')
      expect(session.refreshToken).toBe('winner-refresh-token')
      expect(session.tokenExpiry).toBe(NOW_S + 3000)
    })

    it('destroys the session when the store still holds the same refresh token', async () => {
      const { request, session } = makeRequest({
        refreshToken: 'unrotated-refresh-token',
        stored: { accessToken: 'a', refreshToken: 'unrotated-refresh-token' },
      })

      await expect(refreshAccessToken(request)).rejects.toThrow(RefreshFailedError)

      expect(session.destroy).toHaveBeenCalledOnce()
    })

    it('destroys the session when the store row is gone', async () => {
      const { request, session } = makeRequest({ stored: null })

      await expect(refreshAccessToken(request)).rejects.toThrow(RefreshFailedError)

      expect(session.destroy).toHaveBeenCalledOnce()
    })

    it('destroys the session when the store cannot be read, and says so in the logs', async () => {
      const storeError = new Error('connection terminated')
      const { request, session } = makeRequest({ storeError })

      await expect(refreshAccessToken(request)).rejects.toThrow(RefreshFailedError)

      expect(session.destroy).toHaveBeenCalledOnce()
      // Otherwise a DB outage is indistinguishable from an ended session.
      expect(request.log.warn).toHaveBeenCalledWith(
        expect.objectContaining({ err: storeError }),
        expect.stringContaining('session store unreadable'),
      )
    })
  })

  describe('when the failure is transient', () => {
    it('propagates a network error without destroying the session', async () => {
      const oidc = await import('openid-client')
      const networkError = new TypeError('fetch failed')
      vi.mocked(oidc.refreshTokenGrant).mockRejectedValue(networkError)
      const { request, session } = makeRequest()

      await expect(refreshAccessToken(request)).rejects.toBe(networkError)

      expect(session.destroy).not.toHaveBeenCalled()
      expect(session.accessToken).toBe('old-access-token')
    })

    // A wrong client secret or an unwell B2C is a property of the deployment,
    // not of this session — destroying sessions would turn one misconfiguration
    // into a fleet-wide logout.
    it.each(['invalid_client', 'server_error', 'temporarily_unavailable'])(
      'propagates the OAuth error %s without destroying the session',
      async (error) => {
        const oidc = await import('openid-client')
        vi.mocked(oidc.refreshTokenGrant).mockRejectedValue(oauthError(error))
        const { request, session } = makeRequest()

        const thrown: unknown = await refreshAccessToken(request).catch((err: unknown) => err)

        expect(thrown).toBeInstanceOf(ResponseBodyError)
        expect(thrown).not.toBeInstanceOf(RefreshFailedError)
        expect(session.destroy).not.toHaveBeenCalled()
      },
    )
  })

  describe('single-flight', () => {
    it('makes exactly one token-endpoint call for N concurrent requests on the same session', async () => {
      const requests = Array.from({ length: 5 }, () => makeRequest({ sessionId: 'shared-sid' }))

      await Promise.all(requests.map(({ request }) => refreshAccessToken(request)))

      const oidc = await import('openid-client')
      expect(oidc.refreshTokenGrant).toHaveBeenCalledOnce()
    })

    it('gives every concurrent request the refreshed token, not just the leader', async () => {
      const requests = Array.from({ length: 5 }, () => makeRequest({ sessionId: 'shared-sid' }))

      await Promise.all(requests.map(({ request }) => refreshAccessToken(request)))

      for (const { session } of requests) {
        expect(session.accessToken).toBe('new-access-token')
        expect(session.refreshToken).toBe('new-refresh-token')
        expect(session.tokenExpiry).toBe(NOW_S + 3600)
        // One store write each, of identical data: the price of every concurrent
        // request holding its own session instance. One token-endpoint call, N
        // idempotent UPSERTs, roughly once per token lifetime per active session.
        expect(session.save).toHaveBeenCalledOnce()
      }
    })

    it('fails every concurrent request when the shared refresh is rejected', async () => {
      const oidc = await import('openid-client')
      vi.mocked(oidc.refreshTokenGrant).mockRejectedValue(oauthError('invalid_grant'))
      const requests = Array.from({ length: 3 }, () => makeRequest({ sessionId: 'shared-sid' }))

      const results = await Promise.allSettled(requests.map(({ request }) => refreshAccessToken(request)))

      expect(results.every(r => r.status === 'rejected')).toBe(true)
      expect(oidc.refreshTokenGrant).toHaveBeenCalledOnce()
    })

    // Releasing the flight when the token exchange resolves would leave a window
    // where the rotated token exists at B2C but not in the store. A request
    // arriving there would redeem the already-rotated token, get invalid_grant,
    // re-read the store, still see the pre-rotation token, and destroy a healthy
    // session.
    it('holds the flight open until the refreshed tokens are persisted', async () => {
      const leader = makeRequest({ sessionId: 'shared-sid' })
      const saveStarted = deferred()
      const saveFinished = deferred()
      leader.session.save.mockImplementation(() => {
        saveStarted.resolve()
        return saveFinished.promise
      })

      const leaderRefresh = refreshAccessToken(leader.request)
      await saveStarted.promise // token exchange done, store write still in flight

      const late = makeRequest({ sessionId: 'shared-sid' })
      const lateRefresh = refreshAccessToken(late.request)
      saveFinished.resolve()
      await Promise.all([leaderRefresh, lateRefresh])

      const oidc = await import('openid-client')
      expect(oidc.refreshTokenGrant).toHaveBeenCalledOnce()
      expect(late.session.accessToken).toBe('new-access-token')
      expect(late.session.destroy).not.toHaveBeenCalled()
    })

    it('does not share a refresh between different sessions', async () => {
      const first = makeRequest({ sessionId: 'sid-a' })
      const second = makeRequest({ sessionId: 'sid-b' })

      await Promise.all([refreshAccessToken(first.request), refreshAccessToken(second.request)])

      const oidc = await import('openid-client')
      expect(oidc.refreshTokenGrant).toHaveBeenCalledTimes(2)
    })

    it('starts a fresh flight once the previous one has settled', async () => {
      const { request: first } = makeRequest({ sessionId: 'sequential-sid' })
      await refreshAccessToken(first)

      const { request: second } = makeRequest({ sessionId: 'sequential-sid' })
      await refreshAccessToken(second)

      const oidc = await import('openid-client')
      expect(oidc.refreshTokenGrant).toHaveBeenCalledTimes(2)
    })
  })
})
