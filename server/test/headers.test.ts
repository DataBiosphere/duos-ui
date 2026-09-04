import { describe, it, expect, afterEach } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import fastifyHelmet from '@fastify/helmet'
import { helmetOptions } from '../src/security/headers.js'
import type { CspEnvironment } from '../src/security/csp.js'

const config = (bffEnabled: boolean): Record<string, unknown> => ({ env: 'dev', bffEnabled })

const PROD: CspEnvironment = { isDev: false, reportOnly: false }
const DEV: CspEnvironment = { isDev: true, reportOnly: true }

describe('helmetOptions', () => {
  it('sends no COOP at all in legacy mode, where a popup carries the sign-in result', () => {
    // Measured, not assumed: `same-origin-allow-popups` does NOT save this
    // flow. It spares a popup only on its initial navigation while the popup's
    // own document is unsafe-none. On the return leg from B2C the comparison
    // is unsafe-none against our COOP, which mismatches — the browser swaps
    // browsing context groups and window.opener goes null, so oidc-client-ts
    // can never postMessage the result back and signinPopup() hangs.
    expect(helmetOptions(config(false), PROD).crossOriginOpenerPolicy).toBe(false)
  })

  it('keeps COOP in BFF mode, where sign-in is a top-level redirect with no opener', () => {
    expect(helmetOptions(config(true), PROD).crossOriginOpenerPolicy).toEqual({ policy: 'same-origin-allow-popups' })
  })

  it('treats a missing bffEnabled key as legacy mode, the fail-safe direction', () => {
    expect(helmetOptions({ env: 'dev' }, PROD).crossOriginOpenerPolicy).toBe(false)
  })

  it('leaves COEP off, since the banner and metrics origins send no CORP header', () => {
    expect(helmetOptions(config(true), PROD).crossOriginEmbedderPolicy).toBe(false)
  })

  it('sends HSTS in production only', () => {
    expect(helmetOptions(config(true), DEV).strictTransportSecurity).toBe(false)
    expect(helmetOptions(config(true), PROD).strictTransportSecurity).toEqual({
      maxAge: 31536000,
      includeSubDomains: true,
      preload: false,
    })
  })

  it('carries the policy through from csp.ts', () => {
    const csp = helmetOptions(config(true), PROD).contentSecurityPolicy
    expect(csp).toMatchObject({ useDefaults: false })
  })
})

describe('the headers as helmet serialises them', () => {
  let app: FastifyInstance

  async function buildHelmetApp(env: CspEnvironment, bffEnabled = true): Promise<FastifyInstance> {
    const instance = Fastify({ logger: false })
    await instance.register(fastifyHelmet, helmetOptions(config(bffEnabled), env))
    instance.get('/page', async () => ({ ok: true }))
    return instance
  }

  afterEach(async () => {
    await app?.close()
  })

  it('sends the headers a browser acts on, alongside the policy', async () => {
    app = await buildHelmetApp(PROD)
    const res = await app.inject({ method: 'GET', url: '/page' })

    expect(res.headers['cross-origin-opener-policy']).toBe('same-origin-allow-popups')
    expect(res.headers['cross-origin-resource-policy']).toBe('same-origin')
    expect(res.headers['referrer-policy']).toBe('no-referrer')
    expect(res.headers['x-frame-options']).toBe('DENY')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['content-security-policy']).toContain('default-src \'self\'')
  })

  it('omits the COOP header entirely for a legacy deployment', async () => {
    // Not `unsafe-none`: absent. A legacy popup must see no COOP at all.
    app = await buildHelmetApp(PROD, false)
    const res = await app.inject({ method: 'GET', url: '/page' })

    expect(res.headers['cross-origin-opener-policy']).toBeUndefined()
  })

  it('omits HSTS outside production, so a plain-HTTP dev setup keeps working', async () => {
    app = await buildHelmetApp(DEV)
    const res = await app.inject({ method: 'GET', url: '/page' })

    expect(res.headers['strict-transport-security']).toBeUndefined()
  })
})
