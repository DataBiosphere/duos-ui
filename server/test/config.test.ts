import { describe, it, expect, vi, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import Fastify from 'fastify'
import { configPath, defaultBannersUrl, readConfig, showcaseHandoffsEnabled, resetConfigCache, TRUST_PROXY_ENV_VAR, trustedProxies } from '../src/config.js'

describe('configPath', () => {
  afterEach(() => {
    delete process.env.CONFIG_PATH
  })

  it('points at public/config.json in dev', () => {
    expect(configPath('/app', true)).toBe(path.join('/app', 'public', 'config.json'))
  })

  it('points at build/config.json outside dev', () => {
    expect(configPath('/app', false)).toBe(path.join('/app', 'build', 'config.json'))
  })

  it('is overridden by CONFIG_PATH regardless of isDev', () => {
    process.env.CONFIG_PATH = '/custom/config.json'
    expect(configPath('/app', true)).toBe('/custom/config.json')
  })
})

describe('readConfig', () => {
  let dir: string
  const log = { error: vi.fn() }

  afterEach(() => {
    delete process.env.DUOS_API_URL
    delete process.env.DUOS_SHOWCASE_API_URL
    resetConfigCache()
    log.error.mockClear()
    // Guarded: rmSync(undefined) throws and would mask the real failure of a
    // test that died before mkdtempSync assigned dir.
    if (dir) rmSync(dir, { recursive: true, force: true })
  })

  function writeFixture(config: Record<string, unknown>): string {
    dir = mkdtempSync(path.join(tmpdir(), 'duos-client-config-'))
    const file = path.join(dir, 'config.json')
    writeFileSync(file, JSON.stringify(config))
    return file
  }

  const DEV_BANNERS_URL = 'https://storage.googleapis.com/duos-banners-dev/dev_notifications.json'

  it('returns the static file with only bannersUrl added when DUOS_API_URL is not set', async () => {
    const file = writeFixture({ apiUrl: 'https://consent.dsde-dev.broadinstitute.org', env: 'dev' })
    expect(await readConfig(file, log)).toEqual({
      apiUrl: 'https://consent.dsde-dev.broadinstitute.org',
      env: 'dev',
      bannersUrl: DEV_BANNERS_URL,
      showcaseHandoffsEnabled: false,
    })
  })

  it('overrides apiUrl with DUOS_API_URL, leaving other fields untouched', async () => {
    const file = writeFixture({ apiUrl: 'https://consent.dsde-dev.broadinstitute.org', env: 'dev' })
    process.env.DUOS_API_URL = 'https://local.dsde-dev.broadinstitute.org:27443'
    expect(await readConfig(file, log)).toEqual({
      apiUrl: 'https://local.dsde-dev.broadinstitute.org:27443',
      env: 'dev',
      bannersUrl: DEV_BANNERS_URL,
      showcaseHandoffsEnabled: false,
    })
  })

  it('derives showcaseHandoffsEnabled from the URLs, and ignores a value in the file', async () => {
    const file = writeFixture({ apiUrl: 'https://consent.dsde-dev.broadinstitute.org', showcaseApiUrl: 'https://consent.dsde-prod.broadinstitute.org', showcaseHandoffsEnabled: true })
    expect((await readConfig(file, log)).showcaseHandoffsEnabled).toBe(false)
  })

  it('derives showcaseHandoffsEnabled after DUOS_API_URL replaces apiUrl', async () => {
    const file = writeFixture({ apiUrl: 'https://consent.dsde-dev.broadinstitute.org', showcaseApiUrl: 'https://local.dsde-dev.broadinstitute.org:27443' })
    process.env.DUOS_API_URL = 'https://local.dsde-dev.broadinstitute.org:27443'
    expect((await readConfig(file, log)).showcaseHandoffsEnabled).toBe(true)
  })

  it('keeps a bannersUrl the file names, so the feed can move without a code change', async () => {
    const custom = 'https://storage.googleapis.com/some-other-bucket/dev_notifications.json'
    const file = writeFixture({ env: 'dev', bannersUrl: custom })
    expect((await readConfig(file, log)).bannersUrl).toBe(custom)
  })

  it('treats a blank bannersUrl, as base_config.json ships, as unset', async () => {
    const file = writeFixture({ env: 'staging', bannersUrl: '' })
    expect((await readConfig(file, log)).bannersUrl).toBe('https://storage.googleapis.com/duos-banners-staging/staging_notifications.json')
  })

  it('leaves bannersUrl unset when env is missing too', async () => {
    const file = writeFixture({ apiUrl: 'https://consent.dsde-dev.broadinstitute.org' })
    expect(await readConfig(file, log)).not.toHaveProperty('bannersUrl')
  })

  it('logs and rethrows on a missing file, without caching the failure', async () => {
    const file = writeFixture({ env: 'dev' })
    const missing = path.join(dir, 'nope.json')
    await expect(readConfig(missing, log)).rejects.toThrow()
    expect(log.error).toHaveBeenCalledTimes(1)

    // The failure must not poison the cache: a subsequent read of a good path succeeds.
    expect(await readConfig(file, log)).toEqual({ env: 'dev', bannersUrl: DEV_BANNERS_URL, showcaseHandoffsEnabled: false })
  })
})

describe('defaultBannersUrl', () => {
  it.each([
    ['dev', 'https://storage.googleapis.com/duos-banners-dev/dev_notifications.json'],
    ['staging', 'https://storage.googleapis.com/duos-banners-staging/staging_notifications.json'],
    ['prod', 'https://storage.googleapis.com/duos-banners-prod/prod_notifications.json'],
  ])('names the %s bucket in that environment\'s Terra project', (env, expected) => {
    expect(defaultBannersUrl(env)).toBe(expected)
  })

  it('points a local dev server at the dev feed', () => {
    expect(defaultBannersUrl('local')).toBe('https://storage.googleapis.com/duos-banners-dev/dev_notifications.json')
  })

  it.each([
    ['a blank env', ''],
    ['whitespace', '  '],
    ['a non-string', 7],
    ['an unset env', undefined],
  ])('returns undefined for %s', (_label, env) => {
    expect(defaultBannersUrl(env)).toBeUndefined()
  })
})

describe('trustedProxies', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('trusts only the loopback sidecar by default', () => {
    expect(trustedProxies()).toEqual(['loopback'])
  })

  it.each(['', '  '])('falls back to loopback when the variable is %j', (value) => {
    vi.stubEnv(TRUST_PROXY_ENV_VAR, value)
    expect(trustedProxies()).toEqual(['loopback'])
  })

  it('reads a comma-separated list for docker-compose', () => {
    vi.stubEnv(TRUST_PROXY_ENV_VAR, 'loopback, uniquelocal')
    expect(trustedProxies()).toEqual(['loopback', 'uniquelocal'])
  })

  it.each(['true', '1', '10.0.0.0/8', 'loopback,,uniquelocal'])('fails startup on %j', (value) => {
    vi.stubEnv(TRUST_PROXY_ENV_VAR, value)
    expect(() => trustedProxies()).toThrow(TRUST_PROXY_ENV_VAR)
  })

  // What the value means once Fastify has it: the sidecar's forwarded
  // protocol keeps the session cookie working, and a pod that calls the app
  // port directly cannot pick its own address (DT-4381).
  describe('as Fastify trustProxy', () => {
    async function probe(remoteAddress: string) {
      const app = Fastify({ trustProxy: trustedProxies() })
      app.get('/', async request => ({ ip: request.ip, protocol: request.protocol }))
      const response = await app.inject({
        url: '/',
        remoteAddress,
        headers: { 'x-forwarded-for': '198.51.100.7', 'x-forwarded-proto': 'https' },
      })
      await app.close()
      return response.json() as { ip: string, protocol: string }
    }

    it('honors X-Forwarded-* from the loopback sidecar', async () => {
      expect(await probe('127.0.0.1')).toEqual({ ip: '198.51.100.7', protocol: 'https' })
    })

    it('ignores X-Forwarded-* from a pod that calls the app port directly', async () => {
      expect(await probe('10.64.4.18')).toEqual({ ip: '10.64.4.18', protocol: 'http' })
    })

    it('honors X-Forwarded-* from an RFC1918 proxy when docker-compose opts in', async () => {
      vi.stubEnv(TRUST_PROXY_ENV_VAR, 'loopback,uniquelocal')
      expect(await probe('172.18.0.3')).toEqual({ ip: '198.51.100.7', protocol: 'https' })
    })
  })
})

describe('showcaseHandoffsEnabled', () => {
  const DEV = 'https://consent.dsde-dev.broadinstitute.org'
  const PROD = 'https://consent.dsde-prod.broadinstitute.org'

  afterEach(() => {
    delete process.env.DUOS_SHOWCASE_API_URL
  })

  it.each([
    ['the same origin', DEV, DEV, true],
    ['the same origin with a path on apiUrl', DEV, `${DEV}/api`, true],
    ['a production lookup in a dev preview', PROD, DEV, false],
    ['no lookup URL', undefined, DEV, false],
    ['a lookup URL that is not a URL', 'consent', DEV, false],
    ['a non-http lookup URL', 'ftp://consent.dsde-dev.broadinstitute.org', DEV, false],
    ['no apiUrl', DEV, undefined, false],
  ])('in legacy mode, compares showcaseApiUrl with apiUrl: %s', (_label, showcaseApiUrl, apiUrl, expected) => {
    expect(showcaseHandoffsEnabled({ bffEnabled: false, showcaseApiUrl, apiUrl })).toBe(expected)
  })

  it('in BFF mode, compares DUOS_SHOWCASE_API_URL with apiUrl and ignores showcaseApiUrl', () => {
    process.env.DUOS_SHOWCASE_API_URL = DEV
    expect(showcaseHandoffsEnabled({ bffEnabled: true, showcaseApiUrl: PROD, apiUrl: DEV })).toBe(true)
    process.env.DUOS_SHOWCASE_API_URL = PROD
    expect(showcaseHandoffsEnabled({ bffEnabled: true, showcaseApiUrl: DEV, apiUrl: DEV })).toBe(false)
  })

  it('in BFF mode, turns handoffs off when DUOS_SHOWCASE_API_URL is not set', () => {
    expect(showcaseHandoffsEnabled({ bffEnabled: true, showcaseApiUrl: DEV, apiUrl: DEV })).toBe(false)
  })
})
