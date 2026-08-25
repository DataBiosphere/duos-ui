import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { fetchPost } from 'src/libs/ajax/fetchAdapter'
import { resetCsrfToken } from 'src/libs/ajax/csrf'
import { Config } from 'src/libs/config'

// ---------------------------------------------------------------------------
// Story 5-B: the cross-tab stale-token recovery, end to end.
//
// fetchAdapter.spec.ts mocks getCsrfToken/resetCsrfToken away, so its retry
// tests prove the adapter's branching but not the real token cache's part in
// it. This suite keeps src/libs/ajax/csrf REAL and fakes only the server, so
// the whole loop runs: cache warm → server rotates → stale send → rejection →
// cache reset → refetch → retry with the NEW token.
//
// Why cross-tab is the realistic stale-token path: a normal login is a
// full-page navigation, which resets the module cache — the freshly loaded
// page cannot hold a stale token. A SECOND tab can: it keeps its module cache
// across the first tab's re-login, and the session rotation at that login
// (Epic 5, 5-C) discards the server-side secret its cached token was minted
// against.
// ---------------------------------------------------------------------------

vi.mock('src/libs/config', async importOriginal => ({
  ...(await importOriginal<typeof import('src/libs/config')>()),
  Config: {
    getApiUrl: vi.fn(),
    getBardApiUrl: vi.fn(),
    isBffEnabled: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/Metrics', () => ({
  Metrics: { captureEvent: vi.fn() },
}))

vi.mock('src/libs/storage', () => ({
  Storage: { getOidcUser: vi.fn() },
}))

vi.mock('src/libs/auth/auth', () => ({
  redirectOnLogout: vi.fn(),
}))

vi.mock('src/libs/ErrorReporter', () => ({
  ErrorReporter: { report: vi.fn() },
}))

/**
 * A stand-in BFF: hands out its current token on /auth/csrf-token and
 * accepts a proxied POST only when X-CSRF-Token matches it. Rotating the
 * session is one assignment to `serverToken`.
 */
function makeBffStub() {
  const state = {
    serverToken: 'token-a',
    // What /auth/csrf-token hands out. Normally the same as serverToken;
    // split so a test can model a recovery whose fresh token STILL fails.
    issuedToken: null as string | null,
    tokenFetches: 0,
    postAttempts: [] as string[],
  }

  const fetchMock = vi.fn(async (url: string, init?: { headers?: Record<string, string> }) => {
    if (url === '/auth/csrf-token') {
      state.tokenFetches += 1
      return new Response(JSON.stringify({ token: state.issuedToken ?? state.serverToken }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }
    const sent = init?.headers?.['X-CSRF-Token'] ?? ''
    state.postAttempts.push(sent)
    if (sent !== state.serverToken) {
      return new Response(
        JSON.stringify({ error: 'csrf_validation_failed', reason: 'invalid_token' }),
        { status: 403, headers: { 'content-type': 'application/json' } },
      )
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  })

  return { state, fetchMock }
}

describe('cross-tab stale CSRF token recovery (real csrf module)', () => {
  beforeEach(() => {
    // The token cache is module-level state shared across tests — start cold.
    resetCsrfToken()
    vi.mocked(Config.isBffEnabled).mockResolvedValue(true)
    vi.mocked(Config.getApiUrl).mockResolvedValue('/duos-api')
    vi.mocked(Config.getBardApiUrl).mockResolvedValue('https://bard.example.org')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    resetCsrfToken()
  })

  it('recovers when the session rotates under a warm cache: rejection → refetch → retry with the new token', async () => {
    const { state, fetchMock } = makeBffStub()
    vi.stubGlobal('fetch', fetchMock)

    // This tab warms its cache and uses token-a successfully.
    const first = await fetchPost<{ ok: boolean }>('/duos-api/api/dataset', { name: 'one' })
    expect(first.data).toEqual({ ok: true })
    expect(state.tokenFetches).toBe(1)
    expect(state.postAttempts).toEqual(['token-a'])

    // Another tab re-authenticates; session rotation discards the old secret
    // and the server now only honors the new session's token.
    state.serverToken = 'token-b'

    // This tab's next write sends the stale cached token, gets the CSRF
    // rejection, refetches ONCE, and retries with the new token — invisibly
    // to the caller.
    const second = await fetchPost<{ ok: boolean }>('/duos-api/api/dataset', { name: 'two' })

    expect(second.data).toEqual({ ok: true })
    expect(state.postAttempts).toEqual(['token-a', 'token-a', 'token-b'])
    expect(state.tokenFetches).toBe(2) // one warm-up, one recovery — no extra churn
  })

  it('caches the recovered token: the next write reuses it without another fetch', async () => {
    const { state, fetchMock } = makeBffStub()
    vi.stubGlobal('fetch', fetchMock)

    await fetchPost('/duos-api/api/dataset', { name: 'one' })
    state.serverToken = 'token-b'
    await fetchPost('/duos-api/api/dataset', { name: 'two' })

    const third = await fetchPost<{ ok: boolean }>('/duos-api/api/dataset', { name: 'three' })

    expect(third.data).toEqual({ ok: true })
    expect(state.postAttempts.at(-1)).toBe('token-b')
    expect(state.tokenFetches).toBe(2) // still two — token-b came from the cache
  })

  it('surfaces the failure (bounded retry) when the refetched token is rejected too', async () => {
    const { state, fetchMock } = makeBffStub()
    vi.stubGlobal('fetch', fetchMock)

    await fetchPost('/duos-api/api/dataset', { name: 'one' })
    // A server that rejects even the refetched token — e.g. the session died
    // entirely, so nothing this tab can mint verifies. The adapter must stop
    // after ONE retry rather than loop.
    state.serverToken = 'never-issued'
    state.issuedToken = 'token-b'

    await expect(fetchPost('/duos-api/api/dataset', { name: 'two' })).rejects.toThrow()

    // Initial success + stale attempt + single retry: exactly three POSTs.
    expect(state.postAttempts).toHaveLength(3)
  })
})
