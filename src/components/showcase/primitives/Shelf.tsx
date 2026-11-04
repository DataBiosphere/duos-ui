import React, { Children, isValidElement, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import './Shelf.css'

export interface ShelfProps {
  /** Plain-text shelf title: names the arrows and the default heading. */
  title: string
  /** Id of the heading element; labels the region. */
  headingId: string
  /** Replaces the default `<h2 id={headingId}>{title}</h2>`; must carry `id={headingId}`. */
  heading?: ReactNode
  /** Header actions beside the arrows, such as the "See all" link (D4). */
  actions?: ReactNode
  /** One card per child. */
  children?: ReactNode
}

const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Distance that moves one view of fully visible cards: whole cards plus the gaps between them. */
const pageWidth = (list: HTMLElement) => {
  const [first, second] = Array.from(list.children) as HTMLElement[]
  const step = second ? second.offsetLeft - first.offsetLeft : first?.offsetWidth
  if (!(step > 0)) return list.clientWidth
  const gap = step - first.offsetWidth
  return Math.max(1, Math.floor((list.clientWidth + gap) / step)) * step
}

/** A horizontally scrolling row of cards with named back/forward controls (design review D1–D3). */
export const Shelf = ({ title, headingId, heading, actions, children }: ShelfProps) => {
  const listRef = useRef<HTMLUListElement>(null)
  const controlsRef = useRef<HTMLDivElement>(null)
  // Set when the arrows are about to disappear while one of them has focus.
  const refocusRef = useRef(false)
  const [scroll, setScroll] = useState({ overflows: false, atStart: true, atEnd: true, hasFocusable: true })

  const measure = useCallback(() => {
    const list = listRef.current
    if (!list) return
    const { scrollLeft, clientWidth, scrollWidth } = list
    const next = {
      overflows: scrollWidth > clientWidth + 1,
      atStart: scrollLeft <= 1,
      atEnd: scrollLeft + clientWidth >= scrollWidth - 1,
      hasFocusable: list.querySelector(FOCUSABLE) !== null,
    }
    const active = document.activeElement
    if (!next.overflows && active instanceof HTMLElement && active.classList.contains('showcase-shelf__arrow')
      && controlsRef.current?.contains(active)) {
      refocusRef.current = true
    }
    setScroll(prev => (Object.keys(next) as (keyof typeof next)[]).every(k => prev[k] === next[k]) ? prev : next)
  }, [])

  // Removing a focused arrow would drop focus to the page body; move it to the shelf's first card
  // control instead, or to the list itself.
  useLayoutEffect(() => {
    const list = listRef.current
    if (!refocusRef.current || scroll.overflows || !list) return
    refocusRef.current = false
    const target = list.querySelector<HTMLElement>(FOCUSABLE) ?? list
    if (target === list) list.tabIndex = -1
    target.focus()
  }, [scroll.overflows])

  // Cards may arrive after mount (loading skeleton, D11), which no resize event reports.
  useLayoutEffect(measure)

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const resize = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure)
    if (resize) resize.observe(list)
    else window.addEventListener('resize', measure)
    // A card can gain or lose a link without a Shelf render, which would leave hasFocusable stale.
    const mutations = typeof MutationObserver === 'undefined' ? undefined : new MutationObserver(measure)
    mutations?.observe(list, { childList: true, subtree: true, attributes: true, attributeFilter: ['href', 'tabindex', 'disabled'] })
    return () => {
      if (resize) resize.disconnect()
      else window.removeEventListener('resize', measure)
      mutations?.disconnect()
    }
  }, [measure])

  const page = (direction: 1 | -1) => {
    const list = listRef.current
    if (!list || (direction === 1 ? scroll.atEnd : scroll.atStart)) return
    const left = direction * pageWidth(list)
    const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth'
    if (typeof list.scrollBy === 'function') {
      list.scrollBy({ left, behavior })
    }
    else {
      list.scrollLeft += left
    }
  }

  // Keyboard users must be able to reach a scroller; cards with links or buttons already do.
  const listFocusable = scroll.overflows && !scroll.hasFocusable

  return (
    <section className="showcase-shelf" aria-labelledby={headingId}>
      <div className="showcase-shelf__header">
        {heading ?? <h2 id={headingId} className="showcase-shelf__title">{title}</h2>}
        {(actions || scroll.overflows) && (
          <div className="showcase-shelf__controls" ref={controlsRef}>
            {actions}
            {scroll.overflows && (
              <>
                <button
                  type="button"
                  className="showcase-shelf__arrow"
                  aria-label={`Scroll ${title} back`}
                  aria-disabled={scroll.atStart}
                  onClick={() => page(-1)}
                >
                  <ChevronLeftIcon aria-hidden />
                </button>
                <button
                  type="button"
                  className="showcase-shelf__arrow"
                  aria-label={`Scroll ${title} forward`}
                  aria-disabled={scroll.atEnd}
                  onClick={() => page(1)}
                >
                  <ChevronRightIcon aria-hidden />
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {/* role="list" restores list semantics that Safari drops with list-style: none. */}
      <ul
        ref={listRef}
        role="list"
        className="showcase-shelf__list"
        onScroll={measure}
        tabIndex={listFocusable ? 0 : undefined}
        aria-labelledby={listFocusable ? headingId : undefined}
      >
        {Children.toArray(children).map((card, i) => <li key={isValidElement(card) ? card.key : i} className="showcase-shelf__card">{card}</li>)}
      </ul>
    </section>
  )
}
