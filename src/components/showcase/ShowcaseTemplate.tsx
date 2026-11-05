/**
 * The showcase page template (DT-4353, S3.1): theme custom properties, typography, the focus style,
 * the skip link and the landmarks around the visible sections, in registry order.
 *
 * Each section renderer owns its own `<section id={id} aria-labelledby=...>` and heading, as
 * `SectionRendererProps.id` and the Shelf primitive do; the template adds no wrapper, so there is
 * one region per section. The renderer's root element must carry the id, so the anchor offset
 * (`scroll-margin-top`) applies to it.
 *
 * The page has one `h1`, which is also the skip link's target. When the hero renders, its renderer
 * puts `id={SHOWCASE_MAIN_HEADING_ID}` and `tabIndex={-1}` on its heading; otherwise the template
 * renders the registry entry's title as the `h1`. The app shell has no `<main>`, so the template
 * provides it.
 */
import React, { type ComponentType, type CSSProperties, type MouseEvent } from 'react'
import {
  type SectionRegistry,
  type SectionRendererProps,
  sectionRegistry,
  type VisibleSection,
  visibleSections,
} from 'src/components/showcase/sectionRegistry'
import {
  accessibleThemeColors,
  SHOWCASE_MAIN_HEADING_ID,
  SHOWCASE_NEUTRALS,
  ShowcaseLookupsContext,
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
  /** For tests only; pages use the real registry. */
  registry?: SectionRegistry
}

export const ShowcaseTemplate = ({ entry, config, registry = sectionRegistry }: ShowcaseTemplateProps) => {
  const lookups = useShowcaseLookups(config, Object.keys(registry) as SectionKey[])
  const sections = visibleSections(config, registry)
  const masthead = sections.filter(section => section.key === 'masthead')
  const content = sections.filter(section => section.key !== 'masthead')
  const hasHero = content.some(section => section.key === 'hero')

  return (
    <div className="showcase-template" style={themeStyle(config.branding)}>
      <a className="showcase-template__skip-link" href={`#${SHOWCASE_MAIN_HEADING_ID}`} onClick={skipToMain}>
        Skip to main content
      </a>
      <ShowcaseLookupsContext.Provider value={lookups}>
        {masthead.map(renderSection)}
        <main className="showcase-template__main">
          {!hasHero && (
            <h1 id={SHOWCASE_MAIN_HEADING_ID} className="showcase-template__title" tabIndex={-1}>{entry.title}</h1>
          )}
          {content.map(renderSection)}
        </main>
      </ShowcaseLookupsContext.Provider>
    </div>
  )
}
