# ADR-013 — The Content Security Policy is derived from runtime config, and ships report-only

**Status:** Accepted (2026-08-31) &nbsp;|&nbsp; **Phase:** 5, story 5-F
**Related:** [ADR-004](ADR-004-api-proxy-layer.md) (the proxies that make ECM and TDR same-origin)
**Implemented by:** `server/src/security/csp.ts`, `server/src/security/cspReport.ts` (duos-ui, DT-4021)

---

## Context

The server sent no security headers. Adding a Content Security Policy is the
last large control in Phase 5, and the risky one: a policy that is one entry
short does not fail a test, it blanks a page for a user.

Three facts shaped the policy.

**The app still runs in two modes.** Under `bffEnabled`, ECM and TDR are
reached through same-origin proxies. A legacy deployment calls all four
upstreams straight from the browser, and `oidc-client-ts` fetches Consent's
`/oauth2/token` as well. One `connect-src` list cannot be correct for both.

**Three browser connections stay direct even after cutover.** They are not
oversights:

| Connection | Where | Why it stays direct |
|---|---|---|
| Banner notifications, `storage.googleapis.com/broad-duos-banners` | `src/libs/notificationService.ts` | A public bucket; no session involved. |
| Feature flags, `/feature` and `/feature/:key` on Consent | `src/libs/ajax/FeatureFlag.ts` | Unauthenticated and read before login; the session-guarded proxy would 401 them. |
| Anonymous Bard metrics | `src/libs/ajax/Metrics.ts` | Deliberately carries no credentials. Identified events go through `/bard-api`. |

Folding these into the existing proxies as "unauthenticated paths" does not
work as those are built. `unauthenticatedPaths` is an **exact** set match
(`upstreamProxy.ts`), so an entry for `/feature` still leaves `/feature/:key`
returning 401. Worse, anonymous and identified metrics share `POST /api/event`,
and the proxy injects no token for an unauthenticated path even when a session
exists — marking it unauthenticated would silently turn *identified* metrics
anonymous.

**The audit found exactly one inline script problem: none.** The root
`index.html` carries no inline script or style, and neither does the built
`build/index.html` — Vite emits a hashed external module. Story 5-A had already
replaced `react-google-charts`, which was the only runtime third-party script.
So `script-src` needs neither a hash nor a nonce.

## Decision

### 1. `connect-src` is derived from `config.json`, never hardcoded

`connectSources()` reads only **inventoried, active** fields of the same
runtime config the client reads, reduces each to its origin, and drops blanks
and unparseable values. Two literals remain: `'self'` and the banner bucket,
which is a fixed public asset host rather than a deployment-configured upstream.

The list is mode-specific:

- **BFF mode** — `'self'`, `apiUrl`, `bardApiUrl`, the banner bucket.
  `ecmApiUrl` and `tdrApiUrl` are omitted **on purpose**; those calls are
  same-origin after cutover.
- **Legacy mode** — the above plus `ecmApiUrl` and `tdrApiUrl`, until Epic 6
  retires the legacy client.

`terraUrl` is never allowlisted: it is navigated to, not fetched. The
development config also carries convenience origins the browser never
connects to, so sweeping up every URL-shaped value would allowlist them by
accident.

`DUOS_API_URL` overrides the file's `apiUrl` (see `config.ts`), and the policy
follows the override — otherwise a redirected deployment would block its own
calls.

### 2. Report-only by default, enforced per environment

`DUOS_CSP_REPORT_ONLY` defaults to **true**. Each environment collects
violations first and is flipped to enforcement once a run over every flow is
clean. Collection is real, not console-only: `POST /csp-report` accepts the
reports, and `test/e2e/csp.spec.ts` drives the flows in CI with the same
policy attached and asserts nothing was reported.

The report sink is an unauthenticated POST, so it is bounded four ways: an
8 KB body limit, exactly two accepted media types (everything else gets 415
before a handler runs), a field allowlist with truncation so an attacker
cannot choose what is logged, and a fixed-window cap on reports logged per
minute. It always answers 204, so it is no kind of oracle. It is registered
outside both cutover switches — a legacy deployment needs it too.

### 3. Two helmet defaults are overridden, and two headers are production-only

- **`Cross-Origin-Opener-Policy: same-origin-allow-popups`**, not helmet's
  `same-origin`. The latter severs `window.opener`, which the legacy B2C popup
  sign-in flow reads. Revisit in Epic 6.
- **`Cross-Origin-Embedder-Policy` off.** It demands CORP or CORS headers on
  every cross-origin subresource; the banner bucket and the two direct
  upstreams send neither.
- **HSTS and `upgrade-insecure-requests` in production only.** A plain-HTTP
  dev or docker-compose setup would otherwise be pinned to https by a single
  stray response.
- **Vite HMR allowances behind `isDev`.** The dev server injects the React
  Fast Refresh preamble as an inline module script and opens an HMR websocket,
  so dev adds `'unsafe-inline'` to `script-src` and `ws:`/`wss:` to
  `connect-src`. Production gets neither.

### 4. The proxy's per-reply sandbox still wins

`upstreamProxy.ts` sets `content-security-policy: sandbox` on proxied
responses so a proxied upload cannot execute on the SPA's origin. Helmet
writes its header onto the raw response; Fastify passes the proxy's through
`writeHead`, and `writeHead` values take precedence. `server/test/csp.test.ts`
asserts this against the real proxy rather than leaving it to Node's
documentation.

### 5. `style-src` keeps `'unsafe-inline'`

`style-src-attr` falls back to `style-src`, and the component tree styles
almost everything through React `style={{…}}` props. Dropping it would render
the app unstyled. Removing it means moving the tree off inline styles, which
is a much larger piece of work than this story.

## Consequences

- Every `connect-src` entry traces to the inventory table above and to a
  config field, so a new upstream is a config change, not a code change.
- BFF-mode `connect-src` cannot reach `'self'` alone until the three direct
  flows move to dedicated public BFF endpoints (`/public/notifications`,
  `/public/features/*`, `/public/metrics/event`). That is the filed follow-up
  to this story, and it is what will let this allowlist shrink.
- The e2e collector attaches the policy to the document itself, because
  `pnpm run serve` is `vite preview` and sends no headers. Once the e2e harness
  serves through the Fastify server (Epic 6), the attachment can be deleted and
  the spec can read the header the server already sends.
- Enforcement is a per-environment decision recorded in deployment config, so
  a bad policy is one env var away from being backed out.
