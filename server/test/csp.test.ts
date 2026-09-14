import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import fastifyHelmet from '@fastify/helmet'
import {
  BANNER_SOURCE,
  type CspEnvironment,
  connectSources,
  contentSecurityPolicyOptions,
} from '../src/security/csp.js'
import { CSP_REPORT_GROUP, CSP_REPORT_PATH } from '../src/security/cspReport.js'
import { helmetOptions } from '../src/security/headers.js'
import { apiProxy } from '../src/proxy/apiProxy.js'
import { type Upstream, buildAppShell, nowSeconds, seedSession, startUpstream } from './proxyTestHarness.js'

// Keep the proxy test local.
vi.mock('../src/auth/refresh.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/auth/refresh.js')>()
  return { ...actual, refreshAccessToken: vi.fn() }
})

const CONSENT = 'https://consent.dsde-dev.broadinstitute.org'
const BARD = 'https://terra-bard-dev.appspot.com'
const ECM = 'https://externalcreds.dsde-dev.broadinstitute.org'
const TDR = 'https://jade.datarepo-dev.broadinstitute.org'
const TERRA = 'https://bvdp-saturn-dev.appspot.com'

const fullConfig = (bffEnabled: boolean): Record<string, unknown> => ({
  env: 'dev',
  bffEnabled,
  apiUrl: CONSENT,
  bardApiUrl: BARD,
  ecmApiUrl: ECM,
  tdrApiUrl: TDR,
  terraUrl: TERRA,
  features: {},
})

const PROD: CspEnvironment = { isDev: false, reportOnly: false }
const DEV: CspEnvironment = { isDev: true, reportOnly: true }

function parsePolicy(header: string): Map<string, string[]> {
  return new Map(header.split(';').map((part) => {
    const [name, ...values] = part.trim().split(/\s+/)
    return [name, values] as const
  }))
}

describe('connectSources', () => {
  it('allows only the two direct flows plus the banner bucket in BFF mode', () => {
    expect(connectSources(fullConfig(true), PROD)).toEqual(['\'self\'', CONSENT, BARD, BANNER_SOURCE])
  })

  it('allows all four configured upstreams in legacy mode', () => {
    expect(connectSources(fullConfig(false), PROD)).toEqual(['\'self\'', CONSENT, BARD, ECM, TDR, BANNER_SOURCE])
  })

  it('treats a missing bffEnabled key as legacy mode', () => {
    const config = fullConfig(false)
    delete config.bffEnabled
    expect(connectSources(config, PROD)).toContain(ECM)
  })

  it('never allowlists terraUrl, which is navigated to rather than fetched', () => {
    expect(connectSources(fullConfig(false), PROD)).not.toContain(TERRA)
  })

  it('reduces a configured URL to its origin', () => {
    const sources = connectSources({ bffEnabled: true, apiUrl: `${CONSENT}/api/v1/`, bardApiUrl: '' }, PROD)
    expect(sources).toContain(CONSENT)
    expect(sources).not.toContain(`${CONSENT}/api/v1/`)
  })

  it.each([
    ['a blank field, as base_config.json ships every one of them', ''],
    ['whitespace', '   '],
    ['a value that is not an absolute URL', '/duos-api'],
    ['a non-string', 42],
  ])('drops %s rather than emitting it as a source', (_label, apiUrl) => {
    expect(connectSources({ bffEnabled: true, apiUrl }, PROD)).toEqual(['\'self\'', BANNER_SOURCE])
  })

  it('adds the websocket schemes for Vite HMR in dev only', () => {
    expect(connectSources(fullConfig(true), DEV)).toEqual(expect.arrayContaining(['ws:', 'wss:']))
    expect(connectSources(fullConfig(true), PROD)).not.toEqual(expect.arrayContaining(['ws:', 'wss:']))
  })

  it('scopes the banner bucket to its path, not the whole shared GCS origin', () => {
    const sources = connectSources(fullConfig(true), PROD)
    expect(sources).toContain('https://storage.googleapis.com/broad-duos-banners/')
    expect(sources).not.toContain('https://storage.googleapis.com')
  })

  it('emits each origin once when two fields share it', () => {
    const sources = connectSources({ bffEnabled: false, apiUrl: CONSENT, ecmApiUrl: `${CONSENT}/ecm` }, PROD)
    expect(sources.filter(source => source === CONSENT)).toHaveLength(1)
  })
})

describe('contentSecurityPolicyOptions', () => {
  it('states every directive itself instead of inheriting helmet defaults', () => {
    expect(contentSecurityPolicyOptions(fullConfig(true), PROD).useDefaults).toBe(false)
  })

  it('keeps script-src at self in production — story 5-A removed the only external script', () => {
    expect(contentSecurityPolicyOptions(fullConfig(true), PROD).directives.scriptSrc).toEqual(['\'self\''])
  })

  it('allows inline scripts in dev, where Vite injects the Fast Refresh preamble', () => {
    expect(contentSecurityPolicyOptions(fullConfig(true), DEV).directives.scriptSrc).toEqual(['\'self\'', '\'unsafe-inline\''])
  })

  it('upgrades insecure requests in production only', () => {
    expect(contentSecurityPolicyOptions(fullConfig(true), PROD).directives).toHaveProperty('upgradeInsecureRequests', [])
    expect(contentSecurityPolicyOptions(fullConfig(true), DEV).directives).not.toHaveProperty('upgradeInsecureRequests')
  })

  it('points both report directives at the local sink', () => {
    const { directives } = contentSecurityPolicyOptions(fullConfig(true), PROD)
    expect(directives.reportUri).toEqual([CSP_REPORT_PATH])
    expect(directives.reportTo).toEqual([CSP_REPORT_GROUP])
  })

  it('carries the reportOnly flag through', () => {
    expect(contentSecurityPolicyOptions(fullConfig(true), { isDev: false, reportOnly: true }).reportOnly).toBe(true)
    expect(contentSecurityPolicyOptions(fullConfig(true), PROD).reportOnly).toBe(false)
  })

  it.each([
    ['objectSrc', ['\'none\'']],
    ['baseUri', ['\'none\'']],
    ['frameAncestors', ['\'none\'']],
    ['scriptSrcAttr', ['\'none\'']],
    ['fontSrc', ['\'self\'']],
    ['formAction', ['\'self\'']],
    ['manifestSrc', ['\'self\'']],
    ['defaultSrc', ['\'self\'']],
  ])('locks %s down to %s', (directive, expected) => {
    expect(contentSecurityPolicyOptions(fullConfig(true), PROD).directives[directive]).toEqual(expected)
  })

  it('keeps unsafe-inline for styles, which the React style prop depends on', () => {
    expect(contentSecurityPolicyOptions(fullConfig(true), PROD).directives.styleSrc).toEqual(['\'self\'', '\'unsafe-inline\''])
  })

  it('allows data: images but neither blob: nor a bare https:', () => {
    const { imgSrc } = contentSecurityPolicyOptions(fullConfig(true), PROD).directives
    expect(imgSrc).toEqual(['\'self\'', 'data:'])
    expect(imgSrc).not.toContain('https:')
  })
})

describe('the policy as helmet serialises it', () => {
  let app: FastifyInstance

  async function buildHelmetApp(env: CspEnvironment, config = fullConfig(true)): Promise<FastifyInstance> {
    const instance = Fastify({ logger: false })
    await instance.register(fastifyHelmet, helmetOptions(config, env))
    instance.get('/page', async () => ({ ok: true }))
    return instance
  }

  afterEach(async () => {
    await app?.close()
  })

  it('sends the report-only header, and not the enforcing one, in report-only mode', async () => {
    app = await buildHelmetApp({ isDev: false, reportOnly: true })
    const res = await app.inject({ method: 'GET', url: '/page' })
    expect(res.headers['content-security-policy-report-only']).toBeDefined()
    expect(res.headers['content-security-policy']).toBeUndefined()
  })

  it('sends the enforcing header once report-only is switched off', async () => {
    app = await buildHelmetApp(PROD)
    const res = await app.inject({ method: 'GET', url: '/page' })
    expect(res.headers['content-security-policy']).toBeDefined()
    expect(res.headers['content-security-policy-report-only']).toBeUndefined()
  })

  it('serialises the directive names in their hyphenated spelling', async () => {
    app = await buildHelmetApp(PROD)
    const res = await app.inject({ method: 'GET', url: '/page' })
    const policy = parsePolicy(String(res.headers['content-security-policy']))

    expect(policy.get('connect-src')).toEqual(['\'self\'', CONSENT, BARD, BANNER_SOURCE])
    expect(policy.get('script-src')).toEqual(['\'self\''])
    expect(policy.get('frame-ancestors')).toEqual(['\'none\''])
    expect(policy.get('report-uri')).toEqual([CSP_REPORT_PATH])
    expect(policy.get('report-to')).toEqual([CSP_REPORT_GROUP])
    expect(policy.get('upgrade-insecure-requests')).toEqual([])
  })

  it('denies framing through both the CSP and the legacy header', async () => {
    app = await buildHelmetApp(PROD)
    const res = await app.inject({ method: 'GET', url: '/page' })
    expect(res.headers['x-frame-options']).toBe('DENY')
    expect(String(res.headers['content-security-policy'])).toContain('frame-ancestors \'none\'')
  })
})

describe('the proxy download sandbox', () => {
  let app: FastifyInstance | undefined
  let upstream: Upstream

  beforeEach(async () => {
    upstream = await startUpstream()
    process.env.DUOS_API_URL = upstream.origin
    const { refreshAccessToken } = await import('../src/auth/refresh.js')
    vi.mocked(refreshAccessToken).mockReset().mockResolvedValue(undefined)
  })

  afterEach(async () => {
    await app?.close()
    app = undefined
    await upstream.close()
    delete process.env.DUOS_API_URL
  })

  it('keeps its per-reply sandbox value instead of the global policy', async () => {
    // The proxy writes its stricter header after Helmet; registration order matters.
    app = await buildAppShell()
    await app.register(fastifyHelmet, helmetOptions(fullConfig(true), PROD))
    seedSession(app, { accessToken: 'session-access-token', tokenExpiry: nowSeconds() + 3600 })
    await app.register(apiProxy)
    // The sibling route proves Helmet is active in this app.
    app.get('/not-proxied', async () => ({ ok: true }))

    const proxied = await app.inject({ method: 'GET', url: '/duos-api/api/dataset/1' })
    const plain = await app.inject({ method: 'GET', url: '/not-proxied' })

    expect(proxied.statusCode).toBe(200)
    expect(proxied.headers['content-security-policy']).toBe('sandbox')
    expect(proxied.headers['x-content-type-options']).toBe('nosniff')
    expect(String(plain.headers['content-security-policy'])).toContain('default-src \'self\'')
  })
})
