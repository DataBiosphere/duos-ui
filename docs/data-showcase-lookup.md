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
| `DUOS_SHOWCASE_API_URL` | Server environment (`.env.local`, terra-helmfile) | BFF mode | A bare origin, for example `https://consent.dsde-prod.broadinstitute.org`. A path or credentials stop the server at startup. |
| `showcaseApiUrl` | `config.json` | Legacy mode | A Consent URL. The client and the Content Security Policy use its origin only. |

Set them for each kind of environment as follows:

| Environment | Points to | Why |
| ----------- | --------- | --- |
| Production | Production Consent | Showcase configs list production identifiers. |
| Content preview (staging or local, to review a showcase PR) | Production Consent | `DUOS-` identifiers come from a sequence in each environment, so only production resolves them. The preview is read-only: authenticated DUOS handoffs (search, dataset detail, data access requests) must stay off, so a reviewer never sends a production identifier to a staging backend. E3 implements that rule. |
| Functional test (end-to-end request flows) | That environment's own Consent | The tests use a synthetic showcase fixture with datasets seeded in the same environment, so the lookup and the handoffs agree. |
| Local development | Dev Consent (`.env.example`) | Change it to production to preview real content. |

A missing setting fails visibly. In BFF mode the route answers 503 `{"error":"upstream_not_configured"}`.
In legacy mode the client fails with `not_configured` before it sends a request.

### Content Security Policy

BFF mode adds nothing to `connect-src`: the route is same-origin. Legacy mode adds
`<showcaseApiUrl origin>/showcase/`, a path source, so a preview that reads production Consent admits
only the anonymous showcase routes, not the rest of that API. If `showcaseApiUrl` has the same
origin as `apiUrl`, the `apiUrl` entry already covers it. See ADR-013
(`docs/plans/bff_adrs/ADR-013-content-security-policy.md`).

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
| Upstream unreachable | 502 `{"error":"upstream_unavailable"}` | — |
| Upstream body is not JSON | 502 `{"error":"upstream_not_json"}` | — |

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
vi.mock('src/libs/ajax/ShowcaseCatalog')
vi.mocked(lookupShowcaseDatasets).mockImplementation(createShowcaseCatalogMock())
```

The mock does not check Consent's input limits. Test those against Consent.

## Not done yet

- Consent CORS and preflight for `/showcase/*` from the approved UI origins (legacy mode). It must not
  widen what the authenticated `/api` routes accept.
- terra-helmfile values for `DUOS_SHOWCASE_API_URL` and `showcaseApiUrl`. Until they exist, the
  deployed route answers 503.
- The browser address on the BFF-to-Consent hop. Consent's load balancer overwrites `X-Real-IP` on
  that hop, so Consent puts all BFF traffic in one rate-limit bucket. A follow-up ticket from DT-4374
  covers the design.
- End-to-end tests against a seeded environment.
