import type { IncomingMessage, ServerResponse } from 'node:http'

/** Small request and response helpers for the two mock servers. */

const MAX_BODY_BYTES = 64 * 1024

export async function readBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    size += (chunk as Buffer).length
    if (size > MAX_BODY_BYTES) throw new Error('request body is too large')
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

/** The URL of a request, parsed against the server's own origin. */
export const requestUrl = (request: IncomingMessage, origin: string): URL => new URL(request.url ?? '/', origin)

export function bearerToken(request: IncomingMessage): string | undefined {
  const match = /^Bearer (\S+)$/.exec(request.headers.authorization ?? '')
  return match?.[1]
}
