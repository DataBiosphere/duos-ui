import type { Page } from '@playwright/test'
import { contentSecurityPolicyOptions } from '../../../server/src/security/csp'

/**
 * Uses the server's production policy builder. Until e2e runs through Fastify
 * (Epic 6), tests inject the header because Vite preview omits it.
 */

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

export function policyHeader(config: Record<string, unknown>): string {
  const { directives } = contentSecurityPolicyOptions(config, { isDev: false, reportOnly: true })
  // The preview is HTTP and has no CSP report endpoint.
  delete directives.upgradeInsecureRequests
  delete directives.reportUri
  delete directives.reportTo
  return Object.entries(directives)
    .map(([name, values]) => [dashify(name), ...values].join(' ').trim())
    .join('; ')
}

export async function attachReportOnlyPolicy(page: Page, header: string): Promise<void> {
  await page.route('**/*', async (route) => {
    if (route.request().resourceType() !== 'document') {
      await route.fallback()
      return
    }
    const response = await route.fetch()
    const headers: Record<string, string> = { ...response.headers(), 'content-security-policy-report-only': header }
    // route.fetch() returns a decoded body, so encoded-body metadata is invalid.
    delete headers['content-encoding']
    delete headers['content-length']
    await route.fulfill({ response, headers })
  })
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
