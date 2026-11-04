import { test, expect } from '@playwright/test'
import { lookupExamples } from '../fixtures/showcase/contracts'
import { MOCK_SHOWCASE_API_URL, MOCK_SHOWCASE_LOOKUP_PATH } from './mocks/settings'
import { collectViolations, drainViolations, expectServerPolicy } from './support/csp'

// Proves the legacy project itself (DT-4353): its server runs with bffEnabled
// off, and the browser reaches the mock showcase lookup cross-origin under the
// served CSP. The showcase page specs build on it.

interface LegacyConfig {
  bffEnabled?: unknown
  showcaseApiUrl?: unknown
}

const STATS = lookupExamples.find(example => example.name.startsWith('stats:'))!

test('serves legacy mode, and the browser reaches the showcase lookup directly', async ({ page, request }) => {
  const config = await (await request.get('/config.json')).json() as LegacyConfig
  expect(config.bffEnabled).not.toBe(true)
  expect(config.showcaseApiUrl).toBe(MOCK_SHOWCASE_API_URL)

  const violations = await collectViolations(page)
  const paths: string[] = []
  page.on('request', sent => paths.push(new URL(sent.url()).pathname))

  const response = await page.goto('/')
  expectServerPolicy(response)
  const policy = response?.headers()['content-security-policy'] ?? ''
  expect(policy).toContain(`${MOCK_SHOWCASE_API_URL}/showcase/`)
  await expect(page.getByText('DUOS').first()).toBeVisible()

  // A JSON content type makes the browser send a preflight first.
  const lookup = await page.evaluate(async ({ url, body }) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'omit',
    })
    return { status: res.status, body: await res.json() as unknown }
  }, { url: `${config.showcaseApiUrl as string}${MOCK_SHOWCASE_LOOKUP_PATH}`, body: STATS.request })
  expect(lookup).toEqual({ status: STATS.status, body: STATS.response })

  // The policy is enforced here and admits /showcase/ only, not the rest of that origin.
  const blocked = await page.evaluate(async url => fetch(url).then(() => 'reached', () => 'blocked'), `${MOCK_SHOWCASE_API_URL}/status`)
  expect(blocked).toBe('blocked')
  expect((await drainViolations(page, violations)).map(violation => violation.blockedUrl))
    .toEqual([`${MOCK_SHOWCASE_API_URL}/status`])
  // The legacy client never asks the BFF for a session, before or after the lookup.
  expect(paths).not.toContain('/auth/me')
})
