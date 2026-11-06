/**
 * Handoffs from a public showcase into signed-in DUOS pages (DT-4354, S3.2).
 *
 * Search, dataset detail and the data access request start on pages that `AppRoutes` wraps in
 * `Authenticated`. A visitor who is not signed in goes to the sign-in page, and `redirectTo`
 * brings them back to the same path and query string. So a handoff is a plain internal link, and
 * the showcase labels it as needing sign-in.
 *
 * Environment binding (delivery plan section 3, "Dataset identifiers across environments"): a
 * config lists production `DUOS-` identifiers, and a content preview reads them from production.
 * The same identifier can name a different dataset in this environment's DUOS, so a handoff opens
 * only when config.json has `showcaseHandoffsEnabled`. The server sets it to `true` only when the
 * showcase lookup reads this environment's own Consent (server/src/config.ts). Anything else
 * turns every handoff off, and the page says why.
 */
import { createContext } from 'react'
import { DUOS_IDENTIFIER_PATTERN } from 'src/types/showcase'

export interface ShowcaseHandoffs {
  /** True only when the showcase lookup reads this environment's catalog (`showcaseHandoffsEnabled`). */
  enabled: boolean
  /** True only when the session probe says the visitor is signed in. */
  signedIn: boolean
}

/** Fails closed: without a provider, no handoff opens. */
export const ShowcaseHandoffsContext = createContext<ShowcaseHandoffs>({ enabled: false, signedIn: false })

export const LIBRARY_PATH = '/datalibrary'

/**
 * The data library with `text` as its search, in the encoding the library reads back
 * (`useLibraryUrlState` reads `query` with `URLSearchParams`). Blank text opens the library.
 */
export const librarySearchPath = (text: string): string => {
  const query = text.trim()
  return query === '' ? LIBRARY_PATH : `${LIBRARY_PATH}?${new URLSearchParams({ query }).toString()}`
}

/**
 * The dataset detail page for a canonical `DUOS-` identifier, or undefined for anything else. The
 * page has "Apply for Access", which starts the current DAR path with the dataset selected and
 * shows the existing sign-in and eligibility rules, so a request action links here too.
 */
export const datasetPath = (identifier: string): string | undefined =>
  DUOS_IDENTIFIER_PATTERN.test(identifier) ? `/dataset/${identifier}` : undefined

/** Routes outside `Authenticated` in `AppRoutes`. Any other internal path counts as signed-in, so
 * a route that this list leaves out is labeled and blocked, never opened by mistake. */
const PUBLIC_PATHS: ReadonlySet<string> = new Set([
  '/', '/home', '/status', '/nih_pilot_info', '/privacy', '/cookie_policy', '/tos', '/nih_dms_policy', '/anvil_dms_policy', '/data',
])

/**
 * True for an internal path that needs no session: a public page or another showcase. A link with
 * `?redirectTo=` is not public, even on a public page: sign-in sends the visitor on to that
 * destination, so the link is a handoff to wherever `redirectTo` points.
 */
export const isPublicPath = (href: string): boolean => {
  const url = new URL(href, 'https://showcase.invalid')
  if (url.searchParams.has('redirectTo')) return false
  return PUBLIC_PATHS.has(url.pathname) || url.pathname.startsWith('/showcase/')
}
