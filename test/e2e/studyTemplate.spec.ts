import { test, expect } from './support/auth'
import type { Page } from '@playwright/test'

/*
 * The only coverage that crosses the HTTP boundary: StudyTemplateUpload.spec.tsx mocks the ajax
 * layer. Stops at draft navigation because creating a study would leave a permanent record in dev
 * on every run, and DataSubmissionFormV2.modes.spec.tsx already covers past that point.
 */

const FIXTURES = 'test/fixtures/study-template/v1'
const UPLOAD_PATH = '/data_submission_template'
const DRAFT_URL = /\/data_submission_form\/draft\/study-dataset\/([0-9a-f-]+)$/

// ADMIN, not CHAIR: the auth spec proves Admin (its console renders on isAdmin alone) where DAC
// Console renders for Member too. RoleBAC denies by rendering NotFound at the same URL.
const ROLE = 'ADMIN' as const

const chooseFile = async (page: Page, fixture: string) => {
  await page.locator('#study-template-file').setInputFiles(`${FIXTURES}/${fixture}`)
}

const validate = async (page: Page) => {
  await page.locator('#validate-template-btn').click()
}

/** Drafts persist in dev, so a run that creates one removes it rather than leaving it behind. */
const deleteDraft = async (page: Page, draftUuid: string) => {
  const status = await page.evaluate(async (uuid) => {
    const stored = localStorage.getItem('OidcUser')
    const user = stored ? JSON.parse(stored) : {}
    const token = user?.profile?.idp_access_token ?? user?.id_token
    const config = await (await fetch('/config.json')).json()
    const response = await fetch(`${config.apiUrl}/api/draft/v1/${uuid}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.status
  }, draftUuid)
  expect(status, `cleanup of draft ${draftUuid} failed`).toBeLessThan(400)
}

test.describe('study template validation', () => {
  test.beforeEach(async ({ page, signInAs }) => {
    await signInAs(ROLE)
    await page.goto(UPLOAD_PATH)
    // RoleBAC redirects rather than erroring, so a role that cannot reach the page shows up here
    // as a changed URL rather than as a missing element further down.
    await expect(page).toHaveURL(new RegExp(`${UPLOAD_PATH}$`))
    // TableHeaderSection renders its title in a div, so the page's first real heading is this one.
    await expect(page.getByRole('heading', { name: '1. Start from the blank template' })).toBeVisible()
  })

  test('reports the errors Consent found and creates no draft', async ({ page }) => {
    await chooseFile(page, 'invalid/unknown-field.csv')
    await validate(page)

    // The fixture's single error, per its .errors.json in consent: row 2, column field.
    await expect(page.getByRole('heading', { name: 'Your template has 1 error' })).toBeVisible()
    await expect(page.getByText('Unknown study field: studyColour')).toBeVisible()
    await expect(page.getByText('Row 2, column field')).toBeVisible()

    // An invalid template is a completed result, not a failure: the user stays here to fix it.
    await expect(page).toHaveURL(new RegExp(`${UPLOAD_PATH}$`))
    await expect(page.locator('#validate-template-btn')).toBeEnabled()
  })

  test('clears the errors when the rejected file is removed', async ({ page }) => {
    await chooseFile(page, 'invalid/unknown-field.csv')
    await validate(page)
    await expect(page.getByText('Unknown study field: studyColour')).toBeVisible()

    await page.getByRole('button', { name: 'Remove unknown-field.csv' }).click()

    await expect(page.getByText('Unknown study field: studyColour')).toBeHidden()
    await expect(page.locator('#validate-template-btn')).toBeDisabled()
  })

  test('creates a draft from a valid template and navigates to it', async ({ page }) => {
    await chooseFile(page, 'valid/minimal-valid.csv')
    await validate(page)

    await expect(page).toHaveURL(DRAFT_URL)

    const draftUuid = DRAFT_URL.exec(page.url())?.[1]
    expect(draftUuid, 'draft UUID missing from the URL').toBeTruthy()

    await deleteDraft(page, draftUuid!)
  })

  test('validates a replacement after a rejection without reloading', async ({ page }) => {
    await chooseFile(page, 'invalid/unknown-field.csv')
    await validate(page)
    await expect(page.getByText('Unknown study field: studyColour')).toBeVisible()

    await chooseFile(page, 'valid/minimal-valid.csv')
    await validate(page)

    await expect(page).toHaveURL(DRAFT_URL)

    const draftUuid = DRAFT_URL.exec(page.url())?.[1]
    expect(draftUuid, 'draft UUID missing from the URL').toBeTruthy()

    await deleteDraft(page, draftUuid!)
  })
})
