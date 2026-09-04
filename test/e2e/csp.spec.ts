import { test, expect } from './support/auth'
import { attachReportOnlyPolicy, collectViolations, drainViolations, policyHeader } from './support/csp'

/**
 * Each flow waits for its last relevant response before checking violations.
 * CSP events fire when requests start, so response-based waits cannot miss a
 * late request the way a fixed delay could.
 */

const CONFIG_JSON = /\/config\.json$/
const BANNERS = /\/broad-duos-banners\//
// Consent's endpoint, not the client-side /status route.
const CONSENT_STATUS = /\/status$/
const COLLECTION_SUMMARIES = /\/api\/collections\/role\/[^/]+\/summary$/

test.describe('Content Security Policy', () => {
  // Header interception makes Chrome treat the document as an unknown address
  // space. CI's HTTP preview then hits Private Network Access blocks before CSP
  // is exercised; local HTTPS avoids this until e2e uses Fastify (Epic 6).
  test.skip(Boolean(process.env.CI), 'needs a server that sends the header; see the comment above')

  test('The collector reports a violation when one happens', async ({ page }) => {
    // Guards against silent failure in header injection or event collection.
    await attachReportOnlyPolicy(page, 'default-src \'self\'; img-src \'none\'')
    const violations = await collectViolations(page)

    await page.goto('/')
    await expect(page.getByText('DUOS').first()).toBeVisible()

    // The violation itself is the completion signal for this harness check.
    await expect.poll(() => violations.map(violation => violation.directive)).toContain('img-src')
  })

  test('The public pages raise no violations', async ({ page, request }) => {
    const config = await (await request.get('/config.json')).json()
    await attachReportOnlyPolicy(page, policyHeader(config))
    const violations = await collectViolations(page)

    // Register before navigation so startup requests cannot race past the waits.
    const configLoaded = page.waitForResponse(CONFIG_JSON)
    const bannersLoaded = page.waitForResponse(BANNERS)
    await page.goto('/')
    await expect(page.getByText('DUOS').first()).toBeVisible()
    await Promise.all([configLoaded, bannersLoaded])

    const statusLoaded = page.waitForResponse(CONSENT_STATUS)
    await page.getByText('Status').click()
    await expect(page).toHaveURL(/status/)
    await expect(page.locator('#consent')).toBeVisible()
    await statusLoaded

    expect(await drainViolations(page, violations)).toEqual([])
  })

  test('A signed-in console raises no violations', async ({ page, request, signInAs }) => {
    const config = await (await request.get('/config.json')).json()
    await attachReportOnlyPolicy(page, policyHeader(config))
    const violations = await collectViolations(page)

    // Register before sign-in; console chrome can render before this response.
    const summariesLoaded = page.waitForResponse(COLLECTION_SUMMARIES)
    await signInAs('RESEARCHER')
    await expect(page.getByText('Researcher Console').first()).toBeVisible()
    await summariesLoaded

    // Sign-out reloads /home, whose banner fetch is the last relevant request.
    const homeReloaded = page.waitForResponse(BANNERS)
    await page.locator('#sel_user').click()
    await page.getByText('Sign out').click()
    await expect(page).toHaveURL(/\/home/)
    await homeReloaded

    expect(await drainViolations(page, violations)).toEqual([])
  })
})
