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
  for (const href of ['#consent', '#sam']) {
    await expect(
      page.locator(`a[href="${href}"]`).locator('xpath=..').locator('[data-testid="status-healthy"]'),
    ).toBeVisible({ timeout: 15000 })
  }
  await expect(
    page.locator('a[href="#ecm"]').locator('xpath=..').locator('[data-testid^="status-"]'),
  ).toBeVisible({ timeout: 15000 })
})
