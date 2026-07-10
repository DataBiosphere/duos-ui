import { test, expect } from '@playwright/test'

test('Status page loads from home', async ({ page }) => {
  await page.goto('/')
  await page.getByText('Status').click()
  await expect(page).toHaveURL(/status/)
})

test('Status page renders status indicators', async ({ page }) => {
  await page.goto('/')
  await page.getByText('Status').click()
  await expect(page.locator('#consent')).toBeVisible()
  await expect(
    page.locator('[data-testid="status-healthy"], [data-testid="status-unhealthy"]').first(),
  ).toBeVisible({ timeout: 15000 })
})
