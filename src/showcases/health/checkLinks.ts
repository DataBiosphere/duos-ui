/**
 * The link half of the showcase health check (DT-4359, S4.3). It collects every external link a
 * showcase config renders and requests each one, reporting broken links apart from the dataset
 * findings.
 *
 * Collection follows the CI guard's rule for URL fields (`url` or a key ending in `Url`, in
 * test/showcases/guard/checkShowcase.ts). Only `https://` values are requested: same-origin paths
 * and `#section` anchors are DUOS's own, and the URL policy allows nothing else. Links inside a
 * disabled section, or in an item with a `startDate`–`endDate` window that doesn't include today
 * (such as an expired announcement), are skipped, because the page doesn't render them.
 *
 * Classification, after retries for network errors, timeouts, 408, 429 and 5xx:
 * - `broken`: 404 or 410, a 5xx, 408 or timeout that outlasted the retries, or a request that never
 *   got an answer (DNS, TLS, refused connection, redirect loop).
 * - `unverified`: any other 4xx, such as 401, 403, 429 or 451. Sites answer automated requests this
 *   way, so the check can't tell a working link from a broken one.
 * A HEAD request comes first. Any answer but a success or a 429, and any error, is tried again with
 * GET, because some sites reject HEAD.
 */
import { type Clock, isInDateWindow, systemClock } from 'src/showcases/dateWindow'
import type { RegistryEntry, ShowcaseConfig, ShowcaseConfigInput } from 'src/types/showcase'
import { type AttemptResult, DEFAULT_RETRY, type RetryOptions, retryAfterMs, withRetry } from './retry'

export interface LinkLocation {
  showcase: string
  status: RegistryEntry['status']
  /** The dotted config path, e.g. `sections.featured-tools.items.0.launchUrl`. */
  path: string
}

export interface LinkFinding {
  url: string
  /** The last HTTP status, when an answer arrived. */
  httpStatus?: number
  reason: string
  /** Every place the link appears; one request covers them all. */
  locations: LinkLocation[]
}

export interface LinkReport {
  checked: number
  broken: LinkFinding[]
  unverified: LinkFinding[]
}

export interface LinkShowcase {
  entry: Pick<RegistryEntry, 'key' | 'status'>
  config: Pick<ShowcaseConfigInput | ShowcaseConfig, 'sections'>
}

const isUrlField = (key: string) => key === 'url' || key.endsWith('Url')

/** Each external link with every place it appears, in config order. */
export function collectLinks(showcases: readonly LinkShowcase[], clock: Clock = systemClock): Map<string, LinkLocation[]> {
  const links = new Map<string, LinkLocation[]>()
  const visit = (value: unknown, path: string, where: Omit<LinkLocation, 'path'>) => {
    if (value === null || typeof value !== 'object') return
    // The page filters dated items with the same test (`filterByDateWindow`).
    const { startDate, endDate } = value as { startDate?: unknown, endDate?: unknown }
    if (typeof startDate === 'string' && typeof endDate === 'string' && !isInDateWindow({ startDate, endDate }, clock)) return
    for (const [key, child] of Object.entries(value)) {
      const childPath = path ? `${path}.${key}` : key
      if (isUrlField(key) && typeof child === 'string' && child.startsWith('https://')) {
        links.set(child, [...links.get(child) ?? [], { ...where, path: childPath }])
      }
      visit(child, childPath, where)
    }
  }
  for (const { entry, config } of showcases) {
    const where = { showcase: entry.key, status: entry.status }
    for (const [key, section] of Object.entries(config.sections)) {
      if ((section as { enabled?: unknown }).enabled === true) visit(section, `sections.${key}`, where)
    }
  }
  return links
}

export const LINK_TIMEOUT_MS = 20_000

/** How many links are requested at once. */
export const LINK_CONCURRENCY = 4

/** A generic name, so partner sites see what is asking and nothing about who runs it. */
export const USER_AGENT = 'DUOS-showcase-link-check'

/** The answers that mean the page is gone; any other 4xx is a site refusing the request. */
const GONE_STATUSES = new Set([404, 410])

/** 408 is the site timing out, so it is retried like a 5xx. */
const RETRIED_STATUSES = new Set([408])

export type LinkOutcome = { kind: 'ok' } | { kind: 'broken' | 'unverified', httpStatus?: number, reason: string }

export interface LinkCheckOptions {
  fetch?: typeof fetch
  retry?: RetryOptions
  timeoutMs?: number
  /** Which dated items are current; injectable for tests. */
  clock?: Clock
}

const describe = (error: unknown) => {
  const cause = error instanceof Error && error.cause instanceof Error ? `: ${error.cause.message}` : ''
  return error instanceof Error ? `${error.message}${cause}` : String(error)
}

/** Requests one link: HEAD, then GET when HEAD isn't a success. */
export async function checkLink(url: string, options: LinkCheckOptions = {}): Promise<LinkOutcome> {
  const { fetch: fetchImpl = fetch, retry = DEFAULT_RETRY, timeoutMs = LINK_TIMEOUT_MS } = options

  const request = async (method: 'HEAD' | 'GET') => {
    const res = await fetchImpl(url, { method, redirect: 'follow', headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(timeoutMs) })
    // Only the status matters; release the connection.
    await res.body?.cancel().catch(() => undefined)
    return res
  }

  const throttle = (res: Response): AttemptResult<LinkOutcome> =>
    ({ retry: 'answered 429', retryAfterMs: retryAfterMs(res.headers.get('retry-after')) })

  const attempt = async (): Promise<AttemptResult<LinkOutcome>> => {
    // Some sites hang up on HEAD or time it out but serve GET, so an error falls through to GET too.
    const head = await request('HEAD').catch(() => undefined)
    if (head?.ok) return { done: { kind: 'ok' } }
    // A throttled site gets no second request until its Retry-After has passed.
    if (head?.status === 429) return throttle(head)

    let res: Response
    try {
      res = await request('GET')
    }
    catch (error) {
      return { retry: `no answer (${describe(error)})` }
    }
    if (res.ok) return { done: { kind: 'ok' } }
    if (res.status === 429) return throttle(res)
    if (res.status >= 500 || RETRIED_STATUSES.has(res.status)) return { retry: `answered ${res.status}` }
    const kind = GONE_STATUSES.has(res.status) ? 'broken' : 'unverified'
    return { done: { kind, httpStatus: res.status, reason: `answered ${res.status}` } }
  }

  const result = await withRetry(attempt, retry)
  if (result.ok) return result.value
  // A 429 that never cleared is a site limiting automated requests, not a broken link.
  const throttled = result.reason === 'answered 429'
  const httpStatus = /^answered (\d{3})$/.exec(result.reason)?.[1]
  return {
    kind: throttled ? 'unverified' : 'broken',
    ...(httpStatus ? { httpStatus: Number(httpStatus) } : {}),
    reason: `${result.reason}, after ${result.attempts} attempts`,
  }
}

/** Checks every collected link, a few at a time. */
export async function checkLinks(showcases: readonly LinkShowcase[], options: LinkCheckOptions = {}): Promise<LinkReport> {
  const links = [...collectLinks(showcases, options.clock)]
  const outcomes: LinkOutcome[] = new Array(links.length)
  let next = 0
  const worker = async () => {
    while (next < links.length) {
      const index = next++
      outcomes[index] = await checkLink(links[index][0], options)
    }
  }
  await Promise.all(Array.from({ length: Math.min(LINK_CONCURRENCY, links.length) }, worker))

  const report: LinkReport = { checked: links.length, broken: [], unverified: [] }
  links.forEach(([url, locations], index) => {
    const outcome = outcomes[index]
    if (outcome.kind !== 'ok') report[outcome.kind].push({ url, httpStatus: outcome.httpStatus, reason: outcome.reason, locations })
  })
  return report
}
