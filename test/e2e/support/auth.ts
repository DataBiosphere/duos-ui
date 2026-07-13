import { auth, JWT } from 'google-auth-library'
import { test as base } from '@playwright/test'
import { BASE_URL } from './baseUrl'

export const ROLES = ['ADMIN', 'CHAIR', 'MEMBER', 'RESEARCHER', 'SIGNING_OFFICIAL'] as const
export type Role = typeof ROLES[number]

// Ported from the deleted cypress/support/commands.js `cy.auth()`: mints a real
// Google-signed access token from a per-role service account key (no interactive
// OIDC redirect needed), for submission into the app's /backgroundsignin route.
export const getAccessToken = async (role: Role): Promise<string> => {
  const envVar = `DUOS_AUTOMATION_${role}_SA`
  const keysJson = process.env[envVar]
  if (!keysJson) {
    throw new Error(`Missing service account key env var ${envVar}`)
  }

  // fromJSON's return type covers every credential shape it supports, but a service
  // account key (what DUOS_AUTOMATION_*_SA holds) always yields a JWT client.
  const client = auth.fromJSON(JSON.parse(keysJson)) as JWT
  client.scopes = ['email', 'profile']
  await client.request({ url: BASE_URL })

  const accessToken = client.credentials.access_token
  if (!accessToken) {
    throw new Error(`Failed to obtain access token for role ${role}`)
  }
  return accessToken
}

type AuthFixtures = {
  signInAs: (role: Role) => Promise<void>
}

export const test = base.extend<AuthFixtures>({
  signInAs: async ({ page }, use) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- Playwright's fixture callback, not a React hook
    await use(async (role: Role) => {
      const accessToken = await getAccessToken(role)
      await page.goto('/backgroundsignin')
      await page.locator('textarea[name="accessToken"]').fill(accessToken)
      await page.locator('input[type="submit"]').click()
    })
  },
})

export { expect } from '@playwright/test'
