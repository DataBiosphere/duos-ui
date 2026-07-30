# Backend For Frontend (BFF) Migration — Overview

DUOS-UI is migrating its authentication architecture from browser-managed OAuth
tokens to the **Backend For Frontend (BFF)** pattern recommended by
[IETF BCP 212](https://datatracker.ietf.org/doc/bcp212/) (*OAuth 2.0 for Browser-Based Apps*).

## Why

Today the client stores OAuth credentials (access, ID, refresh, and IDP access
tokens) in browser `localStorage`. Any cross-site scripting (XSS) vulnerability
on the origin — in first- or third-party code — could exfiltrate all of them in
a single call, and there is no server-side session to revoke a stolen token.
Because DUOS gates access to controlled-access genomic datasets, this risk
warrants a stronger architecture.

## Target architecture

After the migration the browser holds **zero tokens**:

- The existing Fastify server becomes a BFF that owns the full OAuth 2.0
  authorization-code + PKCE flow against the identity provider.
- Tokens live only in a server-side session backed by PostgreSQL. The browser
  receives a single opaque session cookie (`HttpOnly`, `SameSite=Lax`,
  `Secure`) that JavaScript cannot read. Lax rather than Strict because the
  OAuth callback arrives as a top-level redirect from B2C — Strict cookies are
  withheld from cross-site-initiated navigations, which would strand the PKCE
  state; CSRF tokens land with the endpoints they protect (Phases 2–4) and
  Phase 5 verifies the coverage.
- All API calls are proxied through the BFF, which attaches the
  `Authorization: Bearer` header server-side and transparently refreshes
  expiring tokens.
- Logout destroys the server session and revokes tokens at the identity
  provider where supported — closing the "stolen token stays valid" gap.

The BFF holds **one OIDC client — Azure B2C**. The browser is redirected to the
existing B2C login page, which presents the Google and Microsoft sign-in options
exactly as it does today; B2C federates to the chosen provider internally and
issues the tokens the BFF stores. The session records which **sub-provider** the
user chose (`'google' | 'microsoft'`), extracted from the B2C `id_token`'s `idp`
claim at callback — this drives the audit trail and observability metrics, not
client selection. Because the B2C client is configured entirely through
`DUOS_AZURE_ISSUER_URL` / `DUOS_AZURE_CLIENT_ID` / `DUOS_AZURE_CLIENT_SECRET`,
a future migration (e.g., B2C → Entra External ID) is a config swap, not code.

## Implementation phases

Parent Jira: [DT-3604](https://broadworkbench.atlassian.net/browse/DT-3604)

The work is split into seven phases, delivered in order.

| Phase | Name | Summary | Jira | Status |
|---|---|---|---|---|
| 0 | Environment Configuration | Provision OAuth clients/app registrations for each identity provider and deliver server-side credentials and configuration (client secrets, session secret, database and issuer config) to the deployment environments. | [DT-3605](https://broadworkbench.atlassian.net/browse/DT-3605) | ✅ |
| 1 | Server Foundation & Session Infrastructure | Add session middleware to the Fastify server with a PostgreSQL-backed session store, automated expired-session cleanup, and a metadata-only session audit trail. No user-visible changes. | [DT-3606](https://broadworkbench.atlassian.net/browse/DT-3606) | ✅ |
| 2 | Server-Side OAuth Flow | Implement the BFF auth routes (`/auth/login`, `/auth/callback`, `/auth/logout`, `/auth/me`) using `openid-client` against the single Azure B2C client, with PKCE; the callback extracts the sub-provider from the B2C `id_token`. Runs alongside the legacy client-side flow during rollout. | [DT-3607](https://broadworkbench.atlassian.net/browse/DT-3607) | ✅ |
| 3 | API Proxy Layer | Add a reverse proxy so the client calls relative `/api/*` URLs; the server injects the Bearer token from the session and proactively refreshes tokens before expiry. | [DT-3608](https://broadworkbench.atlassian.net/browse/DT-3608) |        |
| 4 | Client Refactor | Remove all token handling from the React client: drop `oidc-client-ts` and localStorage token storage, switch the fetch layer to relative URLs, and replace the popup sign-in with a full-page redirect to the B2C login page (which presents the Google/Microsoft choice, unchanged). | [DT-3609](https://broadworkbench.atlassian.net/browse/DT-3609) |        |
| 5 | Security Hardening | Layer additional defenses: strict Content Security Policy, end-to-end verification of CSRF coverage (enforcement lands with the endpoints in Phases 2–4), session-fixation protection (session ID regeneration), token revocation on logout, SRI/third-party script audit, and rate limiting on auth endpoints. | [DT-3610](https://broadworkbench.atlassian.net/browse/DT-3610) |        |
| 6 | Testing, Observability & Rollout | E2E test coverage, auth/session metrics and alerting, and a config-driven (`bffEnabled` in `config.json`) per-environment cutover. The legacy flow is removed only after the new flow is stable in production. | [DT-3611](https://broadworkbench.atlassian.net/browse/DT-3611) |        |

## Rollout strategy

Two independent switches control the rollout. Both are deployment
configuration, resolved from local files/env at pod startup — no network
dependency at boot, and every pod of a given deployment behaves identically.

- **Session infrastructure: database env config.** The server registers its
  Postgres/cookie/session plugins when the deployment provides the database
  configuration (`DUOS_DB_HOST` etc., via helmfile env vars). The
  infrastructure is inert until users are routed to it — sessions are only
  created by the BFF auth routes.
- **Auth-flow cutover: `bffEnabled` in `config.json`.** Each environment's
  `config.json` (the same deploy-time file that carries `apiUrl` etc.)
  declares a boolean `bffEnabled`. The server checks it at startup and only
  then enables the BFF auth routes and directs users down the BFF sign-in
  flow; the client reads the same `config.json` it already fetches, so both
  sides agree by construction. A missing key defaults to `false` — the
  fail-safe is the legacy client-side flow.

Cutover proceeds environment by environment (dev → staging → prod) by setting
`bffEnabled: true` in that environment's `config.json` and restarting pods —
a config change and pod restart, not a live flag flip. That trade is
deliberate: no runtime dependency on a feature-flag service, no mixed-mode
pods, and deterministic behavior — everyone in an environment sees the same
flow, so each rollout stage is directly testable. Rollback is the same
operation in reverse. The two switches are independent: an environment can
have the session infrastructure configured (and exercised by tests) while
`bffEnabled` is still `false`.

Both sub-providers (Google-federated and Microsoft) flow through the same B2C
client behind the same flag, so we can test both sign-in paths in each
environment before cutting over.

> Status: as of Phase 1 nothing reads `bffEnabled` yet — the flag-gated
> routing lands with the Phase 2 auth routes.

## Key architectural decisions

- **PostgreSQL-backed sessions** — reuses existing infrastructure, survives
  restarts, supports horizontal scaling, and allows server-side revocation
  (stateless encrypted cookies cannot).
- **Full-page redirect instead of popup** — required by the BFF callback model,
  and eliminates the COOP (`Cross-Origin-Opener-Policy`) breakage that affects
  popup-based flows.
- **Single Azure B2C OIDC client** — provider selection (Google vs. Microsoft)
  happens on the B2C-hosted login page, so there is no multi-client factory and
  no per-provider branching in the BFF. The session records the sub-provider
  from the B2C `id_token`'s `idp` claim for audit and observability.
- **`openid-client` (v6) for all OAuth/OIDC operations** — library-maintained
  PKCE, token exchange, and ID-token validation (signature, `iss`, `aud`,
  `exp`) rather than hand-rolled crypto.
- **`@fastify/reply-from` for the API proxy, on a single `/duos-api` prefix** —
  streams multipart uploads and document downloads instead of buffering them,
  and keeps the auth gate, token refresh, and upstream-401 handling as ordinary
  route hooks. See [ADR-004](bff_adrs/ADR-004-api-proxy-layer.md).

## Target Architecture Sequence Diagrams

Three flows are shown: sign-in (including B2C provider selection, PKCE, and
token exchange), an authenticated API request (including proactive token
refresh), and sign-out (including server-side session destruction). Tokens
appear only on the server side of the dashed boundary. B2C handles both Google
and Microsoft authentication internally — the BFF is unaware of which provider
the user chose until the sub-provider is extracted from the B2C `id_token` at
callback.

### Authentication Flow

```mermaid
sequenceDiagram
    participant B   as Browser
    participant BFF as Fastify BFF (DUOS)
    participant PG  as PostgreSQL
    participant B2C as Azure B2C (b2clogin.com)
    participant IdP as Google or Microsoft IdP

    rect rgb(235, 245, 255)
        Note over B,IdP: Sign-In

        B->>BFF: POST /auth/login
        BFF->>BFF: Generate code_verifier, code_challenge (PKCE), state
        BFF->>PG: Store pkceVerifier, pkceState, returnTo in session
        PG-->>BFF: ok
        BFF-->>B: 200 { redirectUrl } + Set-Cookie: sessionId (HttpOnly, Secure, SameSite=Lax)

        B->>B2C: GET /oauth2/v2.0/authorize?code_challenge=...&state=...&client_id=<duos-b2c-id>&p=<policy>
        Note over B2C: B2C login page — user selects Google or Microsoft
        B2C->>IdP: Federated authentication (internal to B2C)
        IdP-->>B2C: Authentication result
        B2C-->>B: 302 to /auth/callback?code=...&state=...

        B->>BFF: GET /auth/callback?code=...&state=... [cookie: sessionId]
        BFF->>PG: Read session — pkceVerifier, pkceState
        PG-->>BFF: session data
        BFF->>B2C: POST /token — code + code_verifier + client_id + client_secret
        B2C-->>BFF: access_token, refresh_token, id_token, expires_in
        Note over BFF: Extract sub-provider from id_token idp claim<br/>(google.com → 'google', otherwise 'microsoft')
        Note over BFF,PG: Tokens stored server-side — never sent to browser
        BFF->>PG: Store tokens + idp (sub-provider) in session: clear pkce fields
        PG-->>BFF: ok
        BFF-->>B: 302 to returnTo
    end
```

### Authenticated API Call Flow

Consent's `oauth2.conf` already trusts the B2C issuer (it accepts B2C tokens
for all Microsoft users today), so B2C-issued tokens are forwarded for both
sub-providers with no proxy changes.

```mermaid
sequenceDiagram
    participant B   as Browser
    participant BFF as Fastify BFF (DUOS)
    participant PG  as PostgreSQL
    participant B2C as Azure B2C
    participant API as DUOS API (Consent)

    rect rgb(235, 255, 235)
        Note over B,API: Authenticated API Request

        B->>BFF: GET /api/user/me [cookie: sessionId]
        BFF->>PG: Read session — accessToken, tokenExpiry
        PG-->>BFF: session data

        alt token expires within 60s
            BFF->>B2C: POST /token (grant_type=refresh_token)
            B2C-->>BFF: new access_token, expires_in
            BFF->>PG: Update session with refreshed token
            PG-->>BFF: ok
        end

        BFF->>API: GET /api/user/me + Authorization: Bearer <b2c-token> + X-App-ID: DUOS
        API-->>BFF: 200 user data
        BFF-->>B: 200 user data
    end
```

### Sign-out Flow

```mermaid
sequenceDiagram
    participant B   as Browser
    participant BFF as Fastify BFF (DUOS)
    participant PG  as PostgreSQL
    participant B2C as Azure B2C

    rect rgb(255, 240, 240)
        Note over B,B2C: Sign-Out

        B->>BFF: POST /auth/logout [cookie: sessionId]
        BFF->>PG: Read session — accessToken, refreshToken
        PG-->>BFF: session data

        opt revocation_endpoint available (B2C typically does not expose one)
            BFF->>B2C: POST /revoke (access_token)
            B2C-->>BFF: 200
            BFF->>B2C: POST /revoke (refresh_token)
            B2C-->>BFF: 200
        end

        BFF->>PG: Stamp user_session_audit end_reason='logout'
        PG-->>BFF: ok
        BFF->>PG: Destroy session
        PG-->>BFF: ok
        BFF-->>B: 204 + Set-Cookie: sessionId (cleared, Max-Age=0)
    end
```
