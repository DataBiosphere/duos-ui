import { test, expect } from '@playwright/test'

test('liveness page loads', async ({ page }) => {
  await page.goto('/liveness')
  await expect(page.getByText('DUOS is healthy!')).toBeVisible()
})
