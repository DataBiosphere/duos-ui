/**
 * The showcase hero (DT-4355, S3.3): the page's `h1`, an optional subtitle, the intro text, calls
 * to action and onboarding links. The background is a static decoration from the theme colors, with
 * no image (MVP).
 *
 * The heading is the page's one `h1` and the skip link's target (D7), so it carries
 * `SHOWCASE_MAIN_HEADING_ID` and `tabIndex={-1}`.
 *
 * The hero `<section>` has no accessible name, so it is not a region landmark. Its heading is
 * usually the showcase title, which already names the masthead region; a second region with the
 * same name would be ambiguous in a landmark list. The hero is the top of `<main>`, and the `h1`
 * is what the skip link reaches.
 *
 * Announcements and the live stats come in later PRs; this renderer shows neither yet.
 */
import React, { useContext, useId } from 'react'
import { ShowcaseLink } from 'src/components/showcase/primitives/ShowcaseLink'
import { isShownHref } from 'src/components/showcase/primitives/safeHref'
import type { EnabledSection, SectionRendererProps } from 'src/components/showcase/sectionRegistry'
import { SHOWCASE_MAIN_HEADING_ID, ShowcasePageInfoContext } from 'src/components/showcase/showcaseTemplateContract'
import './Hero.css'

/** Provisional copy (S3.3). */
export const ONBOARDING_LABEL = 'Get started'

type HeroLink = EnabledSection<'hero'>['primaryCtas'][number]

const LinkList = ({ links, className, labelledBy }: { links: readonly HeroLink[], className: string, labelledBy?: string }) => (
  <ul className={className} aria-labelledby={labelledBy}>
    {links.map(link => <li key={`${link.label}-${link.url}`}><ShowcaseLink href={link.url}>{link.label}</ShowcaseLink></li>)}
  </ul>
)

const Onboarding = ({ links }: { links: readonly HeroLink[] }) => {
  const headingId = useId()
  if (links.length === 0) return null
  return (
    <div className="showcase-hero__onboarding">
      <h2 id={headingId} className="showcase-hero__subheading">{ONBOARDING_LABEL}</h2>
      <LinkList links={links} className="showcase-hero__onboarding-links" labelledBy={headingId} />
    </div>
  )
}

export const Hero = ({ section, id, title }: SectionRendererProps<'hero'>) => {
  const page = useContext(ShowcasePageInfoContext)
  const shown = (links: readonly HeroLink[]) => links.filter(link => isShownHref(link.url, page.visibleSectionIds))
  const ctas = shown(section.primaryCtas)
  const intro = section.intro.trim()

  return (
    <section id={id} className="showcase-hero">
      <div className="showcase-hero__inner">
        <div className="showcase-hero__intro">
          <h1 id={SHOWCASE_MAIN_HEADING_ID} className="showcase-hero__title" tabIndex={-1}>{title ?? page.title}</h1>
          {section.subtitle !== undefined && section.subtitle.trim() !== '' && <p className="showcase-hero__subtitle">{section.subtitle}</p>}
          {intro !== '' && <p className="showcase-hero__text">{intro}</p>}
          {ctas.length > 0 && <LinkList links={ctas} className="showcase-hero__ctas" />}
          <Onboarding links={shown(section.onboarding)} />
        </div>
      </div>
    </section>
  )
}
