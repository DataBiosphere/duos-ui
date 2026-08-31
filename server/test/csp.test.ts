import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import fastifyHelmet from '@fastify/helmet'
import {
  BANNER_ORIGIN,
  CSP_REPORT_GROUP,
  CSP_REPORT_PATH,
  type CspEnvironment,
  connectSources,
  contentSecurityPolicyOptions,
  helmetOptions,
} from '../src/security/csp.js'
import { apiProxy } from '../src/proxy/apiProxy.js'
import { type Upstream, buildAppShell, nowSeconds, seedSession, startUpstream } from './proxyTestHarness.js'

// refreshAccessToken is replaced so the proxy case below never reaches B2C.
vi.mock('../src/auth/refresh.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/auth/refresh.js')>()
  return { ...actual, refreshAccessToken: vi.fn() }
})

const CONSENT = 'https://consent.dsde-dev.broadinstitute.org'
const BARD = 'https://terra-bard-dev.appspot.com'
const ECM = 'https://externalcreds.dsde-dev.broadinstitute.org'
const TDR = 'https://jade.datarepo-dev.broadinstitute.org'
const TERRA = 'https://bvdp-saturn-dev.appspot.com'

/** A config.json with every inventoried field populated, as dev.json ships it. */
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

/** Splits a policy header back into `directive -> values`. */
function parsePolicy(header: string): Map<string, string[]> {
  return new Map(header.split(';').map((part) => {
    const [name, ...values] = part.trim().split(/\s+/)
    return [name, values] as const
  }))
}

describe('connectSources', () => {
  it('allows only the two direct flows plus the banner bucket in BFF mode', () => {
    // ECM and TDR are reached through same-origin proxies after cutover, so
    // their configured origins must NOT leak into the policy just because the
    // fields exist in config.json.
    expect(connectSources(fullConfig(true), PROD)).toEqual(['\'self\'', CONSENT, BARD, BANNER_ORIGIN])
  })

  it('allows all four configured upstreams in legacy mode', () => {
    // The legacy client calls each of these directly from the browser, and
    // oidc-client-ts fetches Consent's /oauth2/token — the apiUrl origin.
    expect(connectSources(fullConfig(false), PROD)).toEqual(['\'self\'', CONSENT, BARD, ECM, TDR, BANNER_ORIGIN])
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
    expect(connectSources({ bffEnabled: true, apiUrl }, PROD)).toEqual(['\'self\'', BANNER_ORIGIN])
  })

  it('adds the websocket schemes for Vite HMR in dev only', () => {
    expect(connectSources(fullConfig(true), DEV)).toEqual(expect.arrayContaining(['ws:', 'wss:']))
    expect(connectSources(fullConfig(true), PROD)).not.toEqual(expect.arrayContaining(['ws:', 'wss:']))
  })

  it('emits each origin once when two fields share it', () => {
    const sources = connectSources({ bffEnabled: false, apiUrl: CONSENT, ecmApiUrl: `${CONSENT}/ecm` }, PROD)
    expect(sources.filter(source => source === CONSENT)).toHaveLength(1)
  })
})

describe('contentSecurityPolicyOptions', () => {
  it('states every directive itself instead of inheriting helmet defaults', () => {
    // helmet's defaults carry `style-src https:` and an unconditional
    // upgrade-insecure-requests, neither of which this app wants.
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
    // style-src-attr falls back to style-src; without this every `style={{…}}`
    // prop in the tree would be dropped and the app would render unstyled.
    expect(contentSecurityPolicyOptions(fullConfig(true), PROD).directives.styleSrc).toEqual(['\'self\'', '\'unsafe-inline\''])
  })

  it('allows data: and blob: images but never a bare https:', () => {
    const { imgSrc } = contentSecurityPolicyOptions(fullConfig(true), PROD).directives
    expect(imgSrc).toEqual(['\'self\'', 'data:', 'blob:'])
    expect(imgSrc).not.toContain('https:')
  })
})

describe('helmetOptions', () => {
  it('sends no COOP at all in legacy mode, where a popup carries the sign-in result', () => {
    // Measured, not assumed: `same-origin-allow-popups` does NOT save this
    // flow. It spares a popup only on its initial navigation while the popup's
    // own document is unsafe-none. On the return leg from B2C the comparison
    // is unsafe-none against our COOP, which mismatches — the browser swaps
    // browsing context groups and window.opener goes null, so oidc-client-ts
    // can never postMessage the result back and signinPopup() hangs.
    expect(helmetOptions(fullConfig(false), PROD).crossOriginOpenerPolicy).toBe(false)
  })

  it('keeps COOP in BFF mode, where sign-in is a top-level redirect with no opener', () => {
    expect(helmetOptions(fullConfig(true), PROD).crossOriginOpenerPolicy).toEqual({ policy: 'same-origin-allow-popups' })
  })

  it('treats a missing bffEnabled key as legacy mode, the fail-safe direction', () => {
    const config = fullConfig(false)
    delete config.bffEnabled
    expect(helmetOptions(config, PROD).crossOriginOpenerPolicy).toBe(false)
  })

  it('leaves COEP off, since the banner and metrics origins send no CORP header', () => {
    expect(helmetOptions(fullConfig(true), PROD).crossOriginEmbedderPolicy).toBe(false)
  })

  it('sends HSTS in production only', () => {
    expect(helmetOptions(fullConfig(true), DEV).strictTransportSecurity).toBe(false)
    expect(helmetOptions(fullConfig(true), PROD).strictTransportSecurity).toEqual({
      maxAge: 31536000,
      includeSubDomains: true,
      preload: false,
    })
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

    expect(policy.get('connect-src')).toEqual(['\'self\'', CONSENT, BARD, BANNER_ORIGIN])
    expect(policy.get('script-src')).toEqual(['\'self\''])
    expect(policy.get('frame-ancestors')).toEqual(['\'none\''])
    expect(policy.get('report-uri')).toEqual([CSP_REPORT_PATH])
    expect(policy.get('report-to')).toEqual([CSP_REPORT_GROUP])
    // A valueless directive serialises as the bare name.
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
    // Both writes land on the same raw response through setHeader, and the
    // proxy's runs second, so it wins. (Not through writeHead: the proxy
    // replies with a stream, and Fastify's stream path deliberately avoids
    // writeHead — see the comment at fastify/lib/reply.js `sendStream`. The
    // ordering is what makes this work, so a future change that moved helmet
    // later would silently strip the sandbox.) Proxied uploads are served from
    // the SPA's own origin, so losing `sandbox` here would let one execute.
    app = await buildAppShell()
    await app.register(fastifyHelmet, helmetOptions(fullConfig(true), PROD))
    seedSession(app, { accessToken: 'session-access-token', tokenExpiry: nowSeconds() + 3600 })
    await app.register(apiProxy)
    // A non-proxy route in the same app, to prove helmet is live here. Without
    // it this case would also pass against an app where helmet never ran.
    app.get('/not-proxied', async () => ({ ok: true }))

    const proxied = await app.inject({ method: 'GET', url: '/duos-api/api/dataset/1' })
    const plain = await app.inject({ method: 'GET', url: '/not-proxied' })

    expect(proxied.statusCode).toBe(200)
    expect(proxied.headers['content-security-policy']).toBe('sandbox')
    expect(proxied.headers['x-content-type-options']).toBe('nosniff')
    // Same app, same helmet registration — the full policy, not `sandbox`.
    expect(String(plain.headers['content-security-policy'])).toContain('default-src \'self\'')
  })
})
