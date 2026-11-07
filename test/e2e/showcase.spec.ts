import { test, expect, type Page } from '@playwright/test'
import { E2E_FLAGSHIP, E2E_HIDDEN, E2E_PARTNER } from './showcase/entries'
import { bannerFeed, collectViolations, drainViolations, expectServerPolicy } from './support/csp'

// The public showcase pages (DT-4424), served from the synthetic index that `pnpm run build:e2e`
// compiles in. This spec runs in two projects: `chromium` (bffEnabled on) and `legacy` (off).
// Section-level checks (section headings, shelf arrows, reduced motion) come with the first
// section renderer (S3.3).

// `description` is the hero subtitle, which ShowcasePage uses as the meta description.
const SHOWCASES = [
  { entry: E2E_FLAGSHIP, path: '/data', description: undefined },
  { entry: E2E_PARTNER, path: `/showcase/${E2E_PARTNER.key}`, description: 'A synthetic partner showcase' },
]

const NOT_FOUND = 'Sorry, the page you were looking for was not found.'

const showcaseHeading = (page: Page) => page.locator('main').getByRole('heading', { level: 1 })

const overflowsSideways = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)

for (const { entry, path, description } of SHOWCASES) {
  test.describe(`${path} (${entry.key})`, () => {
    test('loads signed out, without a sign-in redirect or a CSP violation', async ({ page, request }, testInfo) => {
      const bannersFetched = await bannerFeed(request)
      const violations = await collectViolations(page)
      const paths: string[] = []
      page.on('request', sent => paths.push(new URL(sent.url()).pathname))

      // Registered before navigation, so the header's banner fetch can't finish unseen.
      const bannersLoaded = page.waitForResponse(bannersFetched)
      expectServerPolicy(await page.goto(path))
      await expect(showcaseHeading(page)).toHaveText(entry.title)
      await bannersLoaded
      expect(new URL(page.url()).pathname).toBe(path)
      await expect(page).toHaveTitle(`${entry.title} | DUOS`)
      const meta = page.locator('meta[name="description"]')
      if (description === undefined) await expect(meta).toHaveCount(0)
      else await expect(meta).toHaveAttribute('content', description)
      expect(await drainViolations(page, violations)).toEqual([])

      if (testInfo.project.name === 'legacy') {
        // The legacy client never asks the BFF for a session.
        expect(paths).not.toContain('/auth/me')
      }
    })

    test('has one h1 inside <main>, and the skip link moves focus to it', async ({ page }) => {
      await page.goto(path)
      await expect(page.locator('main')).toHaveCount(1)
      await expect(page.locator('h1')).toHaveCount(1)
      await expect(showcaseHeading(page)).toHaveText(entry.title)

      const skip = page.getByRole('link', { name: 'Skip to main content' })
      await skip.focus()
      await expect(skip).toBeVisible()
      await skip.press('Enter')
      await expect(showcaseHeading(page)).toBeFocused()
      // Chromium focuses a hash target on its own; an unchanged URL shows the click handler moved focus.
      expect(new URL(page.url()).hash).toBe('')
    })

    // 390px is a common phone width; 640px is a 1280px window at 200% zoom.
    for (const width of [390, 640]) {
      test(`does not scroll sideways at ${width}px`, async ({ page, request }) => {
        // The header renders the banner feed after the page loads, and a long
        // banner can be the widest thing on it, so measure once it's in.
        const bannersLoaded = page.waitForResponse(await bannerFeed(request))
        await page.setViewportSize({ width, height: 800 })
        await page.goto(path)
        await expect(showcaseHeading(page)).toBeVisible()
        await bannersLoaded
        // Two frames: React renders the fetched banners, then the browser lays them out.
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
        expect(await overflowsSideways(page)).toBe(false)
      })
    }
  })
}

test.describe('the partner hero (S3.3)', () => {
  test('shows one announcement at a time, and the controls move between them', async ({ page }) => {
    await page.goto(`/showcase/${E2E_PARTNER.key}`)
    const announcements = page.getByRole('region', { name: 'Announcements' })
    await expect(announcements.getByRole('link')).toHaveText('First synthetic announcement')
    await expect(announcements.getByText('1 of 2')).toBeVisible()
    await announcements.getByRole('button', { name: 'Next announcement' }).click()
    await expect(announcements.getByRole('link')).toHaveText('Second synthetic announcement')
    await expect(announcements.getByText('2 of 2')).toBeVisible()
  })

  test('hides the onboarding link whose target section is not on the page', async ({ page }) => {
    await page.goto(`/showcase/${E2E_PARTNER.key}`)
    // A public link, so it opens whether or not this build turns the DUOS handoffs on.
    await expect(page.getByRole('link', { name: 'About DUOS' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Start in a workspace' })).toHaveCount(0)
  })
})

test.describe('refused showcase URLs', () => {
  /** The visible not-found text and the document title, the two places a refused key could show. */
  const notFoundPage = async (page: Page, path: string) => {
    await page.goto(path)
    const notFound = page.locator('[data-cy="not-found"]')
    await expect(notFound).toContainText(NOT_FOUND)
    expect(new URL(page.url()).pathname).toBe(path)
    await expect(page.locator('main')).toHaveCount(0)
    return { text: await notFound.innerText(), title: await page.title() }
  }

  test('a hidden key, an unknown key and the flagship\'s own key give the same not-found page', async ({ page }) => {
    const unknown = await notFoundPage(page, '/showcase/no-such-showcase')
    expect(unknown.title).toBe('DUOS')
    expect(await notFoundPage(page, `/showcase/${E2E_HIDDEN.key}`)).toEqual(unknown)
    // The flagship is served at /data only.
    expect(await notFoundPage(page, `/showcase/${E2E_FLAGSHIP.key}`)).toEqual(unknown)
  })

  test('/showcase with no key, or with extra segments, reaches the app\'s not-found route', async ({ page }) => {
    const unknown = await notFoundPage(page, '/showcase/no-such-showcase')
    for (const path of ['/showcase', `/showcase/${E2E_PARTNER.key}/extra`]) {
      expect(await notFoundPage(page, path)).toEqual(unknown)
    }
  })
})
