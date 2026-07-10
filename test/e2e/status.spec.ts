import { test, expect } from '@playwright/test'

test('Status page loads from home', async ({ page }) => {
  await page.goto('/')
  await page.getByText('Status').click()
  await expect(page).toHaveURL(/status/)
})

test('Status page renders status indicators', async ({ page }) => {
  // This suite has no live backend (public/config.json's apiUrl is empty), so the app's
  // API call to /status is mocked to a known-healthy response - otherwise the fetch fails and
  // both indicators always render unhealthy, regardless of what the app is actually doing.
  // The page itself is also served from /status (a plain <a href> full navigation, not a
  // client-side route), so only intercept the API fetch, not the document navigation.
  await page.route('**/status', (route) => {
    if (route.request().resourceType() === 'document') return route.continue()
    return route.fulfill({
      json: {
        ok: true,
        degraded: false,
        systems: { sam: { healthy: true, details: { ok: true } } },
      },
    })
  })

  await page.goto('/')
  await page.getByText('Status').click()
  await expect(page.locator('#consent')).toBeVisible()
  for (const href of ['#consent', '#sam']) {
    await expect(
      page.locator(`a[href="${href}"]`).locator('xpath=..').locator('[data-testid="status-healthy"]'),
    ).toBeVisible({ timeout: 15000 })
  }
})
