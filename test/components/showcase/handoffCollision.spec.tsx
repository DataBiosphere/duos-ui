import '@testing-library/jest-dom/vitest'
import React from 'react'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DatasetSummaryInput, RegistryEntry, ShowcasePartialInput } from 'src/types/showcase'

/**
 * The cross-environment collision case (DT-4358; delivery plan section 3, "Dataset identifiers
 * across environments"). `DUOS-` identifiers come from a sequence in each environment, so one
 * identifier can name different datasets in production and dev. A local preview whose
 * `config.json` was copied from dev says `showcaseHandoffsEnabled: true`, and `pnpm start` serves
 * it as it is. With the lookup at production, the card shows the production record, and its
 * request action must not link to dev's `/dataset/<identifier>`.
 *
 * This runs the real config.json reader, `loadShowcase` and page; only the index, the lookup and the
 * session are stand-ins.
 */

const DEV = 'https://consent.dsde-dev.broadinstitute.org'
const PROD = 'https://consent.dsde-prod.broadinstitute.org'
const IDENTIFIER = 'DUOS-000123'

const partner: RegistryEntry = { key: 'collision-partner', title: 'Collision Partner Data', status: 'live', flagship: false, order: 1 }

vi.mock('src/showcases', () => ({
  showcaseEntries: [partner],
  showcaseConfigs: {
    'collision-partner': { sections: { 'latest-data-releases': { enabled: true, ranking: 'newest' } } } satisfies ShowcasePartialInput,
  },
  retiredShowcaseKeys: [],
}))
vi.mock('src/libs/ajax/ShowcaseCatalog', async importOriginal => ({
  ...await importOriginal<typeof import('src/libs/ajax/ShowcaseCatalog')>(),
  lookupShowcaseDatasets: vi.fn(),
}))
vi.mock('src/hooks/useSession', () => ({ useUserIsLogged: vi.fn(() => true) }))
vi.mock('src/pages/NotFound', () => ({ default: () => <div>Not found</div> }))

/** The record each environment's catalog holds under the same identifier. */
const RECORDS: Record<string, DatasetSummaryInput> = {
  [PROD]: { identifier: IDENTIFIER, title: 'Production Cohort', accessManagement: 'controlled', dacName: 'Production DAC', consentCodes: ['GRU'], participantCount: 500, availableDate: '2026-10-01', accessUrl: null },
  [DEV]: { identifier: IDENTIFIER, title: 'Dev Test Cohort', accessManagement: 'controlled', dacName: 'Dev DAC', consentCodes: ['GRU'], participantCount: 5, availableDate: '2026-10-01', accessUrl: null },
}

/** Loads the page with a legacy-mode config.json whose lookup reads `lookupOrigin`. */
const renderWith = async (lookupOrigin: string) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    json: () => Promise.resolve({
      env: 'dev',
      apiUrl: DEV,
      bffEnabled: false,
      showcaseEnabled: true,
      showcaseApiUrl: lookupOrigin,
      // Copied from a deployed dev config.json, where the server derived it.
      showcaseHandoffsEnabled: true,
    }),
  }))
  const { lookupShowcaseDatasets } = await import('src/libs/ajax/ShowcaseCatalog')
  vi.mocked(lookupShowcaseDatasets).mockResolvedValue({ datasets: [RECORDS[lookupOrigin]] } as never)
  const { ShowcasePage } = await import('src/components/showcase/ShowcasePage')
  render(
    <MemoryRouter initialEntries={[`/showcase/${partner.key}`]}>
      <Routes>
        <Route path="/showcase/:key" element={<ShowcasePage route="key" />} />
      </Routes>
    </MemoryRouter>,
  )
  return screen.findByRole('article')
}

const datasetLinks = () => Array.from(document.querySelectorAll<HTMLAnchorElement>(`a[href="/dataset/${IDENTIFIER}"]`))

describe(`one identifier, ${IDENTIFIER}, in two environments`, () => {
  beforeEach(() => {
    // config.json is cached for the module's life, so each case loads it fresh.
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the production record without a link into dev when the lookup reads production', async () => {
    const card = await renderWith(PROD)
    expect(within(card).getByRole('heading')).toHaveTextContent('Production Cohort')
    expect(within(card).getByText(/Request access/)).toBeInTheDocument()
    expect(datasetLinks()).toEqual([])
    expect(screen.getByRole('note')).toHaveTextContent('content preview with production data')
  })

  it('links the request action when the lookup and the dataset page read the same Consent', async () => {
    const card = await renderWith(DEV)
    expect(within(card).getByRole('heading')).toHaveTextContent('Dev Test Cohort')
    expect(datasetLinks()).toHaveLength(1)
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
  })
})
