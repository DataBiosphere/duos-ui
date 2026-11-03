import type { IncomingMessage, ServerResponse } from 'node:http'
import { isDeepStrictEqual } from 'node:util'
import type { LookupRequestInput } from 'src/types/showcase'
import { createShowcaseCatalogMock } from '../../fixtures/showcase/catalogMock'
import { lookupExamples } from '../../fixtures/showcase/contracts'
import { HttpError, readBody } from './http'
import { MOCK_SHOWCASE_LOOKUP_PATH } from './settings'

/**
 * Consent's anonymous `POST /showcase/datasets` (DT-4275), for the legacy-mode
 * project, where the browser calls it cross-origin (DT-4353). It is
 * deliberately small:
 *
 * - A body equal to a request in `lookupExamples` gets that example's status
 *   and response, the 400s included.
 * - Any other body with a known `mode` gets `createShowcaseCatalogMock()`'s
 *   answer. That mock skips Consent's bounds checks.
 * - Anything else is a 400.
 *
 * It checks no token. A request that carries an `Authorization` header or a
 * cookie is a 400, so a client that sends credentials fails loudly. CORS
 * admits only the given page origins and has no `allow-credentials`.
 */

const MODES: ReadonlySet<string> = new Set(['identifiers', 'ranking', 'all', 'stats'])

const lookup = createShowcaseCatalogMock()

function corsHeaders(request: IncomingMessage, allowedOrigins: readonly string[]): Record<string, string> | undefined {
  const origin = request.headers.origin
  if (origin === undefined || !allowedOrigins.includes(origin)) return undefined
  return { 'access-control-allow-origin': origin, 'vary': 'Origin' }
}

async function answer(request: IncomingMessage): Promise<{ status: number, body: unknown }> {
  if (request.headers.authorization !== undefined || request.headers.cookie !== undefined) {
    throw new HttpError(400, 'the showcase lookup is anonymous; the request carried credentials (mock Consent upstream)')
  }
  let body: unknown
  try {
    body = JSON.parse(await readBody(request))
  }
  catch (error) {
    if (error instanceof HttpError) throw error
    throw new HttpError(400, 'the request body is not JSON (mock Consent upstream)')
  }
  const example = lookupExamples.find(candidate => isDeepStrictEqual(candidate.request, body))
  if (example) return { status: example.status, body: example.response }
  const mode = (body as { mode?: unknown } | null)?.mode
  if (typeof mode !== 'string' || !MODES.has(mode)) {
    throw new HttpError(400, 'the request has no known lookup mode (mock Consent upstream)')
  }
  try {
    return { status: 200, body: await lookup(body as LookupRequestInput) }
  }
  catch {
    // A known mode with fields of the wrong shape: the catalog mock cannot read it.
    throw new HttpError(400, 'the request does not fit its lookup mode (mock Consent upstream)')
  }
}

/** Answers the lookup and its preflight. False for any other path. */
export async function serveShowcaseLookup(
  request: IncomingMessage,
  response: ServerResponse,
  url: URL,
  allowedOrigins: readonly string[],
): Promise<boolean> {
  if (url.pathname !== MOCK_SHOWCASE_LOOKUP_PATH) return false
  const cors = corsHeaders(request, allowedOrigins)
  if (request.method === 'OPTIONS') {
    if (!cors) throw new HttpError(403, 'the preflight origin is not allowed (mock Consent upstream)')
    response.writeHead(204, {
      ...cors,
      'access-control-allow-methods': 'POST',
      'access-control-allow-headers': 'content-type, accept',
      'access-control-max-age': '600',
    }).end()
    return true
  }
  const send = (status: number, body: unknown): void => {
    response.writeHead(status, { ...cors, 'content-type': 'application/json', 'cache-control': 'no-store' })
    response.end(JSON.stringify(body))
  }
  if (request.method !== 'POST') {
    send(405, { message: `${request.method} is not allowed on ${url.pathname} (mock Consent upstream)` })
    return true
  }
  // Errors carry the CORS headers too, so a browser sees the status, as it would from Consent.
  try {
    const { status, body } = await answer(request)
    send(status, body)
  }
  catch (error) {
    if (!(error instanceof HttpError)) throw error
    send(error.status, { message: error.message })
  }
  return true
}
