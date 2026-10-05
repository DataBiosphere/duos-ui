import { test, expect } from '@playwright/test'
import type { Page, Route } from '@playwright/test'

/*
 * The indicators show the health that Consent reports for its dependencies, so a test that
 * needs a healthy Sam fails whenever dev Sam is degraded, whatever the change under test did.
 * The render tests stub Consent's answer. One live test checks that each indicator appears.
 */

const systemStatus = (ok: boolean) => ({ ok, systems: {} })

/**
 * The shape of Consent's /status that src/libs/ajax/ServiceStatus.ts reads.
 * Consent rolls its dependencies up into `ok`, so an unhealthy Sam makes Consent unhealthy.
 */
const consentStatus = ({ sam }: { sam: boolean }) => ({
  ok: sam,
  degraded: !sam,
  systems: {
    ecm: { healthy: true, details: systemStatus(true) },
    sam: { healthy: sam, details: systemStatus(sam) },
  },
})

/**
 * Answers the app's fetch of Consent's status, at `/duos-api/status` or `${apiUrl}/status`.
 * The footer link is a full navigation to the /status document, which goes to the server.
 */
const stubConsentStatus = async (page: Page, body: object) => {
  await page.route(url => url.pathname.endsWith('/status'), async (route: Route) => {
    if (route.request().resourceType() !== 'fetch') return route.fallback()
    return route.fulfill({ json: body, headers: { 'access-control-allow-origin': '*' } })
  })
}

const openStatusFromHome = async (page: Page) => {
  await page.goto('/')
  await page.getByText('Status').click()
  await expect(page.locator('#consent')).toBeVisible()
}

/**
 * The page shows every service as unhealthy until Consent's answer arrives, and keeps
 * doing so if the fetch fails. A check of the indicators means nothing until the raw
 * response under the Consent heading has the `ok` field.
 */
const expectStatusLoaded = async (page: Page) => {
  await expect(page.locator('h2#consent + pre')).toContainText('"ok"', { timeout: 15000 })
}

const indicator = (page: Page, href: string, state: string) =>
  page.locator(`a[href="${href}"]`).locator('xpath=..').locator(`[data-testid${state}]`)

test('Status page loads from home', async ({ page }) => {
  await page.goto('/')
  await page.getByText('Status').click()
  await expect(page).toHaveURL(/status/)
})

test('Status page renders an indicator for each service', async ({ page }) => {
  await openStatusFromHome(page)
  await expectStatusLoaded(page)

  for (const href of ['#consent', '#ecm', '#sam']) {
    await expect(indicator(page, href, '^="status-"')).toBeVisible()
  }
})

test('Status page renders healthy services as healthy', async ({ page }) => {
  await stubConsentStatus(page, consentStatus({ sam: true }))
  await openStatusFromHome(page)
  await expectStatusLoaded(page)

  for (const href of ['#consent', '#ecm', '#sam']) {
    await expect(indicator(page, href, '="status-healthy"')).toBeVisible()
  }
})

test('Status page renders an unhealthy service as unhealthy', async ({ page }) => {
  await stubConsentStatus(page, consentStatus({ sam: false }))
  await openStatusFromHome(page)
  await expectStatusLoaded(page)

  await expect(indicator(page, '#sam', '="status-unhealthy"')).toBeVisible()
  await expect(indicator(page, '#consent', '="status-unhealthy"')).toBeVisible()
  await expect(indicator(page, '#ecm', '="status-healthy"')).toBeVisible()
})
