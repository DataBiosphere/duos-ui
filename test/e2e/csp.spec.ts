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
  // Local only, and not by choice. `pnpm run serve` is `vite preview`, which
  // sends no security headers, so support/csp.ts fulfils the document itself to
  // attach the policy. Chrome treats a fulfilled document as coming from an
  // unknown address space, which makes every same-origin subresource a
  // public-to-loopback Private Network Access transition — allowed from a
  // secure context, blocked without one. Locally the preview server speaks
  // HTTPS and the page loads; in CI it speaks plain HTTP and every stylesheet
  // and script is blocked before the policy is ever exercised.
  //
  // The fix is not a browser flag: it is to serve the e2e run through the
  // Fastify server, which sends the real header and needs no interception at
  // all. That is tracked with the Epic 6 harness work. Until then, run this
  // locally (`pnpm exec playwright test test/e2e/csp.spec.ts`) whenever the
  // policy or the app's outbound calls change.
  test.skip(Boolean(process.env.CI), 'needs a server that sends the header; see the comment above')

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
