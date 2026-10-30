import { BFF_PUBLIC_SHOWCASE_DATASETS_PATH, Config } from 'src/libs/config'
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

/**
 * Anonymous showcase catalog lookups (DT-4281). BFF mode posts to the
 * same-origin public proxy; legacy mode posts to the configured
 * `showcaseApiUrl` origin. Neither falls back to apiUrl or to mock data.
 *
 * Plain fetch, not fetchAdapter: the adapter signs a visitor out on a 401 from
 * the API host and reports every non-OK status. On this anonymous route a 429
 * or a 400 is an expected answer, and no response says anything about a session.
 */

type LookupMode = LookupRequestInput['mode']

interface LookupResponses {
  identifiers: IdentifiersResponse
  ranking: RankingResponse
  all: AllResponse
  stats: StatsResponse
}

// Parsing enforces the contract, including http(s)-only access URLs.
const RESPONSE_SCHEMAS = {
  identifiers: IdentifiersResponseSchema,
  ranking: RankingResponseSchema,
  all: AllResponseSchema,
  stats: StatsResponseSchema,
} as const

const LOOKUP_PATH = '/showcase/datasets'

export type ShowcaseLookupFailure = 'not_configured' | 'network' | 'http' | 'invalid_response'

export class ShowcaseLookupError extends Error {
  readonly reason: ShowcaseLookupFailure
  /** The HTTP status, when a response arrived. */
  readonly status?: number
  /** From Retry-After on a 429. */
  readonly retryAfterSeconds?: number

  constructor(reason: ShowcaseLookupFailure, message: string, options: { status?: number, retryAfterSeconds?: number, cause?: unknown } = {}) {
    super(message, { cause: options.cause })
    this.name = 'ShowcaseLookupError'
    this.reason = reason
    this.status = options.status
    this.retryAfterSeconds = options.retryAfterSeconds
  }
}

/** The legacy lookup URL, built from the configured value's origin only. */
function legacyLookupUrl(configured: string): string {
  let parsed: URL | undefined
  try {
    parsed = new URL(configured)
  }
  catch {
    parsed = undefined
  }
  if (parsed?.protocol !== 'https:' && parsed?.protocol !== 'http:') {
    throw new ShowcaseLookupError('not_configured', 'showcaseApiUrl is not configured as an http(s) origin')
  }
  return `${parsed.origin}${LOOKUP_PATH}`
}

async function lookupUrl(): Promise<string> {
  if (await Config.isBffEnabled()) {
    return BFF_PUBLIC_SHOWCASE_DATASETS_PATH
  }
  return legacyLookupUrl(await Config.getShowcaseApiUrl())
}

async function errorMessage(res: Response): Promise<string> {
  const fallback = `Showcase lookup failed with status ${res.status}`
  if (!res.headers.get('content-type')?.includes('application/json')) return fallback
  try {
    const body = await res.json() as { message?: unknown }
    return typeof body.message === 'string' ? body.message : fallback
  }
  catch {
    return fallback
  }
}

async function httpError(res: Response): Promise<ShowcaseLookupError> {
  const retryAfter = Number.parseInt(res.headers.get('retry-after') ?? '', 10)
  return new ShowcaseLookupError('http', await errorMessage(res), {
    status: res.status,
    retryAfterSeconds: Number.isNaN(retryAfter) ? undefined : retryAfter,
  })
}

async function send(url: string, request: LookupRequestInput, signal?: AbortSignal): Promise<Response> {
  try {
    return await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(request),
      credentials: 'omit',
      signal,
    })
  }
  catch (error) {
    // A caller's cancellation is not a lookup failure.
    if (signal?.aborted) throw error
    throw new ShowcaseLookupError('network', 'Showcase lookup could not reach the server', { cause: error })
  }
}

/** Resolve one lookup; the response type follows the request's mode. */
export async function lookupShowcaseDatasets<M extends LookupMode>(
  request: Extract<LookupRequestInput, { mode: M }>,
  signal?: AbortSignal,
): Promise<LookupResponses[M]> {
  const res = await send(await lookupUrl(), request, signal)
  if (!res.ok) {
    throw await httpError(res)
  }

  let body: unknown
  try {
    body = await res.json()
  }
  catch (error) {
    throw new ShowcaseLookupError('invalid_response', 'Showcase lookup returned a body that is not JSON', { status: res.status, cause: error })
  }

  const parsed = RESPONSE_SCHEMAS[request.mode].safeParse(body)
  if (!parsed.success) {
    throw new ShowcaseLookupError('invalid_response', 'Showcase lookup returned a response outside the contract', { status: res.status, cause: parsed.error })
  }
  return parsed.data as LookupResponses[M]
}
