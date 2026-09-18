import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router'

/**
 * Sends a new navigation to the top of the page.
 *
 * BrowserRouter keeps the current document offset across an in-app navigation, so following a link
 * from halfway down a long page opens the next one already scrolled. That is every route, not one
 * page: 'Back to library' from deep inside a study lands on the library at the same offset.
 *
 * POP is the browser's own Back and Forward, where it restores the offset it recorded - overriding
 * that would lose the reader's place, which is the whole point of going back.
 *
 * Only a change of pathname counts. The library keeps its filters, sort and page in the query
 * string, so every one of those is a navigation to the same page: comparing pathnames leaves the
 * reader where they were. Reacting to the location alone would have scrolled on the first such
 * change - navigationType flips from POP to PUSH once - and then never again. The same comparison
 * covers the first render, so a bookmark deep into a page keeps the offset the browser restored.
 */
const ScrollToTopOnNavigate = () => {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()
  const previousPathname = useRef<string | null>(null)

  useEffect(() => {
    const movedToAnotherPage = previousPathname.current !== null && previousPathname.current !== pathname
    previousPathname.current = pathname
    if (movedToAnotherPage && navigationType !== 'POP') {
      globalThis.scrollTo({ top: 0, left: 0 })
    }
  }, [pathname, navigationType])

  return null
}

export default ScrollToTopOnNavigate
