import { describe, expect, it } from 'vitest'
import {
  linkTargetSections,
  type SectionRegistry,
  type SectionRegistryEntry,
  sectionDomId,
  sectionRegistry,
  subNavSections,
  visibleSections,
} from 'src/components/showcase/sectionRegistry'
import type { LookupState, ShowcaseLookups } from 'src/components/showcase/useShowcaseLookups'
import { ShowcaseLookupError } from 'src/libs/ajax/ShowcaseCatalog'
import { resolveShowcase } from 'src/showcases/defaults'
import { ShowcaseConfigSchema } from 'src/showcases/schema'
import {
  ANCHOR_SECTION_KEYS,
  IMPLEMENTED_SECTION_KEYS,
  SECTION_KEYS,
  type SectionKey,
  type DatasetSummary,
  type ShowcaseConfig,
  type ShowcasePartialInput,
} from 'src/types/showcase'

/** A test entry that renders nothing and has content unless told otherwise. */
const testEntry = <K extends SectionKey>(overrides: Partial<SectionRegistryEntry<K>> = {}): SectionRegistryEntry<K> => ({
  component: () => null,
  defaultLabels: {},
  navigable: true,
  hasRenderableContent: () => true,
  ...overrides,
})

const hasItems = (section: { items?: readonly unknown[] }) => (section.items ?? []).length > 0

const configWith = (sections: Sections): ShowcaseConfig =>
  ShowcaseConfigSchema.parse(resolveShowcase({ sections }))

type Sections = NonNullable<ShowcasePartialInput['sections']>

const hero: NonNullable<Sections['hero']> = {
  enabled: true,
  intro: 'Welcome',
  stats: [],
  announcements: [],
  onboarding: [],
  primaryCtas: [],
}

const tool = { id: 'tool-1', name: 'Tool', description: 'A tool', tags: [], launchUrl: 'https://example.org/tool' as const }

const sections: Sections = {
  'hero': hero,
  'latest-data-releases': { enabled: true, ranking: 'newest' },
  'featured-tools': { enabled: true, items: [tool] },
  'featured-workspaces': { enabled: true, items: [] },
}

const registry: SectionRegistry = {
  'masthead': testEntry({ navigable: false }),
  'hero': testEntry({ navigable: false }),
  'latest-data-releases': testEntry({ defaultLabels: { title: 'Latest' } }),
  'featured-tools': testEntry({ defaultLabels: { title: 'Tools' }, hasRenderableContent: hasItems }),
  'featured-workspaces': testEntry({ defaultLabels: { title: 'Workspaces' }, hasRenderableContent: hasItems }),
}

const keys = (list: { key: SectionKey }[]) => list.map(section => section.key)

describe('sectionRegistry', () => {
  it('has an entry for exactly the implemented section types', () => {
    expect(Object.keys(sectionRegistry).toSorted()).toEqual([...IMPLEMENTED_SECTION_KEYS].toSorted())
  })
})

describe('sectionDomId', () => {
  it('is the bare key, so every #<section key> link the URL policy allows resolves', () => {
    ANCHOR_SECTION_KEYS.forEach(key => expect(sectionDomId(key)).toBe(key))
  })
})

describe('visibleSections', () => {
  it('renders only the implemented sections with the real registry', () => {
    expect(keys(visibleSections(configWith(sections)))).toEqual(['hero', 'latest-data-releases'])
  })

  it('lists enabled sections with content, in fixed order', () => {
    expect(keys(visibleSections(configWith(sections), registry))).toEqual(['hero', 'latest-data-releases', 'featured-tools'])
  })

  it('keeps the fixed order whatever the key order of the config', () => {
    const config = configWith(sections)
    const reversed = { ...config, sections: Object.fromEntries(Object.entries(config.sections).toReversed()) } as ShowcaseConfig
    expect(Object.keys(reversed.sections)[0]).toBe('tech-policy-interns')
    expect(keys(visibleSections(reversed, registry))).toEqual(['hero', 'latest-data-releases', 'featured-tools'])
  })

  it('skips a disabled section, even one that keeps its content', () => {
    const config = configWith({ ...sections, 'featured-tools': { enabled: false, items: [tool] } })
    expect(keys(visibleSections(config, registry))).not.toContain('featured-tools')
  })

  it('skips a section with no renderable content', () => {
    expect(keys(visibleSections(configWith(sections), registry))).not.toContain('featured-workspaces')
  })

  it('shows a copy-only section whose predicate does not need items', () => {
    expect(keys(visibleSections(configWith({ hero }), registry))).toEqual(['hero'])
  })

  it('skips an enabled section with no registry entry', () => {
    const { 'latest-data-releases': _omitted, ...rest } = registry
    expect(keys(visibleSections(configWith(sections), rest))).toEqual(['hero', 'featured-tools'])
  })

  it('ignores keys that are not section keys', () => {
    const config = configWith(sections)
    const withUnknown = { ...config, sections: { ...config.sections, 'not-a-section': { enabled: true } } } as ShowcaseConfig
    expect(keys(visibleSections(withUnknown, registry))).toEqual(['hero', 'latest-data-releases', 'featured-tools'])
  })

  it('skips a section missing from the config', () => {
    const config = configWith(sections)
    const { hero: _omitted, ...rest } = config.sections
    expect(keys(visibleSections({ sections: rest } as ShowcaseConfig, registry))).toEqual(['latest-data-releases', 'featured-tools'])
  })

  it('gives each section its DOM id and passes the predicate the enabled config', () => {
    const seen: unknown[] = []
    const spying: SectionRegistry = { 'featured-tools': testEntry({
      hasRenderableContent: (section) => {
        seen.push(section)
        return true
      },
    }) }
    const [visible] = visibleSections(configWith(sections), spying)
    expect(visible).toMatchObject({ key: 'featured-tools', id: 'featured-tools', section: { enabled: true, items: [tool] } })
    expect(seen).toEqual([visible.section])
  })

  it('takes labels from the config, then the registry defaults, then the title', () => {
    const labelled: SectionRegistry = {
      'latest-data-releases': testEntry({ defaultLabels: { title: 'Default title', navLabel: 'Default nav' } }),
      'featured-tools': testEntry({ defaultLabels: { title: 'Tools', navLabel: '' } }),
      'featured-workspaces': testEntry(),
    }
    const config = configWith({ ...sections, 'featured-workspaces': { enabled: true, items: [], title: 'Workspaces', navLabel: 'Spaces' } })
    expect(visibleSections(config, labelled).map(({ key, title, navLabel }) => ({ key, title, navLabel }))).toEqual([
      { key: 'latest-data-releases', title: 'Default title', navLabel: 'Default nav' },
      { key: 'featured-tools', title: 'Tools', navLabel: 'Tools' },
      { key: 'featured-workspaces', title: 'Workspaces', navLabel: 'Spaces' },
    ])
  })

  it('treats a whitespace-only title or nav label as unset', () => {
    const config = configWith({ ...sections, 'featured-tools': { enabled: true, items: [tool], title: '  ', navLabel: ' ' } })
    const tools = visibleSections(config, registry).find(section => section.key === 'featured-tools')
    expect(tools).toMatchObject({ title: 'Tools', navLabel: 'Tools' })
  })

  it('marks content sections navigable and masthead and hero not, whatever their entry says', () => {
    const claimsNav: SectionRegistry = { ...registry, hero: testEntry({ navigable: true }) }
    const navigable = visibleSections(configWith(sections), claimsNav).map(({ key, navigable }) => [key, navigable])
    expect(navigable).toEqual([['hero', false], ['latest-data-releases', true], ['featured-tools', true]])
  })
})

describe('subNavSections', () => {
  it('lists the visible navigable sections in page order', () => {
    const config = configWith(sections)
    const nonNav: SectionRegistry = { ...registry, 'latest-data-releases': testEntry({ navigable: false }) }
    expect(keys(subNavSections(config, registry))).toEqual(['latest-data-releases', 'featured-tools'])
    expect(keys(subNavSections(config, nonNav))).toEqual(['featured-tools'])
  })

  it('leaves out a section with no nav label, title or default, which the page still renders', () => {
    const unlabelled: SectionRegistry = { ...registry, 'latest-data-releases': testEntry() }
    const config = configWith(sections)
    expect(keys(subNavSections(config, unlabelled))).toEqual(['featured-tools'])
    expect(keys(visibleSections(config, unlabelled))).toContain('latest-data-releases')
  })

  it('uses the same entries as the page list', () => {
    const config = configWith(sections)
    expect(subNavSections(config, registry)).toEqual(visibleSections(config, registry).filter(section => section.navigable))
  })

  it('covers every section key in SECTION_KEYS order', () => {
    const all = Object.fromEntries(SECTION_KEYS.map(key => [key, testEntry()])) as SectionRegistry
    const config = configWith(sections)
    expect(keys(visibleSections(config, all))).toEqual(SECTION_KEYS.filter(key => key in sections))
  })
})

describe('linkTargetSections (D11)', () => {
  const retry = () => {}
  const withLatest = (state: LookupState<DatasetSummary[]> | undefined): ShowcaseLookups => ({ datasets: state === undefined ? {} : { 'latest-data-releases': state } })
  type State = LookupState<DatasetSummary[]>
  const READY: State = { status: 'ready', data: [{ identifier: 'DUOS-000001' }] as unknown as DatasetSummary[], retry }
  const EMPTY: State = { status: 'ready', data: [], retry }
  const LOADING: State = { status: 'loading', retry }
  const FAILED: State = { status: 'error', error: new ShowcaseLookupError('network', 'down'), retry }
  const config = () => configWith(sections)

  it.each([
    ['has datasets', READY, true],
    ['failed, so people can reach "Try again" (D12)', FAILED, true],
    ['is loading', LOADING, false],
    ['is ready with no datasets', EMPTY, false],
    ['has no lookup', undefined, false],
  ])('keeps a dataset shelf that %s as a link target', (_, state, linkable) => {
    expect(keys(linkTargetSections(config(), registry, withLatest(state))).includes('latest-data-releases')).toBe(linkable)
  })

  it('keeps every other visible section, which has no lookup', () => {
    expect(keys(linkTargetSections(config(), registry, withLatest(LOADING)))).toEqual(['hero', 'featured-tools'])
  })

  it('keeps every visible section when the lookups are unknown', () => {
    expect(linkTargetSections(config(), registry)).toEqual(visibleSections(config(), registry))
  })

  it('gives the sub-nav a shelf only once it has content', () => {
    expect(keys(subNavSections(config(), registry, withLatest(LOADING)))).toEqual(['featured-tools'])
    expect(keys(subNavSections(config(), registry, withLatest(READY)))).toEqual(['latest-data-releases', 'featured-tools'])
    expect(keys(subNavSections(config(), registry, withLatest(FAILED)))).toEqual(['latest-data-releases', 'featured-tools'])
  })

  it('still renders a loading shelf, so its skeleton shows', () => {
    expect(keys(visibleSections(config(), registry))).toContain('latest-data-releases')
  })
})
