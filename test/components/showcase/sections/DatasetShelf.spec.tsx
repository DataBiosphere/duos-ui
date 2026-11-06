import '@testing-library/jest-dom/vitest'
import React from 'react'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ShowcaseHandoffs } from 'src/components/showcase/handoffs'
import {
  DATASETS_FAILED_TEXT,
  DATASETS_LOADING_TEXT,
  RETRY_FALLBACK_SECONDS,
  retryWaitText,
  SEE_ALL_LABEL,
  TRY_AGAIN_LABEL,
} from 'src/components/showcase/sections/DatasetShelf'
import { type SectionRegistry, sectionRegistry } from 'src/components/showcase/sectionRegistry'
import { ShowcaseTemplate } from 'src/components/showcase/ShowcaseTemplate'
import { lookupShowcaseDatasets, ShowcaseLookupError } from 'src/libs/ajax/ShowcaseCatalog'
import { resolveShowcase } from 'src/showcases/defaults'
import { ShowcaseConfigSchema } from 'src/showcases/schema'
import type { DatasetSummaryInput, RegistryEntry, ShowcaseConfig, ShowcasePartialInput } from 'src/types/showcase'

vi.mock('src/libs/ajax/ShowcaseCatalog', async importOriginal => ({
  ...await importOriginal<typeof import('src/libs/ajax/ShowcaseCatalog')>(),
  lookupShowcaseDatasets: vi.fn(),
}))

const lookup = vi.mocked(lookupShowcaseDatasets)

const showcase: RegistryEntry = { key: 'quillmere', title: 'Quillmere Data Showcase', status: 'live', flagship: false, order: 1 }
const registry: SectionRegistry = { 'latest-data-releases': sectionRegistry['latest-data-releases'] }
const LIVE: ShowcaseHandoffs = { enabled: true, signedIn: true }
const TITLE = 'Latest data releases'

const dataset = (n: number, overrides: Partial<DatasetSummaryInput> = {}): DatasetSummaryInput => ({
  identifier: `DUOS-00000${n}` as DatasetSummaryInput['identifier'],
  title: `Cohort ${n}`,
  accessManagement: 'controlled',
  dacName: 'Example DAC',
  consentCodes: ['GRU'],
  participantCount: 100 * n,
  availableDate: '2026-10-01',
  accessUrl: null,
  ...overrides,
})

type Latest = Extract<NonNullable<ShowcasePartialInput['sections']>['latest-data-releases'], { enabled: true }>

const configWith = (latest: Partial<Latest> = {}): ShowcaseConfig =>
  ShowcaseConfigSchema.parse(resolveShowcase({
    sections: { 'latest-data-releases': { enabled: true, ranking: 'newest', ...latest } } as ShowcasePartialInput['sections'],
  }))

const renderShelf = (config = configWith()) => render(
  <MemoryRouter>
    <ShowcaseTemplate entry={showcase} config={config} handoffs={LIVE} registry={registry} />
  </MemoryRouter>,
)

const shelf = () => document.getElementById('latest-data-releases')
const heading = () => screen.getByRole('heading', { level: 2, name: TITLE })
const cardTitles = () => (shelf() === null ? [] : within(shelf()!).queryAllByRole('article').map(card => within(card).getByRole('heading').textContent))

const pending = () => new Promise<never>(() => {})

beforeEach(() => {
  lookup.mockReset()
})

describe('latest-data-releases loading (D11)', () => {
  it('shows the heading and a skeleton, announced once as loading', () => {
    lookup.mockImplementation(pending)
    renderShelf()
    expect(shelf()).not.toBeNull()
    expect(heading()).toBeInTheDocument()
    expect(screen.getAllByRole('status').map(status => status.textContent)).toEqual([DATASETS_LOADING_TEXT])
    expect(within(shelf()!).queryAllByRole('article')).toHaveLength(0)
  })

  it('hides the skeleton cards from assistive technology', () => {
    lookup.mockImplementation(pending)
    renderShelf()
    const skeletons = shelf()!.querySelectorAll('.MuiSkeleton-root')
    expect(skeletons.length).toBeGreaterThan(0)
    skeletons.forEach(skeleton => expect(skeleton.closest('[aria-hidden="true"]')).not.toBeNull())
  })
})

describe('latest-data-releases ready', () => {
  it('asks for the newest datasets with the config scope, limit, pins and exclusions', async () => {
    lookup.mockResolvedValue({ datasets: [] } as never)
    renderShelf(configWith({ scope: { dac: ['Example DAC'] }, limit: 6, pin: ['DUOS-000002'], exclude: ['DUOS-000009'] }))
    await waitFor(() => expect(lookup).toHaveBeenCalled())
    expect(lookup).toHaveBeenCalledWith({
      mode: 'ranking',
      section: 'latest-data-releases',
      ranking: 'newest',
      scope: { dac: ['Example DAC'] },
      limit: 6,
      pin: ['DUOS-000002'],
      exclude: ['DUOS-000009'],
    }, expect.anything())
  })

  it('shows one dataset card per result, in the order Consent ranks them', async () => {
    lookup.mockResolvedValue({ datasets: [dataset(3), dataset(1), dataset(2)] } as never)
    renderShelf()
    await waitFor(() => expect(cardTitles()).toEqual(['Cohort 3', 'Cohort 1', 'Cohort 2']))
    expect(screen.queryByRole('status')).toBeNull()
    expect(heading()).toBeInTheDocument()
  })

  it('shows cards with missing fields', async () => {
    lookup.mockResolvedValue({ datasets: [dataset(1, { dacName: null, consentCodes: [], participantCount: null, availableDate: null })] } as never)
    renderShelf()
    await waitFor(() => expect(cardTitles()).toEqual(['Cohort 1']))
  })

  it('renders nothing when the shelf has no datasets', async () => {
    lookup.mockResolvedValue({ datasets: [] } as never)
    renderShelf()
    await waitFor(() => expect(lookup).toHaveBeenCalled())
    await waitFor(() => expect(shelf()).toBeNull())
  })

  it('links "See all" only when the config sets seeAllUrl (D4)', async () => {
    lookup.mockResolvedValue({ datasets: [dataset(1)] } as never)
    const { unmount } = renderShelf(configWith({ seeAllUrl: 'https://example.org/all' }))
    await waitFor(() => expect(cardTitles()).toHaveLength(1))
    const seeAll = within(shelf()!).getByRole('link', { name: SEE_ALL_LABEL })
    expect(seeAll).toHaveAttribute('href', 'https://example.org/all')
    expect(seeAll).toHaveAccessibleDescription(TITLE)
    unmount()

    renderShelf()
    await waitFor(() => expect(cardTitles()).toHaveLength(1))
    expect(within(shelf()!).queryByRole('link', { name: SEE_ALL_LABEL })).toBeNull()
  })
})

describe('latest-data-releases lookup failed (D12)', () => {
  it('keeps the heading and says the datasets can\'t load, with no mock or cached cards', async () => {
    lookup.mockRejectedValue(new ShowcaseLookupError('network', 'down'))
    renderShelf()
    expect(await screen.findByText(DATASETS_FAILED_TEXT)).toBeInTheDocument()
    expect(heading()).toBeInTheDocument()
    expect(within(shelf()!).queryAllByRole('article')).toHaveLength(0)
  })

  it('tries again, keeps focus on the shelf, and shows the cards once they load', async () => {
    const user = userEvent.setup()
    lookup.mockRejectedValueOnce(new ShowcaseLookupError('network', 'down'))
    renderShelf()
    const retry = await screen.findByRole('button', { name: TRY_AGAIN_LABEL })

    let answer: (value: unknown) => void = () => {}
    lookup.mockImplementationOnce(() => new Promise((resolve) => {
      answer = resolve
    }) as never)
    await user.click(retry)
    expect(lookup).toHaveBeenCalledTimes(2)
    expect(heading()).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent(DATASETS_LOADING_TEXT)

    answer({ datasets: [dataset(1)] })
    await waitFor(() => expect(cardTitles()).toEqual(['Cohort 1']))
    expect(heading()).toHaveFocus()
  })
})

describe('latest-data-releases too many requests (D13)', () => {
  const tooMany = (retryAfterSeconds?: number) => new ShowcaseLookupError('http', 'Too many requests', { status: 429, retryAfterSeconds })

  // Every timer is fake and real time never moves the clock, so a slow machine can't reach the
  // deadline early. findBy/waitFor need real timers, so these tests settle promises with
  // advanceTimersByTimeAsync instead.
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const tick = (seconds: number) => act(async () => {
    await vi.advanceTimersByTimeAsync(seconds * 1000)
  })

  /** Lets the lookup settle and React render, then returns "Try again". */
  const retryButton = async () => {
    await tick(0)
    return screen.getByRole('button', { name: TRY_AGAIN_LABEL })
  }

  it('turns "Try again" off for the Retry-After seconds, with a countdown, then back on', async () => {
    lookup.mockRejectedValueOnce(tooMany(3))
    renderShelf()
    const retry = await retryButton()
    expect(retry).toHaveAttribute('aria-disabled', 'true')
    expect(retry).toHaveAccessibleDescription(retryWaitText(3))

    await tick(1)
    expect(retry).toHaveAccessibleDescription(retryWaitText(2))

    await tick(2)
    expect(retry).not.toHaveAttribute('aria-disabled', 'true')
    expect(screen.queryByText(retryWaitText(1))).toBeNull()
  })

  it('ignores a press while the countdown runs, and tries again after it', async () => {
    lookup.mockRejectedValueOnce(tooMany(2))
    renderShelf()
    const retry = await retryButton()
    fireEvent.click(retry)
    expect(lookup).toHaveBeenCalledTimes(1)

    await tick(2)
    lookup.mockResolvedValueOnce({ datasets: [dataset(1)] } as never)
    fireEvent.click(retry)
    expect(lookup).toHaveBeenCalledTimes(2)
    await tick(0)
    expect(cardTitles()).toEqual(['Cohort 1'])
  })

  it(`counts down ${RETRY_FALLBACK_SECONDS} seconds when the browser can't read Retry-After`, async () => {
    lookup.mockRejectedValueOnce(tooMany(undefined))
    renderShelf()
    const retry = await retryButton()
    expect(retry).toHaveAccessibleDescription(retryWaitText(RETRY_FALLBACK_SECONDS))
    await tick(RETRY_FALLBACK_SECONDS - 1)
    expect(retry).toHaveAttribute('aria-disabled', 'true')
    await tick(1)
    expect(retry).not.toHaveAttribute('aria-disabled', 'true')
  })

  it('keeps "Try again" on for any other failure', async () => {
    lookup.mockRejectedValueOnce(new ShowcaseLookupError('http', 'Server error', { status: 503 }))
    renderShelf()
    const retry = await retryButton()
    expect(retry).not.toHaveAttribute('aria-disabled', 'true')
    expect(retry).not.toHaveAccessibleDescription()
  })
})
