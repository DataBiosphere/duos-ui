import type { IncomingMessage, ServerResponse } from 'node:http'

/** Small request and response helpers for the two mock servers. */

/**
 * A client error with its status. The servers' request guard in main.ts answers
 * it as JSON, so a bad request gets a 4xx instead of an empty 500.
 */
export class HttpError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const MAX_BODY_BYTES = 64 * 1024

export async function readBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    size += (chunk as Buffer).length
    if (size > MAX_BODY_BYTES) throw new HttpError(413, `the request body is larger than ${MAX_BODY_BYTES} bytes`)
    chunks.push(chunk as Buffer)
  }
  return Buffer.concat(chunks).toString('utf8')
}

export function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' })
  response.end(JSON.stringify(body))
}

export function redirect(response: ServerResponse, location: string): void {
  response.writeHead(302, { 'location': location, 'cache-control': 'no-store' })
  response.end()
}

/**
 * The URL of a request, parsed against the server's own origin. A target that
 * does not parse, such as `//`, is a 400.
 */
export function requestUrl(request: IncomingMessage, origin: string): URL {
  try {
    return new URL(request.url ?? '/', origin)
  }
  catch {
    throw new HttpError(400, 'the request URL is malformed')
  }
}

export function bearerToken(authorization: string | null): string | undefined {
  const match = /^Bearer (\S+)$/.exec(authorization ?? '')
  return match?.[1]
}
