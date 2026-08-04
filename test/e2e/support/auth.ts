import { auth, JWT } from 'google-auth-library'
import { test as base, expect } from '@playwright/test'
import { BASE_URL } from './baseUrl'

export const ROLES = ['ADMIN', 'CHAIR', 'MEMBER', 'RESEARCHER', 'SIGNING_OFFICIAL'] as const
export type Role = typeof ROLES[number]

// Google-signed access token from a per-role service account key (no interactive
// OIDC redirect needed), for submission into the app's /backgroundsignin route.
export const getAccessToken = async (role: Role): Promise<string> => {
  const envVar = `DUOS_AUTOMATION_${role}_SA`
  const keysJson = process.env[envVar]
  if (!keysJson) {
    throw new Error(`Missing service account key env var ${envVar}`)
  }

  // DUOS_AUTOMATION_*_SA holds whatever Secret Manager returns for these accounts, which
  // is the service account key JSON wrapped in a { key: {...} } envelope, not the bare key.
  const parsed = JSON.parse(keysJson)
  const serviceAccountKey = parsed.key ?? parsed

  // fromJSON's return type covers every credential shape it supports, but a service
  // account key (what DUOS_AUTOMATION_*_SA holds) always yields a JWT client.
  const client = auth.fromJSON(serviceAccountKey) as JWT
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
    // oxlint-disable-next-line react-hooks/rules-of-hooks -- Playwright's fixture callback, not a React hook
    await use(async (role: Role) => {
      const accessToken = await getAccessToken(role)
      await page.goto('/backgroundsignin')
      await page.locator('textarea[name="accessToken"]').fill(accessToken)
      await page.locator('input[type="submit"]').click()
      // Sign-in redirects client-side to whichever console the role lands on
      // (Navigation.console), so assert we've left this page rather than guessing the
      // destination or waiting on network idle.
      await expect(page).not.toHaveURL(/backgroundsignin/)
    })
  },
})

export { expect } from '@playwright/test'
