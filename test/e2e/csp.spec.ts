import { test, expect } from './support/auth'
import { attachReportOnlyPolicy, collectViolations, policyHeader } from './support/csp'

/**
 * The report-only collection run the Content Security Policy needs before it
 * can be enforced (Phase 5, story 5-F). Each case drives real flows with the
 * real policy attached and asserts the browser reported nothing.
 *
 * A failure names the directive and the blocked URL: either the app gained a
 * resource the policy does not cover, or the policy lost an entry it needs.
 * Fix whichever is wrong — do not widen the policy to silence the test without
 * checking that the resource belongs there.
 */

/** Long enough for the banner, feature-flag, and metrics calls to leave. */
const SETTLE_MS = 1500

test.describe('Content Security Policy', () => {
  test('The collector reports a violation when one happens', async ({ page }) => {
    // Without this, a harness that silently stopped attaching the header — or
    // stopped listening — would report every other case in this file as clean.
    await attachReportOnlyPolicy(page, 'default-src \'self\'; img-src \'none\'')
    const violations = await collectViolations(page)

    await page.goto('/')
    await expect(page.getByText('DUOS').first()).toBeVisible()
    await page.waitForTimeout(SETTLE_MS)

    expect(violations.length).toBeGreaterThan(0)
    expect(violations.map(violation => violation.directive)).toContain('img-src')
  })

  test('The public pages raise no violations', async ({ page, request }) => {
    const config = await (await request.get('/config.json')).json()
    await attachReportOnlyPolicy(page, policyHeader(config))
    const violations = await collectViolations(page)

    // Home: the banner fetch, the feature-flag lookup, and an anonymous
    // metrics event all leave the browser on this page.
    await page.goto('/')
    await expect(page.getByText('DUOS').first()).toBeVisible()
    await page.waitForLoadState('networkidle')

    // Status: reached by in-app navigation, and it polls several upstreams.
    await page.getByText('Status').click()
    await expect(page).toHaveURL(/status/)
    await expect(page.locator('#consent')).toBeVisible()
    await page.waitForLoadState('networkidle')

    await page.waitForTimeout(SETTLE_MS)
    expect(violations).toEqual([])
  })

  test('A signed-in console raises no violations', async ({ page, request, signInAs }) => {
    const config = await (await request.get('/config.json')).json()
    await attachReportOnlyPolicy(page, policyHeader(config))
    const violations = await collectViolations(page)

    // Sign-in, the console behind it, and sign-out — the flows that talk to
    // Consent, ECM, and the identified metrics endpoint.
    await signInAs('RESEARCHER')
    await expect(page.getByText('Researcher Console').first()).toBeVisible()
    await page.waitForLoadState('networkidle')

    await page.locator('#sel_user').click()
    await page.getByText('Sign out').click()
    await expect(page).toHaveURL(/\/home/)

    await page.waitForTimeout(SETTLE_MS)
    expect(violations).toEqual([])
  })
})
