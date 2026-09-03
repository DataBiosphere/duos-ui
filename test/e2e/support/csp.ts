import type { Page } from '@playwright/test'
import { contentSecurityPolicyOptions } from '../../../server/src/security/csp'

/**
 * Drives the Content Security Policy against the real built app in the browser,
 * so a policy that would break a page fails a pull request rather than a
 * deployment (Phase 5, story 5-F).
 *
 * The policy string comes from the server's own builder — the same function
 * `server/src/index.ts` hands helmet — so this cannot drift from what the app
 * actually sends. What the e2e harness cannot supply today is the *server*:
 * `pnpm run serve` is `vite preview`, which sends no security headers at all,
 * so the header is attached to the document response here instead. Once the
 * harness serves through the Fastify server (Epic 6), delete
 * `attachReportOnlyPolicy` and read the header the server already sends.
 */

/** helmet's own directive-name spelling: camelCase becomes hyphenated. */
const dashify = (name: string): string => name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)

export interface Violation {
  documentUrl: string
  directive: string
  blockedUrl: string
}

declare global {
  interface Window {
    __recordCspViolation?: (violation: Violation) => void
  }
}

/**
 * The report-only policy header for a deployment running this `config.json`.
 *
 * Two production directives are dropped, both because the preview server speaks
 * plain HTTP and hosts no BFF routes. Neither changes what the page may load,
 * and both are asserted directly in `server/test/csp.test.ts`.
 */
export function policyHeader(config: Record<string, unknown>): string {
  const { directives } = contentSecurityPolicyOptions(config, { isDev: false, reportOnly: true })
  delete directives.upgradeInsecureRequests
  // Collection here is the DOM event below, not the server sink; leaving these
  // in would only make the browser POST reports at a 404.
  delete directives.reportUri
  delete directives.reportTo
  return Object.entries(directives)
    .map(([name, values]) => [dashify(name), ...values].join(' ').trim())
    .join('; ')
}

/**
 * Attaches the report-only policy to every top-level document the page loads.
 *
 * Report-only, not enforcing: a violation must be *collected* rather than
 * break the page, or the first failure hides every one behind it.
 */
export async function attachReportOnlyPolicy(page: Page, header: string): Promise<void> {
  await page.route('**/*', async (route) => {
    if (route.request().resourceType() !== 'document') {
      await route.fallback()
      return
    }
    const response = await route.fetch()
    const headers: Record<string, string> = { ...response.headers(), 'content-security-policy-report-only': header }
    // route.fetch() hands back an already-decoded body, so the upstream's
    // content-encoding and content-length no longer describe what is being
    // fulfilled — copying them over makes the browser fail to decode the
    // document. `vite preview` compresses nothing today, but the Fastify server
    // this harness moves to (Epic 6) does, and the failure there is an opaque
    // navigation error rather than a CSP result.
    delete headers['content-encoding']
    delete headers['content-length']
    await route.fulfill({ response, headers })
  })
}

/**
 * Starts collecting violations. The returned array fills as the page navigates
 * — read it after the flows have run, not before.
 */
export async function collectViolations(page: Page): Promise<Violation[]> {
  const violations: Violation[] = []
  await page.exposeFunction('__recordCspViolation', (violation: Violation) => {
    violations.push(violation)
  })
  // addInitScript runs at document start on every navigation, so the listener
  // is in place before the app's own scripts can trip the policy.
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (event) => {
      window.__recordCspViolation?.({
        documentUrl: event.documentURI,
        directive: event.effectiveDirective || event.violatedDirective,
        blockedUrl: event.blockedURI,
      })
    })
  })
  return violations
}

/**
 * Returns the collected violations once every report the browser has already
 * raised has actually crossed back into Node.
 *
 * `exposeFunction` bindings and `evaluate` results travel the same ordered
 * channel, so one round-trip through the page after the flows have finished
 * guarantees any binding call the page made earlier was already delivered.
 * Without it, a case asserting the array is empty can read it in the same tick
 * the browser raised a report and see nothing.
 */
export async function drainViolations(page: Page, violations: Violation[]): Promise<Violation[]> {
  await page.evaluate(() => true)
  return violations
}
