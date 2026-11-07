import '@testing-library/jest-dom/vitest'
import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SUB_NAV_LABEL } from 'src/components/showcase/sections/Masthead'
import { type SectionRegistry, sectionRegistry } from 'src/components/showcase/sectionRegistry'
import { ShowcaseTemplate } from 'src/components/showcase/ShowcaseTemplate'
import { lookupShowcaseDatasets, ShowcaseLookupError } from 'src/libs/ajax/ShowcaseCatalog'
import { resolveShowcase } from 'src/showcases/defaults'
import { ShowcaseConfigSchema } from 'src/showcases/schema'
import type { RegistryEntry, ShowcasePartialInput } from 'src/types/showcase'
import { renderWithRouter } from '../../test-utils'

// The D11 link rules with the real masthead, hero and shelf: a shelf's sub-nav link and the
// same-page links to it appear only once it has content, and stay when its lookup fails (D12).

vi.mock('src/libs/ajax/ShowcaseCatalog', async importOriginal => ({
  ...await importOriginal<typeof import('src/libs/ajax/ShowcaseCatalog')>(),
  lookupShowcaseDatasets: vi.fn(),
}))
vi.mock('src/showcases/images', () => ({ resolveShowcaseImage: vi.fn(() => undefined) }))

const lookup = vi.mocked(lookupShowcaseDatasets)

const showcase: RegistryEntry = { key: 'quillmere', title: 'Quillmere Data Showcase', status: 'live', flagship: false, order: 1 }
const registry: SectionRegistry = {
  'masthead': sectionRegistry.masthead,
  'hero': sectionRegistry.hero,
  'latest-data-releases': sectionRegistry['latest-data-releases'],
}

const config = ShowcaseConfigSchema.parse(resolveShowcase({
  sections: {
    'masthead': { enabled: true, logos: [] },
    'hero': {
      enabled: true,
      intro: 'Data for everyone',
      stats: [],
      announcements: [],
      onboarding: [{ label: 'See what is new', url: '#latest-data-releases' }],
      primaryCtas: [],
    },
    'latest-data-releases': { enabled: true, ranking: 'newest' },
  } as ShowcasePartialInput['sections'],
}))

const dataset = { identifier: 'DUOS-000001', title: 'Cohort 1', accessManagement: 'controlled', dacName: 'DAC', consentCodes: [], participantCount: null, availableDate: null, accessUrl: null }

const renderPage = () => renderWithRouter(
  <ShowcaseTemplate entry={showcase} config={config} handoffs={{ enabled: true, signedIn: true }} registry={registry} />,
)

const subNavLink = () => screen.queryByRole('navigation', { name: SUB_NAV_LABEL })?.querySelector('a[href="#latest-data-releases"]') ?? null
const onboardingLink = () => screen.queryByRole('link', { name: 'See what is new' })

beforeEach(() => {
  lookup.mockReset()
})

describe('D11 link rules on the page', () => {
  it('shows the loading shelf but no link to it', () => {
    lookup.mockImplementation(() => new Promise(() => {}))
    renderPage()
    expect(document.getElementById('latest-data-releases')).not.toBeNull()
    expect(subNavLink()).toBeNull()
    expect(onboardingLink()).toBeNull()
  })

  it('adds the sub-nav link and the same-page link once the shelf has datasets', async () => {
    lookup.mockResolvedValue({ datasets: [dataset] } as never)
    renderPage()
    await waitFor(() => expect(subNavLink()).not.toBeNull())
    expect(onboardingLink()).toHaveAttribute('href', '#latest-data-releases')
  })

  it('never links to a shelf that has no datasets', async () => {
    lookup.mockResolvedValue({ datasets: [] } as never)
    renderPage()
    await waitFor(() => expect(document.getElementById('latest-data-releases')).toBeNull())
    expect(subNavLink()).toBeNull()
    expect(onboardingLink()).toBeNull()
  })

  it('keeps the links to a failed shelf, so people can reach "Try again" (D12)', async () => {
    lookup.mockRejectedValue(new ShowcaseLookupError('network', 'down'))
    renderPage()
    await waitFor(() => expect(subNavLink()).not.toBeNull())
    expect(onboardingLink()).toBeInTheDocument()
  })
})
