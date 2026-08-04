import { test, expect } from '@playwright/test'

test('Home page loads correctly', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('DUOS').first()).toBeVisible()
  await expect(page.getByText('Sign In').first()).toBeVisible()
  await expect(page.getByText('How does DUOS expedite compliant data sharing?')).toBeVisible()
  await expect(page.getByText('DUOS for DACs')).toBeVisible()
  await expect(page.getByText('Looking for data')).toBeVisible()
  await expect(page.getByText('Data Libraries in DUOS')).toBeVisible()
  await expect(page.locator('#blog-support-dac-link')).toHaveAttribute('href', 'https://duos.blog/help/dacguide/')
  await expect(page.locator('#blog-support-so-link')).toHaveAttribute('href', 'https://duos.blog/help/signingofficialguide/')
})
