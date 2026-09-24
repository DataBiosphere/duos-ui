import { test, expect, ROLES } from './support/auth'
import type { Role } from './support/auth'

// Each role's console, per headerTabsConfig in src/components/DuosHeader.tsx.
const CONSOLE_LABEL: Record<Role, string> = {
  ADMIN: 'Admin Console',
  CHAIR: 'DAC Console',
  MEMBER: 'DAC Console',
  RESEARCHER: 'Researcher Console',
  SIGNING_OFFICIAL: 'SO Console',
}

for (const role of ROLES) {
  test(`Background sign-in as ${role}`, async ({ page, signInAs }) => {
    await signInAs(role)
    await expect(page.getByText(CONSOLE_LABEL[role]).first()).toBeVisible()
    // The BFF holds the token server-side; the browser keeps only the session cookie.
    const cookie = (await page.context().cookies()).find(cookie => cookie.name === 'sessionId')
    expect(cookie).toMatchObject({ httpOnly: true, secure: true })
    expect(await page.evaluate(() => localStorage.getItem('OidcUser'))).toBeNull()

    await page.locator('#sel_user').click()
    await page.getByText('Sign out').click()

    await expect(page).toHaveURL(/\/home/)
    await expect(page.getByText('Sign In').first()).toBeVisible()
  })
}
