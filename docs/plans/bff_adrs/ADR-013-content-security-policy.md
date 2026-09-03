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
| Feature flags, `/feature` and `/feature/:key` on Consent | `src/libs/ajax/FeatureFlag.ts` | Unauthenticated and read before login; the session-guarded proxy would 401 them. **But see below — no caller today.** |
| Anonymous Bard metrics | `src/libs/ajax/Metrics.ts` | Deliberately carries no credentials. Identified events go through `/bard-api`. |

The feature-flag entry is inherited from the story's inventory and does not
describe the tree as it stands: `FeatureFlag.ts` has **no caller anywhere in
`src/`** — `getFlagNhgriDacId`, `getFeatureFlag`, and `getAllFeatureFlags` are
reached only from their own unit test. Nothing else calls
`getUpstreamApiUrl` outside the legacy-only `oidcBroker.ts`, so BFF-mode
`connect-src` needs no `apiUrl` entry for a flow that runs today.

It is kept anyway, deliberately. The policy ships report-only, so a
superfluous entry costs nothing now, and the module reads as one about to be
wired up rather than one to delete — dropping the origin would greet whoever
wires it with a blocked request and no obvious cause. The consequence worth
carrying forward is for the follow-up: `/public/features/*` may have no
consumer to serve, and that should be settled before it is built.

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

The bucket is the one source written to a **path**,
`https://storage.googleapis.com/broad-duos-banners/`, rather than an origin.
`storage.googleapis.com` is shared by every public bucket on GCS, so the bare
origin would hand injected script a ready exfiltration target — the thing this
policy exists to close. A trailing slash matches by prefix, which covers every
`<env>_notifications.json` the service builds. The narrowing applies to the
direct request only: a browser drops the path when matching a redirect target,
and GCS answers object reads without redirecting. The configured upstreams stay
at origin granularity, because each is a whole service the app talks to across
many paths and none shares a host with anybody else.

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

A deployment whose rendered config omits `bffEnabled` gets the **legacy**
list, which is a superset. `config/base_config.json` ships without the key, so
this is the common case, not an edge one. It fails open on the allowlist and
safe on breakage, which is the right direction while both modes exist.

**B2C is the one origin the browser reaches that no config field names, and it
needs no entry.** The authority URL does not live in `config.json` at all: it
arrives at runtime in Consent's `/oauth2/configuration` response as
`authorityEndpoint` (`src/libs/ajax/OAuth2.ts`). The legacy client never
`fetch`es it, so `connect-src` never has to name it — audited through
`oidc-client-ts` 3.5.0:

| Request that would need B2C in `connect-src` | Why it never happens |
|---|---|
| OpenID discovery | `oidcBroker.ts` passes an explicit `metadata` object, and `MetadataService` returns that cache without ever reading `_metadataUrl`. |
| JWKS | `getSigningKeys()` has no call site in the bundle. |
| userinfo | `loadUserInfo` defaults false, and `_processClaims` short-circuits on it. |
| Session monitor, end-session, revocation | `monitorSession` defaults false; sign-out calls only `removeUser()` and `clearStaleState()`. |
| Silent-renew iframe | `silent_redirect_uri` falls back to `redirect_uri`, which the broker sets to `''`, so `signinSilent()` throws before an iframe exists. The live branch is a refresh-token POST to `token_endpoint` — the `apiUrl` origin. |

`signinPopup` reaches B2C by **navigating** the popup to
`${apiUrl}/oauth2/authorize`, which redirects onward. No directive in this
policy governs navigation.

Four one-line edits would each turn that into a broken sign-in with no
config field to fix it from: dropping the `metadata` override, setting
`loadUserInfo: true`, setting `monitorSession: true`, or giving
`redirect_uri`/`silent_redirect_uri` a real value. The last also needs
`frame-src`. Any of them means adding the authority origin here — sourced from
Consent's response, not from `config.json`.

### 2. Report-only by default, enforced per environment

`DUOS_CSP_REPORT_ONLY` defaults to **true**. Each environment collects
violations first and is flipped to enforcement once a run over every flow is
clean. Collection is real, not console-only: `POST /csp-report` accepts the
reports, and `test/e2e/csp.spec.ts` drives the flows with the same policy
attached and asserts nothing was reported. That spec runs **locally only** —
see the Consequences section for why CI cannot run it yet, and what it costs.

The report sink is an unauthenticated POST, so it is bounded six ways: an
8 KB body limit; exactly two accepted media types (everything else gets 415
before a handler runs); a cap on how many reports one request may contribute,
because neither parser checks the body's shape and roughly 170 minimal entries
fit inside 8 KB; a field allowlist with truncation so an attacker cannot choose
what is logged; a fixed-window log budget charged once per *request*, so no one
request can spend it; and a per-client rate limit through `@fastify/rate-limit`
at 30 requests a minute, refusing the rest with a bare 429.

The last two are separate controls on purpose. The budget bounds what is
*written*; on its own it still reads and parses every request it is sent, and
the rate limit is what stops that. Fastify's own per-request logging is
switched off for this route as well (`logLevel: 'silent'`), or every rejected
415 and 413 would still write a line that none of the other controls bounds.

The plugin registers with `global: false` — this instance also serves every
SPA asset, and one page load fetches many, so a global cap sized for this
endpoint would block page loads. Story 5-G attaches the auth-route limits to
the same registration. The default store is per process, so a deployment's
real ceiling is these numbers times the replica count and it resets on every
restart; that is why the epic puts flood protection at the ingress and treats
this as the backstop beneath it.

The sink always answers 204, so it is no kind of oracle, and every rejection —
413, 415, 429 — carries the status alone rather than a framework error code.
It is registered outside both cutover switches: a legacy deployment needs it
too.

### 3. Two helmet defaults are overridden, and two headers are production-only

- **`Cross-Origin-Opener-Policy` is off in legacy mode**, and set to
  `same-origin-allow-popups` only under `bffEnabled`. `-allow-popups` is *not*
  a safe middle ground for the legacy flow, which was measured rather than
  assumed: it spares a popup only on its initial navigation, while the popup's
  own document is `unsafe-none`. The return leg from B2C compares the popup's
  current document (`unsafe-none`) against ours (COOP set) — a mismatch — so
  the browser swaps browsing context groups, `window.opener` becomes null,
  `postMessage` throws, and `signinPopup()` never resolves. COOP is not part
  of the CSP and has no report-only mode, so `DUOS_CSP_REPORT_ONLY` would not
  have caught this: it breaks sign-in on the first deploy. BFF sign-in is a
  top-level redirect with no popup, so it keeps the isolation. Revisit when
  Epic 6 retires the legacy client.
- **`Cross-Origin-Embedder-Policy` off.** It demands CORP or CORS headers on
  every cross-origin subresource; the banner bucket and the two direct
  upstreams send neither.
- **HSTS and `upgrade-insecure-requests` gated on `NODE_ENV`**, so that
  `pnpm start:server` cannot pin a developer's browser to https for a year.
  The gate is on the environment, not the transport: docker-compose defaults
  `NODE_ENV` to production and does send both, so reach a compose stack on its
  :443 mapping rather than :80.
- **Vite HMR allowances behind `isDev`.** The dev server injects the React
  Fast Refresh preamble as an inline module script and opens an HMR websocket,
  so dev adds `'unsafe-inline'` to `script-src` and `ws:`/`wss:` to
  `connect-src`. Production gets neither.

### 4. The proxy's per-reply sandbox still wins

`upstreamProxy.ts` sets `content-security-policy: sandbox` on proxied
responses so a proxied upload cannot execute on the SPA's origin. Both writes
reach the same raw response through `setHeader`, and the proxy's runs second,
so it wins. Not through `writeHead`: the proxy replies with a stream, and
Fastify's stream path deliberately avoids `writeHead` so it can still turn a
late stream error into a proper status. **Ordering is the whole mechanism**,
which makes it fragile — registering helmet later would silently strip the
sandbox. `server/test/csp.test.ts` asserts it against the real proxy, and
asserts a sibling route in the same app carries the full policy, so the case
cannot pass against an app where helmet never ran.

### 5. `style-src` keeps `'unsafe-inline'`

`style-src-attr` falls back to `style-src`, and the component tree styles
almost everything through React `style={{…}}` props. Dropping it would render
the app unstyled. Removing it means moving the tree off inline styles, which
is a much larger piece of work than this story.

## Consequences

- Every `connect-src` entry traces to the inventory table above and to a
  config field, so a new upstream is a config change, not a code change.
- `frame-src` is `'self'` — the app frames nothing. `openPreviewWindow` in
  `components/forms/DocumentUpload.tsx` reads as though it frames a `blob:`
  object URL, but it opens the window with `noopener`, and `window.open`
  returns null for that by specification, so it always takes the download
  fallback and the iframe is never created. Repairing that preview means
  adding `blob:` back to this directive.
- BFF-mode `connect-src` cannot reach `'self'` alone until the three direct
  flows move to dedicated public BFF endpoints (`/public/notifications`,
  `/public/features/*`, `/public/metrics/event`). That is the follow-up to this
  story, and it is what will let this allowlist shrink.
- `img-src` carries `'self'` and `data:` only. `blob:` is deliberately absent:
  the audit found no `<img src="blob:">` in the tree — every object URL the app
  mints is a download, which needs no directive, or the dead preview branch in
  `DocumentUpload.tsx`. The story says to add it only once a report-only run
  proves the need, and report-only is what makes that cheap to establish.
- `img-src` has no `https:`, so an **operator-authored** remote image would be
  blocked. Banner messages, Consent's terms-of-service text, and DAC bot rule
  text all render through `ReactMarkdown`, and that content lives outside this
  repo. Nothing in the tree can prove it never carries a remote image, so it is
  a signal to watch during the report-only run rather than a settled question.
- `configuredOrigin` accepts an `http:` upstream, but production also sends
  `upgrade-insecure-requests`, which rewrites that request to `https:`. Running
  in production mode against a plain-HTTP upstream — the `apiUrl` in
  `config-example.json`, for instance — therefore fails. This is the same
  caveat as the docker-compose one above, from the other side.
- **The e2e collector runs locally, not in CI.** `pnpm run serve` is
  `vite preview`, which sends no headers, so the spec fulfils the document
  itself to attach the policy. Chrome then treats that document as coming from
  an unknown address space, which makes every same-origin subresource a
  public-to-loopback Private Network Access transition: allowed from a secure
  context, blocked without one. Locally the preview server speaks HTTPS and the
  page loads; in CI it speaks plain HTTP and nothing loads. The spec is
  therefore skipped under `CI`. The fix is not a browser flag — it is to serve
  the e2e run through the Fastify server, which sends the real header and needs
  no interception. Tracked with the Epic 6 harness work.
- Enforcement is a per-environment decision recorded in deployment config, so
  a bad policy is one env var away from being backed out.
- **The httpd sidecar replaces this policy in deployed environments, so
  enforcement does not yet reach the browser.** Its `site.conf` runs
  `Header unset Content-Security-Policy` inside the `LocationMatch` that covers
  every proxied path, then sets five of its own — a policy carrying
  `'unsafe-inline'` and `'unsafe-eval'` on `script-src`, and no `default-src`,
  `frame-ancestors`, `object-src`, `base-uri` or `form-action` at all.

  Measured against a backend sending this app's exact headers:

  | Header the app sends | What the browser receives |
  |---|---|
  | `Content-Security-Policy` (enforcing) | **replaced** by the sidecar's |
  | `Content-Security-Policy-Report-Only` | passes through unchanged |
  | `X-Frame-Options: DENY` | **replaced** with `SAMEORIGIN` |
  | `Strict-Transport-Security` 1 year | **replaced** with 1 day |
  | COOP, CORP, `Referrer-Policy` | pass through unchanged |

  The report-only header surviving is what makes this quiet: the collection run
  works, reports arrive, the run reads clean, and then flipping
  `DUOS_CSP_REPORT_ONLY=false` changes nothing a browser acts on. Enforcement is
  therefore blocked on a `terra-helmfile` change that stops the sidecar
  overriding the header — and the story is not done when the env var flips, but
  when `curl -sI` against a deployed host returns *this* policy.

  COOP passing through is the reassuring half: the legacy-mode decision above
  is the one non-CSP header that both matters and actually arrives.
