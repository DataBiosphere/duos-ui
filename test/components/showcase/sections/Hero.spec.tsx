import '@testing-library/jest-dom/vitest'
import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { ShowcaseHandoffs } from 'src/components/showcase/handoffs'
import { ONBOARDING_LABEL } from 'src/components/showcase/sections/Hero'
import { heroHasContent } from 'src/components/showcase/sections/heroContent'
import { type SectionRegistry, type SectionRegistryEntry, type SectionRendererProps, sectionRegistry } from 'src/components/showcase/sectionRegistry'
import { SHOWCASE_MAIN_HEADING_ID } from 'src/components/showcase/showcaseTemplateContract'
import { ShowcaseTemplate } from 'src/components/showcase/ShowcaseTemplate'
import { resolveShowcase } from 'src/showcases/defaults'
import { ShowcaseConfigSchema } from 'src/showcases/schema'
import type { RegistryEntry, SectionKey, ShowcaseConfig, ShowcasePartialInput } from 'src/types/showcase'

vi.mock('src/libs/ajax/ShowcaseCatalog', async importOriginal => ({
  ...await importOriginal<typeof import('src/libs/ajax/ShowcaseCatalog')>(),
  lookupShowcaseDatasets: vi.fn(() => new Promise(() => {})),
}))

const showcase: RegistryEntry = { key: 'quillmere', title: 'Quillmere Data Showcase', status: 'live', flagship: false, order: 1 }

const ContentSection = ({ id, title }: SectionRendererProps<SectionKey>) => (
  <section id={id} aria-labelledby={`${id}-heading`}>
    <h2 id={`${id}-heading`}>{title}</h2>
  </section>
)

const hasItems = (section: { items?: readonly unknown[] }) => (section.items ?? []).length > 0

const contentEntry = <K extends SectionKey>(title: string): SectionRegistryEntry<K> => ({
  component: ContentSection as SectionRegistryEntry<K>['component'],
  defaultLabels: { title },
  navigable: true,
  hasRenderableContent: hasItems as SectionRegistryEntry<K>['hasRenderableContent'],
})

/** The real hero, with a test renderer for the workspaces shelf that onboarding links to. */
const registry: SectionRegistry = {
  'hero': sectionRegistry.hero,
  'featured-workspaces': contentEntry('Starter workspaces'),
}

type HeroInput = Extract<NonNullable<ShowcasePartialInput['sections']>['hero'], { enabled: true }>

const emptyHero: HeroInput = { enabled: true, intro: '', stats: [], announcements: [], onboarding: [], primaryCtas: [] }

const workspace = { id: 'ws-1', name: 'Starter', description: 'A workspace', tags: [], launchUrl: 'https://example.org/ws' as const }

const configWith = (hero: Partial<HeroInput>, sections: ShowcasePartialInput['sections'] = {}): ShowcaseConfig =>
  ShowcaseConfigSchema.parse(resolveShowcase({ sections: { hero: { ...emptyHero, ...hero }, ...sections } as ShowcasePartialInput['sections'] }))

const LIVE: ShowcaseHandoffs = { enabled: true, signedIn: true }

const renderHero = (config: ShowcaseConfig, handoffs = LIVE) => render(
  <MemoryRouter initialEntries={['/showcase/quillmere']}>
    <ShowcaseTemplate entry={showcase} config={config} handoffs={handoffs} registry={registry} />
  </MemoryRouter>,
)

const heroRegion = () => document.getElementById('hero')!

describe('Hero heading', () => {
  it('is the page h1 and the skip link target, with the config title', () => {
    renderHero(configWith({ title: 'Welcome to Quillmere', intro: 'Data for everyone' }))
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Welcome to Quillmere')
    expect(heading).toHaveAttribute('id', SHOWCASE_MAIN_HEADING_ID)
    expect(heading).toHaveAttribute('tabindex', '-1')
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('falls back to the showcase title when the config sets none', () => {
    renderHero(configWith({ intro: 'Data for everyone' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(showcase.title)
  })

  it('is not a region landmark, so it does not repeat the masthead region\'s name', () => {
    renderHero(configWith({ intro: 'Data for everyone' }))
    expect(heroRegion()).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: showcase.title })).toBeNull()
  })

  it('leaves the h1 to the template when the hero has no content', () => {
    renderHero(configWith({ title: 'Welcome to Quillmere' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(showcase.title)
    expect(document.getElementById('hero')).toBeNull()
  })
})

describe('Hero copy and links', () => {
  it('shows the subtitle and intro', () => {
    renderHero(configWith({ subtitle: 'A partner showcase', intro: 'Data for everyone' }))
    expect(screen.getByText('A partner showcase')).toBeInTheDocument()
    expect(screen.getByText('Data for everyone')).toBeInTheDocument()
  })

  it('renders the calls to action as links, in config order', () => {
    renderHero(configWith({
      primaryCtas: [{ label: 'Browse data', url: '/datalibrary' }, { label: 'Read the guide', url: 'https://example.org/guide' }],
    }))
    const links = within(heroRegion()).getAllByRole('link').map(link => link.textContent)
    expect(links).toEqual(['Browse data', 'Read the guide'])
    expect(screen.getByRole('link', { name: 'Read the guide' })).toHaveAttribute('href', 'https://example.org/guide')
  })

  it('lists the onboarding links under their own heading', () => {
    renderHero(configWith({ onboarding: [{ label: 'Take the tour', url: 'https://example.org/tour' }] }))
    const list = screen.getByRole('list', { name: ONBOARDING_LABEL })
    expect(within(list).getByRole('link', { name: 'Take the tour' })).toBeInTheDocument()
  })

  it('shows a same-page link when its target section is visible', () => {
    renderHero(
      configWith({ onboarding: [{ label: 'Start in a workspace', url: '#featured-workspaces' }] }, { 'featured-workspaces': { enabled: true, items: [workspace] } }),
    )
    expect(screen.getByRole('link', { name: 'Start in a workspace' })).toHaveAttribute('href', '#featured-workspaces')
  })

  it('hides a same-page link, and its empty list, when the target section is not visible', () => {
    renderHero(configWith({
      intro: 'Data for everyone',
      onboarding: [{ label: 'Start in a workspace', url: '#featured-workspaces' }],
      primaryCtas: [{ label: 'See workspaces', url: '#featured-workspaces' }],
    }))
    expect(within(heroRegion()).queryByRole('link')).toBeNull()
    expect(screen.queryByRole('list', { name: ONBOARDING_LABEL })).toBeNull()
    expect(screen.queryByRole('heading', { name: ONBOARDING_LABEL })).toBeNull()
  })
})

describe('Hero keyboard order (D7)', () => {
  it('goes from the skip link to the calls to action, then onboarding', async () => {
    const user = userEvent.setup()
    renderHero(configWith({
      primaryCtas: [{ label: 'Browse data', url: 'https://example.org/browse' }],
      onboarding: [{ label: 'Take the tour', url: 'https://example.org/tour' }],
    }))
    const order: string[] = []
    for (let i = 0; i < 3; i++) {
      await user.tab()
      const focused = document.activeElement as HTMLElement
      order.push(focused.getAttribute('aria-label') ?? focused.textContent ?? '')
    }
    expect(order).toEqual([
      'Skip to main content',
      'Browse data',
      'Take the tour',
    ])
  })
})

describe('Hero with the real masthead (D7)', () => {
  const withMasthead: SectionRegistry = { ...registry, masthead: sectionRegistry.masthead }

  it('keeps one landmark named for the showcase, and tabs from the masthead into the hero', async () => {
    const user = userEvent.setup()
    const config = configWith(
      { primaryCtas: [{ label: 'Browse data', url: 'https://example.org/browse' }] },
      { 'masthead': { enabled: true, logos: [] }, 'featured-workspaces': { enabled: true, items: [workspace] } },
    )
    render(
      <MemoryRouter initialEntries={['/showcase/quillmere']}>
        <ShowcaseTemplate entry={showcase} config={config} handoffs={LIVE} registry={withMasthead} />
      </MemoryRouter>,
    )
    expect(screen.getAllByRole('region', { name: showcase.title })).toHaveLength(1)

    const order: string[] = []
    for (let i = 0; i < 5; i++) {
      await user.tab()
      const focused = document.activeElement as HTMLElement
      order.push(focused.getAttribute('aria-label') ?? focused.getAttribute('placeholder') ?? focused.textContent ?? '')
    }
    expect(order).toEqual([
      'Skip to main content',
      'Search DUOS datasets',
      'Search',
      'Starter workspaces',
      'Browse data',
    ])
  })
})

describe('heroHasContent', () => {
  const hero = (overrides: Partial<HeroInput>) => ({ ...emptyHero, ...overrides }) as Parameters<typeof heroHasContent>[0]

  it.each([
    ['intro text', { intro: 'Data for everyone' }],
    ['a call to action', { primaryCtas: [{ label: 'Go', url: '/datalibrary' as const }] }],
    ['an onboarding link', { onboarding: [{ label: 'Go', url: '/datalibrary' as const }] }],
    ['a stat', { stats: ['datasets' as const] }],
  ])('is true with %s', (_, overrides) => {
    expect(heroHasContent(hero(overrides))).toBe(true)
  })

  it.each([
    ['nothing', {}],
    ['only blank intro text', { intro: '  \n ' }],
    ['only a title and subtitle', { title: 'Welcome', subtitle: 'Hello' }],
  ])('is false with %s', (_, overrides) => {
    expect(heroHasContent(hero(overrides))).toBe(false)
  })
})
