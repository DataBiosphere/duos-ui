/** Which masthead logos show, and how (DT-4354, S3.2; contracts record, D10). */
import { isShownHref } from 'src/components/showcase/primitives/safeHref'
import type { SectionRendererProps } from 'src/components/showcase/sectionRegistry'
import { resolveShowcaseImage } from 'src/showcases/images'

/** The showcase's own logo and up to three partners (D10); the CI guard rejects more. */
export const MAX_LOGOS = 4

export type Logo = SectionRendererProps<'masthead'>['section']['logos'][number]

export interface ShownLogo {
  /** The bundled URL, or undefined when the path names no bundled image. */
  src: string | undefined
  alt: string
  /** The logo's link, when it passes the URL policy and any same-page target is visible. */
  url: string | undefined
}

/** The logos to show: `logos[0]` falls back to the showcase title for blank alt text; a partner
 * logo with blank alt text is dropped, since it would make a link with no name. */
export const shownLogos = (logos: readonly Logo[], title: string, visibleSectionIds?: readonly string[]): ShownLogo[] =>
  logos.slice(0, MAX_LOGOS).flatMap((logo, i) => {
    const alt = logo.alt.trim() === '' && i === 0 ? title : logo.alt.trim()
    if (alt === '') return []
    const url = logo.url !== undefined && isShownHref(logo.url, visibleSectionIds) ? logo.url : undefined
    return [{ src: resolveShowcaseImage(logo.src), alt, url }]
  })
