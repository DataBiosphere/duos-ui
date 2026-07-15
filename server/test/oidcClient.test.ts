import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createHash } from 'node:crypto'
import type { Configuration } from 'openid-client'
import { getOidcConfig, pkce, resetOidcCache } from '../src/auth/oidcClient.js'

// Mock only discovery() — it performs a real network fetch of the B2C
// discovery document. The PKCE helpers below are exercised for real.
vi.mock('openid-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('openid-client')>()
  return { ...actual, discovery: vi.fn() }
})

const AZURE_ENV = {
  DUOS_AZURE_ISSUER_URL: 'https://duosdev.b2clogin.com/duosdev.onmicrosoft.com/v2.0/.well-known/openid-configuration?p=b2c_1a_signup_signin',
  DUOS_AZURE_CLIENT_ID: 'test-client-id',
  DUOS_AZURE_CLIENT_SECRET: 'test-client-secret',
}

describe('getOidcConfig', () => {
  const fakeConfig = {} as Configuration
  let discovery: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    Object.assign(process.env, AZURE_ENV)
    resetOidcCache()
    const oidc = await import('openid-client')
    discovery = vi.mocked(oidc.discovery)
    discovery.mockReset()
    discovery.mockResolvedValue(fakeConfig)
  })

  afterEach(() => {
    for (const key of Object.keys(AZURE_ENV)) delete process.env[key]
  })

  it('discovers the B2C issuer with the configured URL, client id, and secret', async () => {
    await getOidcConfig()

    expect(discovery).toHaveBeenCalledTimes(1)
    const [url, clientId, clientSecret] = discovery.mock.calls[0]
    expect(url).toBeInstanceOf(URL)
    // The full discovery-document URL must survive untouched — deriving a
    // .well-known path from it would mangle the ?p=<policy> query string.
    expect((url as URL).href).toBe(AZURE_ENV.DUOS_AZURE_ISSUER_URL)
    expect(clientId).toBe('test-client-id')
    expect(clientSecret).toBe('test-client-secret')
  })

  it('returns the cached configuration on repeated calls without re-discovering', async () => {
    const first = await getOidcConfig()
    const second = await getOidcConfig()

    expect(first).toBe(fakeConfig)
    expect(second).toBe(first)
    expect(discovery).toHaveBeenCalledTimes(1)
  })

  it('does not cache a failed discovery — the next call retries and can succeed', async () => {
    discovery.mockRejectedValueOnce(new Error('B2C unreachable'))

    await expect(getOidcConfig()).rejects.toThrow('B2C unreachable')
    await expect(getOidcConfig()).resolves.toBe(fakeConfig)
    expect(discovery).toHaveBeenCalledTimes(2)
  })

  it.each(Object.keys(AZURE_ENV))('rejects with an error naming %s when it is unset', async (name) => {
    delete process.env[name]

    await expect(getOidcConfig()).rejects.toThrow(name)
    expect(discovery).not.toHaveBeenCalled()
  })
})

describe('pkce helpers', () => {
  it('verifier() returns a 43-character base64url string (32 bytes of entropy per RFC 7636)', () => {
    const verifier = pkce.verifier()
    expect(verifier).toMatch(/^[A-Za-z0-9_-]{43}$/)
  })

  it('verifier() returns a fresh value on every call', () => {
    expect(pkce.verifier()).not.toBe(pkce.verifier())
  })

  it('challenge() produces the S256 challenge for the given verifier', async () => {
    const verifier = pkce.verifier()
    const expected = createHash('sha256').update(verifier).digest('base64url')
    await expect(pkce.challenge(verifier)).resolves.toBe(expected)
  })

  it('state() returns a non-empty url-safe string, fresh on every call', () => {
    const state = pkce.state()
    expect(state).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(pkce.state()).not.toBe(state)
  })
})
