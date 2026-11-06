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
  sessionStoreId: string
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
  /** The store row's key; `sessionId` is the generation, which differs after a rotation. */
  sessionStoreId?: string
  generation?: string
  accessToken?: string
  refreshToken?: string
  idToken?: string
  tokenExpiry?: number
  /** What sessionStore.get yields: a session snapshot, null, or an error. */
  stored?: Partial<Session> | null
  storeError?: Error
  /** What the store's generation-checked destroy reports; without it, endSession falls back to destroy(). */
  destroyOutcome?: 'destroyed' | 'gone' | 'superseded'
} = {}): FakeRequest {
  const session = {
    sessionStoreId: overrides.sessionStoreId ?? 'sid-1',
    // A session that hasn't rotated has the sid as its generation.
    sessionId: overrides.generation ?? overrides.sessionStoreId ?? 'sid-1',
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
    sessionStore: {
      get: storeGet,
      ...overrides.destroyOutcome && {
        destroyGeneration: (_sid: string, _generation: string, callback: (err: unknown, outcome: string) => void) => callback(null, overrides.destroyOutcome!),
      },
    },
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

  it('fails as terminal when the session ended during the refresh, so its save is refused', async () => {
    // A logout destroyed the row mid-flight; compareAndSet won't write it back.
    const { request, session } = makeRequest()
    session.save.mockRejectedValue(Object.assign(new Error('The session does not exist or has changed'), { code: 'ENOENT' }))

    const err = await refreshAccessToken(request).catch((e: unknown) => e)

    expect(err).toBeInstanceOf(RefreshFailedError)
    expect((err as Error).message).toBe('session_ended')
    expect(request.log.warn).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'auth.refresh.completed', outcome: 'terminal', reason: 'session_ended' }),
      'auth.refresh.completed',
    )
  })

  it('fails as transient, and drops the session, when a later sign-in took the row during the refresh', async () => {
    const { request, session } = makeRequest({ stored: { __fastifySessionMetadata: { generation: 'later' } } as Partial<Session> })
    session.save.mockRejectedValue(Object.assign(new Error('The session does not exist or has changed'), { code: 'ENOENT' }))

    const err = await refreshAccessToken(request).catch((e: unknown) => e)

    expect(err).not.toBeInstanceOf(RefreshFailedError)
    expect(request.session).toBeNull()
  })

  it.each([
    ['without a refresh token', { refreshToken: undefined }],
    ['after B2C rejects the token', {}],
  ])('fails as transient, without destroying, when a later sign-in holds the row %s', async (_case, overrides) => {
    const oidc = await import('openid-client')
    vi.mocked(oidc.refreshTokenGrant).mockRejectedValue(oauthError('invalid_grant'))
    const { request, session } = makeRequest({ ...overrides, destroyOutcome: 'superseded' })

    const err = await refreshAccessToken(request).catch((e: unknown) => e)

    expect(err).toBeInstanceOf(Error)
    expect(err).not.toBeInstanceOf(RefreshFailedError)
    expect(session.destroy).not.toHaveBeenCalled()
  })

  it('keeps any other save failure transient', async () => {
    const { request, session } = makeRequest()
    session.save.mockRejectedValue(new Error('connection terminated'))

    const err = await refreshAccessToken(request).catch((e: unknown) => e)

    expect(err).not.toBeInstanceOf(RefreshFailedError)
    expect((err as Error).message).toBe('connection terminated')
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
    const withoutIdToken = makeRequest({ sessionStoreId: 'sid-2', idToken: 'kept-id-token' })
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
          __fastifySessionMetadata: { generation: 'sid-1' },
          accessToken: 'winner-access-token',
          refreshToken: 'winner-refresh-token',
          idToken: 'winner-id-token',
          tokenExpiry: NOW_S + 3000,
        } as Partial<Session>,
      })

      await refreshAccessToken(request)

      expect(session.destroy).not.toHaveBeenCalled()
      expect(session.accessToken).toBe('winner-access-token')
      expect(session.refreshToken).toBe('winner-refresh-token')
      expect(session.tokenExpiry).toBe(NOW_S + 3000)
    })

    it('re-reads the store by the row key, not the generation, once the session has rotated', async () => {
      const { request, session, storeGet } = makeRequest({
        sessionStoreId: 'row-1',
        generation: 'second-generation',
        stored: {
          __fastifySessionMetadata: { generation: 'second-generation' },
          accessToken: 'winner-access-token',
          refreshToken: 'winner-refresh-token',
        } as Partial<Session>,
      })

      await refreshAccessToken(request)

      expect(storeGet).toHaveBeenCalledWith('row-1', expect.any(Function))
      expect(session.accessToken).toBe('winner-access-token')
    })

    it('neither adopts nor destroys a later sign-in that now holds the row', async () => {
      const { request, session } = makeRequest({
        stored: {
          __fastifySessionMetadata: { generation: 'later-sign-in' },
          accessToken: 'other-user-access-token',
          refreshToken: 'other-user-refresh-token',
        } as Partial<Session>,
      })

      const err = await refreshAccessToken(request).catch((e: unknown) => e)

      expect(err).not.toBeInstanceOf(RefreshFailedError)
      expect(session.destroy).not.toHaveBeenCalled()
      expect(session.accessToken).toBe('old-access-token')
      expect(session.save).not.toHaveBeenCalled()
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
      const requests = Array.from({ length: 5 }, () => makeRequest({ sessionStoreId: 'shared-sid' }))

      await Promise.all(requests.map(({ request }) => refreshAccessToken(request)))

      const oidc = await import('openid-client')
      expect(oidc.refreshTokenGrant).toHaveBeenCalledOnce()
    })

    it('gives every concurrent request the refreshed token, not just the leader', async () => {
      const requests = Array.from({ length: 5 }, () => makeRequest({ sessionStoreId: 'shared-sid' }))

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
      const requests = Array.from({ length: 3 }, () => makeRequest({ sessionStoreId: 'shared-sid' }))

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
      const leader = makeRequest({ sessionStoreId: 'shared-sid' })
      const saveStarted = deferred()
      const saveFinished = deferred()
      leader.session.save.mockImplementation(() => {
        saveStarted.resolve()
        return saveFinished.promise
      })

      const leaderRefresh = refreshAccessToken(leader.request)
      await saveStarted.promise // token exchange done, store write still in flight

      const late = makeRequest({ sessionStoreId: 'shared-sid' })
      const lateRefresh = refreshAccessToken(late.request)
      saveFinished.resolve()
      await Promise.all([leaderRefresh, lateRefresh])

      const oidc = await import('openid-client')
      expect(oidc.refreshTokenGrant).toHaveBeenCalledOnce()
      expect(late.session.accessToken).toBe('new-access-token')
      expect(late.session.destroy).not.toHaveBeenCalled()
    })

    it('does not share a refresh between different sessions', async () => {
      const first = makeRequest({ sessionStoreId: 'sid-a' })
      const second = makeRequest({ sessionStoreId: 'sid-b' })

      await Promise.all([refreshAccessToken(first.request), refreshAccessToken(second.request)])

      const oidc = await import('openid-client')
      expect(oidc.refreshTokenGrant).toHaveBeenCalledTimes(2)
    })

    it('never shares a flight between two sign-ins on the same row', async () => {
      // @fastify/session 11.1.6 keeps the row across a sign-in and changes the generation.
      const first = makeRequest({ sessionStoreId: 'shared-row', generation: 'first-sign-in' })
      const second = makeRequest({ sessionStoreId: 'shared-row', generation: 'second-sign-in' })

      await Promise.all([refreshAccessToken(first.request), refreshAccessToken(second.request)])

      const oidc = await import('openid-client')
      expect(oidc.refreshTokenGrant).toHaveBeenCalledTimes(2)
    })

    it('starts a fresh flight once the previous one has settled', async () => {
      const { request: first } = makeRequest({ sessionStoreId: 'sequential-sid' })
      await refreshAccessToken(first)

      const { request: second } = makeRequest({ sessionStoreId: 'sequential-sid' })
      await refreshAccessToken(second)

      const oidc = await import('openid-client')
      expect(oidc.refreshTokenGrant).toHaveBeenCalledTimes(2)
    })
  })
})

describe('refreshAccessToken — events', () => {
  const COMPLETED = (outcome: string, extra: Record<string, unknown> = {}) => expect.objectContaining({ event: 'auth.refresh.completed', outcome, idp: 'unknown', ...extra })

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW_MS)
    resetInFlightRefreshes()
    const oidcClient = await import('../src/auth/oidcClient.js')
    vi.mocked(oidcClient.getOidcConfig).mockReset().mockResolvedValue({} as Configuration)
    const oidc = await import('openid-client')
    vi.mocked(oidc.refreshTokenGrant).mockReset().mockResolvedValue(makeTokens())
  })

  it('emits one succeeded event per flight, not one per caller', async () => {
    const { request } = makeRequest()
    const follower = makeRequest()

    await Promise.all([refreshAccessToken(request), refreshAccessToken(follower.request)])

    const events = [request, follower.request].flatMap(r => vi.mocked(r.log.info).mock.calls)
      .filter(([fields]) => (fields as { event?: string }).event === 'auth.refresh.completed')
    expect(events).toHaveLength(1)
    expect(events[0][0]).toMatchObject({ outcome: 'succeeded' })
  })

  it('emits auth.refresh.unrefreshable at warn, then session.destroyed, when there is no refresh token', async () => {
    const { request } = makeRequest({ refreshToken: undefined })

    await expect(refreshAccessToken(request)).rejects.toThrow(RefreshFailedError)

    expect(request.log.warn).toHaveBeenCalledWith(expect.objectContaining({ event: 'auth.refresh.unrefreshable' }), 'auth.refresh.unrefreshable')
    expect(request.log.info).toHaveBeenCalledWith(expect.objectContaining({ event: 'auth.session.destroyed', reason: 'refresh_terminal' }), 'auth.session.destroyed')
  })

  it('emits a terminal event at warn when B2C rejects the refresh token', async () => {
    const oidc = await import('openid-client')
    vi.mocked(oidc.refreshTokenGrant).mockRejectedValue(oauthError('invalid_grant'))
    const { request } = makeRequest()

    await expect(refreshAccessToken(request)).rejects.toThrow(RefreshFailedError)

    expect(request.log.warn).toHaveBeenCalledWith(COMPLETED('terminal', { reason: 'refresh_failed' }), 'auth.refresh.completed')
    expect(request.log.info).toHaveBeenCalledWith(expect.objectContaining({ event: 'auth.session.destroyed', reason: 'refresh_terminal' }), 'auth.session.destroyed')
  })

  it('emits race_adopted at info, which is not a failure, when another pod already rotated the tokens', async () => {
    const oidc = await import('openid-client')
    vi.mocked(oidc.refreshTokenGrant).mockRejectedValue(oauthError('invalid_grant'))
    const { request } = makeRequest({ stored: { accessToken: 'winner', refreshToken: 'winner-refresh', tokenExpiry: NOW_S + 3000 } })

    await refreshAccessToken(request)

    expect(request.log.info).toHaveBeenCalledWith(COMPLETED('race_adopted'), 'auth.refresh.completed')
    expect(request.log.warn).not.toHaveBeenCalledWith(COMPLETED('terminal'), expect.anything())
  })

  it('emits a transient event at warn and keeps the session', async () => {
    const oidc = await import('openid-client')
    vi.mocked(oidc.refreshTokenGrant).mockRejectedValue(new TypeError('fetch failed'))
    const { request, session } = makeRequest()

    await expect(refreshAccessToken(request)).rejects.toThrow(TypeError)

    expect(request.log.warn).toHaveBeenCalledWith(COMPLETED('transient'), 'auth.refresh.completed')
    expect(session.destroy).not.toHaveBeenCalled()
  })

  it('emits a single transient event, and no succeeded event, when saving the refreshed session fails', async () => {
    const { request, session } = makeRequest()
    session.save.mockRejectedValue(new Error('store unavailable'))

    await expect(refreshAccessToken(request)).rejects.toThrow('store unavailable')

    const events = vi.mocked(request.log.info).mock.calls.concat(vi.mocked(request.log.warn).mock.calls)
      .filter(([fields]) => (fields as { event?: string }).event === 'auth.refresh.completed')
    expect(events).toHaveLength(1)
    expect(events[0][0]).toMatchObject({ outcome: 'transient' })
  })

  it('emits a transient event when the OIDC config cannot be loaded', async () => {
    const oidcClient = await import('../src/auth/oidcClient.js')
    vi.mocked(oidcClient.getOidcConfig).mockRejectedValue(new Error('discovery failed'))
    const { request } = makeRequest()

    await expect(refreshAccessToken(request)).rejects.toThrow('discovery failed')

    expect(request.log.warn).toHaveBeenCalledWith(COMPLETED('transient'), 'auth.refresh.completed')
  })

  it('does not report race_adopted when persisting the adopted tokens fails', async () => {
    const oidc = await import('openid-client')
    vi.mocked(oidc.refreshTokenGrant).mockRejectedValue(oauthError('invalid_grant'))
    const { request, session } = makeRequest({ stored: { accessToken: 'winner', refreshToken: 'winner-refresh', tokenExpiry: NOW_S + 3000 } })
    session.save.mockRejectedValue(new Error('store unavailable'))

    await expect(refreshAccessToken(request)).rejects.toThrow('store unavailable')

    expect(request.log.info).not.toHaveBeenCalledWith(COMPLETED('race_adopted'), expect.anything())
    expect(request.log.warn).toHaveBeenCalledWith(COMPLETED('transient'), 'auth.refresh.completed')
  })

  it('keeps the idp on the terminal event even though the destroy has emptied the session', async () => {
    const oidc = await import('openid-client')
    vi.mocked(oidc.refreshTokenGrant).mockRejectedValue(oauthError('invalid_grant'))
    const { request, session } = makeRequest()
    ;(session as unknown as { idp: string }).idp = 'microsoft'

    await expect(refreshAccessToken(request)).rejects.toThrow(RefreshFailedError)

    expect(request.log.warn).toHaveBeenCalledWith(COMPLETED('terminal', { idp: 'microsoft' }), 'auth.refresh.completed')
  })
})
