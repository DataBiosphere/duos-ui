/**
 * Paths the client calls today with no `Authorization` header, verified against
 * the call sites rather than assumed: `/status` (ServiceStatus.ts),
 * `/oauth2/configuration` (OAuth2.ts), `/tos/text/duos` (ToS.ts, `textPlain()`),
 * `/support/request` and `/support/upload` (Support.ts).
 *
 * They proxy through without a session, and without a token even when there IS
 * a session — matching current client behavior exactly is the point, so
 * cutover cannot change what the upstream sees. Without this allowlist the
 * signed-out status page and the Contact Us form would start returning 401.
 *
 * Matched exactly, not by prefix: a `/status` prefix would also swallow a
 * future `/statuses`, and every entry here is a fixed path.
 */
export const UNAUTHENTICATED_PATHS: ReadonlySet<string> = new Set([
  '/status',
  '/oauth2/configuration',
  '/tos/text/duos',
  '/support/request',
  '/support/upload',
])
