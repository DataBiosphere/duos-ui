import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest'
import { Config, getEnv, getApiUrl, getBannersUrl, getBardApiUrl, getEcmApiUrl, getECMUrl, getHash, getProject, getTag, getTdrApiUrl, getTerraUrl, getUpstreamApiUrl, isBffEnabled, isShowcaseEnabled, isShowcaseHandoffsEnabled, isShowcaseHiddenPreviewEnabled, Token, authOpts, jsonBody, multiPartOpts, textPlain } from 'src/libs/config'
import { Storage } from 'src/libs/storage'

const mockConfig = {
  env: 'test',
  apiUrl: 'https://test.api.com',
  bannersUrl: 'https://test.banners.com/test_notifications.json',
  bardApiUrl: 'https://test.bard.com',
  ecmApiUrl: 'https://test.ecm.com',
  hash: 'test-hash-123',
  tag: 'v1.0.0-test',
  tdrApiUrl: 'https://test.tdr.com',
  terraUrl: 'https://test.terra.bio',
}

const stubConfigFetch = (config: Record<string, unknown>) =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: () => Promise.resolve(config) }))

// configPromise is module-level and caches after the first fetch — mock fetch once for all tests
beforeAll(() => {
  stubConfigFetch(mockConfig)
})

afterEach(() => {
  vi.restoreAllMocks()
  // Individual tests override the fetch stub (e.g. with bffEnabled: true);
  // restore the baseline so test execution order never matters
  stubConfigFetch(mockConfig)
})

afterAll(() => {
  vi.unstubAllGlobals()
})

describe('Config', () => {
  describe('Config instance', () => {
    it('should be an object instance', () => {
      expect(Config).toBeTypeOf('object')
    })

    it('should get full config', async () => {
      expect(await Config.getConfig()).toEqual(mockConfig)
    })

    it.each([
      ['getEnv', 'test'],
      ['getApiUrl', 'https://test.api.com'],
      ['getBannersUrl', 'https://test.banners.com/test_notifications.json'],
      ['getBardApiUrl', 'https://test.bard.com'],
      ['getEcmApiUrl', 'https://test.ecm.com'],
      ['getECMUrl', 'https://test.ecm.com'],
      ['getHash', 'test-hash-123'],
      ['getProject', 'broad-duos-test'],
      ['getTag', 'v1.0.0-test'],
      ['getTdrApiUrl', 'https://test.tdr.com'],
      ['getTerraUrl', 'https://test.terra.bio'],
      ['getUpstreamApiUrl', 'https://test.api.com'],
      // bffEnabled is absent from mockConfig — the fail-safe default is false
      ['isBffEnabled', false],
      ['isShowcaseEnabled', false],
      ['isShowcaseHandoffsEnabled', false],
    ] as const)('should get %s', async (method, expected) => {
      // oxlint-disable-next-line @typescript-eslint/no-explicit-any
      expect(await (Config[method] as any)()).toBe(expected)
    })
  })

  describe('Exported functions', () => {
    it.each([
      ['getEnv', getEnv, 'test'],
      ['getApiUrl', getApiUrl, 'https://test.api.com'],
      ['getBannersUrl', getBannersUrl, 'https://test.banners.com/test_notifications.json'],
      ['getBardApiUrl', getBardApiUrl, 'https://test.bard.com'],
      ['getEcmApiUrl', getEcmApiUrl, 'https://test.ecm.com'],
      ['getECMUrl', getECMUrl, 'https://test.ecm.com'],
      ['getHash', getHash, 'test-hash-123'],
      ['getProject', getProject, 'broad-duos-test'],
      ['getTag', getTag, 'v1.0.0-test'],
      ['getTdrApiUrl', getTdrApiUrl, 'https://test.tdr.com'],
      ['getTerraUrl', getTerraUrl, 'https://test.terra.bio'],
      ['getUpstreamApiUrl', getUpstreamApiUrl, 'https://test.api.com'],
      ['isBffEnabled', isBffEnabled, false],
      // showcaseEnabled is absent from mockConfig: the showcase pages stay off
      ['isShowcaseEnabled', isShowcaseEnabled, false],
      // showcaseHandoffsEnabled is absent from mockConfig: every showcase handoff stays off
      ['isShowcaseHandoffsEnabled', isShowcaseHandoffsEnabled, false],
      // env is 'test' in mockConfig, which is not a non-production preview environment
      ['isShowcaseHiddenPreviewEnabled', isShowcaseHiddenPreviewEnabled, false],
    ] as const)('%s should return correct value', async (_name, fn, expected) => {
      expect(await fn()).toBe(expected)
    })
  })

  describe('isBffEnabled', () => {
    it('returns true only when config.json sets bffEnabled to true', async () => {
      vi.resetModules()
      stubConfigFetch({ ...mockConfig, bffEnabled: true })
      const freshConfig = await import('src/libs/config')
      expect(await freshConfig.isBffEnabled()).toBe(true)
    })
  })

  describe('isShowcaseHiddenPreviewEnabled', () => {
    it.each([
      ['local', true],
      ['dev', true],
      ['staging', true],
      ['prod', false],
      ['alpha', false],
      ['', false],
      ['Dev', false],
      [undefined, false],
      [null, false],
      [['dev'], false],
    ])('returns env %j as %j, so only a non-production environment previews hidden showcases', async (env, expected) => {
      vi.resetModules()
      stubConfigFetch({ ...mockConfig, env })
      const freshConfig = await import('src/libs/config')
      expect(await freshConfig.isShowcaseHiddenPreviewEnabled()).toBe(expected)
    })
  })

  describe('isShowcaseEnabled', () => {
    it.each([
      [true, true],
      [false, false],
      ['true', false],
      [1, false],
    ])('returns %j as %j, so only a boolean true turns the showcase pages on', async (showcaseEnabled, expected) => {
      vi.resetModules()
      stubConfigFetch({ ...mockConfig, showcaseEnabled })
      const freshConfig = await import('src/libs/config')
      expect(await freshConfig.isShowcaseEnabled()).toBe(expected)
      expect(await freshConfig.Config.isShowcaseEnabled()).toBe(expected)
    })
  })

  describe('isShowcaseHandoffsEnabled', () => {
    it.each([
      [true, true],
      [false, false],
      ['true', false],
      [1, false],
    ])('returns %j as %j, so only a boolean true opens showcase handoffs', async (showcaseHandoffsEnabled, expected) => {
      vi.resetModules()
      // The lookup reads this environment's Consent, so the flag alone decides (see the legacy cases below).
      stubConfigFetch({ ...mockConfig, showcaseApiUrl: mockConfig.apiUrl, showcaseHandoffsEnabled })
      const freshConfig = await import('src/libs/config')
      expect(await freshConfig.isShowcaseHandoffsEnabled()).toBe(expected)
      expect(await freshConfig.Config.isShowcaseHandoffsEnabled()).toBe(expected)
    })
  })

  describe('isShowcaseHandoffsEnabled in legacy mode (DT-4358)', () => {
    // A config.json copied from a deployed environment says `true`; `pnpm start` serves it as it is.
    const DEV = 'https://consent.dsde-dev.broadinstitute.org'
    const PROD = 'https://consent.dsde-prod.broadinstitute.org'

    it.each([
      ['the lookup reads this environment\'s Consent', DEV, DEV, true],
      ['apiUrl has a path on the same origin', DEV, `${DEV}/api`, true],
      ['the lookup reads production', PROD, DEV, false],
      ['no lookup URL is configured', undefined, DEV, false],
      ['the lookup URL is not a URL', 'consent.dsde-dev', DEV, false],
      ['the lookup URL is not http(s)', 'ftp://consent.dsde-dev.broadinstitute.org', DEV, false],
      ['the lookup URL is not a string', ['https://consent.dsde-dev.broadinstitute.org'], DEV, false],
    ])('opens handoffs only when %s', async (_label, showcaseApiUrl, apiUrl, expected) => {
      vi.resetModules()
      stubConfigFetch({ ...mockConfig, apiUrl, showcaseApiUrl, showcaseHandoffsEnabled: true })
      const freshConfig = await import('src/libs/config')
      expect(await freshConfig.isShowcaseHandoffsEnabled()).toBe(expected)
    })

    it('keeps handoffs off when the file says so, even with matching URLs', async () => {
      vi.resetModules()
      stubConfigFetch({ ...mockConfig, apiUrl: DEV, showcaseApiUrl: DEV, showcaseHandoffsEnabled: false })
      const freshConfig = await import('src/libs/config')
      expect(await freshConfig.isShowcaseHandoffsEnabled()).toBe(false)
    })

    it('takes the served value in BFF mode, where the server derived it', async () => {
      vi.resetModules()
      stubConfigFetch({ ...mockConfig, bffEnabled: true, apiUrl: DEV, showcaseApiUrl: PROD, showcaseHandoffsEnabled: true })
      const freshConfig = await import('src/libs/config')
      expect(await freshConfig.isShowcaseHandoffsEnabled()).toBe(true)
    })
  })

  describe('getBannersUrl', () => {
    it('returns an empty string when config.json names no banner feed', async () => {
      vi.resetModules()
      const { bannersUrl: _omitted, ...withoutBanners } = mockConfig
      stubConfigFetch(withoutBanners)
      const freshConfig = await import('src/libs/config')
      expect(await freshConfig.getBannersUrl()).toBe('')
    })
  })

  describe('API URLs under the BFF cutover', () => {
    it('returns the relative proxy prefixes when bffEnabled', async () => {
      vi.resetModules()
      stubConfigFetch({ ...mockConfig, bffEnabled: true })
      const freshConfig = await import('src/libs/config')
      expect(await freshConfig.getApiUrl()).toBe('/duos-api')
      expect(await freshConfig.getEcmApiUrl()).toBe('/ecm-api')
      expect(await freshConfig.getECMUrl()).toBe('/ecm-api')
      expect(await freshConfig.getTdrApiUrl()).toBe('/tdr-api')
      // The un-proxied getters stay absolute: /feature is called pre-login,
      // and anonymous Bard events carry no credentials to protect
      expect(await freshConfig.getUpstreamApiUrl()).toBe('https://test.api.com')
      expect(await freshConfig.getBardApiUrl()).toBe('https://test.bard.com')
    })
  })

  describe('Token', () => {
    it('should prefer idp_access_token from profile when available', () => {
      const idpToken = 'idp-access-token-123'
      vi.spyOn(Storage, 'getOidcUser').mockReturnValue({ profile: { idp_access_token: idpToken }, id_token: 'fallback-token' } as ReturnType<typeof Storage.getOidcUser>)
      expect(Token.getToken()).toBe(idpToken)
    })

    it('should fall back to id_token when idp_access_token is not available', () => {
      const mockToken = 'test-token-123'
      vi.spyOn(Storage, 'getOidcUser').mockReturnValue({ profile: {}, id_token: mockToken } as ReturnType<typeof Storage.getOidcUser>)
      expect(Token.getToken()).toBe(mockToken)
    })

    it('should fall back to id_token when profile is not present', () => {
      const mockToken = 'test-token-123'
      vi.spyOn(Storage, 'getOidcUser').mockReturnValue({ id_token: mockToken } as ReturnType<typeof Storage.getOidcUser>)
      expect(Token.getToken()).toBe(mockToken)
    })

    it('should return undefined when no token is available', () => {
      vi.spyOn(Storage, 'getOidcUser').mockReturnValue(null as unknown as ReturnType<typeof Storage.getOidcUser>)
      expect(Token.getToken()).toBeUndefined()
    })
  })

  describe('authOpts', () => {
    it('should create auth options with provided token', () => {
      const token = 'custom-token'
      expect(authOpts(token)).toEqual({
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'X-App-ID': 'DUOS',
        },
      })
    })

    it('should create auth options with idp_access_token from storage if not provided', () => {
      const mockToken = 'idp-access-token'
      vi.spyOn(Storage, 'getOidcUser').mockReturnValue({ profile: { idp_access_token: mockToken }, id_token: 'fallback-token' } as ReturnType<typeof Storage.getOidcUser>)
      const opts = authOpts()
      expect(opts.headers['Authorization']).toBe(`Bearer ${mockToken}`)
      expect(opts.headers['Accept']).toBe('application/json')
      expect(opts.headers['X-App-ID']).toBe('DUOS')
    })

    it('should create auth options with id_token from storage when idp_access_token is not present', () => {
      const mockToken = 'storage-token'
      vi.spyOn(Storage, 'getOidcUser').mockReturnValue({ id_token: mockToken } as ReturnType<typeof Storage.getOidcUser>)
      const opts = authOpts()
      expect(opts.headers['Authorization']).toBe(`Bearer ${mockToken}`)
      expect(opts.headers['Accept']).toBe('application/json')
      expect(opts.headers['X-App-ID']).toBe('DUOS')
    })
  })

  describe('jsonBody', () => {
    it('should create JSON body options with simple object', () => {
      const body = { key: 'value', number: 42 }
      expect(jsonBody(body)).toEqual({
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      })
    })

    it('should create JSON body options with complex object', () => {
      const body = { nested: { data: 'value' }, array: [1, 2, 3], boolean: true }
      const opts = jsonBody(body)
      expect(opts.body).toBe(JSON.stringify(body))
      expect(opts.headers['Content-Type']).toBe('application/json')
    })

    it('should handle null body', () => {
      const opts = jsonBody(null)
      expect(opts.body).toBe('null')
      expect(opts.headers['Content-Type']).toBe('application/json')
    })
  })

  describe('multiPartOpts', () => {
    it('should create multipart options with provided token', () => {
      const token = 'custom-token'
      expect(multiPartOpts(token)).toEqual({
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
          'X-App-ID': 'DUOS',
        },
      })
    })

    it('should create multipart options with idp_access_token from storage if not provided', () => {
      const mockToken = 'idp-access-token'
      vi.spyOn(Storage, 'getOidcUser').mockReturnValue({ profile: { idp_access_token: mockToken }, id_token: 'fallback-token' } as ReturnType<typeof Storage.getOidcUser>)
      const opts = multiPartOpts()
      expect(opts.headers['Authorization']).toBe(`Bearer ${mockToken}`)
      expect(opts.headers['Content-Type']).toBe('multipart/form-data')
      expect(opts.headers['X-App-ID']).toBe('DUOS')
    })

    it('should create multipart options with id_token from storage when idp_access_token is not present', () => {
      const mockToken = 'storage-token'
      vi.spyOn(Storage, 'getOidcUser').mockReturnValue({ id_token: mockToken } as ReturnType<typeof Storage.getOidcUser>)
      const opts = multiPartOpts()
      expect(opts.headers['Authorization']).toBe(`Bearer ${mockToken}`)
      expect(opts.headers['Content-Type']).toBe('multipart/form-data')
      expect(opts.headers['X-App-ID']).toBe('DUOS')
    })
  })

  describe('textPlain', () => {
    it('should create text/plain options', () => {
      expect(textPlain()).toEqual({
        headers: {
          'Accept': 'text/plain',
          'X-App-ID': 'DUOS',
        },
      })
    })
  })

  describe('Config instance method wrappers', () => {
    it('authOpts method should call authOpts function', () => {
      const token = 'test-token'
      expect(Config.authOpts(token).headers['Authorization']).toBe(`Bearer ${token}`)
    })

    it('jsonBody method should call jsonBody function', () => {
      const body = { test: 'data' }
      const opts = Config.jsonBody(body)
      expect(opts.body).toBe(JSON.stringify(body))
      expect(opts.headers['Content-Type']).toBe('application/json')
    })

    it('multiPartOpts method should call multiPartOpts function', () => {
      const token = 'test-token'
      expect(Config.multiPartOpts(token).headers['Content-Type']).toBe('multipart/form-data')
    })

    it('textPlain method should call textPlain function', () => {
      expect(Config.textPlain().headers['Accept']).toBe('text/plain')
    })
  })
})
