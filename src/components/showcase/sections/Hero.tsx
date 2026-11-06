/**
 * The showcase hero (DT-4355, S3.3): the page's `h1`, an optional subtitle, the intro text, calls
 * to action, onboarding links and date-bounded announcements. On desktop the intro column sits
 * beside the announcements; below 980px they stack (D15). The background is a static decoration
 * from the theme colors, with no image (MVP).
 *
 * The heading is the page's one `h1` and the skip link's target (D7), so it carries
 * `SHOWCASE_MAIN_HEADING_ID` and `tabIndex={-1}`.
 *
 * The hero `<section>` has no accessible name, so it is not a region landmark. Its heading is
 * usually the showcase title, which already names the masthead region; a second region with the
 * same name would be ambiguous in a landmark list. The hero is the top of `<main>`, and the `h1`
 * is what the skip link reaches.
 *
 * The live stats come in a later PR; this renderer shows none yet.
 */
import React, { useContext, useId, useState } from 'react'
import { ShowcaseLink } from 'src/components/showcase/primitives/ShowcaseLink'
import { isShownHref } from 'src/components/showcase/primitives/safeHref'
import type { EnabledSection, SectionRendererProps } from 'src/components/showcase/sectionRegistry'
import { currentAnnouncements } from 'src/components/showcase/sections/heroContent'
import { SHOWCASE_MAIN_HEADING_ID, ShowcaseClockContext, ShowcasePageInfoContext } from 'src/components/showcase/showcaseTemplateContract'
import './Hero.css'

/** Provisional copy (S3.3). */
export const ONBOARDING_LABEL = 'Get started'
export const ANNOUNCEMENTS_LABEL = 'Announcements'
export const PREVIOUS_ANNOUNCEMENT_LABEL = 'Previous announcement'
export const NEXT_ANNOUNCEMENT_LABEL = 'Next announcement'

type HeroLink = EnabledSection<'hero'>['primaryCtas'][number]
type Announcement = EnabledSection<'hero'>['announcements'][number]

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

/** A decorative arrow for the announcement buttons, sized by the CSS whatever the button's font. */
const Chevron = ({ points }: { points: string }) => (
  <svg className="showcase-hero__chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/**
 * The announcements, one at a time (D5, D6): no autoplay and no pause button. "Previous" and
 * "Next" buttons with a visible "2 of 4" position, which wrap at both ends, so focus never lands on
 * a disabled button. Only the active announcement is rendered, so the others leave the tab order
 * and the accessibility tree. With one announcement there are no controls; with none, no panel.
 */
const Announcements = ({ announcements }: { announcements: readonly Announcement[] }) => {
  const [index, setIndex] = useState(0)
  const headingId = useId()
  const count = announcements.length
  if (count === 0) return null
  // The list can shrink between renders (a window ends), so keep the index in range.
  const active = Math.min(index, count - 1)
  const current = announcements[active]
  const move = (step: number) => setIndex((active + step + count) % count)

  return (
    <section className="showcase-hero__announcements" aria-labelledby={headingId}>
      <h2 id={headingId} className="showcase-hero__subheading">{ANNOUNCEMENTS_LABEL}</h2>
      <div className="showcase-hero__announcement" aria-live="polite">
        <ShowcaseLink key={current.id} href={current.url}>{current.text}</ShowcaseLink>
      </div>
      {count > 1 && (
        <div className="showcase-hero__announcement-controls">
          <button type="button" className="showcase-hero__announcement-button" aria-label={PREVIOUS_ANNOUNCEMENT_LABEL} onClick={() => move(-1)}>
            <Chevron points="15 18 9 12 15 6" />
          </button>
          <span className="showcase-hero__announcement-position">{`${active + 1} of ${count}`}</span>
          <button type="button" className="showcase-hero__announcement-button" aria-label={NEXT_ANNOUNCEMENT_LABEL} onClick={() => move(1)}>
            <Chevron points="9 18 15 12 9 6" />
          </button>
        </div>
      )}
    </section>
  )
}

export const Hero = ({ section, id, title }: SectionRendererProps<'hero'>) => {
  const page = useContext(ShowcasePageInfoContext)
  const clock = useContext(ShowcaseClockContext)
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
        <Announcements announcements={currentAnnouncements(section.announcements, clock, page.visibleSectionIds)} />
      </div>
    </section>
  )
}
