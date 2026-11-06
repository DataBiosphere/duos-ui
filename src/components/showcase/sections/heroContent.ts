/** What the hero renders (DT-4355, S3.3), kept out of the component file so fast refresh works. */
import { isShownHref } from 'src/components/showcase/primitives/safeHref'
import type { EnabledSection } from 'src/components/showcase/sectionRegistry'
import type { LookupState } from 'src/components/showcase/useShowcaseLookups'
import { type Clock, filterByDateWindow } from 'src/showcases/dateWindow'
import { type ShowcaseConfig, type StatsResponse, TOOL_SECTION_KEYS } from 'src/types/showcase'

type Hero = EnabledSection<'hero'>
type Announcement = Hero['announcements'][number]
export type HeroStatKey = Hero['stats'][number]

/** Provisional copy (S3.3). Each count has its own label, so studies, datasets and tools are never
 * confused. */
export const HERO_STAT_LABELS: Record<HeroStatKey, string> = { studies: 'Studies', datasets: 'Datasets', tools: 'Tools' }

/** One stat the hero shows: which count, and its value. */
export interface HeroStatValue {
  key: HeroStatKey
  value: number
}

/**
 * Whether an enabled hero has anything to show. A title alone is not content: then the template
 * renders the showcase title as the `h1` (D7). Announcements and same-page links count whatever
 * their dates or targets, so the answer doesn't depend on the clock or on other sections.
 */
export const heroHasContent = (hero: Hero): boolean =>
  hero.intro.trim() !== ''
  || hero.primaryCtas.length > 0
  || hero.onboarding.length > 0
  || hero.announcements.length > 0
  || hero.stats.length > 0

/** The announcements to show today, in config order, without any whose link can't render here. */
export const currentAnnouncements = (announcements: readonly Announcement[], clock: Clock, visibleSectionIds: readonly string[] | undefined): Announcement[] =>
  filterByDateWindow(announcements, clock).filter(announcement => isShownHref(announcement.url, visibleSectionIds))

/** The number of items in the enabled tool sections (contracts record). Workspaces are not tools. */
export const countToolItems = (sections: ShowcaseConfig['sections']): number =>
  TOOL_SECTION_KEYS.reduce((count, key) => {
    const section = sections[key]
    return section.enabled ? count + section.items.length : count
  }, 0)

/**
 * The stats the hero shows, in config order and each once, or `undefined` for no stat strip.
 * Studies and datasets come from the `stats` lookup; tools from `toolCount`. A stat that is 0 is
 * hidden. While a needed lookup is loading, failed or missing, the whole strip goes, the tools count
 * included, so the page never shows a partial or placeholder count (D14). A hero that asks only for
 * tools needs no lookup.
 */
export const heroStats = (
  stats: readonly HeroStatKey[],
  lookup: LookupState<StatsResponse> | undefined,
  toolCount: number,
): HeroStatValue[] | undefined => {
  const needsLookup = stats.some(key => key !== 'tools')
  if (needsLookup && lookup?.status !== 'ready') return undefined
  const counts = lookup?.status === 'ready' ? lookup.data : { studyCount: 0, datasetCount: 0 }
  const values: Record<HeroStatKey, number> = { studies: counts.studyCount, datasets: counts.datasetCount, tools: toolCount }
  const shown = [...new Set(stats)].flatMap(key => (values[key] > 0 ? [{ key, value: values[key] }] : []))
  return shown.length > 0 ? shown : undefined
}
