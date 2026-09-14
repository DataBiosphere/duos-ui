# ADR-001 — Use Vertex AI in every environment; run no local model

**Status:** Proposed (2026-08-28) &nbsp;|&nbsp; **Work item:** Chat 9 (Vertex), Chat 2 (stub)
**Related:** [AI_Chatbot_Overview.md](../AI_Chatbot_Overview.md) §2, §3.2, §4.1, open questions 1 and 5
**Raised by:** review feedback on duos-ui [#3892](https://github.com/DataBiosphere/duos-ui/pull/3892)

---

## Context

The June plan named Ollama as the local model backend for development.
Production used Vertex AI Gemini. Two rounds of review on #3892 first replaced
Ollama, and then removed the local backend altogether.

**Round 1** asked for an open-source, OpenAI-compatible engine, and warned that
the team could use a model that breaks policy by accident. Both points hold.
The concrete hazard is that recent Ollama versions serve cloud model tags
through the same local API and the same `/v1` endpoint, so one wrong tag sends
DUOS prompts to a third party. The engine is MIT, but the cloud parts are not
open source.

**Round 2** asked a better question: does development need a local model at
all? It does not.

### Why a local model is not like the local Postgres

The compose stack runs `postgres:16.14-alpine`, so the obvious precedent says
run the model locally too. That argument doesn't hold.

A local dependency earns its place when it **reproduces production behavior**.
Postgres does: the same engine, the same wire protocol, the same SQL semantics,
pinned to a patch version. The container is production, shrunk.

A local 7B model does not. It has different weights, a different tokenizer, a
different tool-call dialect, and far worse tool choice than Gemini. It
reproduces the shape of the dependency and none of its behavior. The team would
pay the whole setup cost and get no fidelity back. Worse, when a local model
calls a tool badly, nobody can tell whether the fault is the prompt, the loop,
or the model — and production would not have failed that way.

The churn makes it worse. Postgres has one moving part on a slow, versioned
schedule, so a one-line pin ages well. A local model has three parts that move
independently — the engine, the weights, and the tool-call dialect. June to
August broke this decision once already. That is a maintenance tax on the dev
stack with no fidelity benefit to pay for it.

## Decision

1. **One model backend in every environment: Vertex AI Gemini**, through the
   Google Gen AI SDK (`@google/genai`). Development, dev, staging and production
   call the same service, the same SDK and the same pinned model version.
2. **Credentials differ by environment; code does not.** Developers use
   Application Default Credentials (`gcloud auth application-default login`)
   against the dev project. Deployed environments use Workload Identity. No key
   files anywhere.
3. **A stub backend with recorded fixtures is the default for unit tests, CI and
   Playwright E2E.** It is a first-class backend with its own work item, not a
   mock buried in a test file. It must cover multi-iteration turns and the
   failure paths, because it carries the whole build while Chat 0 is in review.
4. **No local inference engine.** No compose service, no model volume, no GGUF
   pins, no engine-neutral environment variables.
5. **Keep vLLM on the record for one branch only.** If Compliance blocks Vertex
   AI, vLLM self-hosted in the cluster is the candidate. Do no work on it now.

## Consequences

- The plan **loses** a backend instead of gaining one. §3.2 drops its
  dual-implementation abstraction, and §4.1 and §4.2 collapse into one backend
  with two credential paths.
- Every developer who runs a real model needs `roles/aiplatform.user` on the dev
  project. That grant goes through Compliance and Infosec, so it joins the
  data-governance decision as **one ask**, not two serial ones (Chat 0).
- **Development does not wait for that approval.** Chats 1 through 8 run against
  the stub. Only Chat 9 and the prompt tuning in Chat 10 need a real model.
- Offline development ends for this feature. Accepted: the BFF already needs dev
  Consent, dev B2C and a database.
- Development costs money. Set a budget alert on the dev project, and measure a
  real turn in Chat 9.
- Development and production find the same tool-call bugs, because they call the
  same model version. This is the point of the change.
- The plan is no longer defended against an accidental third-party model by the
  engine's design. The guard is now the deployment: one service, one project,
  one region, and no key that reaches anything else.

## Accepted risks

1. **ADC lives on the host; the app runs in Docker.** Compose must mount
   `~/.config/gcloud` read-only and set the project. That mount hands the
   container the developer's own Google identity, which is broader than a scoped
   service account. It is Google's standard developer pattern, and it beats a
   downloaded service-account key, but DEVNOTES must say so plainly.
2. **The quota project must be set.** Run
   `gcloud auth application-default set-quota-project <dev project>`, or the
   first call fails with an unhelpful error.
3. **The app runs `node --enable-fips`.** That flag restricts the OpenSSL
   algorithm set and has broken auth libraries before. Verify the Google auth
   path under it in Chat 9, not later.
4. **The stub carries the build.** If it is weak, the team meets the loop's real
   behavior only after approval lands. Chat 2 must cover multi-iteration turns,
   a tool 401, a tool 429 with `Retry-After`, a malformed tool-call argument, and
   a turn that hits the iteration bound.

## Alternatives considered

**A local llama.cpp engine (`llama-server`, or the `llama.app` packaging).**
Rejected on the fidelity and churn argument above, not on quality. For the
record: `llama.app` is ggml-org's own packaging of llama.cpp, MIT, with the
source in `app/` in the same repository, and `llama serve -hf <repo>` starts the
same OpenAI-compatible server. It would have been the right choice had the team
kept a local engine.

**A Gemini Developer API key from AI Studio.** Rejected. It is a different
service from Vertex AI, so it does not deliver the production symmetry that
motivated the change. On the free tier Google may use prompts and responses to
improve its products, which DUOS data cannot accept. It also puts a long-lived
key in every developer's `.env.local`, which §4.2 forbids.

**A Vertex AI Express Mode API key.** Rejected for the key handling alone.
Google's own guidance is API keys for testing and Application Default
Credentials otherwise.

**Ollama.** Rejected in round 1. Only parts of Ollama are open source, and the
cloud path is the accident the reviewer named.

**Keep Ollama and forbid cloud tags in the README.** Rejected. A written rule
does not stop a typo in a model tag, and the failure sends user data off the
machine.
