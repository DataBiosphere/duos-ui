import { test, expect } from '@playwright/test'

const ABOUT_HREF = 'https://duos.blog/aboutduos/'

test('About link is correct on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 2000, height: 2000 })
  await page.goto('/')
  await expect(page.locator('#link_about').first()).toHaveAttribute('href', ABOUT_HREF)
})

test('About link is correct on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 600 })
  await page.goto('/')
  await page.locator('#navbar-menu-icon').click()
  await expect(page.locator('#link_about').first()).toHaveAttribute('href', ABOUT_HREF)
})
