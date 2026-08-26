import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { fetchGet, fetchPost } from 'src/libs/ajax/fetchAdapter'
import { resetCsrfToken } from 'src/libs/ajax/csrf'
import { Config, Token } from 'src/libs/config'
import { Storage } from 'src/libs/storage'
import { redirectOnLogout } from 'src/libs/auth/auth'

// ---------------------------------------------------------------------------
// Story 5-B: the session-expired handler must not re-enter itself.
//
// The other suites mock src/libs/ajax/Metrics away, so the auto-logout metric
// is a no-op in them. It is not a no-op in the browser: an identified event
// posts to /bard-api, an unsafe same-origin request that fetches its own CSRF
// token — from the same gated endpoint whose 401 starts the handler. This
// suite keeps BOTH the csrf module and Metrics REAL, so the metric really
// tries to go out and the loop is either bounded or the test fails.
//
// Two entry points reach the loop, and both are covered below:
//   1. the token fetch for an unsafe request answers 401;
//   2. a DUOS API response is a 401 and the token cache is cold, so the
//      metric's own token fetch answers 401.
// ---------------------------------------------------------------------------

vi.mock('src/libs/config', async importOriginal => ({
  ...(await importOriginal<typeof import('src/libs/config')>()),
  Config: {
    getApiUrl: vi.fn(),
    getBardApiUrl: vi.fn(),
    isBffEnabled: vi.fn(),
  },
  Token: { getToken: vi.fn() },
}))

vi.mock('src/libs/storage', () => ({
  Storage: {
    getOidcUser: vi.fn(),
    userIsLogged: vi.fn(),
    getCurrentUser: vi.fn(),
    getAnonymousId: vi.fn(),
    setAnonymousId: vi.fn(),
  },
}))

vi.mock('src/libs/auth/auth', () => ({
  redirectOnLogout: vi.fn(),
}))

vi.mock('src/libs/ErrorReporter', () => ({
  ErrorReporter: { report: vi.fn() },
}))

vi.mock('@databiosphere/bard-client', () => ({
  getDefaultProperties: vi.fn().mockReturnValue({}),
}))

// The hard cap turns a recursion regression into a failed assertion instead
// of a test run that hangs.
const CALL_CAP = 12

/**
 * A dead-session BFF: /auth/csrf-token is gated and answers 401, the
 * /bard-api proxy holds no session token and answers 401, and the DUOS API
 * answers with `apiStatus`.
 */
function makeDeadSessionBff(apiStatus: number = 200) {
  const state = { tokenFetches: 0, metricPosts: 0, apiCalls: 0, calls: 0 }

  const unauthenticated = () => new Response(JSON.stringify({ error: 'unauthenticated' }), {
    status: 401,
    headers: { 'content-type': 'application/json' },
  })

  const fetchMock = vi.fn(async (url: string) => {
    state.calls += 1
    if (state.calls > CALL_CAP) {
      throw new Error(`the session-expired handler looped: more than ${CALL_CAP} requests`)
    }
    if (url === '/auth/csrf-token') {
      state.tokenFetches += 1
      return unauthenticated()
    }
    if (url.startsWith('/bard-api/')) {
      state.metricPosts += 1
      return unauthenticated()
    }
    state.apiCalls += 1
    return new Response(JSON.stringify({ ok: true }), {
      status: apiStatus,
      headers: { 'content-type': 'application/json' },
    })
  })

  return { state, fetchMock }
}

describe('session-expired handling with the real Metrics path', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetCsrfToken()
    vi.mocked(Config.isBffEnabled).mockResolvedValue(true)
    vi.mocked(Config.getApiUrl).mockResolvedValue('/duos-api')
    vi.mocked(Config.getBardApiUrl).mockResolvedValue('https://bard.example.org')
    vi.mocked(Token.getToken).mockReturnValue(undefined)
    // A registered user: this is what makes the metric identified, so it
    // rides /bard-api instead of the cross-origin (token-free) Bard URL.
    vi.mocked(Storage.userIsLogged).mockReturnValue(true)
    vi.mocked(Storage.getCurrentUser).mockReturnValue({ userId: 42 } as ReturnType<typeof Storage.getCurrentUser>)
    vi.mocked(Storage.getAnonymousId).mockReturnValue('anon-id')
    vi.mocked(Storage.getOidcUser).mockReturnValue({} as ReturnType<typeof Storage.getOidcUser>)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    resetCsrfToken()
  })

  it('redirects once and stops when the token fetch for a write answers 401', async () => {
    const { state, fetchMock } = makeDeadSessionBff()
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchPost('/duos-api/api/dataset', { name: 'two' }))
      .rejects.toMatchObject({ response: { status: 401 } })

    expect(redirectOnLogout).toHaveBeenCalledOnce()
    expect(state.apiCalls).toBe(0) // the write itself never went out
    // One token fetch for the write, one for the metric that the handler
    // then tries to send. The metric dies at its token fetch, so it never
    // reaches /bard-api — and it never starts a third round.
    expect(state.tokenFetches).toBe(2)
    expect(state.metricPosts).toBe(0)
  })

  it('redirects once and stops when a DUOS API 401 meets a cold token cache', async () => {
    const { state, fetchMock } = makeDeadSessionBff(401)
    vi.stubGlobal('fetch', fetchMock)

    // A GET needs no token of its own, so the FIRST token fetch here is the
    // metric's. Its 401 lands back in the handler that sent it.
    await expect(fetchGet('/duos-api/api/dataset/1'))
      .rejects.toMatchObject({ response: { status: 401 } })

    expect(redirectOnLogout).toHaveBeenCalledOnce()
    expect(state.apiCalls).toBe(1)
    expect(state.tokenFetches).toBe(1)
    expect(state.metricPosts).toBe(0)
  })

  // The guard must not become a one-shot latch: it clears when the handler
  // finishes, so a page that has not navigated yet still records the next one.
  it('records again after the first handler finishes', async () => {
    const { state, fetchMock } = makeDeadSessionBff()
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchPost('/duos-api/api/dataset', { name: 'one' })).rejects.toThrow()
    const afterFirst = state.tokenFetches

    await expect(fetchPost('/duos-api/api/dataset', { name: 'two' })).rejects.toThrow()

    expect(redirectOnLogout).toHaveBeenCalledTimes(2)
    expect(state.tokenFetches).toBeGreaterThan(afterFirst)
  })
})
