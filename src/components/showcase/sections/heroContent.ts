/** What the hero renders (DT-4355, S3.3), kept out of the component file so fast refresh works. */
import type { EnabledSection } from 'src/components/showcase/sectionRegistry'

type Hero = EnabledSection<'hero'>

/**
 * Whether an enabled hero has anything to show. A title alone is not content: then the template
 * renders the showcase title as the `h1` (D7). Same-page links count whatever their targets, so
 * the answer doesn't depend on other sections.
 */
export const heroHasContent = (hero: Hero): boolean =>
  hero.intro.trim() !== ''
  || hero.primaryCtas.length > 0
  || hero.onboarding.length > 0
  || hero.stats.length > 0
