# Phase 4: Evaluation fixtures and the tool-choice harness

**Phase:** 4 of 5 (near-term set) &nbsp;|&nbsp; **Effort:** ~4d &nbsp;|&nbsp; **Risk:** 🟡 Medium
**Depends on:** Phase 2 (the backend interface and the fixture format), Phase 3 (the tool declarations the set asserts against)
**Blocks:** Phase 5 — the loop must have this check from its first commit
**Can parallelize with:** Phase 0
**Reference:** [AI_Chatbot_Overview.md](../AI_Chatbot_Overview.md) §3.2, §6, open questions 1 and 7

---

## Goal

Build a question set with recorded tool results, and a runner that reports how
the backend chose tools. Land it **before** the loop story, not after.

---

## Background

§3.2 is explicit about the order: "This lands as its own story **before** the
loop story, not after. One E2E test does not cover tool choice."

The reason is that this harness measures two different things at two different
times, and both matter:

| Run against | What it proves |
|---|---|
| The stub (now, Phase 4 and 5) | The loop's plumbing. Given a scripted tool call, does the loop execute it, append the result, re-invoke, and stop correctly? |
| Gemini (later, Chat 10) | The model's tool choice. Given a real question, does the model pick the right tool with the right arguments? |

The same harness, the same question set, two different claims. Build it once.

It is also the gate on two changes that otherwise ship unmeasured: a model
version bump (open question 1) and a system prompt edit (open question 7, and
Phase 5 story 5-A). §3.2 says a prompt edit changes behavior as surely as a code
edit. This phase is what makes that statement enforceable.

---

## Stories

### 4-A: The question set

Write the questions, and for each one record what a correct turn looks like.

Each entry holds:

- The question text.
- The expected tool, or **no tool** — an out-of-scope question is a first-class
  case, because refusing well is part of the job (open question 7).
- The expected arguments, or the constraints on them. Exact arguments are often
  too strict for a real model; prefer a constraint, for example "the search term
  contains the disease name from the question".
- The expected fields in the answer, so an answer that omits the retrieved data
  fails.

Cover at least these shapes:

| Shape | Example intent |
|---|---|
| One tool, obvious | "What datasets are there about diabetes?" |
| The other tool, obvious | "What is the status of my access requests?" |
| Both tools in one turn | A question that needs a dataset and the user's request on it |
| No tool — in scope, answerable from the prompt | "What is a DAR?" |
| No tool — out of scope | "Write me a Python script" |
| Empty result | A search that returns nothing; the answer must say so, not invent |
| Ambiguous | A question a good model asks to clarify rather than guessing |

Ten to fifteen entries is enough to start. A set nobody maintains is worse than
a small one that runs on every change.

**Files:** `server/test/eval/questions.json`, `docs/plans/ai_chatbot_docs/PHASE-4-evaluation-harness.md`
**Effort:** 1d &nbsp;|&nbsp; **Risk:** Medium — a weak set gives false confidence

---

### 4-B: Recorded tool results

Each question needs a recorded upstream result, so the run reaches no network.

Reuse the Phase 2 story 2-B fixture format. One format for the stub backend and
the evaluation set means one loader and one thing to learn.

Two rules:

- **Record the projected result, not the raw upstream body.** The Phase 3
  projection is the contract with story 0-A; a fixture that holds excluded
  fields will eventually leak them into a test log.
- **Record a real shape.** Capture from dev Consent once, then project and
  trim. A hand-written fixture drifts from the real response and hides a
  parsing bug.

Include the empty result and an oversized result that trips the shared byte cap
from Phase 3 story 3-F.

**Files:** `server/test/eval/fixtures/`, `server/test/eval/README.md`
**Effort:** 1d &nbsp;|&nbsp; **Risk:** Low

---

### 4-C: The runner

One command runs the set against a backend and reports the result.

Report at least:

- **Tool-choice accuracy** — how many questions chose the expected tool.
- **The wrong choices, named.** A percentage with no list is not actionable.
- **Argument failures** separately from tool failures. Picking the right tool
  with a bad argument is a different bug from picking the wrong tool.
- **Turn shape** — iteration count and tool-call count per question. A model
  that reaches the right answer in five iterations instead of one is a cost
  problem the accuracy number hides.

The runner takes the backend as a parameter, so Chat 10 points it at Gemini
without changing the harness.

Do not build a scoring model for answer quality. The set asserts tool choice,
argument shape and the presence of retrieved fields. Judging prose is a
different problem, and v1 does not need it.

**Files:** `server/test/eval/run.ts`, `server/test/eval/report.ts`
**Effort:** 1d &nbsp;|&nbsp; **Risk:** Low

---

### 4-D: CI wiring against the stub

Run the set in CI on every change, against the stub, with no network.

- Assert no socket opens, the same way Phase 2 story 2-F does.
- Fail the build on a regression, not on a threshold that drifts upward.
  Against the stub the expected score is 100%, because the stub is scripted —
  anything less is a loop bug. Say that in the CI job's comment, so nobody
  later relaxes it thinking it is a model score.
- Keep the run fast. This is a plumbing check in CI, not a model benchmark.

Follow the existing test layout: the runner sits under `server/test/`, next to
`server/test/load/`, which is the precedent for a harness that is not a unit
test.

**Files:** the CI workflow, `server/test/eval/run.ts`, `package.json` script
**Effort:** 0.5d &nbsp;|&nbsp; **Risk:** Low

---

### 4-E: The bump gate

Write down what this set gates, and where.

Three changes must pass a run before they merge:

1. **A model version change** (open question 1). §8.1 says the evaluation set is
   the check a bump must pass.
2. **A system prompt change** (open question 7, Phase 5 story 5-A).
3. **A tool declaration change** — a new parameter, a changed description, or a
   new tool. A description edit changes tool choice.

Against the stub, a run proves the plumbing. Against Gemini, it measures the
model. State which run each change needs: 1 and 2 need a Gemini run and cannot
merge on a stub pass alone; 3 needs both.

Record the rule in this file, in the Phase 5 story 5-A prompt file header, and
in the repository's contributing notes if there is a natural place.

**Files:** this document, `server/src/chat/prompt/` (header comment), contributing notes
**Effort:** 0.5d &nbsp;|&nbsp; **Risk:** Low

---

## Suggested sequencing

```
4-A ─→ 4-B ─→ 4-C ─→ 4-D
                └──→ 4-E
```

---

## Exit criteria

1. The question set covers both tools, both tools together, an in-scope
   no-tool question, an out-of-scope question, an empty result and an
   ambiguous question.
2. Every question has a recorded, projected tool result, and the run opens no
   socket.
3. The runner names its failures and separates tool errors from argument
   errors.
4. CI runs the set against the stub on every change and expects a perfect score.
5. The runner takes a backend as a parameter, so Chat 10 needs no harness
   change.
6. The bump rule is written down in more than one place.
