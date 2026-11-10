/**
 * The showcase section registry (DT-4353, S3.1). Each implemented section type has one entry: its
 * renderer, default labels, whether it gets a sub-nav link, and when it has something to show.
 * Page rendering and the sub-nav both read `visibleSections`, so a section that isn't rendered has
 * no anchor and no nav link (delivery plan section 3).
 *
 * Each E3 story adds its renderers here. The registry's keys must equal
 * `IMPLEMENTED_SECTION_KEYS`, so a renderer can't ship without the CI guard allowing its type, or
 * the other way round.
 *
 * A section's DOM id is its bare key. Authored same-page links are `#<section key>`
 * (`SafeUrlSchema` and `urlProblem`), and a browser resolves `#latest-data-releases` only against
 * an element whose id is exactly `latest-data-releases`, so a prefixed id would break every such
 * link. Masthead and hero get an id too, but no nav link, and the URL policy rejects links to them.
 *
 * A dataset shelf renders while its lookup loads (its skeleton, D11) and after it fails (its
 * retry, D12), but it is a link target, in the sub-nav or a same-page link, only once it has
 * datasets or has failed (`linkTargetSections`).
 */
import type { ComponentType } from 'react'
import type { ShowcaseLookups } from 'src/components/showcase/useShowcaseLookups'
import { AnalysisApps } from 'src/components/showcase/sections/AnalysisApps'
import { DatasetShelf } from 'src/components/showcase/sections/DatasetShelf'
import { Hero } from 'src/components/showcase/sections/Hero'
import { heroHasContent } from 'src/components/showcase/sections/heroContent'
import { Masthead } from 'src/components/showcase/sections/Masthead'
import { WorkspaceShelf } from 'src/components/showcase/sections/WorkspaceShelf'
import {
  DATASET_SECTION_KEYS,
  type DatasetSectionKey,
  NO_ANCHOR_SECTION_KEYS,
  SECTION_KEYS,
  type SectionConfigs,
  type SectionKey,
  type ShowcaseConfig,
} from 'src/types/showcase'

/** A section's config when it is enabled. Disabled sections may keep content, so the predicate and
 * renderer only ever see this variant. */
export type EnabledSection<K extends SectionKey> = Extract<SectionConfigs[K], { enabled: true }>

/** The type of one entry in a section's `items`, or `never` for a section without items. */
export type SectionItem<K extends SectionKey> = EnabledSection<K> extends { items?: readonly (infer I)[] } ? I : never

/** What the template passes each section renderer. */
export interface SectionRendererProps<K extends SectionKey> {
  sectionKey: K
  section: EnabledSection<K>
  /** The DOM id the renderer puts on its section element; see `sectionDomId`. */
  id: string
  /** The config's title, else the registry default. */
  title: string | undefined
}

export interface SectionRegistryEntry<K extends SectionKey> {
  component: ComponentType<SectionRendererProps<K>>
  /** Default labels for a section that sets none. The product owner supplies the wording; until
   * then these may be undefined or empty. */
  defaultLabels: { title?: string, navLabel?: string }
  /** Whether the section gets a sub-nav link. False for masthead and hero, which have no anchor
   * (`NO_ANCHOR_SECTION_KEYS`); `visibleSections` enforces that whatever the entry says. */
  navigable: boolean
  /** Whether the enabled section has anything to show. Copy-only sections such as hero can have
   * content without `items`, so each type decides. */
  hasRenderableContent: (section: EnabledSection<K>) => boolean
}

/** A mapped type, not `Partial<Record<...>>`, so each entry is typed by its own section config. */
export type SectionRegistry = { readonly [K in SectionKey]?: SectionRegistryEntry<K> }

/** The real registry. Each E3 story adds its type here and to `IMPLEMENTED_SECTION_KEYS`. */
export const sectionRegistry: SectionRegistry = {
  // Search always renders, so an enabled masthead always has content, with or without logos.
  'masthead': { component: Masthead, defaultLabels: {}, navigable: false, hasRenderableContent: () => true },
  // The hero's heading falls back to the showcase title, so it needs no default title.
  'hero': { component: Hero, defaultLabels: {}, navigable: false, hasRenderableContent: heroHasContent },
  // Provisional title. A computed shelf's content depends on its lookup, which the shelf renders.
  'latest-data-releases': { component: DatasetShelf, defaultLabels: { title: 'Latest data releases' }, navigable: true, hasRenderableContent: () => true },
  // Provisional title. Curated or computed per showcase; a curated list with no items makes no
  // lookup, so it has nothing to show.
  'open-access-datasets': {
    component: DatasetShelf,
    defaultLabels: { title: 'Open access datasets' },
    navigable: true,
    hasRenderableContent: section => section.ranking !== undefined || (section.items ?? []).length > 0,
  },
  // Provisional title (S3.4).
  'featured-tools': { component: AnalysisApps, defaultLabels: { title: 'Analysis Apps' }, navigable: true, hasRenderableContent: section => section.items.length > 0 },
  // Provisional title (S3.4).
  'featured-workspaces': { component: WorkspaceShelf, defaultLabels: { title: 'Workspaces' }, navigable: true, hasRenderableContent: section => section.items.length > 0 },
}

export interface VisibleSectionOf<K extends SectionKey> {
  key: K
  entry: SectionRegistryEntry<K>
  section: EnabledSection<K>
  id: string
  title: string | undefined
  /** The sub-nav label: the config's `navLabel`, else the registry default, else the title. */
  navLabel: string | undefined
  navigable: boolean
}

export type VisibleSection = { [K in SectionKey]: VisibleSectionOf<K> }[SectionKey]

/** The stable DOM id of a section, and the target of a `#<section key>` link: the bare key. */
export const sectionDomId = (key: SectionKey): string => key

const hasNoAnchor = (key: SectionKey) => (NO_ANCHOR_SECTION_KEYS as readonly string[]).includes(key)

/** `undefined` for a missing, empty or whitespace-only label, so a fallback applies. */
const label = (...candidates: (string | undefined)[]) => candidates.find(candidate => candidate !== undefined && candidate.trim() !== '')

const visibleSection = <K extends SectionKey>(key: K, sections: SectionConfigs, registry: SectionRegistry): VisibleSectionOf<K> | undefined => {
  // Every section type has `enabled` and the common label fields; reading them through this shape
  // keeps the compiler from expanding the union of all 23 section configs.
  const section = sections[key] as { enabled?: boolean, title?: string, navLabel?: string } | undefined
  const entry = registry[key] as SectionRegistryEntry<K> | undefined
  if (section?.enabled !== true || entry === undefined) {
    return undefined
  }
  const enabled = section as unknown as EnabledSection<K>
  if (!entry.hasRenderableContent(enabled)) {
    return undefined
  }
  const title = label(section.title, entry.defaultLabels.title)
  return {
    key,
    entry,
    section: enabled,
    id: sectionDomId(key),
    title,
    navLabel: label(section.navLabel, entry.defaultLabels.navLabel, title),
    navigable: entry.navigable && !hasNoAnchor(key),
  }
}

/**
 * The sections the page renders, in `SECTION_KEYS` order whatever the config's key order. A
 * section is left out when it is disabled, has no registry entry (an unimplemented type, which the
 * CI guard also rejects) or has nothing to show. Keys that aren't section keys are ignored.
 *
 * `registry` is for tests only; pages use the real one.
 */
export const visibleSections = (config: Pick<ShowcaseConfig, 'sections'>, registry: SectionRegistry = sectionRegistry): VisibleSection[] =>
  SECTION_KEYS.flatMap((key) => {
    const visible = visibleSection(key, config.sections, registry)
    return visible === undefined ? [] : [visible as VisibleSection]
  })

const isDatasetSection = (key: SectionKey): key is DatasetSectionKey => (DATASET_SECTION_KEYS as readonly string[]).includes(key)

/** D11 and D12: a dataset shelf is a link target once it has datasets, or once its lookup fails so
 * people can reach "Try again". Loading, empty or with no lookup, it is not. */
const isLinkTarget = (key: SectionKey, lookups: ShowcaseLookups): boolean => {
  if (!isDatasetSection(key)) return true
  const state = lookups.datasets[key]
  return state?.status === 'error' || (state?.status === 'ready' && state.data.length > 0)
}

/**
 * The visible sections that a sub-nav link or a same-page `#<section key>` link may target, in page
 * order. Without `lookups` (the lookup state is unknown) every visible section counts.
 */
export const linkTargetSections = (
  config: Pick<ShowcaseConfig, 'sections'>,
  registry: SectionRegistry = sectionRegistry,
  lookups?: ShowcaseLookups,
): VisibleSection[] =>
  visibleSections(config, registry).filter(section => lookups === undefined || isLinkTarget(section.key, lookups))

/**
 * The sections the sub-nav links to: link targets that are navigable and labelled, in page order. A
 * section with no nav label, title or registry default (the defaults stay empty until the product
 * owner gives the wording) is left out rather than shown as a link with no text.
 */
export const subNavSections = (
  config: Pick<ShowcaseConfig, 'sections'>,
  registry: SectionRegistry = sectionRegistry,
  lookups?: ShowcaseLookups,
): VisibleSection[] =>
  linkTargetSections(config, registry, lookups).filter(section => section.navigable && section.navLabel !== undefined)
