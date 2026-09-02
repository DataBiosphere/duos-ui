# Phase 0: Compliance and Infosec — one ask

**Phase:** 0 of 5 (near-term set) &nbsp;|&nbsp; **Effort:** 2–3d of drafting, then an unknown review wait &nbsp;|&nbsp; **Risk:** 🔴 High
**Depends on:** nothing
**Blocks:** Chat 9 (Vertex), Chat 10 (prompt tuning), Chat 11 (rollout). It blocks no work in Phases 1–5.
**Can parallelize with:** Phases 1–5, all of which run against the stub backend
**Reference:** [AI_Chatbot_Overview.md](../AI_Chatbot_Overview.md) §6, §7, open questions 5 and 8 &nbsp;|&nbsp; [ADR-001](ADR-001-model-backend.md)

---

## Goal

Get one written answer to one question: **may DUOS text reach Vertex AI, and
under what terms?** Bundle the `roles/aiplatform.user` grant on the dev project
into the same submission, because it goes to the same reviewers.

Start this first and do not wait for it. The stub backend (Phase 2) carries
Phases 1 through 5 while the review runs.

---

## Background

Three points shape this phase, and each one comes from a mistake that is easy
to make.

**Ask once, not twice.** ADR-001 moved every environment onto Vertex AI, so
every developer who runs a real model needs `roles/aiplatform.user` on the dev
project. That grant travels through Compliance and Infosec — the same reviewers
who rule on the data question. Two serial asks cost two review cycles for one
decision.

**Ask for every environment at once.** A dev-only pilot, or a synthetic-data
pilot, answers a different question and guarantees a second cycle. The answer
worth having early is whether DUOS text may reach Vertex **at all**, because a
"no" changes the architecture and not the schedule. If the answer is no, the
fallback is self-hosted vLLM (ADR-001, decision 5), and Phases 1 through 5 do
not change, because §3.2 keeps the backend interface provider-neutral.

**More than dataset text leaves the cluster.** The obvious payload is dataset
and DAR (Data Access Request) content. The full payload is larger: the user's
prompts, the generated answers, whatever the server logs, and whatever it
records as a metric. Open question 8 asks what usage data the team may keep;
that data also leaves DUOS, so it belongs in this contract and not in a later
story.

Nobody on the team has read Google's current retention, caching and no-training
terms. Story 0-B fixes that before the ask goes out, because a submission that
misquotes the vendor terms comes back.

---

## Stories

### 0-A: Write the field-level data contract

Produce one table. Each row is a field or a class of text that could leave the
DUOS cluster. Each row states whether it leaves, and what redaction applies.

Cover at least these sources:

| Source | Examples |
|---|---|
| User input | The prompt text, and every earlier turn in the forwarded history |
| Model output | The generated answer text |
| `list_datasets` results | Dataset name, description, DAC, data-use terms, identifiers |
| `list_dar_collections` results | Collection identifier, status, project title, dates |
| Server logs | Request lines, error messages, upstream failure bodies |
| Metrics | Turn counts, tool-call counts by tool, token counts, error types, any category label |
| Identity | Whether a user identifier reaches Vertex at all, in any field |

For each row, record: does it leave, what the redaction rule is, and who
decided. Mark the rows the team proposes to hold back — the working assumption
is that no user identifier and no session identifier reaches Vertex, and that
prompts and answers stay out of ordinary application logs (§7).

State the **field projection** the tools apply. §3.3 caps the fields each tool
returns, and that cap is the enforcement point for this contract. A field that
the contract excludes must not be in the projection.

**Files:** `docs/plans/ai_chatbot_docs/PHASE-0-compliance-and-data-contract.md` (this file, appendix), and the tool projections it constrains in Phase 3
**Effort:** 1d &nbsp;|&nbsp; **Risk:** Medium

---

### 0-B: Record Google's current Vertex AI terms

Read the current documents and quote them, with a URL and a retrieval date for
each. Do not rely on memory or on a summary.

Answer these, in writing:

1. **Retention.** How long does Vertex AI hold a prompt and a response?
2. **Caching.** Is request caching on by default? Can the project turn it off?
3. **Training.** Do the terms permit Google to train on this project's prompts
   and responses? ADR-001 already rejected the AI Studio free tier for failing
   this test; confirm the Vertex answer rather than assuming it.
4. **Abuse monitoring.** Does human review of stored prompts apply, and does
   the project need an exception?
5. **Region residency.** Does a pinned region keep the data in that region for
   every one of the above?

The output is a short reference section in this document. It becomes the
factual basis of the submission in 0-C, so a reviewer can check the claims
without repeating the research.

**Files:** this document (terms appendix)
**Effort:** 0.5–1d &nbsp;|&nbsp; **Risk:** Low

---

### 0-C: Assemble and submit the single ask

One submission, three parts:

1. The data contract from 0-A.
2. The vendor terms from 0-B.
3. A request for `roles/aiplatform.user` on the dev project, for the named
   developers, with the DEVNOTES warning from §4.1 attached: compose mounts
   `~/.config/gcloud` read-only, and that mount hands the container the
   developer's own Google identity, which is wider than a scoped service
   account.

Name all three environments — dev, staging and production — in the same
submission.

State the architecture plainly for a non-engineering reader: the model runs in
one Google project, in one pinned region, on one pinned model version; the model
calls two read-only tools; every tool call carries the user's own token, so the
chat can show nothing the user cannot already see; and Vertex never calls back
into DUOS.

**Files:** none in the repository. Record the ticket link here when it exists.
**Effort:** 0.5d, then the review wait &nbsp;|&nbsp; **Risk:** High — the wait is not under the team's control

---

### 0-D: Record the outcome

When the answer arrives, write it down here:

- The verdict, and the approver's name and date.
- The pinned region, and who approved it.
- The caching setting the project must run.
- Any abuse-monitoring exception that was granted or refused.
- Any field the reviewers removed from the 0-A contract. Each removal is a
  change to a tool projection in Phase 3, so file it as a follow-up on the
  matching story.

If the verdict is no, open ADR-003 for the vLLM branch. Do not start that work
before the verdict.

**Files:** this document, and [AI_Chatbot_Overview.md](../AI_Chatbot_Overview.md) §8.5
**Effort:** 0.25d &nbsp;|&nbsp; **Risk:** Low

---

## Suggested sequencing

Run 0-A and 0-B together; they need different people and neither blocks the
other. 0-C needs both. 0-D waits for the reviewers.

```
0-A ─┐
     ├─→ 0-C ─→ (review wait) ─→ 0-D
0-B ─┘
```

---

## Exit criteria

1. A field-level table exists, and every row carries a decision.
2. Google's retention, caching, training, abuse-monitoring and residency terms
   are quoted with a URL and a date.
3. One submission covers the data question, all three environments, and the
   dev role grant.
4. The verdict, the region and the approver are recorded in this file.
