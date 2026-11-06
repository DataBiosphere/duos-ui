/** What the hero renders (DT-4355, S3.3), kept out of the component file so fast refresh works. */
import { isShownHref } from 'src/components/showcase/primitives/safeHref'
import type { EnabledSection } from 'src/components/showcase/sectionRegistry'
import { type Clock, filterByDateWindow } from 'src/showcases/dateWindow'

type Hero = EnabledSection<'hero'>
type Announcement = Hero['announcements'][number]

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
