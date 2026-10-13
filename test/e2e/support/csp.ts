import { expect } from '@playwright/test'
import type { Page, Response } from '@playwright/test'

/**
 * Collects the browser's CSP violation events. The policy itself is the one
 * the Fastify server sends; tests do not attach or rewrite it.
 */

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

/** Fails unless the document carries the server's policy, in either mode. */
export function expectServerPolicy(response: Response | null): void {
  const headers = response?.headers() ?? {}
  const policy = headers['content-security-policy-report-only'] ?? headers['content-security-policy']
  expect(policy, 'the document response has no CSP header').toContain('default-src \'self\'')
}

export async function collectViolations(page: Page): Promise<Violation[]> {
  const violations: Violation[] = []
  await page.exposeFunction('__recordCspViolation', (violation: Violation) => {
    violations.push(violation)
  })
  // Install on every document before application scripts can violate the policy.
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
 * Flushes pending violation bindings. `exposeFunction` calls and `evaluate`
 * results share an ordered channel, so this observes earlier events.
 */
export async function drainViolations(page: Page, violations: Violation[]): Promise<Violation[]> {
  await page.evaluate(() => true)
  return violations
}
