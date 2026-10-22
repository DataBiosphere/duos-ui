/**
 * The URL policy for authored showcase links (delivery plan section 3). The CI guard applies it to
 * every config, and the renderer applies it again before it renders a link.
 *
 * A link is an `https://` URL, a same-origin path beginning with exactly one `/`, or `#<section key>`
 * for a section that renders an anchor.
 */
import { ANCHOR_SECTION_KEYS, NO_ANCHOR_SECTION_KEYS } from 'src/types/showcase'

// oxlint-disable-next-line no-control-regex -- the policy rejects control characters
const CONTROL_CHARACTER = /[\u0000-\u001F\u007F-\u009F]/
const WHITESPACE = /\s/

const decodes = (url: string) => {
  try {
    decodeURIComponent(url)
    return true
  }
  catch {
    return false
  }
}

const anchorProblem = (url: string): string | undefined => {
  const key = url.slice(1)
  if (key === '') {
    return 'is a bare #'
  }
  if ((NO_ANCHOR_SECTION_KEYS as readonly string[]).includes(key)) {
    return `targets ${key}, which has no anchor`
  }
  return (ANCHOR_SECTION_KEYS as readonly string[]).includes(key) ? undefined : `targets an unknown section "${key}"`
}

const httpsProblem = (url: string): string | undefined => {
  if (!url.startsWith('https://')) {
    return 'must use the https scheme, a /path or a #section'
  }
  // The URL parser drops extra slashes, so `https:///path` would parse with the host `path`.
  if (!/^https:\/\/[^/?#]/.test(url) || !URL.canParse(url)) {
    return 'has no host'
  }
  const { username, password } = new URL(url)
  return username || password ? 'contains credentials' : undefined
}

/** Returns why `url` breaks the policy, or `undefined` when it is safe. */
export const urlProblem = (url: string): string | undefined => {
  if (CONTROL_CHARACTER.test(url)) {
    return 'contains a control character'
  }
  if (WHITESPACE.test(url)) {
    return 'contains whitespace'
  }
  if (url.includes('\\')) {
    return 'contains a backslash'
  }
  if (!decodes(url)) {
    return 'has a malformed percent-encoding'
  }
  if (url.startsWith('#')) {
    return anchorProblem(url)
  }
  if (url.startsWith('/')) {
    return url.startsWith('//') ? 'is protocol-relative' : undefined
  }
  return httpsProblem(url)
}
