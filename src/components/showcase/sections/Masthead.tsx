/**
 * The showcase masthead (DT-4354, S3.2): the showcase's own logo, up to three partner logos, the
 * data library search and the sub-nav, below the DUOS header. The DUOS header has the DUOS logo and
 * Sign in, so the masthead has neither (contracts record, D10).
 *
 * It sticks to the top of the window on tablet and desktop, and not on phones (D8). While it
 * sticks, it sets `scroll-padding-top` on the page root (`<html>`) to its own height. So nothing
 * the browser scrolls into view is hidden under it: a section that a sub-nav link targets, a
 * control that gets keyboard focus (WCAG 2.4.11), or the heading that the skip link focuses.
 */
import React, { type FormEvent, useContext, useId, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { librarySearchPath, ShowcaseHandoffsContext } from 'src/components/showcase/handoffs'
import { ShowcaseLink, SIGN_IN_REQUIRED_TEXT } from 'src/components/showcase/primitives/ShowcaseLink'
import type { SectionRendererProps } from 'src/components/showcase/sectionRegistry'
import { type Logo, shownLogos } from 'src/components/showcase/sections/mastheadLogos'
import { ShowcasePageInfoContext, type SubNavLink } from 'src/components/showcase/showcaseTemplateContract'
import { imageLoading } from 'src/showcases/imageLoading'
import './Masthead.css'

/** Provisional copy (S3.2). */
export const SEARCH_LABEL = 'Search DUOS datasets'
export const SEARCH_UNAVAILABLE_TEXT = 'Search is not available in this preview.'
export const SUB_NAV_LABEL = 'Sections on this page'

/** A logo image that shows its alt text, at the same height, when it can't load. */
const LogoImage = ({ src, alt }: { src: string | undefined, alt: string }) => {
  const [failed, setFailed] = useState(false)
  if (src === undefined || failed) {
    return <span className="showcase-masthead__logo-text">{alt}</span>
  }
  return <img className="showcase-masthead__logo-image" src={src} alt={alt} loading={imageLoading('masthead')} onError={() => setFailed(true)} />
}

const LogoList = ({ logos, title }: { logos: readonly Logo[], title: string }) => {
  const shown = shownLogos(logos, title)
  if (shown.length === 0) {
    return <p className="showcase-masthead__title">{title}</p>
  }
  return (
    <ul className="showcase-masthead__logos">
      {shown.map((logo, i) => (
        <li key={`${i}-${logo.alt}`} className={i === 0 ? 'showcase-masthead__logo' : 'showcase-masthead__logo showcase-masthead__logo--partner'}>
          {logo.url === undefined
            ? <LogoImage src={logo.src} alt={logo.alt} />
            : <ShowcaseLink href={logo.url}><LogoImage src={logo.src} alt={logo.alt} /></ShowcaseLink>}
        </li>
      ))}
    </ul>
  )
}

/** Search hands off to the signed-in data library with the text as its `query`. A native GET form,
 * so it works the same before the router takes over; with the router it navigates in place. */
const LibrarySearch = () => {
  const { enabled, signedIn } = useContext(ShowcaseHandoffsContext)
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const inputId = useId()
  const noteId = useId()
  const showNote = !enabled || !signedIn

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (enabled) navigate(librarySearchPath(text))
  }

  return (
    <form className="showcase-masthead__search" role="search" action="/datalibrary" method="get" onSubmit={submit}>
      <label className="showcase-visually-hidden" htmlFor={inputId}>{SEARCH_LABEL}</label>
      <input
        id={inputId}
        className="showcase-masthead__search-input"
        type="search"
        name="query"
        placeholder={SEARCH_LABEL}
        value={text}
        onChange={event => setText(event.target.value)}
        disabled={!enabled}
        aria-describedby={showNote ? noteId : undefined}
      />
      <button className="showcase-masthead__search-button" type="submit" disabled={!enabled} aria-describedby={showNote ? noteId : undefined}>Search</button>
      {showNote && <span id={noteId} className="showcase-masthead__search-note">{enabled ? SIGN_IN_REQUIRED_TEXT : SEARCH_UNAVAILABLE_TEXT}</span>}
    </form>
  )
}

const SubNav = ({ links }: { links: readonly SubNavLink[] }) => {
  if (links.length === 0) return null
  return (
    <nav className="showcase-masthead__sub-nav" aria-label={SUB_NAV_LABEL}>
      <ul>
        {links.map(link => <li key={link.id}><a href={`#${link.id}`}>{link.label}</a></li>)}
      </ul>
    </nav>
  )
}

/** Keeps the page's `scroll-padding-top` equal to the masthead's height while it sticks, and
 * clears it when it doesn't (phones, D8) or when the masthead unmounts. */
const useStickyScrollPadding = (ref: React.RefObject<HTMLElement | null>) => {
  useLayoutEffect(() => {
    const masthead = ref.current
    if (!masthead) return
    const page = document.documentElement
    const update = () => {
      const sticks = getComputedStyle(masthead).position === 'sticky'
      page.style.scrollPaddingTop = sticks ? `${masthead.offsetHeight}px` : ''
    }
    update()
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(update)
    observer?.observe(masthead)
    globalThis.addEventListener('resize', update)
    return () => {
      observer?.disconnect()
      globalThis.removeEventListener('resize', update)
      page.style.scrollPaddingTop = ''
    }
  }, [ref])
}

export const Masthead = ({ section, id }: SectionRendererProps<'masthead'>) => {
  const { title, subNav } = useContext(ShowcasePageInfoContext)
  const ref = useRef<HTMLElement>(null)
  useStickyScrollPadding(ref)

  return (
    <section ref={ref} id={id} className="showcase-masthead" aria-label={title}>
      <div className="showcase-masthead__bar">
        <LogoList logos={section.logos} title={title} />
        <LibrarySearch />
      </div>
      <SubNav links={subNav} />
    </section>
  )
}
