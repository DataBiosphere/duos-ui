import { urlProblem } from 'src/showcases/urlPolicy'

export type ShowcaseAction = { label: string, href: string }

/** True when `href` passes the showcase URL policy, so a primitive may render it. */
export const isSafeHref = (href: string): boolean => urlProblem(href) === undefined

// oxlint-disable-next-line no-control-regex -- data URLs get the link policy's control-character check
const CONTROL_CHARACTER = /[\u0000-\u001F\u007F-\u009F]/
/** The image types Vite inlines; a `data:` URL of any other type is refused. */
const INLINED_IMAGE = /^data:image\/(?:png|jpeg|gif|webp|avif|svg\+xml)[;,]/

/**
 * True for a resolved image URL: a bundled asset, which Vite serves as a `/path` or, for a small
 * file, inlines as a `data:image/` URL of a known image type, or an https URL that passes the link
 * policy. No form may contain a control character.
 */
export const isSafeImageSrc = (src: string): boolean =>
  INLINED_IMAGE.test(src) ? !CONTROL_CHARACTER.test(src) : isSafeHref(src) && !src.startsWith('#')
