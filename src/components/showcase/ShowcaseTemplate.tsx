/**
 * The showcase page template (DT-4353, S3.1): theme custom properties, typography, the focus style,
 * the skip link and the landmarks around the visible sections, in registry order.
 *
 * Each section renderer owns its own `<section id={id} aria-labelledby=...>` and heading, as
 * `SectionRendererProps.id` and the Shelf primitive do; the template adds no wrapper, so there is
 * one region per section. The renderer's root element must carry the id, since it is the target
 * of `#<section key>` links. The masthead keeps the page's `scroll-padding-top` equal to its height
 * while it sticks, so a target is not hidden under it.
 *
 * The page has one `h1`, which is also the skip link's target. When the hero renders, its renderer
 * puts `id={SHOWCASE_MAIN_HEADING_ID}` and `tabIndex={-1}` on its heading; otherwise the template
 * renders the registry entry's title as the `h1`. The app shell has no `<main>`, so the template
 * provides it.
 */
import React, { type ComponentType, type CSSProperties, type MouseEvent, useMemo } from 'react'
import {
  type SectionRegistry,
  type SectionRendererProps,
  sectionRegistry,
  subNavSections,
  type VisibleSection,
  visibleSections,
} from 'src/components/showcase/sectionRegistry'
import { type ShowcaseHandoffs, ShowcaseHandoffsContext } from 'src/components/showcase/handoffs'
import {
  accessibleThemeColors,
  SHOWCASE_MAIN_HEADING_ID,
  SHOWCASE_NEUTRALS,
  ShowcaseLookupsContext,
  type ShowcasePageInfo,
  ShowcasePageInfoContext,
} from 'src/components/showcase/showcaseTemplateContract'
import { useShowcaseLookups } from 'src/components/showcase/useShowcaseLookups'
import type { RegistryEntry, SectionKey, ShowcaseConfig } from 'src/types/showcase'
import './ShowcaseTemplate.css'

const themeStyle = (branding: ShowcaseConfig['branding']): CSSProperties => {
  const { primary, accent, background } = accessibleThemeColors(branding)
  return {
    '--showcase-primary': primary,
    '--showcase-accent': accent,
    '--showcase-background': background,
    ...SHOWCASE_NEUTRALS,
  } as CSSProperties
}

const renderSection = ({ key, entry, section, id, title }: VisibleSection) => {
  const Section = entry.component as ComponentType<SectionRendererProps<SectionKey>>
  return <Section key={key} sectionKey={key} section={section} id={id} title={title} />
}

/** Moves focus as well as scrolling: browsers don't reliably focus a hash target. */
const skipToMain = (event: MouseEvent<HTMLAnchorElement>) => {
  const target = document.getElementById(SHOWCASE_MAIN_HEADING_ID)
  if (!target) return
  event.preventDefault()
  target.focus()
}

export interface ShowcaseTemplateProps {
  entry: RegistryEntry
  config: ShowcaseConfig
  /** Whether handoffs to signed-in DUOS pages open, and whether the visitor is signed in. */
  handoffs: ShowcaseHandoffs
  /** For tests only; pages use the real registry. */
  registry?: SectionRegistry
}

/** Provisional copy (S3.2): why search, dataset and request links don't open in a preview. */
export const PREVIEW_NOTICE = 'This is a content preview with production data. Search, dataset details and access requests are '
  + 'turned off here, because a production dataset ID can name a different dataset in this environment.'

export const ShowcaseTemplate = ({ entry, config, handoffs, registry = sectionRegistry }: ShowcaseTemplateProps) => {
  const lookups = useShowcaseLookups(config, Object.keys(registry) as SectionKey[])
  const sections = visibleSections(config, registry)
  const masthead = sections.filter(section => section.key === 'masthead')
  const content = sections.filter(section => section.key !== 'masthead')
  const hasHero = content.some(section => section.key === 'hero')
  // `subNavSections` reads the same visible list, so a hidden or empty section gets no link. A new
  // object on every render would re-render every context consumer (Sonar S6481).
  const pageInfo = useMemo<ShowcasePageInfo>(() => ({
    title: entry.title,
    subNav: subNavSections(config, registry).flatMap(section => (section.navLabel === undefined ? [] : [{ id: section.id, label: section.navLabel }])),
  }), [entry.title, config, registry])

  return (
    <div className="showcase-template" style={themeStyle(config.branding)}>
      <a className="showcase-template__skip-link" href={`#${SHOWCASE_MAIN_HEADING_ID}`} onClick={skipToMain}>
        Skip to main content
      </a>
      <ShowcaseHandoffsContext.Provider value={handoffs}>
        <ShowcaseLookupsContext.Provider value={lookups}>
          <ShowcasePageInfoContext.Provider value={pageInfo}>{masthead.map(renderSection)}</ShowcasePageInfoContext.Provider>
          <main className="showcase-template__main">
            {!handoffs.enabled && <p className="showcase-template__preview-notice" role="note">{PREVIEW_NOTICE}</p>}
            {!hasHero && (
              <h1 id={SHOWCASE_MAIN_HEADING_ID} className="showcase-template__title" tabIndex={-1}>{entry.title}</h1>
            )}
            {content.map(renderSection)}
          </main>
        </ShowcaseLookupsContext.Provider>
      </ShowcaseHandoffsContext.Provider>
    </div>
  )
}
