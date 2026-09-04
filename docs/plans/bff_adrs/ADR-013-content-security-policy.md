# ADR-013 — Security headers, and a Content Security Policy derived from runtime config

**Status:** Accepted (2026-08-31) &nbsp;|&nbsp; **Phase:** 5, story 5-F
**Related:** [ADR-004](ADR-004-api-proxy-layer.md) (the proxies that make ECM and TDR same-origin)
**Implemented by:** `server/src/security/` (duos-ui, DT-4021)

This record is written across the 5-F stack and grows with it. Stories 5-F1
(helmet's non-CSP headers), 5-F2 (the report sink) and 5-F3 (the policy) are
recorded here. The sidecar change (5-F4) is described under Consequences and
lands in `terra-helmfile`.

---

## Context

The server sent no security headers at all. Adding them is the last large
control in Phase 5, and the risky one: a header that is one value wrong does
not fail a test, it breaks sign-in for everybody or blanks a page for one user.

The app also still runs in two modes. Under `bffEnabled` sign-in is a top-level
redirect. A legacy deployment opens a popup, sends it to B2C, and reads the
result back through `window.opener`. One set of header values cannot be correct
for both.

## Decision, part 1 — helmet's non-CSP defaults are set deliberately

`@fastify/helmet` registers ahead of every route and outside both cutover
switches, because a legacy deployment needs these headers just as much. Two of
its defaults would break flows this app depends on.

### `Cross-Origin-Opener-Policy` is off in legacy mode

Not `same-origin`, and not `same-origin-allow-popups` either. `-allow-popups`
reads like the safe middle ground for a popup sign-in and is not one. This was
measured rather than assumed.

The token spares a popup only on its **initial** navigation, and only while the
popup's own document is `unsafe-none`. The return leg from B2C is a different
comparison: the popup's current document is B2C's (`unsafe-none`) and the
incoming one is ours (COOP set). That mismatches, so the browser swaps browsing
context groups and `window.opener` becomes null. `oidc-client-ts` then throws on
`postMessage`, the opener never hears back, and `signinPopup()` never resolves.

Measured in Chromium across two local origins with a cross-origin hop between:

```
COOP on callback  : openerNull=true,  postMessage threw, opener saw nothing
COOP off (control): openerNull=false, postMessage fine,  opener got the message
```

**COOP is not part of the CSP and has no report-only mode.** Nothing in 5-F3
would have caught this. It breaks sign-in on the first deploy, in every
environment, since none has `bffEnabled` on yet. That is why 5-F1 ships alone:
it can be deployed and sign-in verified before anything else rides on it.

Legacy deployments therefore get no COOP at all until Epic 6 retires that flow.
Under `bffEnabled`, sign-in has no popup and no opener, so it keeps
`same-origin-allow-popups`.

### `Cross-Origin-Embedder-Policy` stays off

COEP demands a CORP or CORS header on every cross-origin subresource. The banner
bucket and the two direct upstreams send neither, so enabling it would block
them. It stays off until those become same-origin (5-F6).

### HSTS is production-only

Gated on `NODE_ENV`, not on the transport, so `pnpm start:server` cannot pin a
developer's browser to https for a year. A docker-compose stack runs as
production and does send it; browsers ignore HSTS delivered over plain HTTP, so
that costs nothing there.

### The rest

`Cross-Origin-Resource-Policy: same-origin`, `Referrer-Policy: no-referrer`, and
`X-Frame-Options: DENY`. The deployed httpd sidecar also sets the last two, and
its values win — ours are what a local or compose run gets, where there is no
proxy at all.

## Decision, part 2 — the violation report sink is bounded six ways

`reportOnly: true` on its own collects nothing centrally, so the policy needs a
real endpoint to report to. `POST /csp-report` lands before the policy, and is
inert until 5-F3 points a browser at it.

It is an unauthenticated POST that anyone on the internet can reach, and
everything it accepts reaches the pod's logs. Six controls bound that:

1. An 8 KB body limit, enforced by Fastify before the parser runs.
2. Exactly two accepted media types; everything else gets 415 without reaching
   a handler.
3. A cap on how many reports one request may contribute. Neither content-type
   parser checks the body's shape, so an 8 KB array of minimal entries — around
   170 of them fit — is one request that would otherwise write 170 lines.
4. A logged-field allowlist, each value truncated and stripped of control
   characters. Unknown keys never reach the log.
5. A fixed-window log budget charged once per **request**, not once per report.
6. A per-client rate limit through `@fastify/rate-limit`, at 30 requests a
   minute, refusing the rest with a bare 429.

Controls 3, 5 and 6 exist because the obvious design fails in both directions.
Charging the budget per *report* lets a single 8 KB POST a minute exhaust the
window and silently drop every genuine report — the security-monitoring
equivalent of switching the sink off, for the cost of one request a minute. And
a budget alone bounds only what is *written*: without a rate limit the endpoint
still reads and parses everything it is sent.

Fastify's own per-request logging is switched off for this route
(`logLevel: 'silent'`). Without it, every POST — including the 415s and 413s
rejected before any handler runs — still emits an `incoming request` /
`request completed` pair that none of the six controls bounds. The report lines
go through `app.log` rather than `request.log` as a result: a route level
*pins* rather than raises, so logging at `warn` to keep `request.log` would have
overridden a deployment that deliberately configured a lower level.

The plugin registers `global: false`. This instance also serves every SPA asset
and one page load fetches many, so a global cap sized for this endpoint would
block page loads. Story 5-G attaches the auth-route limits to the same
registration. The store is per process, so a deployment's real ceiling is these
numbers times the replica count, and it resets on every restart — which is why
the epic puts flood protection at the ingress and treats this as the backstop.

The sink always answers 204, so it is no kind of oracle, and every rejection —
413, 415, 429 — carries the status alone rather than a framework error code.
The route sets its own error handler to get that: `index.ts` installs the
app-level one after this plugin registers, so Fastify never resolves it here.

## Decision, part 3 — the policy itself

### The `connect-src` allowlist is derived from `config.json`, never hardcoded

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

**Three browser connections stay direct even after cutover.** They are not
oversights, and they are why BFF-mode `connect-src` is not `'self'` alone:

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
anonymous. Dedicated `/public/*` endpoints are the answer, and they are story
5-F6.

One entry in that table describes an intention rather than the tree as it
stands: `FeatureFlag.ts` has **no caller anywhere in `src/`** — only its own
unit test — and nothing else calls `getUpstreamApiUrl` outside the legacy-only
`oidcBroker.ts`. BFF-mode `connect-src` therefore allowlists `apiUrl` for a flow
that does not run today.

**Settled 2026-09-04: the module stays**, against a future caller. Dropping the
origin now would greet whoever wires it up with a blocked request and no obvious
cause, and while the policy is report-only the entry costs nothing.

It does not hold `apiUrl` in the allowlist, though. Story 5-F6 points
`FeatureFlag.ts` at `/public/features/*` under `bffEnabled` using the same
prefix-and-flag pattern `Metrics.ts` already uses, so a future caller reaches
the proxy rather than Consent directly. What the decision does mean is that the
endpoint is built for a consumer that does not exist — so its tests are the only
proof it works, and no amount of exercising the app will tell anyone if it is
broken.

**BFF-mode `connect-src` will not reach `'self'` in one step after all.** 5-F6
drops `apiUrl` and `bardApiUrl`, leaving `'self'` and the banner bucket. The
bucket stays: a separate backlog item rewrites `notificationService.ts` to read
environment-specific buckets, and proxying GCS is worth deciding once that
lands rather than building against a URL shape about to change. Until then the
banner fetch stays direct and the literal stays in the policy.

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

### `script-src` stays `'self'`, with no hash and no nonce

The audit found exactly one inline-script problem: none. The root `index.html`
carries no inline script or style, and neither does the built `build/index.html`
— it emits only hashed files under `/assets` plus a stylesheet link. Story 5-A
removed `react-google-charts`, which was the one runtime third-party script, so
nothing needs an external origin either.

Dev is the exception, behind the existing `isDev` flag: Vite rewrites
`index.html` to add the React Fast Refresh preamble as an inline module script,
and its HMR client opens a websocket, so `'unsafe-inline'` and `ws:`/`wss:` are
allowed there and only there.

`img-src` carries `'self'` and `data:` only. No live `<img src="blob:">` exists
— every object URL the app mints is a download, which no directive covers, or
the dead preview branch in `DocumentUpload.tsx` — so `blob:` waits until a
report-only run proves it is needed.

### Report-only by default, enforced per environment

`DUOS_CSP_REPORT_ONLY` defaults to **true**. Each environment collects
violations first and is flipped to enforcement once a run over every flow is
clean — sign-in, protected pages, banner fetch, feature flags, anonymous
metrics, a chart page, sign-out. That rollout is story 5-F5.

Collection is real rather than console-only: the policy carries both
`report-uri` and `report-to`, pointing at the sink from part 2 above.

Two things make the flip less trivial than it looks. The deployed httpd sidecar
replaces the enforcing header, so until 5-F4 lands the env var changes nothing a
browser acts on — see Consequences. And the browser-level check that drives
every flow and asserts nothing was reported is story **6-K**, in Epic 6: it
needs the e2e run served through the Fastify server, which is harness work that
epic already owns.

### The proxy's per-reply sandbox still wins

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

### `style-src` keeps `'unsafe-inline'`

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
- **No browser-level check ships with this story.** One was written and works
  locally, but it cannot run in CI: `pnpm run serve` is `vite preview`, which
  sends no headers, so the spec has to fulfil the document itself to attach the
  policy — and Chrome then treats that document as coming from an unknown
  address space, making every same-origin subresource a public-to-loopback
  Private Network Access transition, blocked outside a secure context. The fix
  is not a browser flag but serving the e2e run through the Fastify server,
  which is harness work Epic 6 owns. Held back as story **6-K** rather than
  merged skipped, since a spec that never runs is not coverage.
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

  The change is six lines in `charts/duos/templates/_site.conf.tpl` — the
  `Header unset` plus the five that replace it. That template is DUOS's own,
  not shared with the other Terra apps, and the origins in it are terra-ui's:
  googletagmanager, cloudinary, zendesk, `data.terra.bio`. Deleting the `unset`
  matters as much as the rest — on its own it strips the app's header and sends
  nothing at all.

  `bffEnabled` does not enter into it, which is worth stating because it looks
  as though it should. The flag gates the BFF auth routes and the API proxies,
  not serving the app: Fastify is the app container's only process, it
  registers `@fastify/vite` and the SPA fallback outside both switches, and
  helmet registers ahead of both. Nor does any path bypass it — `PROXY_PATH`
  defaults to `/` and `PROXY_URL` to `http://app:8080/` in the
  `httpd-terra-proxy` image and the chart overrides neither, so the
  `LocationMatch` covers everything except `/introspect/`, which its negative
  lookahead excludes and which carries no CSP today either.

  COOP passing through is the reassuring half: the legacy-mode decision above
  is the one non-CSP header that both matters and actually arrives.
