import { test, expect, signOutThroughMock } from './support/mockProvider'
import { expectSignInPage } from './support/session'

// The masthead search handoff (DT-4354, S3.2), end to end against the mock provider: an anonymous
// visitor searches from the public flagship page, signs in, and lands on the data library with
// the same search. The synthetic flagship (test/e2e/showcase) turns the masthead on. The mock
// server's showcase lookup and API use the same mock Consent, so the server turns handoffs on.

const SEARCH = 'heart & lung'
const LIBRARY_RETURN_PATH = `/datalibrary?${new URLSearchParams({ query: SEARCH }).toString()}`

test('a masthead search survives sign-in and lands on the library with the same query', async ({ page, mockScenario }) => {
  await page.goto('/data')
  const search = page.getByRole('searchbox', { name: 'Search DUOS datasets' })
  await expect(search).toHaveAccessibleDescription('Sign-in required')
  await search.fill(SEARCH)
  await search.press('Enter')

  await expectSignInPage(page, LIBRARY_RETURN_PATH)
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()

  await expect(page).toHaveURL(url => url.pathname === '/datalibrary' && url.searchParams.get('query') === SEARCH)
  expect(await mockScenario.stats()).toMatchObject({ authorizations: 1, codeGrants: 1 })

  await signOutThroughMock(page)
})
