import '@testing-library/jest-dom/vitest'
import React from 'react'
import { screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OPEN_PROVIDER_LABEL } from 'src/components/showcase/primitives/DatasetCard'
import { type SectionRegistry, sectionRegistry } from 'src/components/showcase/sectionRegistry'
import { ShowcaseTemplate } from 'src/components/showcase/ShowcaseTemplate'
import { lookupShowcaseDatasets } from 'src/libs/ajax/ShowcaseCatalog'
import { resolveShowcase } from 'src/showcases/defaults'
import { ShowcaseConfigSchema } from 'src/showcases/schema'
import type { DatasetSummaryInput, RegistryEntry, ShowcaseConfig, ShowcasePartialInput } from 'src/types/showcase'
import { renderWithRouter } from '../../../test-utils'

// `open-access-datasets` is curated (`items`) or computed (`ranking`), chosen per showcase. It
// renders with the same DatasetShelf as `latest-data-releases`, whose states DatasetShelf.spec covers.

vi.mock('src/libs/ajax/ShowcaseCatalog', async importOriginal => ({
  ...await importOriginal<typeof import('src/libs/ajax/ShowcaseCatalog')>(),
  lookupShowcaseDatasets: vi.fn(),
}))

const lookup = vi.mocked(lookupShowcaseDatasets)

const showcase: RegistryEntry = { key: 'quillmere', title: 'Quillmere Data Showcase', status: 'live', flagship: false, order: 1 }
const registry: SectionRegistry = { 'open-access-datasets': sectionRegistry['open-access-datasets'] }
const TITLE = 'Open access datasets'

const open = (n: number): DatasetSummaryInput => ({
  identifier: `DUOS-00000${n}` as DatasetSummaryInput['identifier'],
  title: `Open Cohort ${n}`,
  accessManagement: 'open',
  dacName: null,
  consentCodes: ['GRU'],
  participantCount: null,
  availableDate: '2026-01-01',
  accessUrl: `https://data.example.org/${n}`,
})

const configWith = (openAccess: Record<string, unknown>): ShowcaseConfig =>
  ShowcaseConfigSchema.parse(resolveShowcase({
    sections: { 'open-access-datasets': { enabled: true, ...openAccess } } as ShowcasePartialInput['sections'],
  }))

const renderShelf = (config: ShowcaseConfig) => renderWithRouter(
  <ShowcaseTemplate entry={showcase} config={config} handoffs={{ enabled: true, signedIn: true }} registry={registry} />,
)

const shelf = () => document.getElementById('open-access-datasets')
const cardTitles = () => (shelf() === null ? [] : within(shelf()!).queryAllByRole('article').map(card => within(card).getByRole('heading').textContent))

beforeEach(() => {
  lookup.mockReset()
})

describe('open-access-datasets, curated', () => {
  it('looks up the listed datasets once each, and shows them in the listed order', async () => {
    lookup.mockResolvedValue({ datasets: [open(1), open(2), open(3)] } as never)
    renderShelf(configWith({ items: ['DUOS-000003', 'DUOS-000001', 'DUOS-000003', 'DUOS-000002'] }))
    await waitFor(() => expect(cardTitles()).toEqual(['Open Cohort 3', 'Open Cohort 1', 'Open Cohort 2']))
    expect(lookup).toHaveBeenCalledWith(
      { mode: 'identifiers', section: 'open-access-datasets', identifiers: ['DUOS-000003', 'DUOS-000001', 'DUOS-000002'] },
      expect.anything(),
    )
    expect(screen.getByRole('heading', { level: 2, name: TITLE })).toBeInTheDocument()
  })

  it('leaves out a listed dataset that Consent reports as unavailable', async () => {
    lookup.mockResolvedValue({ datasets: [open(1), { identifier: 'DUOS-000002', status: 'unavailable' }] } as never)
    renderShelf(configWith({ items: ['DUOS-000001', 'DUOS-000002'] }))
    await waitFor(() => expect(cardTitles()).toEqual(['Open Cohort 1']))
  })

  it('renders nothing when every listed dataset is unavailable', async () => {
    lookup.mockResolvedValue({ datasets: [{ identifier: 'DUOS-000002', status: 'unavailable' }] } as never)
    renderShelf(configWith({ items: ['DUOS-000002'] }))
    await waitFor(() => expect(lookup).toHaveBeenCalled())
    await waitFor(() => expect(shelf()).toBeNull())
  })

  it('makes no lookup and renders nothing with an empty list', () => {
    renderShelf(configWith({ items: [] }))
    expect(lookup).not.toHaveBeenCalled()
    expect(shelf()).toBeNull()
  })

  it('links each card straight to its provider', async () => {
    lookup.mockResolvedValue({ datasets: [open(1)] } as never)
    renderShelf(configWith({ items: ['DUOS-000001'] }))
    await waitFor(() => expect(cardTitles()).toHaveLength(1))
    expect(within(shelf()!).getByRole('link', { name: OPEN_PROVIDER_LABEL })).toHaveAttribute('href', 'https://data.example.org/1')
  })
})

describe('open-access-datasets, computed', () => {
  it('asks for the newest open datasets, and shows them in Consent\'s order', async () => {
    lookup.mockResolvedValue({ datasets: [open(2), open(1)] } as never)
    renderShelf(configWith({ ranking: 'newest', limit: 4 }))
    await waitFor(() => expect(cardTitles()).toEqual(['Open Cohort 2', 'Open Cohort 1']))
    expect(lookup).toHaveBeenCalledWith({ mode: 'ranking', section: 'open-access-datasets', ranking: 'newest', limit: 4 }, expect.anything())
  })
})
