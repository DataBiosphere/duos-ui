import { test, expect } from './support/auth'
import type { APIRequestContext, Response } from '@playwright/test'
import { collectViolations, drainViolations, expectServerPolicy } from './support/csp'

/**
 * Each flow waits for its last relevant response before checking violations.
 * CSP events fire when requests start, so response-based waits cannot miss a
 * late request the way a fixed delay could.
 */

const CONFIG_JSON = /\/config\.json$/
// Consent's endpoint, not the client-side /status route.
const CONSENT_STATUS = /\/status$/
const DASHBOARD_SUMMARY = /\/api\/researcher\/dashboard-summary$/
// img-src allows only 'self' and data:, and .invalid never resolves.
const DISALLOWED_IMAGE = 'https://csp-probe.invalid/probe.png'

/** Matches the banner feed that config.json names, so a bucket move cannot stale it. */
async function bannerFeed(request: APIRequestContext): Promise<(response: Response) => boolean> {
  const { bannersUrl } = await (await request.get('/config.json')).json() as { bannersUrl?: string }
  if (!bannersUrl) throw new Error('config.json names no bannersUrl, so the banner wait cannot complete')
  return response => response.url() === bannersUrl
}

test.describe('Content Security Policy', () => {
  test('The collector reports a violation when one happens', async ({ page }) => {
    // Guards against a missing header or a broken collector reading as clean.
    const violations = await collectViolations(page)

    const response = await page.goto('/')
    expectServerPolicy(response)
    await expect(page.getByText('DUOS').first()).toBeVisible()

    await page.evaluate((src) => {
      const image = document.createElement('img')
      image.src = src
      document.body.append(image)
    }, DISALLOWED_IMAGE)

    // The violation itself is the completion signal for this harness check.
    await expect.poll(() => violations.map(violation => violation.blockedUrl)).toContain(DISALLOWED_IMAGE)
    expect(violations.find(violation => violation.blockedUrl === DISALLOWED_IMAGE)?.directive).toBe('img-src')
  })

  test('The public pages raise no violations', async ({ page, request }) => {
    const bannersFetched = await bannerFeed(request)
    const violations = await collectViolations(page)

    // Register before navigation so startup requests cannot race past the waits.
    const configLoaded = page.waitForResponse(CONFIG_JSON)
    const bannersLoaded = page.waitForResponse(bannersFetched)
    const response = await page.goto('/')
    expectServerPolicy(response)
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
    const bannersFetched = await bannerFeed(request)
    const violations = await collectViolations(page)

    // Register before sign-in; console chrome can render before this response.
    const dashboardLoaded = page.waitForResponse(DASHBOARD_SUMMARY)
    await signInAs('RESEARCHER')
    await expect(page.getByText('Researcher Console').first()).toBeVisible()
    await dashboardLoaded

    // Sign-out reloads /home, whose banner fetch is the last relevant request.
    const homeReloaded = page.waitForResponse(bannersFetched)
    await page.locator('#sel_user').click()
    await page.getByText('Sign out').click()
    await expect(page).toHaveURL(/\/home/)
    await homeReloaded

    expect(await drainViolations(page, violations)).toEqual([])
  })
})
