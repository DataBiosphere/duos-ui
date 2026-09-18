import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router'

/**
 * Sends a new navigation to the top of the page.
 *
 * BrowserRouter keeps the current document offset across an in-app navigation, so following a link
 * from halfway down a long page opens the next one already scrolled. That is every route, not one
 * page: 'Back to library' from deep inside a study lands on the library at the same offset.
 *
 * POP is the browser's own Back and Forward, where it restores the offset it recorded - overriding
 * that would lose the reader's place, which is the whole point of going back. The initial load is
 * reported as POP too, so a bookmark deep into a page is left alone as well.
 */
const ScrollToTopOnNavigate = () => {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if (navigationType !== 'POP') {
      globalThis.scrollTo({ top: 0, left: 0 })
    }
  }, [pathname, navigationType])

  return null
}

export default ScrollToTopOnNavigate
