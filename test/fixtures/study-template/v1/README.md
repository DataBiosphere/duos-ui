# Study template v1 fixtures

These CSVs are **copies**. The canonical fixtures live in the `consent` repository at
`src/test/resources/fixtures/study-template/v1/`, alongside the contract they implement
(`consent/docs/study-template-v1.md`), so the parser's own tests load them directly.

They are duplicated here because vitest cannot reach another repository, and the study-template
round-trip spec needs the real bytes rather than a hand-written approximation of them — the point of
the test is that the generated blank template lines up with what Consent actually accepts.

| File | Copied from | consent commit |
|---|---|---|
| `valid/minimal-valid.csv` | `.../v1/valid/minimal-valid.csv` | `3731e0ee` |
| `valid/multi-consent-group-valid.csv` | `.../v1/valid/multi-consent-group-valid.csv` | `3731e0ee` |

Only the two valid fixtures are copied; the invalid ones exercise the parser, which does not run in
this repository.

Keep these byte-identical to their source. If the contract changes, re-copy rather than edit — and
note that provenance cannot be recorded inside the CSVs themselves, since v1 requires the canonical
header as the first row and rejects any row it does not recognise.

## `draft/minimal-valid-draft-detail.json`

Not a copy: what `GET /api/draft/v1/{draftUUID}` returns after `valid/minimal-valid.csv` is validated,
captured from Consent's own `DraftService.draftAsJson` running against a database, so the envelope and
the document are the server's rather than a guess. What a hand-written version gets wrong is the
omissions — Consent serializes the document with `NON_NULL`, so a field the producer left empty is
absent rather than `null`, and hydration has to read absence as unset.

Volatile values are normalized: the UUID, the timestamps, and the synthetic user the capture ran as.
Everything else is verbatim.
