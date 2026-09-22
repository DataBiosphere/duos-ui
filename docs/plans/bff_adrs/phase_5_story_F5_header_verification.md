# Story 5-F5 — verification runs (local, dev, staging, prod)

**Ticket:** [DUOS-4021](https://broadworkbench.atlassian.net/browse/DT-4021)  
**Records:** [ADR-013](ADR-013-content-security-policy.md)  
**First run:** 2026-09-04  
**Last updated:** 2026-09-22  
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

> **Read the dates.** Every measurement below records what the code sent on the
> day of that run. Two later changes altered the derived policy — story 5-F6 and
> the banner move. See **Code changes since the first run** before you reuse any
> `connect-src` listed here.

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
| Banner fetch | pass | pass | then `broad-duos-banners`; DT-4063 changed the bucket |
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
*(Story 5-F6 has since emptied that list; see the 2026-09-22 section.)*

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

## One false negative worth remembering

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

**Lesson for the dev collection run:** a 200 does not prove a proxied call
reached its upstream. Confirm the three env vars are set, and check the boot log
for `proxy is disabled` warnings before trusting a pass.

---

## Known gaps

1. **Feature flags not driven.** `src/libs/ajax/FeatureFlag.ts` has no callers
   in `src`. Its host is `apiUrl`, allowlisted in both modes, so a future caller
   is already covered. *(Closed by story 5-F6: the call is same-origin now.)*
2. **Single-user traffic.** This run is one developer clicking through. Epic 6
   story 6-K makes collection reliable; the dev report-only run still needs real
   traffic.
3. **`blob:` and other sources.** None were needed here. Add nothing until a
   report-only run on real traffic proves the need.

---

## Dev report-only run — 2026-09-08

Dev serves chart `duos-0.169.0`, so story 5-F4 has promoted. Headers measured
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
An empty log therefore means no violations, not a broken sink.

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

All eight flows re-driven under enforcement: **all pass**. Dev is done.

Reports still collect under enforcement, with `"disposition": "enforce"`. That
log is the early warning for a flow this run did not cover.

---

## Staging enforced — 2026-09-08

Staging collected report-only on **real traffic** from 2026-09-04, when story
5-F3 released, until this deploy — a wider run than any set of driven flows.

Chart `duos-0.169.0` (story 5-F4) and
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

All sixteen directives present, no report-only header left. All workflows pass
under enforcement. A browser-console `fetch()` to a disallowed origin confirmed
the browser enforces the policy and posts the report — the one check curl
cannot make, because curl applies no policy.

**Note the TDR entry.** Staging derives `https://data.staging.envs-terra.bio`;
dev derives `https://jade.datarepo-dev.broadinstitute.org`; prod derives
`https://data.terra.bio`. The lists are genuinely per-environment, which is why
each environment needs its own evidence.

#6499 also enforces in BEEs, where an ephemeral test environment costs nothing
if a policy entry is wrong.

One trap worth recording. That variable belongs in `secrets.envSecrets`, not
`secrets.additionalEnvSecrets`. The chart renders `envSecrets` values through
`| quote`; `additionalEnvSecrets` is emitted by `toYaml` as-is, so an unquoted
`false` there reaches Kubernetes as a boolean and the deployment fails to apply.

---

## Prod report-only collection — analysed 2026-09-21

The 5-F4 chart reached prod on 2026-09-09, so prod ran **report-only with no
enforced policy** from that date. The app has sent the report-only header since
story 5-F3 released on 2026-09-04.

**Export:** 249 reports, 2026-09-08 to 2026-09-21 — 13 days of real prod
traffic. Every entry carries `"disposition": "report"`, from `broad-dsde-prod`
/ `terra-prod`.

**Result: zero violations caused by the app.**

| Count | Source | Judgement |
|---:|---|---|
| 160 | `chrome-extension`, `moz-extension`, `ms-browser-extension`, `sandbox eval code`, `blob` | browser extensions |
| 47 | Fonts from `cdn.scite.ai` and `at.alicdn.com` | extension CDNs |
| 32 | Fonts from `fonts.gstatic.com` (Mulish, Roboto, Material Icons) | not the app |
| 10 | `inline` or `data`, no source file | not the app |
| **0** | **the app's own code** | — |

Directives that fired: `script-src-elem` (122), `font-src` (102), `script-src`
(18), `base-uri` (4), `worker-src` (3). **No `connect-src` violation at all** —
the directive the app could realistically break.

### How each group was excluded

1. **Google Fonts.** `index.html` self-hosts Roboto and Montserrat; its comments
   record that they were downloaded from `fonts.googleapis.com`. Mulish appears
   nowhere in `src` or in the build output. Mulish is Terra's font, and one
   report carries `referrer: https://anvil.terra.bio/`.
2. **`cdn.scite.ai` and `at.alicdn.com`.** Neither appears anywhere in the
   repository. Nine reports name the app bundle as `sourceFile`, because the
   Scite browser extension runs inside the page context. The app never requests
   those fonts.
3. **Inline script.** The built `index.html` is 39 lines and carries one
   external script tag, with zero inline blocks. The unattributed reports cite
   line 367 and line 19, so they describe a document an extension changed.

### What this means after the flip

1. The same reports continue, with `"disposition": "enforce"` — about 19 a day,
   far below the 60-a-minute log budget, so real reports stay visible.
2. Extension features that inject fonts or scripts stop working on DUOS pages.
   That is the policy doing its job.
3. **No policy change is needed.** Do not add `data:` to `font-src`, and do not
   allow `fonts.gstatic.com`: the app uses neither.

**Enforcement PR:** [terra-helmfile#6500](https://github.com/broadinstitute/terra-helmfile/pull/6500).
It moves the flag to `live.yaml.gotmpl` and deletes the per-environment copies,
so one entry covers dev, staging and prod.

---

## Code changes since the first run — 2026-09-22

Two merges changed what `connect-src` derives. Both landed after the local run
and after the dev and staging flips.

### 1. Story 5-F6 — public BFF endpoints ([#3914](https://github.com/DataBiosphere/duos-ui/pull/3914))

`BFF_CONNECT_FIELDS` is now **empty**. Feature flags go to
`/public/features/*` and anonymous metrics to `/public/metrics/event`, both
same-origin through `publicProxy`. Under `bffEnabled`, `connect-src` is
`'self'` plus the banner bucket, and nothing else.

| Mode | `connect-src` on 2026-09-04 | `connect-src` today |
|---|---|---|
| Legacy | `'self'` + 4 upstreams + banner | unchanged |
| BFF | `'self'` + Consent + Bard + banner | `'self'` + banner |

This also closes the old "feature flags not driven" gap. `FeatureFlag.ts` now
calls `BFF_PUBLIC_FEATURES_PREFIX`, a same-origin path that needs no
allowlist entry.

### 2. Banner move — DT-4063 ([#3942](https://github.com/DataBiosphere/duos-ui/pull/3942))

The banner bucket is no longer the literal
`https://storage.googleapis.com/broad-duos-banners/`. Each environment reads
its own bucket, and `bannerSource()` derives the CSP entry from
`config.bannersUrl` by removing the object name. An environment that sets no
`bannersUrl` gets no banner source at all.

### Measured today

All three environments still run `bffEnabled: false`, so each shows four
upstreams plus its own banner bucket.

| Environment | Header | Banner source in `connect-src` |
|---|---|---|
| dev | `Content-Security-Policy` (enforced) | `https://storage.googleapis.com/duos-banners-dev/` |
| staging | `Content-Security-Policy` (enforced) | `https://storage.googleapis.com/duos-banners-staging/` |
| prod | `Content-Security-Policy-Report-Only` | `https://storage.googleapis.com/duos-banners-prod/` |

Dev and staging already enforce the new derived policy, and neither has
reported a banner violation.

### What still needs a run

1. **The banner flow, per environment.** The bucket changed, so the 2026-09-04
   banner evidence no longer describes the request the browser makes.
2. **BFF mode.** The local BFF pass predates 5-F6, so its `connect-src` is no
   longer the one the code builds. Re-drive it before Epic 6 flips `bffEnabled`
   anywhere. The new list is strictly narrower, so it cannot allow something the
   old one blocked.
3. **Prod.** The flag rolls out later on 2026-09-22.

---

## Remaining for 5-F5

1. ~~Land terra-helmfile PR [#6497](https://github.com/broadinstitute/terra-helmfile/pull/6497)~~
   — merged, promoted to dev as chart `duos-0.169.0`.
2. ~~Run report-only collection on dev~~ — clean, 2026-09-08.
3. ~~Enforce on dev ([#6498](https://github.com/broadinstitute/terra-helmfile/pull/6498))
   and re-drive the eight flows~~ — done, all pass, 2026-09-08.
4. ~~Staging~~ — enforced 2026-09-08 via
   [#6499](https://github.com/broadinstitute/terra-helmfile/pull/6499), after
   four days of report-only collection on real traffic. BEEs enforced in the
   same PR.
5. ~~Read prod's collected reports~~ — 249 entries over 13 days, none caused
   by the app, analysed 2026-09-21.
6. Enforce prod
   ([#6500](https://github.com/broadinstitute/terra-helmfile/pull/6500)), then
   drive the eight flows and the console `fetch()` check. Include the banner
   flow: DT-4063 changed the bucket.
7. Re-drive BFF mode locally against the post-5-F6 policy, before Epic 6 flips
   `bffEnabled` in any environment.
8. Prove enforcement per environment:

```bash
curl -sI https://<host>/ | grep -i content-security-policy
```

The header name must be `Content-Security-Policy`, carrying `default-src 'self'`
and `object-src 'none'`. `'unsafe-eval'` means 5-F4 has not landed there.
