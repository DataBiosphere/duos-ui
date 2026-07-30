# ADR-004 — API proxy layer: `@fastify/reply-from` in a BFF-owned route

**Status:** Accepted (2026-07-29) &nbsp;|&nbsp; **Phase:** 3, story 3-A
**Supersedes:** ADR-004 in `BFF_Migration_Plan_v2.md` ("Use `@fastify/http-proxy`")

---

## Context

Phase 3 moves `Authorization` header construction off the browser: the client calls
relative BFF URLs, and Fastify forwards them to the DUOS API with the session's
B2C access token attached. The plan sketched a hand-rolled `fetch` proxy for
development with `@fastify/http-proxy` as the production option, and left the
choice to this story.

Four properties of the current client decide it. All were confirmed against the
code rather than assumed:

**1. Real streaming traffic in both directions.** Uploads use `multipart/form-data`
via `fetchMultipart` — [FileStorageObject.ts:40](../../src/libs/ajax/FileStorageObject.ts:40)
(arbitrary user-selected `File`), [DataSet.ts:26](../../src/libs/ajax/DataSet.ts:26),
[DataSet.ts:95](../../src/libs/ajax/DataSet.ts:95),
[DataSet.ts:118](../../src/libs/ajax/DataSet.ts:118),
[ProgressReport.ts:8](../../src/libs/ajax/ProgressReport.ts:8) — plus a binary
`POST` to `/support/upload` ([Support.ts:74](../../src/libs/ajax/Support.ts:74)).
Downloads use `fetchBlob` in `DAA`, `DAR`, and `FileStorageObject`, and a
`responseType: 'blob'` GET at [DataSet.ts:133](../../src/libs/ajax/DataSet.ts:133).

**2. Fastify parses nothing useful for a proxy.** Only `application/json` and
`text/plain` have default parsers, so `multipart/form-data` and
`application/binary` reject with `FST_ERR_CTP_INVALID_MEDIA_TYPE` (415) *before*
any proxy handler runs — every upload path breaks. And for JSON, `request.body`
is an already-parsed object: passing it to `fetch` as `body` sends the string
`"[object Object]"`.

**3. Not every upstream path lives under `/api`.** Of 104 `getApiUrl()` call
sites, 9 distinct paths sit outside it: `/status`, `/feature`, `/tos/text/duos`,
`/ontology/search`, `/ontology/autocomplete`, `/oauth2/configuration`,
`/support/request`, `/support/upload`, `/api-docs/ISO-3166-countries.json`.
An `/api/*` wildcard under-covers, and the plan's
`request.url.replace(/^\/api/, '')` would strip a prefix the upstream paths
genuinely have.

**4. Five endpoints are called today with no `Authorization` header** —
`/status`, `/oauth2/configuration`, `/tos/text/duos`, `/support/request`,
`/support/upload`. The status page and the Contact Us form are reachable while
signed out.

---

## Decision

Use **`@fastify/reply-from`** (`reply.from()`) inside a route the BFF declares
itself, rather than `@fastify/http-proxy` or a hand-rolled `fetch` proxy.

```ts
app.register(fastifyReplyFrom, { base: requireEnv('DUOS_API_URL'), undici: { /* pool opts */ } })

app.all(`${PROXY_PREFIX}/*`, {
  onRequest: csrfForUnsafeMethods,   // story 3-D
  preHandler: ensureFreshToken,      // story 3-B — single-flight refresh
}, (request, reply) => reply.from(upstreamPath(request.url), {
  rewriteRequestHeaders,             // inject Authorization, strip cookie
  onResponse,                        // story 3-E — upstream 401 destroys the session
}))
```

`@fastify/http-proxy` is `reply-from` plus prefix-mounting plus WebSocket support
(a `ws` dependency DUOS has no use for). Declaring the route ourselves makes the
three things this epic actually needs — CSRF enforcement, the single-flight
refresh, and upstream-401 handling — ordinary Fastify hooks instead of entries in
a plugin's option bag.

### Sub-decisions

**a. One BFF-owned prefix mapped to the upstream root**, not `/api/*`.
`/duos-api/<upstream-path>` → `${DUOS_API_URL}/<upstream-path>`. This covers all
113 paths with a single rule, and it cannot collide with the BFF's own routes —
`/health`, `/config.json`, `/auth/*`, or the asset routes `@fastify/vite`
registers. (Proxying bare `/status` or `/feature` at the BFF root would put
upstream paths in the same namespace the BFF and Vite are already using.)

Phase 4 then becomes a one-line change: `getApiUrl()` returns `'/duos-api'` and
all 104 call sites keep their literal paths unchanged.

**b. An explicit unauthenticated allowlist.** The five endpoints in Context (4)
proxy through without a session and without an injected `Authorization` header.
Everything else 401s when there is no session. Without this, cutover breaks the
signed-out status page and Contact Us form.

**c. A wildcard content-type parser scoped to the proxy.** Registered inside the
proxy plugin's encapsulation so `/auth/*` keeps normal JSON parsing:

```ts
proxyScope.addContentTypeParser('*', (_request, payload, done) => done(null, payload))
```

The payload stays an unread stream, so bodies are neither buffered in memory nor
measured against Fastify's 1 MB `bodyLimit`. Pair it with a header-only `getToken`
for `@fastify/csrf-protection` so CSRF validation never needs a parsed body.

**d. `await request.session.save()` in the refresh preHandler.** This is the
Phase 2 lesson from `25a71a81`: saving before the reply leaves `@fastify/session`'s
`onSend` hook on its synchronous no-op path, so Fastify does not fire a second
`reply.send()` and `ERR_HTTP_HEADERS_SENT` cannot occur. It matters more with a
streamed reply than it did with a buffered one.

---

## Alternatives considered

**Hand-rolled `fetch` proxy** (the Phase 3 plan's 3-C sketch). Rejected. Beyond
Context (2) and (3), it has two defects that are invisible in small-payload
tests: `reply.send(await upstreamRes.arrayBuffer())` buffers every upload *and*
every document download fully in memory; and undici transparently decompresses
gzip responses while the sketch copies `content-encoding` and `content-length`
through verbatim, so a compressed upstream response reaches the browser
mislabelled and with a wrong length.

**`@fastify/http-proxy`.** Viable — same engine underneath. Rejected for less
direct control over per-request behaviour (the auth gate, the refresh, and the
401 path all become plugin options) and an unused WebSocket dependency. Worth
revisiting only if the BFF ever needs to proxy a WebSocket upgrade.

---

## Consequences

- One new production dependency (`@fastify/reply-from`, which brings `undici`).
  Connection pooling, hop-by-hop header handling, and chunked encoding come from
  the library rather than from us.
- Uploads and downloads stream; the proxy's memory use does not scale with
  payload size, and `bodyLimit` stays at its default.
- Because bodies pass through unparsed, nothing server-side inspects request
  payloads. CSRF must therefore read its token from a header, and any future
  need to inspect a proxied body means opting that route out of the wildcard
  parser.
- The `/duos-api` prefix is public API surface between client and BFF. Changing
  it later means changing `getApiUrl()` and the route together.
- Transient refresh failures must map to 502, not 401 — a 401 would sign out a
  user whose session is healthy and whose upstream is merely briefly unreachable.
  See `RefreshFailedError` in `../../../server/src/auth/refresh.ts`.
