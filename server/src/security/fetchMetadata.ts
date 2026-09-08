import type { FastifyReply, FastifyRequest } from 'fastify'

/**
 * Fetch Metadata enforcement (Phase 5, story 5-B) — closes the ADR-009 residual.
 *
 * The residual risk recorded in docs/plans/bff_adrs/ADR-009-state-changing-gets.md
 * is state-changing **GETs** (`/api/nih/sync`, and the sync side effect inside
 * `/api/user/me`). CSRF tokens cannot apply to GET, and `SameSite=Lax` still
 * sends the session cookie on **same-site** requests — in dev/staging the app
 * shares the `broadinstitute.org` registrable domain with many sibling
 * services, so a compromised sibling subdomain is same-site, not cross-site.
 * The forgery has three shapes there, not one:
 *
 *   - a top-level navigation (`Sec-Fetch-Mode: navigate`),
 *   - a subresource such as `<img>` (`no-cors`),
 *   - a credentialed `fetch()` (`cors` — CORS blocks the *read*, but the
 *     simple GET still executes upstream).
 *
 * All three arrive with `Sec-Fetch-Site: same-site`, so neither a
 * cross-site-only rule nor a navigate-only rule (the mitigation ADR-009
 * deferred) closes the gap. The rule is a positive allowlist instead:
 *
 *   **When the Fetch Metadata headers are present, require
 *   `Sec-Fetch-Site: same-origin` AND `Sec-Fetch-Mode: cors` or
 *   `same-origin`.** Anything else — including a missing or malformed
 *   `Sec-Fetch-Mode` alongside a present `Sec-Fetch-Site` — is rejected.
 *
 * When **both** headers are absent (older browsers, and non-browser clients
 * such as curl or the test injector), the request is **allowed** and the
 * CSRF/session controls carry the load alone — exactly the pre-guard posture.
 * That is a documented, deliberate choice: the headers are forbidden request
 * headers a browser sets itself, so an attacker-controlled *browser* request
 * cannot strip them, and a non-browser client holds no victim's cookie jar to
 * forge with. A request carrying only ONE of the pair is not a browser shape
 * at all — browsers send both together or neither — so it is rejected as
 * malformed rather than waved through as legacy.
 *
 * This is safe to apply bluntly because no legitimate flow navigates to or
 * subresource-loads a guarded path (verified 2026-08-24: every client download
 * goes `fetch` → blob → `createObjectURL`, never a proxy-path navigation).
 * Applied to every upstream proxy prefix (upstreamProxy.ts attaches it ahead
 * of the CSRF hook, so a rejected request costs no session read, no token
 * refresh, and no upstream call) and to `/auth/me`, which sits outside the
 * prefixes but calls Consent's state-changing `GET /api/user/me` server-side.
 * It must NOT be attached to `/auth/login` or `/auth/callback`: the OAuth
 * callback is a legitimate cross-site top-level navigation from B2C.
 */

/**
 * Like the CSRF rejection, a bare 403 would be ambiguous — upstreams deny
 * writes with 403 too — so the body names the guard. No client branches on
 * this: a legitimate same-origin caller can never trigger it.
 */
export const FETCH_METADATA_ERROR_CODE = 'cross_site_request_blocked'

const ALLOWED_MODES: ReadonlySet<string> = new Set(['cors', 'same-origin'])

/**
 * An onRequest hook. Async, returning the reply on rejection, in the same
 * style as the proxy's `ensureUpstreamAuth`: Fastify needs the reply returned
 * from an async hook to know the response was already sent.
 *
 * The header reads tolerate `string[]` (repeated headers): a repeated
 * `sec-fetch-site` fails the `=== 'same-origin'` comparison and is rejected —
 * malformed input fails closed, only the genuinely absent PAIR is waved
 * through.
 */
export async function fetchMetadataGuard(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply | undefined> {
  const site = request.headers['sec-fetch-site']
  const mode = request.headers['sec-fetch-mode']
  if (site === undefined && mode === undefined) {
    return undefined
  }

  if (site === 'same-origin' && typeof mode === 'string' && ALLOWED_MODES.has(mode)) {
    return undefined
  }

  request.log.info(
    { url: request.url, method: request.method, secFetchSite: site, secFetchMode: mode },
    '[fetch-metadata] blocked a request whose Fetch Metadata is not same-origin cors/same-origin',
  )
  return reply.status(403).send({ error: FETCH_METADATA_ERROR_CODE })
}
