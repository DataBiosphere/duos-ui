import { urlProblem } from 'src/showcases/urlPolicy'

export type ShowcaseAction = { label: string, href: string }

/** True when `href` passes the showcase URL policy, so a primitive may render it. */
export const isSafeHref = (href: string): boolean => urlProblem(href) === undefined

/**
 * True for a resolved image URL: a bundled asset, which Vite serves as a `/path` or, for a small
 * file, inlines as a `data:image/` URL, or an https URL that passes the link policy.
 */
export const isSafeImageSrc = (src: string): boolean =>
  src.startsWith('data:image/') || (isSafeHref(src) && !src.startsWith('#'))
