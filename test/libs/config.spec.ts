import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest'
import { Config, getEnv, getApiUrl, getConsentApiUrl, getBardApiUrl, getEcmApiUrl, getECMUrl, getHash, getProject, getTag, getTdrApiUrl, getTerraUrl, isBffEnabled, jsonBody, textPlain } from 'src/libs/config'

const mockConfig = {
  env: 'test',
  apiUrl: 'https://test.api.com',
  bardApiUrl: 'https://test.bard.com',
  ecmApiUrl: 'https://test.ecm.com',
  hash: 'test-hash-123',
  tag: 'v1.0.0-test',
  tdrApiUrl: 'https://test.tdr.com',
  terraUrl: 'https://test.terra.bio',
  bffEnabled: true,
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
      // bffEnabled is true in mockConfig, so the API base is the BFF proxy prefix
      ['getApiUrl', '/duos-api'],
      ['getConsentApiUrl', 'https://test.api.com'],
      ['getBardApiUrl', 'https://test.bard.com'],
      ['getEcmApiUrl', 'https://test.ecm.com'],
      ['getECMUrl', 'https://test.ecm.com'],
      ['getHash', 'test-hash-123'],
      ['getProject', 'broad-duos-test'],
      ['getTag', 'v1.0.0-test'],
      ['getTdrApiUrl', 'https://test.tdr.com'],
      ['getTerraUrl', 'https://test.terra.bio'],
    ] as const)('should get %s', async (method, expected) => {
      // oxlint-disable-next-line @typescript-eslint/no-explicit-any
      expect(await (Config[method] as any)()).toBe(expected)
    })

    it('should report bffEnabled', async () => {
      expect(await Config.isBffEnabled()).toBe(true)
    })
  })

  describe('Exported functions', () => {
    it.each([
      ['getEnv', getEnv, 'test'],
      ['getApiUrl', getApiUrl, '/duos-api'],
      ['getConsentApiUrl', getConsentApiUrl, 'https://test.api.com'],
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

    it('isBffEnabled should return true when config.json says so', async () => {
      expect(await isBffEnabled()).toBe(true)
    })
  })

  describe('token helpers are gone', () => {
    it('no longer exposes authOpts / multiPartOpts / Token on the Config instance', () => {
      // The BFF holds the tokens server-side; nothing in the client builds an
      // Authorization header anymore.
      expect((Config as unknown as Record<string, unknown>).authOpts).toBeUndefined()
      expect((Config as unknown as Record<string, unknown>).multiPartOpts).toBeUndefined()
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
    it('jsonBody method should call jsonBody function', () => {
      const body = { test: 'data' }
      const opts = Config.jsonBody(body)
      expect(opts.body).toBe(JSON.stringify(body))
      expect(opts.headers['Content-Type']).toBe('application/json')
    })

    it('textPlain method should call textPlain function', () => {
      expect(Config.textPlain().headers['Accept']).toBe('text/plain')
    })
  })
})
