# Data Showcase Catalog Lookup

Showcase pages (`/data` and `/showcase/:key`) are public. They get dataset summaries and hero counts
from Consent's anonymous `POST /showcase/datasets` (DT-4275). This document is the duos-ui side of
that contract (DT-4281): how the browser reaches the lookup, how each environment configures it, and
what each failure looks like. The request and response shapes are the zod schemas in
`src/showcases/schema.ts`. The decisions behind them are in consent
`docs/plans/data-showcase-contracts.md` and `docs/plans/data-showcase-delivery-plan.md` (section 3).

## How the browser reaches the lookup

Call `lookupShowcaseDatasets(request, signal?)` from `src/libs/ajax/ShowcaseCatalog.ts`. It picks the
route from the mode in `config.json`:

| Mode | The browser posts to | Then |
| ---- | -------------------- | ---- |
| BFF (`bffEnabled: true`) | `/public/showcase/datasets` (same origin) | The BFF forwards to `${DUOS_SHOWCASE_API_URL}/showcase/datasets` (`server/src/proxy/publicProxy.ts`). |
| Legacy | `<showcaseApiUrl origin>/showcase/datasets` | Direct to Consent, cross-origin, with a CORS preflight. |

In both modes the call:

- sends `credentials: 'omit'`, no `Authorization` header and no CSRF token;
- does not call `/auth/csrf-token` and does not need a session;
- uses plain `fetch`, not `fetchAdapter`. The adapter signs the user out on some 401s and reports
  every error status. Neither is correct for an anonymous page.

The client parses every response with the contract schema for the request's mode. A response
outside the contract fails, so an unsafe value (for example an `accessUrl` with the `javascript:`
scheme) does not reach a renderer.

## Configuration

Two settings name the Consent that answers lookups. Both are separate from the authenticated API
(`DUOS_API_URL` and `apiUrl`), and neither falls back to it.

| Setting | Where | Used in | Value |
| ------- | ----- | ------- | ----- |
| `DUOS_SHOWCASE_API_URL` | Server environment (`.env.local`, terra-helmfile) | BFF mode | A bare origin, for example `https://consent.dsde-prod.broadinstitute.org`. A path or credentials stop the server at startup. For a local setup, `scripts/render-configs.sh --write_env true` writes the dev Consent origin and keeps a value that is already in `.env.local`. |
| `showcaseApiUrl` | `config.json` | Legacy mode | An http(s) Consent URL with no wildcard host. The client and the Content Security Policy use its origin only. |

Set them for each kind of environment as follows:

| Environment | Points to | Why |
| ----------- | --------- | --- |
| Production | Production Consent | Showcase configs list production identifiers. |
| Content preview (dev, staging or local, to review a showcase PR) | Production Consent | `DUOS-` identifiers come from a sequence in each environment, so only production resolves them. The preview is read-only: authenticated DUOS handoffs (search, dataset detail, data access requests) must stay off, so a reviewer never sends a production identifier to a dev or staging backend. E3 implements that rule. |
| Functional test (end-to-end request flows) | That environment's own Consent | The tests use a synthetic showcase fixture with datasets seeded in the same environment, so the lookup and the handoffs agree. |
| Local development | Dev Consent (`.env.example`) | Change it to production to preview real content. |

A missing setting fails visibly. In BFF mode the route answers 503 `{"error":"upstream_not_configured"}`.
In legacy mode the client fails with `not_configured` before it sends a request.

### Rollout flag

`showcaseEnabled` in `config.json` turns the showcase pages on. Only the boolean `true` turns them on;
a missing key or any other value leaves them off. While it is off, `/data` and every
`/showcase/:key` render the not-found page, whatever the index says. With it on, a route renders only
a `live`, unretired entry that has a config; the flagship renders at `/data` only. A hidden or
unknown key gets the same not-found page. `loadShowcase` in
`src/components/showcase/loadShowcase.ts` applies these rules. Enabling the flag is the public
launch, and turning it off is the rollback (delivery plan, S5.1).

### Content Security Policy

BFF mode adds nothing to `connect-src`: the route is same-origin. Legacy mode adds
`<showcaseApiUrl origin>/showcase/`, a path source, so a preview that reads production Consent admits
only the anonymous showcase routes, not the rest of that API. The path applies to the direct request
only: a browser ignores it when it checks a redirect target, so the showcase routes must not redirect.
If `showcaseApiUrl` has the same
origin as `apiUrl`, the `apiUrl` entry already covers it. See ADR-013
(`docs/plans/bff_adrs/ADR-013-content-security-policy.md`).

### CORS (legacy mode)

The legacy request is cross-origin and sends `Content-Type: application/json`, so the browser sends
a preflight first. Consent's Apache proxy answers it (DT-4382). The list of origins is
`proxy.showcaseAllowedOrigins` in terra-helmfile (`values/app/consent/live/<env>.yaml` and
`bee.yaml.gotmpl`):

| Consent | Approved origins |
| ------- | ---------------- |
| Production | `https://duos.org`, `https://www.duos.org`, `https://duos.broadinstitute.org`, `https://duos-k8s.dsde-prod.broadinstitute.org`, and for content previews `https://duos-k8s.dsde-dev.broadinstitute.org`, `https://duos-k8s.dsde-staging.broadinstitute.org`, `https://local.dsde-dev.broadinstitute.org` and `https://local.dsde-dev.broadinstitute.org:3000` |
| Staging | `https://duos-k8s.dsde-staging.broadinstitute.org`, `https://local.dsde-dev.broadinstitute.org`, `https://local.dsde-dev.broadinstitute.org:3000` |
| Dev | `https://duos-k8s.dsde-dev.broadinstitute.org`, `https://local.dsde-dev.broadinstitute.org`, `https://local.dsde-dev.broadinstitute.org:3000` |
| BEE | `https://duos.<bee>.bee.envs-terra.bio` |

For `/showcase/*` only, the proxy:

- sets `Access-Control-Allow-Origin` to the request's `Origin` when it is on the list, and leaves it
  out for any other origin, so the browser fails the preflight;
- sets `Access-Control-Allow-Methods: POST, OPTIONS`, `Access-Control-Allow-Headers: Content-Type`
  and `Vary: Origin`, and no `Access-Control-Allow-Credentials`;
- sets `Access-Control-Expose-Headers: Retry-After` on every response, so the client can read
  `Retry-After` on a 429. Browsers hide that header from a cross-origin page unless it is exposed;
- answers `OPTIONS` with 204 itself. The preflight does not reach Consent, so it does not use a
  request of the client's showcase rate limit.

The authenticated `/api` routes keep their own CORS headers. A new UI origin that calls the lookup
in legacy mode must be added to the list, or its showcase pages show no datasets.

## Limits and failures

The BFF proxy checks these before it forwards a request. Consent makes the same checks itself, so a
direct caller cannot skip them.

| Condition | BFF answer | Consent answer |
| --------- | ---------- | -------------- |
| Body over 64 KiB | 413, no body | 413 |
| More than 120 requests a minute from one client | 429, no body, `Retry-After` | 429, no body, `Retry-After` (DT-4280) |
| Media type is not JSON | 415, no body | — |
| Malformed JSON | 400, no body | 400 |
| Request outside the contract (unknown mode, field, or limit) | Forwarded | 400 `{"message": "..."}` |
| Upstream not configured | 503 `{"error":"upstream_not_configured"}` | — |
| Upstream unreachable or timed out | 502 or 504 `{"error":"upstream_unavailable"}` | — |
| Upstream content type is not JSON | 502 `{"error":"upstream_not_json"}` | — |
| Upstream sends a JSON content type with a malformed body | Streamed unchanged; the client fails with `invalid_response` | — |

The proxy also drops a caller's query string, removes cookies, `Authorization` and the CSRF token
from the request, removes `set-cookie` and `www-authenticate` from the response, and adds
`x-content-type-options: nosniff` and `content-security-policy: sandbox`.

The client turns each failure into a `ShowcaseLookupError`:

| `reason` | When | Also carries |
| -------- | ---- | ------------ |
| `not_configured` | Legacy mode with no usable `showcaseApiUrl` | — |
| `network` | The request did not get a response | — |
| `http` | Any non-2xx status | `status`; `message` from a Consent 400; `retryAfterSeconds` from a 429 |
| `invalid_response` | The body is not JSON, or it is outside the contract | `status` |

A page shows a failed lookup as a retryable unavailable state. It never shows mock data in its
place.

## Tests and the mock

`test/fixtures/showcase/catalogMock.ts` is an in-memory lookup with the client's signature. Its rows
are synthetic and come from the examples in `test/fixtures/showcase/contracts.ts`. It is under
`test/`, so a deployed build cannot import it. Use it in a unit test like this:

```ts
vi.mock('src/libs/ajax/ShowcaseCatalog', async importOriginal => ({
  ...await importOriginal<typeof import('src/libs/ajax/ShowcaseCatalog')>(),
  lookupShowcaseDatasets: vi.fn(),
}))
vi.mocked(lookupShowcaseDatasets).mockImplementation(createShowcaseCatalogMock())
```

Mock only `lookupShowcaseDatasets`. A bare `vi.mock('src/libs/ajax/ShowcaseCatalog')` also mocks
`ShowcaseLookupError`: an error a test builds is then not an `Error`, and has no message, `reason`,
`status` or `retryAfterSeconds`, so error and retry handling can't be tested.

The mock does not check Consent's input limits. Test those against Consent.

## Not done yet

- `showcase.publicLookupEnabled` in the deployed Consent configs. No deployed Consent sets it yet, so
  `POST /showcase/datasets` answers 405 in dev, staging and production. DT-4411 adds the setting to
  the Consent chart, still off.
- The browser address on the BFF-to-Consent hop. Consent's load balancer overwrites `X-Real-IP` on
  that hop, so Consent puts all BFF traffic in one rate-limit bucket. A follow-up ticket from DT-4374
  covers the design.
- End-to-end tests against a seeded environment.
