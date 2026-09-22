# Story 5-F5 — verification runs (local, dev, staging, prod)

**Tickets:** [DT-3610](https://broadworkbench.atlassian.net/browse/DT-3610), [DUOS-4021](https://broadworkbench.atlassian.net/browse/DT-4021)    
**Records:** [ADR-013](ADR-013-content-security-policy.md)  
**First run:** 2026-09-04  
**Last updated:** 2026-09-22  
**Run by:** Greg Rushton  

This document records verification of DUOS's Content Security Policy (CSP) and
related security headers, from local testing on September 4 through deployed
environment checks on September 22. CSP tells the browser which scripts,
connections, and other resources the application may use. **Report-only** mode
records violations without blocking requests; **enforcement** blocks requests
that violate the policy. **BFF** (backend for frontend) mode routes application
requests through the DUOS server; legacy mode connects directly to upstream
services.

Each dated section records the configuration tested, checks performed, results,
and limits of the evidence. Header examples are historical measurements, not
configuration templates: public BFF endpoints (5-F6) and the banner bucket move
changed the policy after the initial tests.

## Latest recorded status — 2026-09-22

| Environment | Mode and latest check | Recorded result | Outstanding verification |
|---|---|---|---|
| Local | Legacy: report-only and enforced (2026-09-04); BFF: enforced, re-run against the post-5-F6 policy (2026-09-22) | Tested workflows passed, including anonymous metrics from the console; browser blocked a disallowed request and the report reached the log with `"disposition": "enforce"` | Feature flags remain untested (no callers) |
| Dev | Legacy, enforced; workflows checked 2026-09-08, headers, banner workflow and browser check 2026-09-22 | Workflow checks passed, banner workflow passed against the new bucket; browser blocked a disallowed request and the report reached logging with `"disposition": "enforce"` | None |
| Staging | Legacy, enforced; workflows and browser blocking checked 2026-09-08, headers and banner workflow 2026-09-22 | Workflow checks passed, banner workflow passed against the new bucket; browser blocked and reported a disallowed request | None |
| Prod | Legacy, enforced; logs analysed 2026-09-21, header, workflows, charts and browser check 2026-09-22 | All eight workflows passed; browser blocked a disallowed request and the report reached logging with `"disposition": "enforce"`; none of 249 reviewed reports attributed to application code | None |

The production enforcement configuration PR
[terra-helmfile#6500](https://github.com/broadinstitute/terra-helmfile/pull/6500)
is merged and deployed. The deployed prod header was measured on 2026-09-22 and
enforces the policy, and all eight prod workflows pass. The
[remaining checks](#remaining-verification-checklist) consolidate the work
needed after these measurements.

## What each check establishes

- **Inspect response headers:** establishes which policy and security headers
  reach the client through the Apache proxy. It does not demonstrate browser
  enforcement.
- **Exercise application workflows:** establishes whether the tested behavior
  works with that configuration, while checking for violation reports. It does
  not cover untested workflows or all real-user traffic.
- **Trigger a disallowed request in the browser:** establishes that the browser
  blocks the request under enforcement and sends a report that reaches logging.
  A synthetic POST to `/csp-report` checks only the endpoint and logging; it does
  not establish browser blocking or automatic report delivery.

## Initial local verification — 2026-09-04

**Stack:** `duos-ui` local Docker Compose (`app` + `duos-proxy` httpd sidecar + bundled Postgres)

**Server code:** `develop` @ `ce48888e` (security headers, report endpoint, and CSP policy: 5-F1–5-F3)

**Sidecar config:** local `site.conf`, carrying the proxy header fix (5-F4) from
[terra-helmfile#6497](https://github.com/broadinstitute/terra-helmfile/pull/6497)

This was the local pre-check before deployed-environment verification. It used
the same `httpd-terra-proxy` image and `site.conf` structure as the deployed
stack to check that the proxy preserved the application's policy. The run
covered one developer's manual workflows, not representative real-user traffic.
Later dev, staging, and production evidence is recorded separately below.

### Results

| Mode | Report-only | Enforced |
|---|---|---|
| Legacy (`bffEnabled: false`) | passed | passed |
| BFF (`bffEnabled: true`) | not tested | passed |

No application-triggered violations were observed during the tested workflows.
`docker logs duos | grep '\[csp\]'` returned only the synthetic probe described
below. This result applies to this local run and its configuration.

### Flows driven

| Flow | Legacy | BFF | Note |
|---|---|---|---|
| Sign-in (Google) | pass | pass | BFF uses the full-page auth redirect |
| Protected pages | pass | pass | |
| Banner fetch | pass | pass | then `broad-duos-banners`; DT-4063 changed the bucket |
| Chart page | pass | pass | SVG donut from story 5-A; no third-party script |
| Anonymous metrics | pass | pass | |
| Identified metrics (Bard) | pass | pass | `identify`, `event`, `syncProfile` via `/bard-api` |
| ECM RAS account linking | — | pass | end to end via `/ecm-api` |
| TDR data library | — | pass | via `/tdr-api` |
| Sign-out | pass | pass | |
| Feature flags | not driven | not driven | see remaining verification checklist |

---

### Headers verified

#### Legacy mode, enforced

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

#### BFF mode, enforced

Identical, except `connect-src` drops ECM and TDR:

```
connect-src 'self' https://local.dsde-dev.broadinstitute.org:27443
  https://terra-bard-dev.appspot.com
  https://storage.googleapis.com/broad-duos-banners/;
```

Those two are same-origin through the proxies, per `BFF_CONNECT_FIELDS`.
*(Public BFF endpoints (5-F6) have since emptied that list; see the 2026-09-22 section.)*

#### Companion headers after the local proxy fix

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

### Proxy header fix (5-F4): before and after

| Header the app sends | Before | After |
|---|---|---|
| `Content-Security-Policy` | replaced by the sidecar's `'unsafe-eval'` policy | passes through |
| `X-Frame-Options: DENY` | replaced with `SAMEORIGIN` | passes through |
| HSTS, one year | replaced with one day | passes through |

**The `Header unset` lines matter as much as the `Header set` lines.** Commenting
out only the `set` leaves the `unset` stripping the app's header and sending
nothing. That happened here with HSTS: the app sent `max-age=31536000` on its
own port while the proxy sent no HSTS at all. Both lines must go, for CSP and
for HSTS.

---

### Report endpoint and logging check

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
redacted to `?<redacted>` as `cspReport.ts` specifies. This verified the report
endpoint and logging, not automatic browser report delivery.

---

### Testing pitfall: a successful response without an upstream request

The first BFF pass ran without `DUOS_BARD_URL`, `DUOS_ECM_URL` or
`DUOS_TDR_URL` in `.env.local`. The BFF logs a warning and skips those proxy
registrations. The unmatched `POST /bard-api/...` requests then fell to
`setNotFoundHandler`, which serves `index.html` with **status 200**
(`server/src/index.ts:270`). `identify` and `event` looked successful in the
browser and reached nothing.

Only `syncProfile` failed visibly, and for an unrelated reason: it posts
`Content-Type: application/json` with no body, which Fastify's built-in JSON
parser rejects with `FST_ERR_CTP_EMPTY_JSON_BODY`. Inside a proxy scope
`removeAllContentTypeParsers()` plus the `'*'` parser lets that body through, so
the error only appears when the proxy is absent.

**Lesson for subsequent verification runs:** a 200 does not prove a proxied call
reached its upstream. Confirm the three env vars are set, and check the boot log
for `proxy is disabled` warnings before trusting a pass.

---

### Limits of the local evidence

Feature flags were not exercised. At the time, `src/libs/ajax/FeatureFlag.ts`
had no callers in `src`; its host was covered by the policy's `apiUrl` entry.
The tested workflows required no additional sources such as `blob:`. These
observations do not establish coverage for future callers or other user traffic.

---

## Dev report-only run — 2026-09-08

Dev serves chart `duos-0.169.0`, so the proxy header fix (5-F4) has promoted. Headers measured
at `https://duos-k8s.dsde-dev.broadinstitute.org/`:

```
x-content-type-options: nosniff
x-frame-options: DENY
strict-transport-security: max-age=31536000; includeSubDomains
content-security-policy-report-only: default-src 'self';…;object-src 'none';…
```

The sidecar sends no policy of its own, and the app's 1-year HSTS passes
through. `bffEnabled` is `false`, so this run exercised the legacy list, which
is the wider of the two.

Eight flows driven: sign-in, protected pages, banners, a chart page, metrics,
sign-out, ECM RAS account linking, the data library. **Zero** `[csp] violation
report` entries in GCP logging across both pods.

Collection was proven rather than assumed. A synthetic report posted to
`/csp-report` returned 204 and logged one entry naming
`https://example.com/probe.js`, from pod `duos-deployment-65465457fb-hsmfr`.
This confirms the endpoint and logging worked during the run. No violations
were observed in the workflow checks; the synthetic POST alone does not prove
automatic browser report delivery.

**Enforcement PR:** [terra-helmfile#6498](https://github.com/broadinstitute/terra-helmfile/pull/6498),
setting `DUOS_CSP_REPORT_ONLY=false` in `values/app/duos/live/dev.yaml`.

## Dev enforced — 2026-09-08

[#6498](https://github.com/broadinstitute/terra-helmfile/pull/6498) merged and
promoted. `Content-Security-Policy` replaced
`Content-Security-Policy-Report-Only`; no report-only header remains. All
sixteen directives present, `connect-src` carrying the five expected sources.
`X-Frame-Options: DENY` and the app's 1-year HSTS still pass through the
sidecar.

```
content-security-policy: default-src 'self';script-src 'self';
  script-src-attr 'none';style-src 'self' 'unsafe-inline';img-src 'self' data:;
  frame-src 'self';connect-src 'self' https://consent.dsde-dev.broadinstitute.org
    https://terra-bard-dev.appspot.com
    https://externalcreds.dsde-dev.broadinstitute.org
    https://jade.datarepo-dev.broadinstitute.org
    https://storage.googleapis.com/broad-duos-banners/;
  font-src 'self';object-src 'none';base-uri 'none';frame-ancestors 'none';
  form-action 'self';manifest-src 'self';report-uri /csp-report;
  report-to csp-endpoint;upgrade-insecure-requests
```

All eight flows re-driven under enforcement: **all pass** for the configuration tested on 2026-09-08.

Reports still collect under enforcement, with `"disposition": "enforce"`. That
log is the early warning for a flow this run did not cover.

**Browser blocking and reporting, recorded 2026-09-22.** A console
`fetch('https://example.com/probe')` produced CSP errors in the console, and one
matching entry reached logging from the dev pod on chart `duos-0.173.0`:

```json
{"effectiveDirective": "connect-src",
 "blockedURL": "https://example.com/probe",
 "documentURL": "https://duos-k8s.dsde-dev.broadinstitute.org/",
 "disposition": "enforce",
 "msg": "[csp] violation report"}
```

The same day, the banner workflow passed against `duos-banners-dev`.

---

## Staging enforced — 2026-09-08

Staging collected report-only on **real traffic** from 2026-09-04, when the CSP policy (5-F3) released, until this deploy — a wider run than any set of driven flows.

Chart `duos-0.169.0` (proxy header fix, 5-F4) and
[terra-helmfile#6499](https://github.com/broadinstitute/terra-helmfile/pull/6499)
landed together at 17:45 UTC, so the sidecar's override and the report-only
window ended in the same deploy. Measured after it:

```
x-frame-options: DENY
strict-transport-security: max-age=31536000; includeSubDomains
content-security-policy: default-src 'self';…;connect-src 'self'
    https://consent.dsde-staging.broadinstitute.org
    https://terra-bard-staging.appspot.com
    https://externalcreds.dsde-staging.broadinstitute.org
    https://data.staging.envs-terra.bio
    https://storage.googleapis.com/broad-duos-banners/;…
```

All sixteen directives present, no report-only header left. The exercised workflows passed
under enforcement. A browser-console `fetch()` to a disallowed origin confirmed
the browser enforces the policy and posts the report — the one check curl
cannot make, because curl applies no policy.

**Note the TDR entry.** Staging derives `https://data.staging.envs-terra.bio`;
dev derives `https://jade.datarepo-dev.broadinstitute.org`; prod derives
`https://data.terra.bio`. The lists are genuinely per-environment, which is why
each environment needs its own evidence.

#6499 also enforces in BEEs, where an ephemeral test environment costs nothing
if a policy entry is wrong.

On 2026-09-22 the banner workflow was driven again on staging, against the new
`duos-banners-staging` bucket, and passed.

One trap worth recording. That variable belongs in `secrets.envSecrets`, not
`secrets.additionalEnvSecrets`. The chart renders `envSecrets` values through
`| quote`; `additionalEnvSecrets` is emitted by `toYaml` as-is, so an unquoted
`false` there reaches Kubernetes as a boolean and the deployment fails to apply.

---

## Prod report-only collection — analysed 2026-09-21

The proxy header fix (5-F4) reached prod on 2026-09-09, so prod ran **report-only with no
enforced policy** from that date. The app has sent the report-only header since
the CSP policy (5-F3) released on 2026-09-04.

**Export:** 249 reports, 2026-09-08 to 2026-09-21 — 13 days of real prod
traffic. Every entry carries `"disposition": "report"`, from `broad-dsde-prod`
/ `terra-prod`.

**Result: no reports were attributed to application code in this review.**

The classifications below are the reviewer's assessment. Extension URL schemes
provide direct evidence of extension involvement; attribution of `blob:`,
`inline`, `data`, and other reports without an identifiable source is inferred,
not definitively established.

| Count | Source | Judgement |
|---:|---|---|
| 160 | `chrome-extension`, `moz-extension`, `ms-browser-extension`, `sandbox eval code`, `blob` | Assessed as extension-related; some sources are inferred |
| 47 | Fonts from `cdn.scite.ai` and `at.alicdn.com` | Assessed as extension-related |
| 32 | Fonts from `fonts.gstatic.com` (Mulish, Roboto, Material Icons) | Not attributed to DUOS; inferred |
| 10 | `inline` or `data`, no source file | Not attributed to DUOS; inferred |
| **0** | **the app's own code** | — |

Directives that fired: `script-src-elem` (122), `font-src` (102), `script-src`
(18), `base-uri` (4), `worker-src` (3). **No `connect-src` violations were present in the reviewed export.** This
supports the connection allowlist, but does not rule out application violations
of other directives or failures outside the collection window.

### Evidence used for attribution

1. **Google Fonts.** `index.html` self-hosts Roboto and Montserrat; its comments
   record that they were downloaded from `fonts.googleapis.com`. Mulish appears
   nowhere in `src` or in the build output. Mulish is Terra's font, and one
   report carries `referrer: https://anvil.terra.bio/`.
2. **`cdn.scite.ai` and `at.alicdn.com`.** Neither appears anywhere in the
   repository. Nine reports name the app bundle as `sourceFile`, which the review
   attributed to the Scite extension running inside the page context. A bundle
   reference alone does not establish that application code requested the fonts.
3. **Inline script.** The built `index.html` is 39 lines and carries one
   external script tag, with zero inline blocks. The unattributed reports cite
   line 367 and line 19, which is consistent with
   a modified document. Extension involvement is an inference; the source of
   these unattributed reports was not independently confirmed.

### Expected behavior after enforcement

1. Similar reports are expected to continue, with `"disposition": "enforce"` — the observed average was about 19 a day,
   below the 60-a-minute log budget. That average does not rule out bursts.
2. Extension features that inject fonts or scripts stop working on DUOS pages.
   That is the policy doing its job.
3. **The reviewed evidence does not justify broadening the policy.** Do not add `data:` to `font-src`, and do not
   allow `fonts.gstatic.com`: the app uses neither.

**Enforcement PR:** [terra-helmfile#6500](https://github.com/broadinstitute/terra-helmfile/pull/6500).
It moves the flag to `live.yaml.gotmpl` and deletes the per-environment copies,
so one entry covers dev, staging and prod.

---

## Prod enforced — 2026-09-22

The configuration PR
[terra-helmfile#6500](https://github.com/broadinstitute/terra-helmfile/pull/6500)
deployed. The deployed header, measured after the rollout:

```
x-frame-options: DENY
strict-transport-security: max-age=31536000; includeSubDomains
content-security-policy: default-src 'self';script-src 'self';script-src-attr 'none';
    style-src 'self' 'unsafe-inline';img-src 'self' data:;frame-src 'self';
    connect-src 'self' https://consent.dsde-prod.broadinstitute.org
      https://terra-bard-prod.appspot.com
      https://externalcreds.dsde-prod.broadinstitute.org
      https://data.terra.bio
      https://storage.googleapis.com/duos-banners-prod/;
    font-src 'self';object-src 'none';base-uri 'none';frame-ancestors 'none';
    form-action 'self';manifest-src 'self';report-uri /csp-report;
    report-to csp-endpoint;upgrade-insecure-requests
```

One policy header, no report-only header, all sixteen directives, and the
`duos-banners-prod` bucket that DT-4063 introduced.

### Workflows exercised

| Workflow | Result | Evidence |
|---|---|---|
| Banners | passed | the new `duos-banners-prod` bucket |
| Google sign-in | passed | |
| Protected pages | passed | |
| Metrics | passed | successful calls to `terra-bard-prod.appspot.com` |
| Data library (TDR) | passed | successful calls to `https://data.terra.bio/api/repository/v1/snapshots` |
| ECM RAS account linking | passed | |
| Sign-out | passed | |
| Charts | passed | voting pie charts on completed DARs, viewed with an admin role |

### Browser blocking check

A console `fetch('https://example.com/probe')` produced two console errors. The
first quoted the `connect-src` directive and stated that the action was blocked;
the second reported that the Fetch API refused to connect. This establishes that
the browser enforces the policy on a disallowed connection.

The report reached logging. One entry recorded the same event from the prod
pod, on chart `duos-0.173.0`:

```json
{"effectiveDirective": "connect-src",
 "blockedURL": "https://example.com/probe",
 "documentURL": "https://duos.org/datalibrary",
 "disposition": "enforce",
 "msg": "[csp] violation report"}
```

`"disposition": "enforce"` is the field a synthetic POST cannot supply
honestly. Blocking and report delivery are now both recorded for prod.

### Limits of this evidence

1. One user drove the workflows manually. This is not representative traffic.
2. Every listed workflow passed. The charts were checked with an admin role, which can see the voting pie charts for completed DARs.
3. Ambient reports from browser extensions continue, now with
   `"disposition": "enforce"`. Read `sourceFile` and `blockedURL` before
   treating one as an application problem.

---

## Code changes since the first run — 2026-09-22

Two merges changed what `connect-src` derives. Both landed after the local run
and after the dev and staging flips.

### 1. Public BFF endpoints (5-F6) ([#3914](https://github.com/DataBiosphere/duos-ui/pull/3914))

`BFF_CONNECT_FIELDS` is now **empty**. Feature flags go to
`/public/features/*` and anonymous metrics to `/public/metrics/event`, both
same-origin through `publicProxy`. Under `bffEnabled`, `connect-src` is
`'self'` plus the banner bucket, and nothing else.

| Mode | `connect-src` on 2026-09-04 | `connect-src` on 2026-09-22 |
|---|---|---|
| Legacy | `'self'` + 4 upstreams + banner | unchanged |
| BFF | `'self'` + Consent + Bard + banner | `'self'` + banner |

`FeatureFlag.ts` now calls `BFF_PUBLIC_FEATURES_PREFIX`, a same-origin path
that needs no external allowlist entry. This removes the allowlist requirement;
it does not close the workflow-testing gap. Feature flags remain untested in
this verification record.

### 2. Banner move — DT-4063 ([#3942](https://github.com/DataBiosphere/duos-ui/pull/3942))

The banner bucket is no longer the literal
`https://storage.googleapis.com/broad-duos-banners/`. Each environment reads
its own bucket, and `bannerSource()` derives the CSP entry from
`config.bannersUrl` by removing the object name. An environment that sets no
`bannersUrl` gets no banner source at all.

### Headers measured — 2026-09-22

All three environments still run `bffEnabled: false`, so each shows four
upstreams plus its own banner bucket.

| Environment | Header | Banner source in `connect-src` |
|---|---|---|
| dev | `Content-Security-Policy` (enforced) | `https://storage.googleapis.com/duos-banners-dev/` |
| staging | `Content-Security-Policy` (enforced) | `https://storage.googleapis.com/duos-banners-staging/` |
| prod | `Content-Security-Policy` (enforced later the same day) | `https://storage.googleapis.com/duos-banners-prod/` |

The banner workflow was driven in all three environments on 2026-09-22 and
passed against the new bucket in each. No banner violation was reported.

## Local BFF re-run — 2026-09-22

This run repeats the BFF workflows against the policy as it stands after
story 5-F6. It is the check that must pass before Phase 6 enables BFF in any
environment.

**Configuration:** local Docker Compose, `bffEnabled: true`,
`DUOS_CSP_REPORT_ONLY=false`. The boot log showed
`Content Security Policy is enforced` and no `proxy is disabled` warnings, so
every proxied call reached its upstream. The measured header:

```
Content-Security-Policy: …;connect-src 'self' https://storage.googleapis.com/duos-banners-dev/;…
```

`'self'` plus the banner bucket, with no upstream origins. This is the narrowed
list 5-F6 introduced.

### Workflows exercised

All workflows passed. The app log confirms that the proxied calls reached their
upstreams:

| Route | Status | Count |
|---|---|---|
| `POST /bard-api/api/event` (identified metrics) | 200 | 3 |
| `GET /tdr-api/api/repository/v1/snapshots` (data library) | 200 | 2 |
| `POST /ecm-api/api/oauth/v1/ras/authorization-url` | 200 | 1 |
| `POST /ecm-api/api/oauth/v1/ras/oauthcode` | 200 | 1 |

### Browser blocking check

A console `fetch('https://example.com/probe')` was blocked, and one report
reached the app log:

```json
{"effectiveDirective": "connect-src",
 "blockedURL": "https://example.com/probe",
 "documentURL": "https://local.dsde-dev.broadinstitute.org/researcher_console_dashboard",
 "disposition": "enforce"}
```

The `originalPolicy` in that report carries the narrowed `connect-src`, so the
browser enforced the post-5-F6 policy.

### Environment fault found during the run

The signing-official dashboard first returned 500. The cause was local, not a
policy finding: the local Elasticsearch container had no `dataset` index, so
Consent's `DashboardSearchService` search failed with `index_not_found_exception`
and Consent returned 500. The BFF passed that status through unchanged. A reindex
through Consent's `POST /api/dataset/index` fixed it. No `[csp]` report was
involved, and the fault would occur in either mode.

### Limits of this evidence

1. **Anonymous metrics** (`/public/metrics/event`) did not appear during the
   workflows, because the tester stayed signed in. A separate console check
   closed this; see **Anonymous metrics check** below.
2. **Feature flags** (`/public/features/*`) have no callers in the client, so no
   request was made.
3. One developer drove the workflows. This is not representative traffic.

### Anonymous metrics check

No signed-out page fires a metrics event on demand. `/datalibrary`, the one page
that sends a page-view event, sits inside `<Authenticated />`. The remaining
signed-out callers, `ErrorReporter` and the auto-logout on a 401, fire only on
failure. So the route was exercised from the browser console, signed out, with
a body in the shape `Metrics.ts` sends and the event name
`test:csp-verification`.

| Layer | Evidence |
|---|---|
| Browser | `fetch('/public/metrics/event', …)` returned 200, with no CSP error |
| Proxy sidecar | `"POST /public/metrics/event HTTP/1.1" 200` |
| App | `req-8d`: `url /public/metrics/event`, `fetching from remote server`, `response received`, status 200 |
| CSP | no `[csp] violation report` in the app log afterwards |

This establishes that the route, its upstream (`terra-bard-dev`) and the
narrowed `connect-src 'self'` work together. The route strips `cookie`,
`authorization` and `x-csrf-token` before it forwards the request, so the
request stayed anonymous. A hand-built request does not exercise the client code
in `Metrics.ts`; unit tests cover that code.

---

## Remaining verification checklist

- [x] **Verify production enforcement after deployment.** Done 2026-09-22: the
  deployed header enforces the policy, all eight workflows passed, and a console
  `fetch()` was blocked and reported with `"disposition": "enforce"`. The charts
  were checked with an admin role, on the voting pie charts for completed DARs.
- [x] **Repeat the banner workflow in every environment.** Done 2026-09-22. The
  banner workflow passed against `duos-banners-dev`, `duos-banners-staging` and
  `duos-banners-prod`, the buckets DT-4063 introduced.
- [x] **Repeat local BFF workflows against the updated policy.** Done 2026-09-22
  against `connect-src 'self'` plus the banner bucket. All workflows passed, and
  the proxied routes returned 200 from their upstreams. See **Local BFF re-run**.
- [x] **Record anonymous metrics under BFF.** Done 2026-09-22 from the browser
  console, signed out: `POST /public/metrics/event` returned 200 end to end,
  with no CSP report. No signed-out page fires the event on demand.
- [ ] **Exercise feature flags explicitly.** This feature cannot be tested.
- [x] **Record a browser blocking and reporting check in every configuration.**
  Dev, staging, prod and the updated local BFF configuration each have one,
  recorded on 2026-09-08 and 2026-09-22. Inspect headers as a separate check,
  using the command below.
- [ ] **Continue reviewing reports from real traffic after enforcement.** Manual
  workflow passes do not cover every user scenario. Investigate reports before
  adding sources such as `blob:`; distinguish application needs from extension
  activity and leave uncertain attribution explicit.

To inspect the deployed policy header:

```bash
curl -sI https://<host>/ | grep -i content-security-policy
```

For enforcement, expect `Content-Security-Policy`, including `default-src 'self'`
and `object-src 'none'`. A report-only header alone does not enforce the policy.
An unexpected `'unsafe-eval'` may indicate the old proxy policy is still being
served and requires investigation. Record the environment, date, and observed
header, then use a browser to verify blocking and report delivery separately.
