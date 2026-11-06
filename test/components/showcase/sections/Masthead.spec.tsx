import '@testing-library/jest-dom/vitest'
import React from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ShowcaseHandoffs } from 'src/components/showcase/handoffs'
import { SEARCH_LABEL, SEARCH_UNAVAILABLE_TEXT, SUB_NAV_LABEL } from 'src/components/showcase/sections/Masthead'
import { MAX_LOGOS } from 'src/components/showcase/sections/mastheadLogos'
import { type SectionRegistry, type SectionRegistryEntry, type SectionRendererProps, sectionRegistry } from 'src/components/showcase/sectionRegistry'
import { ShowcaseTemplate } from 'src/components/showcase/ShowcaseTemplate'
import { resolveShowcase } from 'src/showcases/defaults'
import { resolveShowcaseImage } from 'src/showcases/images'
import { ShowcaseConfigSchema } from 'src/showcases/schema'
import type { RegistryEntry, SectionKey, ShowcaseConfig, ShowcasePartialInput } from 'src/types/showcase'

vi.mock('src/showcases/images', () => ({ resolveShowcaseImage: vi.fn() }))
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

const contentEntry = <K extends SectionKey>(overrides: Partial<SectionRegistryEntry<K>> = {}): SectionRegistryEntry<K> => ({
  component: ContentSection as SectionRegistryEntry<K>['component'],
  defaultLabels: {},
  navigable: true,
  hasRenderableContent: () => true,
  ...overrides,
})

const hasItems = (section: { items?: readonly unknown[] }) => (section.items ?? []).length > 0
const tool = { id: 'tool-1', name: 'Tool', description: 'A tool', tags: [], launchUrl: 'https://example.org/tool' as const }

/** The real masthead, with test renderers for the content sections the sub-nav links to. */
const registry: SectionRegistry = {
  'masthead': sectionRegistry.masthead,
  'hero': contentEntry({ navigable: true, defaultLabels: { title: 'Welcome', navLabel: 'Hero' } }),
  'latest-data-releases': contentEntry({ defaultLabels: { title: 'Latest data releases', navLabel: 'Latest' } }),
  'featured-tools': contentEntry({ defaultLabels: { title: 'Featured tools' }, hasRenderableContent: hasItems }),
  'featured-workspaces': contentEntry({ defaultLabels: { title: 'Workspaces' }, hasRenderableContent: hasItems }),
  'notebooks': contentEntry({ defaultLabels: { title: 'Notebooks' } }),
  'ai-models': contentEntry({ defaultLabels: {} }),
}

type Logos = { src: string, alt: string, url?: string }[]

const configWith = (logos: Logos = [], sections: ShowcasePartialInput['sections'] = {}): ShowcaseConfig =>
  ShowcaseConfigSchema.parse(resolveShowcase({ sections: { masthead: { enabled: true, logos }, ...sections } as ShowcasePartialInput['sections'] }))

const LIVE: ShowcaseHandoffs = { enabled: true, signedIn: false }

const LocationProbe = () => {
  const location = useLocation()
  return <output data-testid="location">{location.pathname + location.search}</output>
}

const renderMasthead = (config = configWith(), handoffs = LIVE) => render(
  <MemoryRouter initialEntries={['/showcase/quillmere']}>
    <LocationProbe />
    <Routes>
      <Route path="/showcase/quillmere" element={<ShowcaseTemplate entry={showcase} config={config} handoffs={handoffs} registry={registry} />} />
      <Route path="*" element={<div>Elsewhere</div>} />
    </Routes>
  </MemoryRouter>,
)

const masthead = () => screen.getByRole('region', { name: showcase.title })
const logoImages = () => within(masthead()).queryAllByRole('img')

beforeEach(() => {
  vi.mocked(resolveShowcaseImage).mockImplementation(src => `/assets/${src}`)
})

afterEach(() => {
  vi.mocked(resolveShowcaseImage).mockReset()
})

describe('Masthead', () => {
  describe('logos', () => {
    it('shows the showcase title as text when there is no logo', () => {
      renderMasthead()
      expect(within(masthead()).getByText(showcase.title)).toBeInTheDocument()
      expect(logoImages()).toHaveLength(0)
    })

    it('uses the title as alt text when the showcase\'s own logo leaves it empty', () => {
      renderMasthead(configWith([{ src: 'showcase/quillmere/logo.svg', alt: '' }]))
      expect(within(masthead()).getByRole('img', { name: showcase.title })).toHaveAttribute('src', '/assets/showcase/quillmere/logo.svg')
    })

    it('shows the own logo and at most three partners, partners marked for phones to hide', () => {
      const logos = Array.from({ length: MAX_LOGOS + 1 }, (_, i) => ({ src: `showcase/quillmere/logo-${i}.svg`, alt: `Logo ${i}` }))
      renderMasthead(configWith(logos))
      expect(logoImages().map(img => img.getAttribute('alt'))).toEqual(['Logo 0', 'Logo 1', 'Logo 2', 'Logo 3'])
      const items = within(masthead()).getAllByRole('listitem').filter(item => within(item).queryByRole('img'))
      expect(items.map(item => item.classList.contains('showcase-masthead__logo--partner'))).toEqual([false, true, true, true])
    })

    it('drops a partner logo with blank alt text rather than render a link with no name', () => {
      renderMasthead(configWith([
        { src: 'showcase/quillmere/logo.svg', alt: 'Quillmere' },
        { src: 'showcase/quillmere/partner.svg', alt: ' ', url: 'https://example.org' },
      ]))
      expect(logoImages()).toHaveLength(1)
      expect(within(masthead()).queryByRole('link', { name: '' })).toBeNull()
    })

    it('names each logo link by its alt text', () => {
      renderMasthead(configWith([
        { src: 'showcase/quillmere/logo.svg', alt: 'Quillmere', url: '/data' },
        { src: 'showcase/quillmere/partner.svg', alt: 'Example Partner', url: 'https://example.org' },
      ]))
      expect(within(masthead()).getByRole('link', { name: 'Quillmere' })).toHaveAttribute('href', '/data')
      expect(within(masthead()).getByRole('link', { name: 'Example Partner' })).toHaveAttribute('href', 'https://example.org')
    })

    it('renders a logo without a safe url as an image only', () => {
      renderMasthead(configWith([{ src: 'showcase/quillmere/logo.svg', alt: 'Quillmere', url: '//evil.example' }]))
      expect(within(masthead()).getByRole('img', { name: 'Quillmere' })).toBeInTheDocument()
      expect(within(masthead()).queryByRole('link', { name: 'Quillmere' })).toBeNull()
    })

    it('shows the alt text for a logo path that resolves to no bundled image', () => {
      vi.mocked(resolveShowcaseImage).mockReturnValue(undefined)
      renderMasthead(configWith([{ src: 'showcase/quillmere/missing.svg', alt: 'Quillmere' }]))
      expect(logoImages()).toHaveLength(0)
      expect(within(masthead()).getByText('Quillmere')).toHaveClass('showcase-masthead__logo-text')
    })

    it('shows the alt text in place of a logo that fails to load', () => {
      renderMasthead(configWith([{ src: 'showcase/quillmere/logo.svg', alt: 'Quillmere' }]))
      fireEvent.error(within(masthead()).getByRole('img', { name: 'Quillmere' }))
      expect(logoImages()).toHaveLength(0)
      expect(within(masthead()).getByText('Quillmere')).toHaveClass('showcase-masthead__logo-text')
    })

    it('loads the logos eagerly, since they are on the first screen', () => {
      renderMasthead(configWith([{ src: 'showcase/quillmere/logo.svg', alt: 'Quillmere' }]))
      expect(within(masthead()).getByRole('img')).toHaveAttribute('loading', 'eager')
    })
  })

  describe('search', () => {
    const searchBox = () => within(masthead()).getByRole('searchbox', { name: SEARCH_LABEL })
    const searchButton = () => within(masthead()).getByRole('button', { name: 'Search' })

    it('hands the search text to the data library query', async () => {
      renderMasthead()
      await userEvent.type(searchBox(), 'heart & lung')
      await userEvent.click(searchButton())
      expect(screen.getByText('Elsewhere')).toBeInTheDocument()
      const location = new URL(screen.getByTestId('location').textContent ?? '', 'https://duos.test')
      expect(location.pathname).toBe('/datalibrary')
      expect(location.searchParams.get('query')).toBe('heart & lung')
    })

    it('submits with Enter', async () => {
      renderMasthead()
      await userEvent.type(searchBox(), 'GRU{Enter}')
      expect(screen.getByTestId('location')).toHaveTextContent('/datalibrary?query=GRU')
    })

    it('opens the library for an empty search', async () => {
      renderMasthead()
      await userEvent.click(searchButton())
      expect(screen.getByTestId('location').textContent).toBe('/datalibrary')
    })

    it('tells a visitor who is not signed in that search needs sign-in', () => {
      renderMasthead()
      expect(searchBox()).toHaveAccessibleDescription('Sign-in required')
      expect(searchButton()).toHaveAccessibleDescription('Sign-in required')
    })

    it('has no sign-in note for a signed-in visitor', () => {
      renderMasthead(configWith(), { enabled: true, signedIn: true })
      expect(searchBox()).not.toHaveAccessibleDescription()
    })

    it('turns search off in a production-data preview and says so', async () => {
      renderMasthead(configWith(), { enabled: false, signedIn: true })
      expect(searchBox()).toBeDisabled()
      expect(searchButton()).toBeDisabled()
      expect(searchBox()).toHaveAccessibleDescription(SEARCH_UNAVAILABLE_TEXT)
      fireEvent.submit(searchBox().closest('form') as HTMLFormElement)
      expect(screen.getByTestId('location')).toHaveTextContent('/showcase/quillmere')
    })
  })

  describe('sub-nav', () => {
    const allSections: ShowcasePartialInput['sections'] = {
      'hero': { enabled: true, subtitle: 'Hello', intro: 'Intro', stats: [], announcements: [], onboarding: [], primaryCtas: [] },
      'latest-data-releases': { enabled: true, ranking: 'newest', navLabel: '  ' },
      'featured-tools': { enabled: true, items: [tool], navLabel: 'Tools' },
      'featured-workspaces': { enabled: true, items: [] },
      'notebooks': { enabled: false, items: [tool] },
      'ai-models': { enabled: true, items: [tool] },
    }

    const subNav = () => within(masthead()).queryByRole('navigation', { name: SUB_NAV_LABEL })

    it('links visible, navigable, labelled content sections in page order, with short labels', () => {
      renderMasthead(configWith([], allSections))
      const links = within(subNav() as HTMLElement).getAllByRole('link')
      // Hero is never in the sub-nav; a blank navLabel falls back; empty, disabled and unlabelled
      // sections have no link.
      expect(links.map(link => [link.textContent, link.getAttribute('href')])).toEqual([
        ['Latest', '#latest-data-releases'],
        ['Tools', '#featured-tools'],
      ])
    })

    it('has no dead anchors: every link targets a rendered section', () => {
      renderMasthead(configWith([], allSections))
      within(subNav() as HTMLElement).getAllByRole('link').forEach((link) => {
        const target = document.getElementById((link.getAttribute('href') ?? '').slice(1))
        expect(target).not.toBeNull()
        expect(target?.closest('main')).not.toBeNull()
      })
    })

    it('renders no nav when no section gets a link', () => {
      renderMasthead()
      expect(subNav()).toBeNull()
    })
  })

  it('keeps the D7 tab order: skip link, logos, search, then the sub-nav', () => {
    renderMasthead(configWith([{ src: 'showcase/quillmere/logo.svg', alt: 'Quillmere', url: '/data' }], {
      'latest-data-releases': { enabled: true, ranking: 'newest' },
    }))
    const order = [
      screen.getByRole('link', { name: 'Skip to main content' }),
      screen.getByRole('link', { name: 'Quillmere' }),
      screen.getByRole('searchbox', { name: SEARCH_LABEL }),
      screen.getByRole('button', { name: 'Search' }),
      screen.getByRole('link', { name: 'Latest' }),
    ]
    order.slice(1).forEach((element, i) => {
      expect(order[i].compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })
  })

  describe('anchor offset', () => {
    const offset = (container: HTMLElement) =>
      (container.querySelector('.showcase-template') as HTMLElement).style.getPropertyValue('--showcase-anchor-offset')

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('equals the masthead height while it sticks', () => {
      const realStyle = globalThis.getComputedStyle
      vi.spyOn(globalThis, 'getComputedStyle').mockImplementation((element) => {
        const style = realStyle(element)
        return (element as HTMLElement).classList.contains('showcase-masthead') ? { ...style, position: 'sticky' } as CSSStyleDeclaration : style
      })
      vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(120)
      const { container } = renderMasthead()
      expect(offset(container)).toBe('120px')
    })

    it('is 0 when the masthead does not stick (phones)', () => {
      vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(120)
      const { container } = renderMasthead()
      expect(offset(container)).toBe('0px')
    })
  })
})
