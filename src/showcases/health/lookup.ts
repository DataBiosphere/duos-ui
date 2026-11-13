/**
 * The health check's catalog lookup (DT-4359, S4.3). It posts the page's anonymous lookup to an
 * explicit URL, production Consent by default, rather than reading the browser config the page
 * uses (`src/libs/ajax/ShowcaseCatalog`). Responses are parsed with the same contract schemas.
 *
 * Every answer is one of three kinds:
 * - `ok`: the parsed response.
 * - `disabled`: Consent answered 405 because the public lookup is turned off
 *   (`showcase.publicLookupEnabled`). That is a known state, so the check skips identifiers instead
 *   of failing, and does not retry.
 * - `failed`: a network error, a timeout, a 408, 429 or 5xx that outlasted the retries, which marks
 *   the lookup `unreachable`, or an answer that no retry changes (another 4xx, a redirect, or a
 *   body outside the contract).
 */
import {
  AllResponseSchema,
  IdentifiersResponseSchema,
  RankingResponseSchema,
  StatsResponseSchema,
} from 'src/showcases/schema'
import type {
  AllResponse,
  IdentifiersResponse,
  LookupRequestInput,
  RankingResponse,
  StatsResponse,
} from 'src/types/showcase'
import { type AttemptResult, DEFAULT_RETRY, type RetryOptions, retryAfterMs, withRetry } from './retry'

/** Production Consent: showcase configs list production identifiers. */
export const DEFAULT_LOOKUP_ORIGIN = 'https://consent.dsde-prod.broadinstitute.org'

const LOOKUP_PATH = '/showcase/datasets'

/** No single request waits longer than this. */
export const REQUEST_TIMEOUT_MS = 30_000

type LookupMode = LookupRequestInput['mode']

interface LookupResponses {
  identifiers: IdentifiersResponse
  ranking: RankingResponse
  all: AllResponse
  stats: StatsResponse
}

const RESPONSE_SCHEMAS = {
  identifiers: IdentifiersResponseSchema,
  ranking: RankingResponseSchema,
  all: AllResponseSchema,
  stats: StatsResponseSchema,
} as const

export type HealthLookupResult<T>
  = | { kind: 'ok', data: T }
    | { kind: 'disabled' }
    | { kind: 'failed', reason: string, unreachable: boolean }

/**
 * The lookup URL for an http(s) origin, or the production default when `configured` is empty.
 * Only the origin is kept, so a configured path or query can't redirect the check.
 */
export function lookupUrl(configured: string | undefined): string {
  const value = configured?.trim() || DEFAULT_LOOKUP_ORIGIN
  let parsed: URL
  try {
    parsed = new URL(value)
  }
  catch {
    throw new Error(`The showcase lookup URL "${value}" is not a URL`)
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`The showcase lookup URL "${value}" is not http(s)`)
  }
  return `${parsed.origin}${LOOKUP_PATH}`
}

export interface HealthLookupOptions {
  /** The full lookup URL, from `lookupUrl`. */
  url: string
  fetch?: typeof fetch
  retry?: RetryOptions
  timeoutMs?: number
}

export type HealthLookup = <M extends LookupMode>(request: Extract<LookupRequestInput, { mode: M }>) => Promise<HealthLookupResult<LookupResponses[M]>>

/** A lookup function bound to one URL. */
export function createHealthLookup(options: HealthLookupOptions): HealthLookup {
  const { url, fetch: fetchImpl = fetch, retry = DEFAULT_RETRY, timeoutMs = REQUEST_TIMEOUT_MS } = options

  const attempt = async (request: LookupRequestInput): Promise<AttemptResult<HealthLookupResult<unknown>>> => {
    let res: Response
    try {
      res = await fetchImpl(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(request),
        // A followed 301 or 302 turns the POST into a GET, whose 405 would read as "disabled".
        redirect: 'manual',
        signal: AbortSignal.timeout(timeoutMs),
      })
    }
    catch (error) {
      return { retry: `could not reach the lookup (${error instanceof Error ? error.message : String(error)})` }
    }

    // Node keeps a connection busy until its body is read or cancelled.
    if (!res.ok) await res.body?.cancel().catch(() => undefined)
    if (res.status >= 300 && res.status < 400) return { done: { kind: 'failed', reason: `the lookup redirected with ${res.status}`, unreachable: false } }
    if (res.status === 405) return { done: { kind: 'disabled' } }
    if (res.status === 429) return { retry: 'the lookup answered 429', retryAfterMs: retryAfterMs(res.headers.get('retry-after')) }
    // 408 is a server timing the request out, so it is retried like a 5xx.
    if (res.status >= 500 || res.status === 408) return { retry: `the lookup answered ${res.status}` }
    if (!res.ok) return { done: { kind: 'failed', reason: `the lookup answered ${res.status}`, unreachable: false } }

    // The timeout covers the body too, so a stall or reset while reading it is transient.
    let text: string
    try {
      text = await res.text()
    }
    catch (error) {
      return { retry: `the lookup response was cut off (${error instanceof Error ? error.message : String(error)})` }
    }
    let body: unknown
    try {
      body = JSON.parse(text)
    }
    catch {
      return { done: { kind: 'failed', reason: 'the lookup returned a body that is not JSON', unreachable: false } }
    }
    const parsed = RESPONSE_SCHEMAS[request.mode].safeParse(body)
    return parsed.success
      ? { done: { kind: 'ok', data: parsed.data } }
      : { done: { kind: 'failed', reason: 'the lookup returned a response outside the contract', unreachable: false } }
  }

  return (async (request: LookupRequestInput) => {
    const result = await withRetry(() => attempt(request), retry)
    return result.ok ? result.value : { kind: 'failed', reason: `${result.reason}, after ${result.attempts} attempts`, unreachable: true }
  }) as HealthLookup
}
