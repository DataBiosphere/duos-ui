import { test, expect, type Page, type Route } from '@playwright/test'
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

  test('shows the onboarding link once its target section is on the page, and it jumps there', async ({ page }) => {
    await page.goto(`/showcase/${E2E_PARTNER.key}`)
    // A public link, so it opens whether or not this build turns the DUOS handoffs on.
    await expect(page.getByRole('link', { name: 'About DUOS' })).toBeVisible()
    await page.getByRole('link', { name: 'Start in a workspace' }).click()
    await expect(page).toHaveURL(/#featured-workspaces$/)
    await expect(page.locator('#featured-workspaces')).toBeInViewport()
  })
})

// A showcase lookup for one section: same-origin `/public/showcase/datasets` in BFF mode, and the
// configured `showcaseApiUrl` cross-origin in legacy mode, which also needs CORS and a preflight
// answer. Other lookups go on to the catalog the build reaches.
const stubLookup = (page: Page, section: string, answer: () => { status: number, body: unknown }) =>
  page.route(url => url.pathname.endsWith('/showcase/datasets'), async (route: Route) => {
    const request = route.request()
    const origin = await request.headerValue('origin')
    const cors: Record<string, string> = origin === null ? {} : { 'access-control-allow-origin': origin, 'vary': 'Origin' }
    if (request.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: { ...cors, 'access-control-allow-methods': 'POST', 'access-control-allow-headers': 'content-type, accept' } })
    }
    if (!(request.postData() ?? '').includes(`"${section}"`)) return route.fallback()
    const { status, body } = answer()
    return route.fulfill({ status, headers: cors, contentType: 'application/json', body: JSON.stringify(body) })
  })

test.describe('the latest data releases shelf (S3.3)', () => {
  const datasets = [
    { identifier: 'DUOS-000901', title: 'Synthetic Newest Cohort', accessManagement: 'controlled', dacName: 'Synthetic DAC', consentCodes: ['GRU'], participantCount: 1200, availableDate: '2026-10-01', accessUrl: null },
    { identifier: 'DUOS-000902', title: 'Synthetic Open Cohort', accessManagement: 'open', dacName: null, consentCodes: ['GRU'], participantCount: null, availableDate: '2026-09-01', accessUrl: 'https://example.org/open-cohort' },
  ]

  const stubLatest = (page: Page, answer: () => { status: number, body: unknown }) => stubLookup(page, 'latest-data-releases', answer)

  const shelf = (page: Page) => page.locator('#latest-data-releases')

  test('shows a card for each dataset, with its action', async ({ page }) => {
    await stubLatest(page, () => ({ status: 200, body: { datasets } }))
    await page.goto(`/showcase/${E2E_PARTNER.key}`)
    await expect(shelf(page).getByRole('heading', { level: 2, name: 'Latest data releases' })).toBeVisible()
    await expect(shelf(page).getByRole('article')).toHaveCount(2)
    // "Request access" is a DUOS handoff, a link only when this build turns the handoffs on.
    await expect(shelf(page).getByText(/Request access/)).toBeVisible()
    await expect(shelf(page).getByRole('link', { name: 'Open provider site' })).toHaveAttribute('href', 'https://example.org/open-cohort')
  })

  test('says the datasets can\'t load, and tries again', async ({ page }) => {
    let fail = true
    await stubLatest(page, () => (fail ? { status: 503, body: { message: 'down' } } : { status: 200, body: { datasets } }))
    await page.goto(`/showcase/${E2E_PARTNER.key}`)
    await expect(shelf(page).getByText('These datasets can\'t be loaded right now.')).toBeVisible()
    fail = false
    await shelf(page).getByRole('button', { name: 'Try again' }).click()
    await expect(shelf(page).getByRole('article')).toHaveCount(2)
  })
})

test.describe('the open access datasets shelf (S3.3)', () => {
  test('shows the curated open dataset, linked straight to its provider', async ({ page }) => {
    const openCohort = { identifier: 'DUOS-000902', title: 'Synthetic Open Cohort', accessManagement: 'open', dacName: null, consentCodes: ['GRU'], participantCount: null, availableDate: '2026-09-01', accessUrl: 'https://example.org/open-cohort' }
    await stubLookup(page, 'open-access-datasets', () => ({ status: 200, body: { datasets: [openCohort] } }))
    await page.goto(`/showcase/${E2E_PARTNER.key}`)
    const shelf = page.locator('#open-access-datasets')
    await expect(shelf.getByRole('heading', { level: 2, name: 'Open access datasets' })).toBeVisible()
    await expect(shelf.getByRole('article')).toHaveCount(1)
    await expect(shelf.getByRole('link', { name: 'Open provider site' })).toHaveAttribute('href', 'https://example.org/open-cohort')
  })
})

test.describe('the analysis apps (S3.4)', () => {
  const apps = (page: Page) => page.locator('#featured-tools')

  test('shows the featured app first, then the app grid', async ({ page }) => {
    await page.goto(`/showcase/${E2E_PARTNER.key}`)
    await expect(apps(page).getByRole('heading', { level: 2, name: 'Analysis Apps' })).toBeVisible()
    await expect(apps(page).getByRole('heading', { level: 3 })).toHaveText(['Synthetic Notebooks', 'Synthetic Viewer', 'DUOS status'])
    await expect(apps(page).locator('[data-variant="featured"]')).toHaveCount(1)
  })

  test('opens the intended resource from each launch link', async ({ page }) => {
    await page.route('https://example.org/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>Synthetic resource</title>' }))
    await page.goto(`/showcase/${E2E_PARTNER.key}`)
    await apps(page).getByRole('article', { name: 'Synthetic Notebooks' }).getByRole('link', { name: 'Launch' }).click()
    await expect(page).toHaveURL('https://example.org/notebooks')
    await page.goBack()
    await apps(page).getByRole('article', { name: 'DUOS status' }).getByRole('link', { name: 'Launch' }).click()
    await expect(page).toHaveURL(/\/status$/)
  })

  test('moves with Tab from the featured app\'s links to the grid\'s', async ({ page }) => {
    await page.goto(`/showcase/${E2E_PARTNER.key}`)
    await apps(page).getByRole('heading', { level: 2, name: 'Analysis Apps' }).scrollIntoViewIfNeeded()
    const links = apps(page).getByRole('link')
    await links.first().focus()
    await expect(links.first()).toHaveAttribute('href', 'https://example.org/notebooks')
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toHaveAttribute('href', 'https://example.org/notebooks/docs')
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toHaveAttribute('href', 'https://example.org/viewer')
  })
})

test.describe('the workspaces shelf (S3.4)', () => {
  const shelf = (page: Page) => page.locator('#featured-workspaces')

  test('shows each workspace in config order, in its own shelf', async ({ page }) => {
    await page.goto(`/showcase/${E2E_PARTNER.key}`)
    await expect(shelf(page).getByRole('heading', { level: 2, name: 'Workspaces' })).toBeVisible()
    await expect(shelf(page).getByRole('heading', { level: 3 })).toHaveText(['Synthetic GWAS Workspace', 'Synthetic RNA Workspace', 'Synthetic Imaging Workspace'])
  })

  test('opens the intended workspace from its launch link', async ({ page }) => {
    await page.route('https://example.org/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>Synthetic workspace</title>' }))
    await page.goto(`/showcase/${E2E_PARTNER.key}`)
    await shelf(page).getByRole('article', { name: 'Synthetic GWAS Workspace' }).getByRole('link', { name: 'Launch' }).click()
    await expect(page).toHaveURL('https://example.org/workspaces/gwas')
  })

  test('gives a workspace card without an image the same media box as one with an image', async ({ page }) => {
    await page.goto(`/showcase/${E2E_PARTNER.key}`)
    const frames = shelf(page).locator('.showcase-card__media-frame')
    await expect(frames).toHaveCount(3)
    await expect(frames.first().locator('img')).toHaveCount(1)
    const heights = await frames.evaluateAll(elements => elements.map(element => Math.round(element.getBoundingClientRect().height)))
    expect(heights[0]).toBeGreaterThan(0)
    expect(new Set(heights).size).toBe(1)
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
