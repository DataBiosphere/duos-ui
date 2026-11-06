import '@testing-library/jest-dom/vitest'
import React from 'react'
import { readFileSync } from 'node:fs'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PREVIEW_NOTICE, ShowcaseTemplate } from 'src/components/showcase/ShowcaseTemplate'
import { SHOWCASE_MAIN_HEADING_ID } from 'src/components/showcase/showcaseTemplateContract'
import type { SectionRegistry, SectionRegistryEntry, SectionRendererProps } from 'src/components/showcase/sectionRegistry'
import { lookupShowcaseDatasets } from 'src/libs/ajax/ShowcaseCatalog'
import { resolveShowcase } from 'src/showcases/defaults'
import { ShowcaseConfigSchema } from 'src/showcases/schema'
import { THEME_PRESETS } from 'src/showcases/themes'
import type { RegistryEntry, SectionKey, ShowcaseConfig, ShowcasePartialInput } from 'src/types/showcase'

vi.mock('src/libs/ajax/ShowcaseCatalog', async importOriginal => ({
  ...await importOriginal<typeof import('src/libs/ajax/ShowcaseCatalog')>(),
  lookupShowcaseDatasets: vi.fn(),
}))

const lookup = vi.mocked(lookupShowcaseDatasets)

const showcase: RegistryEntry = { key: 'quillmere', title: 'Quillmere Data Showcase', status: 'live', flagship: false, order: 1 }

/** Renders the section shape the template expects of every renderer: a labeled section with an h2. */
const ContentSection = ({ id, title }: SectionRendererProps<SectionKey>) => (
  <section id={id} aria-labelledby={`${id}-heading`}>
    <h2 id={`${id}-heading`}>{title}</h2>
  </section>
)

const testEntry = <K extends SectionKey>(overrides: Partial<SectionRegistryEntry<K>> = {}): SectionRegistryEntry<K> => ({
  component: ContentSection as SectionRegistryEntry<K>['component'],
  defaultLabels: {},
  navigable: true,
  hasRenderableContent: () => true,
  ...overrides,
})

const HeroSection = () => <div><h1 id={SHOWCASE_MAIN_HEADING_ID} tabIndex={-1}>Hero heading</h1></div>
const MastheadSection = () => <header>Masthead</header>

const hasItems = (section: { items?: readonly unknown[] }) => (section.items ?? []).length > 0
const tool = { id: 'tool-1', name: 'Tool', description: 'A tool', tags: [], launchUrl: 'https://example.org/tool' as const }

const configWith = (sections: ShowcasePartialInput['sections'], branding?: ShowcasePartialInput['branding']): ShowcaseConfig =>
  ShowcaseConfigSchema.parse(resolveShowcase({ sections, branding }))

const sections: ShowcasePartialInput['sections'] = {
  'masthead': { enabled: true, logos: [] },
  'featured-tools': { enabled: true, items: [tool] },
  'featured-workspaces': { enabled: true, items: [] },
  'notebooks': { enabled: false, items: [tool] },
  'latest-data-releases': { enabled: true, ranking: 'newest' },
}

const registry: SectionRegistry = {
  'masthead': testEntry({ component: MastheadSection, navigable: false }),
  'latest-data-releases': testEntry({ defaultLabels: { title: 'Latest data releases' } }),
  'featured-tools': testEntry({ defaultLabels: { title: 'Featured tools' }, hasRenderableContent: hasItems }),
  'featured-workspaces': testEntry({ defaultLabels: { title: 'Workspaces' }, hasRenderableContent: hasItems }),
  'notebooks': testEntry({ defaultLabels: { title: 'Notebooks' } }),
}

const LIVE_HANDOFFS = { enabled: true, signedIn: false }

const renderTemplate = (config = configWith(sections), testRegistry = registry, handoffs = LIVE_HANDOFFS) =>
  render(<ShowcaseTemplate entry={showcase} config={config} handoffs={handoffs} registry={testRegistry} />)

const root = (container: HTMLElement) => container.querySelector('.showcase-template') as HTMLElement

beforeEach(() => {
  lookup.mockReset()
  lookup.mockReturnValue(new Promise(() => {}))
})

describe('ShowcaseTemplate', () => {
  it('renders visible sections in registry order with bare-key ids, inside main', () => {
    renderTemplate()
    const regions = screen.getAllByRole('region')
    expect(regions.map(region => region.id)).toEqual(['latest-data-releases', 'featured-tools'])
    expect(regions.map(region => region.getAttribute('aria-labelledby'))).toEqual(['latest-data-releases-heading', 'featured-tools-heading'])
    expect(screen.getAllByRole('heading', { level: 2 }).map(heading => heading.textContent)).toEqual(['Latest data releases', 'Featured tools'])
    regions.forEach(region => expect(region.closest('main')).not.toBeNull())
  })

  it('hides disabled, empty and unimplemented sections', () => {
    renderTemplate(configWith({ ...sections, 'ai-models': { enabled: true, items: [tool] } }))
    expect(document.getElementById('notebooks')).toBeNull()
    expect(document.getElementById('featured-workspaces')).toBeNull()
    expect(document.getElementById('ai-models')).toBeNull()
  })

  it('asks for the lookups of the sections the registry implements', () => {
    renderTemplate()
    expect(lookup).toHaveBeenCalledTimes(1)
    expect(lookup.mock.calls[0][0]).toMatchObject({ mode: 'ranking', section: 'latest-data-releases' })
  })

  it('shows no preview notice when handoffs open', () => {
    renderTemplate()
    expect(screen.queryByRole('note')).toBeNull()
  })

  it('says why handoffs are off in a production-data preview, inside main', () => {
    renderTemplate(configWith(sections), registry, { enabled: false, signedIn: false })
    const notice = screen.getByRole('note')
    expect(notice).toHaveTextContent(PREVIEW_NOTICE)
    expect(notice.closest('main')).not.toBeNull()
  })

  it('puts the masthead after the skip link and outside main', () => {
    renderTemplate()
    const skip = screen.getByRole('link', { name: 'Skip to main content' })
    const masthead = screen.getByText('Masthead')
    expect(masthead.closest('main')).toBeNull()
    expect(skip.compareDocumentPosition(masthead) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })

  it('renders the registry title as the one h1 when no hero renders', () => {
    renderTemplate()
    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent('Quillmere Data Showcase')
    expect(headings[0]).toHaveAttribute('id', SHOWCASE_MAIN_HEADING_ID)
  })

  it('leaves the h1 to the hero when the hero renders', () => {
    const hero = { enabled: true, intro: 'Welcome', stats: [], announcements: [], onboarding: [], primaryCtas: [] }
    renderTemplate(configWith({ ...sections, hero }), { ...registry, hero: testEntry({ component: HeroSection, navigable: false }) })
    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent('Hero heading')
  })

  it('moves focus to the main heading from the skip link', async () => {
    renderTemplate()
    const user = userEvent.setup()
    await user.tab()
    const skip = screen.getByRole('link', { name: 'Skip to main content' })
    expect(skip).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus()
  })

  it('sets the theme and neutral custom properties on the root', () => {
    const { container } = renderTemplate(configWith(sections, { theme: 'blue', primary: '#1a1a1a' }))
    const style = root(container).style
    expect(style.getPropertyValue('--showcase-primary')).toBe('#1a1a1a')
    expect(style.getPropertyValue('--showcase-accent')).toBe(THEME_PRESETS.blue.accent)
    expect(style.getPropertyValue('--showcase-background')).toBe(THEME_PRESETS.blue.background)
    expect(style.getPropertyValue('--showcase-surface')).toBe('#ffffff')
    expect(style.getPropertyValue('--showcase-border')).toBe('rgba(33, 43, 54, 0.12)')
    expect(style.getPropertyValue('--showcase-border-strong')).toBe('rgba(33, 43, 54, 0.24)')
    expect(style.getPropertyValue('--showcase-muted-text')).toBe('#637381')
    expect(style.getPropertyValue('--showcase-accent-tint')).toBe('#ecedf8')
  })

  it('falls back to the preset color for an override that fails contrast', () => {
    const { container } = renderTemplate(configWith(sections, { theme: 'teal', primary: '#eeeeee', accent: '#1a1a1a' }))
    const style = root(container).style
    expect(style.getPropertyValue('--showcase-primary')).toBe(THEME_PRESETS.teal.primary)
    expect(style.getPropertyValue('--showcase-accent')).toBe('#1a1a1a')
  })

  it('sizes type in px, since the app root is 10px, and gives every heading level the heading font', () => {
    const css = readFileSync('src/components/showcase/ShowcaseTemplate.css', 'utf8')
    expect(css).not.toMatch(/--showcase-font-size-[a-z-]+:\s*[\d.]+rem/)
    expect(css).toMatch(/\.showcase-template :is\(h1, h2, h3, h4, h5, h6\) \{\s*font-family: var\(--showcase-font-heading\)/)
  })

  it('has one focus rule for every control that survives forced colors', () => {
    const css = readFileSync('src/components/showcase/ShowcaseTemplate.css', 'utf8')
    const rule = '.showcase-template :is(a, button, input, select, textarea, summary, [tabindex]):focus-visible'
    expect(css).toContain(`${rule} {\n  outline: var(--showcase-focus-width) solid var(--showcase-focus-color);`)
    expect(css).toMatch(/@media \(forced-colors: active\) \{\s*\.showcase-template :is\(a, button, input, select, textarea, summary, \[tabindex\]\):focus-visible \{\s*outline-color: Highlight;/)
    expect(css.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/!important|box-shadow/)
    expect(css).toMatch(/scroll-margin-top: var\(--showcase-anchor-offset\)/)
  })
})
