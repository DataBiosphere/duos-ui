import { test, expect } from './support/auth'
import { attachReportOnlyPolicy, collectViolations, drainViolations, policyHeader } from './support/csp'

/**
 * The report-only collection run the Content Security Policy needs before it
 * can be enforced (Phase 5, story 5-F). Each case drives real flows with the
 * real policy attached and asserts the browser reported nothing.
 *
 * A failure names the directive and the blocked URL: either the app gained a
 * resource the policy does not cover, or the policy lost an entry it needs.
 * Fix whichever is wrong — do not widen the policy to silence the test without
 * checking that the resource belongs there.
 *
 * Every wait below is on a named request rather than on a clock, because
 * "nothing was reported" is only worth asserting once the calls that could
 * report have happened. Under a report-only policy the browser raises
 * `securitypolicyviolation` when it *initiates* a fetch, not when the fetch
 * comes back, so the response is always the later of the two events: awaiting
 * the response of the last call a flow makes proves the violation, had there
 * been one, was already raised. A fixed sleep proves nothing — a call that left
 * the browser a moment late would pass these cases green on a policy that
 * actually breaks the page.
 */

// The calls each flow makes, matched on URL shape so the deployment's own base
// URLs (and the BFF prefixes that replace them) need no plumbing in here.
const CONFIG_JSON = /\/config\.json$/
const BANNERS = /\/broad-duos-banners\//
// Consent's own /status, not the app's /status route: that route is reached by
// in-app navigation, which issues no document request to match against.
const CONSENT_STATUS = /\/status$/
const COLLECTION_SUMMARIES = /\/api\/collections\/role\/[^/]+\/summary$/

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

    // Here the violation *is* the observable condition, so poll the collected
    // array: the case ends the moment an img-src report arrives rather than
    // after a wait long enough to hope one did.
    await expect.poll(() => violations.map(violation => violation.directive)).toContain('img-src')
  })

  test('The public pages raise no violations', async ({ page, request }) => {
    const config = await (await request.get('/config.json')).json()
    await attachReportOnlyPolicy(page, policyHeader(config))
    const violations = await collectViolations(page)

    // Home: the app's own config fetch and the header's GCS banner fetch both
    // leave the browser here, and connect-src is the directive they exercise.
    // Both waits are set up before goto() — waitForResponse only matches
    // traffic that starts after it exists.
    const configLoaded = page.waitForResponse(CONFIG_JSON)
    const bannersLoaded = page.waitForResponse(BANNERS)
    await page.goto('/')
    await expect(page.getByText('DUOS').first()).toBeVisible()
    await Promise.all([configLoaded, bannersLoaded])

    // Status: reached by in-app navigation, and the page's indicators are drawn
    // from a single call to Consent's /status, which reports on the upstreams
    // behind it. Waiting for that response is what makes the page done.
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

    // Sign-in and the console behind it, the flows that talk to Consent as an
    // authenticated user. /backgroundsignin redirects once /api/user/me answers
    // (support/auth.ts asserts that redirect), and the console then fetches its
    // collection summaries — the console's chrome is visible before that call
    // returns, so the response is the wait that matters.
    const summariesLoaded = page.waitForResponse(COLLECTION_SUMMARIES)
    await signInAs('RESEARCHER')
    await expect(page.getByText('Researcher Console').first()).toBeVisible()
    await summariesLoaded

    // Sign-out ends in a full-page redirect to /home, so the header remounts
    // and fetches the banners again; that second response is the signal the
    // reloaded document has made the calls it makes.
    const homeReloaded = page.waitForResponse(BANNERS)
    await page.locator('#sel_user').click()
    await page.getByText('Sign out').click()
    await expect(page).toHaveURL(/\/home/)
    await homeReloaded

    expect(await drainViolations(page, violations)).toEqual([])
  })
})
