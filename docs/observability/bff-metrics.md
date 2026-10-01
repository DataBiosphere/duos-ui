# BFF metrics and alerts

These metrics come from the structured log events of story 6-F. Cloud Logging reads the server's stdout JSON. Each metric below is a **log-based metric** in Cloud Monitoring, keyed on the `event` field. The server has no metrics client and the chart has no scrape config, so logs are the only transport.

**Status.** The server emits every event in this file. The Cloud Monitoring metric and alert definitions do not exist yet. They live outside this repository.

**Open item: the alert-policy home.** Ask DevOps where the project keeps its other GCP alert policies, then record the answer here. Create the metrics and policies there.

## Rules for every metric

- Filter on `jsonPayload.event`. Never filter on the message text.
- Tag every metric with the `idp` label: `google`, `microsoft` or `unknown`.
- A rate is a count of one outcome divided by the count of all events of its population. Each rate states a window and a minimum sample. Do not alert on a rate below its minimum sample.
- `proxy.completed` is not sampled. Do not sample it, or every rate that divides by it reads too high.

## Counter metrics and rates

| Metric | Numerator filter | Denominator | Window / min sample | Alert |
|---|---|---|---|---|
| Callback error rate | `auth.callback.completed`, `outcome=failed` | all `auth.callback.completed` | 5 min / 20 | > 1% |
| Callback throttle count | `auth.rate_limited`, `route=callback` | none | 5 min | sustained non-zero |
| Terminal refresh rejection rate | `auth.refresh.completed`, `outcome=terminal` | all `auth.refresh.completed` | 15 min / 20 | > 0.5% |
| Sessions without a refresh token | `auth.refresh.unrefreshable` | none (per caller) | 15 min | spike over baseline |
| Transient refresh failure rate | `auth.refresh.completed`, `outcome=transient` | all `auth.refresh.completed` | 15 min / 20 | > 5% |
| Session store error rate | `session_store.completed`, `outcome=failed` | all `session_store.completed` | 5 min / 50 | > 0.1% |
| Session destroyed by upstream 401 | `auth.session.destroyed`, `reason=upstream_401` | `proxy.completed`, `had_session=true` | 5 min / 50 | spike over baseline |
| Proxy 502–504 rate | `proxy.completed`, `status` 502 to 504 | all `proxy.completed` | 5 min / 50 | > 1% |
| Public endpoint failure rate | `public.completed`, `status` 500 to 599 | all `public.completed` | 15 min / 50 | > 2% (proposed) |

What each row leaves out on purpose:

- A user who cancels at the provider is `outcome=cancelled`. It is in the callback denominator, not the numerator.
- A throttled callback (429) never reaches the handler. It has its own row.
- A terminal refresh rejection signs the user out. A transient failure keeps the session. Keep them in separate rows.
- An anonymous 401 has the error code `unauthenticated`. It is not an `auth.session.destroyed` event, so the upstream 401 row ignores it.
- A 429 from a public endpoint is expected throttling. The public failure rate counts 5xx only.

## Active sessions

`session.active` is a gauge, but log-based metrics cannot be gauges. Each pod runs a count query every 60 seconds and logs one `session.active` line per `idp` group. The field `value` holds the count.

1. Create a **distribution** metric on `jsonPayload.event="session.active"`. Extract the value from `jsonPayload.value`. Add `idp` as a label.
2. Read the metric as a **mean**, aligned to 1 minute. Live runs 3 pods, so each minute brings 3 samples of one population. A sum or a count is wrong.
3. The query counts only rows that are unexpired and carry an access token. It splits on `user_sessions.idp`.
4. A group with no rows logs `0`. A failed query logs no sample, only `session.active.failed`.

### Absence alert

Fire when no `session.active` sample arrives from any pod for 3 minutes. The emitter or the log pipeline is down. The drop alert must not fire on this condition.

### Drop alert (PromQL)

Cloud Monitoring threshold alerts cannot compare a value with its past. Use a PromQL alert policy. Fire when the 5-minute mean is below 80% of the mean one hour earlier, and the earlier mean is at least 25. The floor matters: with few concurrent users, 20% of ten is two people.

```promql
(
  sum by (idp) (increase(logging_googleapis_com:user_session_active_sum[5m]))
  / sum by (idp) (increase(logging_googleapis_com:user_session_active_count[5m]))
)
< 0.8 * (
  sum by (idp) (increase(logging_googleapis_com:user_session_active_sum[5m] offset 1h))
  / sum by (idp) (increase(logging_googleapis_com:user_session_active_count[5m] offset 1h))
)
and
(
  sum by (idp) (increase(logging_googleapis_com:user_session_active_sum[5m] offset 1h))
  / sum by (idp) (increase(logging_googleapis_com:user_session_active_count[5m] offset 1h))
) >= 25
```

A series with no samples in either window drops out of a PromQL comparison, so the alert evaluates only when both windows have samples. The metric name depends on what you call the log-based metric. Check the query against the real series name in dev before you save the policy.

## Proof

Do not close story 6-G until each alert fires on a simulated error in dev. For example: a bad `DUOS_SESSION_SECRET` for the callback error rate, a stopped Postgres for the session store rate, and a stopped pod set for the absence alert.
