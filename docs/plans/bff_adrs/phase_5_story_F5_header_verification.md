# Story 5-F5 — Local Verification Run

**Records:** [ADR-013](ADR-013-content-security-policy.md)  
**Date:** 2026-09-04  
**Run by:** Greg Rushton  
**Stack:** `duos-ui` local Docker Compose (`app` + `duos-proxy` httpd sidecar + bundled Postgres)  
**Server code:** `develop` @ `ce48888e` (5-F1, 5-F2, 5-F3 merged)  
**Sidecar config:** local `site.conf`, carrying the story 5-F4 changes that
terra-helmfile PR [#6497](https://github.com/broadinstitute/terra-helmfile/pull/6497) makes

This run is the pre-check for the rollout, not the rollout. The local stack uses
the same `httpd-terra-proxy` image and the same `site.conf` shape as the
deployed environments, so it proves the policy composes and that the sidecar no
longer overrides it. It does **not** close story 5-F5: real traffic on dev,
then the flip per environment, still has to happen.

---

## Result

| Mode | Report-only | Enforced |
|---|---|---|
| Legacy (`bffEnabled: false`) | clean | **clean** |
| BFF (`bffEnabled: true`) | — | **clean** |

Zero violation reports across every pass. `docker logs duos | grep '\[csp\]'`
returned nothing but the synthetic probe described below.

### Flows driven

| Flow | Legacy | BFF | Note |
|---|---|---|---|
| Sign-in (Google) | pass | pass | BFF uses the full-page auth redirect |
| Protected pages | pass | pass | |
| Banner fetch | pass | pass | `storage.googleapis.com/broad-duos-banners/` |
| Chart page | pass | pass | SVG donut from story 5-A; no third-party script |
| Anonymous metrics | pass | pass | |
| Identified metrics (Bard) | pass | pass | `identify`, `event`, `syncProfile` via `/bard-api` |
| ECM RAS account linking | — | pass | end to end via `/ecm-api` |
| TDR data library | — | pass | via `/tdr-api` |
| Sign-out | pass | pass | |
| Feature flags | not driven | not driven | see "Known gaps" |

---

## Headers verified

### Legacy mode, enforced

```
Content-Security-Policy: default-src 'self';script-src 'self';script-src-attr 'none';
style-src 'self' 'unsafe-inline';img-src 'self' data:;frame-src 'self';
connect-src 'self' https://local.dsde-dev.broadinstitute.org:27443
  https://terra-bard-dev.appspot.com https://externalcreds.dsde-dev.broadinstitute.org
  https://jade.datarepo-dev.broadinstitute.org
  https://storage.googleapis.com/broad-duos-banners/;
font-src 'self';object-src 'none';base-uri 'none';frame-ancestors 'none';
form-action 'self';manifest-src 'self';report-uri /csp-report;report-to csp-endpoint;
upgrade-insecure-requests
```

Four upstream origins, per `LEGACY_CONNECT_FIELDS`.

### BFF mode, enforced

Identical, except `connect-src` drops ECM and TDR:

```
connect-src 'self' https://local.dsde-dev.broadinstitute.org:27443
  https://terra-bard-dev.appspot.com
  https://storage.googleapis.com/broad-duos-banners/;
```

Those two are same-origin through the proxies, per `BFF_CONNECT_FIELDS`.

### Companion headers, final state

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains
Cross-Origin-Opener-Policy: same-origin-allow-popups   (BFF mode only)
Cross-Origin-Resource-Policy: same-origin
Referrer-Policy: no-referrer
```

Every one of these is the app's value. Before the `site.conf` fixes the sidecar
replaced `X-Frame-Options` with `SAMEORIGIN` and HSTS with `max-age=86400`.

---

## What story 5-F4 fixed, measured

The app is now the single source for every content-security header.
The proxy keeps only what the app cannot cover.

| Header | Before | After | Set by |
|---|---|---|---|
| `Content-Security-Policy` / `-Report-Only` | proxy replaced the app's | app's, unmodified | **app** |
| `Strict-Transport-Security` | proxy replaced 1 year with 1 day | `max-age=31536000; includeSubDomains` | **app** |
| `Referrer-Policy` | passed through | unchanged | **app** |
| `Cross-Origin-Opener-Policy` (BFF mode only) | passed through | unchanged | **app** |
| `Cross-Origin-Resource-Policy` | passed through | unchanged | **app** |
| `Origin-Agent-Cluster`, `X-DNS-Prefetch-Control`, `X-Download-Options`, `X-Permitted-Cross-Domain-Policies`, `X-XSS-Protection` | passed through | unchanged | **app** |
| `Reporting-Endpoints` | passed through | unchanged | **app** |
| `X-Frame-Options` | proxy sent `SAMEORIGIN`, app sent `DENY` | both send `DENY` | **proxy**, at server scope |
| `X-Content-Type-Options` | proxy sent it twice, app also sent it | proxy sends it once | **proxy**, at server scope |
| `Server`, `Access-Control-*` | proxy | unchanged | **proxy** |

**The `Header unset` lines matter as much as the `Header set` lines.** Commenting
out only the `set` leaves the `unset` stripping the app's header and sending
nothing. That happened here with HSTS: the app sent `max-age=31536000` on its
own port while the proxy sent no HSTS at all. Both lines must go, for CSP and
for HSTS.

---

## Report sink proven

The report-only passes logged nothing, which alone does not prove the sink
works. A synthetic report confirmed the path:

```bash
curl -sk -X POST https://local.dsde-dev.broadinstitute.org/csp-report \
  -H 'content-type: application/csp-report' \
  --data '{"csp-report":{"document-uri":"https://local.dsde-dev.broadinstitute.org/home?x=1",
           "violated-directive":"script-src","blocked-uri":"https://example.com/probe.js",
           "disposition":"report"}}'
```

Returned 204, logged one `[csp] violation report` line, with the query string
redacted to `?<redacted>` as `cspReport.ts` specifies.

---

## Known gaps

1. **Feature flags not driven.** `src/libs/ajax/FeatureFlag.ts` has no callers
   in `src`. Its host is `apiUrl`, allowlisted in both modes, so a future caller
   is already covered.
2. **Single-user traffic.** This run is one developer clicking through. Epic 6
   story 6-K makes collection reliable; the dev report-only run still needs real
   traffic.
3. **`blob:` and other sources.** None were needed here. Add nothing until a
   report-only run on real traffic proves the need.

---

## Remaining for 5-F5

1. Land terra-helmfile PR [#6497](https://github.com/broadinstitute/terra-helmfile/pull/6497)
2. Deploy to dev, run report-only collection with real traffic, read
   `[csp] violation report` lines.
3. Flip `DUOS_CSP_REPORT_ONLY=false` on dev, then staging, then prod.
4. Prove enforcement per environment:

```bash
curl -sI https://<host>/ | grep -i content-security-policy
```

The header name must be `Content-Security-Policy`, carrying `default-src 'self'`
and `object-src 'none'`. `'unsafe-eval'` means 5-F4 has not landed there.
