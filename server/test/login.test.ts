import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { Configuration } from 'openid-client'
import { handleLogin, safeReturnTo } from '../src/auth/login.js'

// Mock getOidcConfig()/pkce (network + randomness) but keep the real
// requireEnv() so its env-var validation is exercised for real.
vi.mock('../src/auth/oidcClient.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/auth/oidcClient.js')>()
  return {
    ...actual,
    getOidcConfig: vi.fn(),
    pkce: { verifier: vi.fn(), challenge: vi.fn(), state: vi.fn() },
  }
})

vi.mock('openid-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('openid-client')>()
  return { ...actual, buildAuthorizationUrl: vi.fn() }
})

describe('safeReturnTo', () => {
  it('returns a legitimate same-origin path unchanged, including query and hash', () => {
    expect(safeReturnTo('/datalibrary?filter=x#top')).toBe('/datalibrary?filter=x#top')
  })

  it('re-serializes ../ segments through URL parsing', () => {
    expect(safeReturnTo('/a/../b')).toBe('/b')
  })

  it.each([
    ['https://evil.com', 'absolute URL'],
    ['//evil.com', 'protocol-relative'],
    ['/\\evil.com', 'backslash treated as slash by WHATWG URL parsing'],
    ['relative/path', 'missing leading slash'],
    [undefined, 'not a string'],
    [42, 'not a string'],
  ])('falls back to / for %s (%s)', (value, _description) => {
    expect(safeReturnTo(value)).toBe('/')
  })
})

describe('handleLogin', () => {
  const fakeConfig = {} as Configuration
  const AZURE_ENV = {
    DUOS_OAUTH_REDIRECT_URI: 'https://local.dsde-dev.broadinstitute.org:3000/auth/callback',
    DUOS_AZURE_CLIENT_ID: 'test-client-id',
  }

  function makeRequest(query: Record<string, unknown> = {}): FastifyRequest {
    return { session: { save: vi.fn().mockResolvedValue(undefined) }, query } as unknown as FastifyRequest
  }

  function makeReply(): FastifyReply & { send: ReturnType<typeof vi.fn> } {
    return { send: vi.fn() } as unknown as FastifyReply & { send: ReturnType<typeof vi.fn> }
  }

  beforeEach(async () => {
    Object.assign(process.env, AZURE_ENV)

    const oidcClient = await import('../src/auth/oidcClient.js')
    vi.mocked(oidcClient.getOidcConfig).mockReset().mockResolvedValue(fakeConfig)
    vi.mocked(oidcClient.pkce.verifier).mockReset().mockReturnValue('test-verifier')
    vi.mocked(oidcClient.pkce.challenge).mockReset().mockResolvedValue('test-challenge')
    vi.mocked(oidcClient.pkce.state).mockReset().mockReturnValue('test-state')

    const oidc = await import('openid-client')
    vi.mocked(oidc.buildAuthorizationUrl).mockReset()
      .mockReturnValue(new URL('https://duosdev.b2clogin.com/authorize?foo=bar'))
  })

  afterEach(() => {
    for (const key of Object.keys(AZURE_ENV)) delete process.env[key]
  })

  it('stores the PKCE verifier, state, and sanitized returnTo in the session', async () => {
    const request = makeRequest({ returnTo: '/datalibrary' })

    await handleLogin(request, makeReply())

    expect(request.session.pkceVerifier).toBe('test-verifier')
    expect(request.session.pkceState).toBe('test-state')
    expect(request.session.returnTo).toBe('/datalibrary')
  })

  it('defaults returnTo to / when the query param is an open-redirect attempt', async () => {
    const request = makeRequest({ returnTo: 'https://evil.com' })

    await handleLogin(request, makeReply())

    expect(request.session.returnTo).toBe('/')
  })

  it('builds the authorization URL with the configured redirect_uri, B2C scope quirk, S256 PKCE params, and a forced login prompt', async () => {
    await handleLogin(makeRequest(), makeReply())

    const oidc = await import('openid-client')
    expect(oidc.buildAuthorizationUrl).toHaveBeenCalledWith(fakeConfig, {
      redirect_uri: AZURE_ENV.DUOS_OAUTH_REDIRECT_URI,
      scope: `openid email profile offline_access ${AZURE_ENV.DUOS_AZURE_CLIENT_ID}`,
      code_challenge: 'test-challenge',
      code_challenge_method: 'S256',
      state: 'test-state',
      // prompt=login forces the B2C login screen even when B2C's own SSO
      // cookie survives a DUOS sign-out (front-channel logout is epic-5, 5-I).
      prompt: 'login',
    })

    const oidcClient = await import('../src/auth/oidcClient.js')
    expect(oidcClient.pkce.challenge).toHaveBeenCalledWith('test-verifier')
  })

  it('sends the authorization URL as { redirectUrl }', async () => {
    const reply = makeReply()

    await handleLogin(makeRequest(), reply)

    expect(reply.send).toHaveBeenCalledWith({ redirectUrl: 'https://duosdev.b2clogin.com/authorize?foo=bar' })
  })

  it('persists the session before responding (guards the double-send race that made login flaky)', async () => {
    const request = makeRequest()
    const reply = makeReply()

    await handleLogin(request, reply)

    // Saving before reply.send makes @fastify/session's onSend save synchronous,
    // so Fastify does not fire a second reply.send(). See callback.ts for the
    // full ERR_HTTP_HEADERS_SENT explanation.
    const save = vi.mocked(request.session.save as () => Promise<void>)
    expect(save).toHaveBeenCalled()
    expect(save.mock.invocationCallOrder[0]).toBeLessThan(reply.send.mock.invocationCallOrder[0])
  })

  it.each(['DUOS_OAUTH_REDIRECT_URI', 'DUOS_AZURE_CLIENT_ID'])(
    'rejects with an error naming %s when it is unset',
    async (name) => {
      delete process.env[name]

      await expect(handleLogin(makeRequest(), makeReply())).rejects.toThrow(name)
    },
  )
})
