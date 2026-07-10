import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest'
import { Config, getEnv, getApiUrl, getBardApiUrl, getEcmApiUrl, getECMUrl, getHash, getProject, getTag, getTdrApiUrl, getTerraUrl, Token, authOpts, jsonBody, multiPartOpts, textPlain } from 'src/libs/config'
import { Storage } from 'src/libs/storage'

const mockConfig = {
  env: 'test',
  apiUrl: 'https://test.api.com',
  bardApiUrl: 'https://test.bard.com',
  ecmApiUrl: 'https://test.ecm.com',
  hash: 'test-hash-123',
  tag: 'v1.0.0-test',
  tdrApiUrl: 'https://test.tdr.com',
  terraUrl: 'https://test.terra.bio',
}

// configPromise is module-level and caches after the first fetch — mock fetch once for all tests
beforeAll(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: () => Promise.resolve(mockConfig) }))
})

afterEach(() => {
  vi.restoreAllMocks()
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
      ['getBardApiUrl', 'https://test.bard.com'],
      ['getEcmApiUrl', 'https://test.ecm.com'],
      ['getECMUrl', 'https://test.ecm.com'],
      ['getHash', 'test-hash-123'],
      ['getProject', 'broad-duos-test'],
      ['getTag', 'v1.0.0-test'],
      ['getTdrApiUrl', 'https://test.tdr.com'],
      ['getTerraUrl', 'https://test.terra.bio'],
    ] as const)('should get %s', async (method, expected) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(await (Config[method] as any)()).toBe(expected)
    })
  })

  describe('Exported functions', () => {
    it.each([
      ['getEnv', getEnv, 'test'],
      ['getApiUrl', getApiUrl, 'https://test.api.com'],
      ['getBardApiUrl', getBardApiUrl, 'https://test.bard.com'],
      ['getEcmApiUrl', getEcmApiUrl, 'https://test.ecm.com'],
      ['getECMUrl', getECMUrl, 'https://test.ecm.com'],
      ['getHash', getHash, 'test-hash-123'],
      ['getProject', getProject, 'broad-duos-test'],
      ['getTag', getTag, 'v1.0.0-test'],
      ['getTdrApiUrl', getTdrApiUrl, 'https://test.tdr.com'],
      ['getTerraUrl', getTerraUrl, 'https://test.terra.bio'],
    ] as const)('%s should return correct value', async (_name, fn, expected) => {
      expect(await fn()).toBe(expected)
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
