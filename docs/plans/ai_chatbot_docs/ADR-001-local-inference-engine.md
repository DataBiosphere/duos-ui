# ADR-001 — Run local inference on llama.cpp `llama-server`, not Ollama

**Status:** Proposed (2026-08-27) &nbsp;|&nbsp; **Work item:** Chat 3 (local dev unblock)
**Related:** [AI_Chatbot_Overview.md](../AI_Chatbot_Overview.md) §2, §3.2, §4.1, open question 1
**Raised by:** review feedback on duos-ui [#3892](https://github.com/DataBiosphere/duos-ui/pull/3892)

---

## Context

The plan needs a local LLM (Large Language Model) backend for development. It
named Ollama. Production uses Vertex AI Gemini, so this decision covers
developer machines and the evaluation harness only.

Review feedback asked the team to switch to an open-source, OpenAI-compatible
inference engine, such as llama.cpp. The comment gave two reasons: Ollama now
sells some of its tooling, and the team could use a model that breaks policy by
accident.

Both reasons hold, but they point at two separate decisions.

**The engine and the weights are different choices.** A new engine does not stop
a developer from loading a model with the wrong license. That risk lives in the
weights. This ADR therefore decides both, and states the second rule
explicitly.

**The license is not the sharp edge; the cloud path is.** The Ollama engine
stays MIT and stays free for local use. The company sells Ollama Cloud. The
concrete hazard is that recent Ollama versions serve cloud model tags through
the same local API and the same `/v1` endpoint. One wrong tag sends DUOS prompts
to a third party. That is exactly the accident the reviewer named. `llama-server`
cannot do it. It loads a file from disk and reaches no registry.

## Options considered

| Engine | License | OpenAI tool calls | Dev laptop | Notes |
|---|---|---|---|---|
| **llama.cpp `llama-server`** | MIT | Yes, with `--jinja` | Yes, best CPU speed | Small image. No registry. No cloud path. |
| vLLM | Apache 2.0 | Yes, needs a parser flag | No, needs a GPU | The option if DUOS must self-host production inference. |
| SGLang | Apache 2.0 | Yes | No, needs a GPU | Same class as vLLM. Smaller community. |
| LocalAI | MIT | Yes | Yes | Wraps llama.cpp and adds a model gallery. The gallery re-adds the provenance problem. |
| Ollama (the plan as written) | MIT engine | Yes | Yes | Registry tags and a cloud path. The two items under review. |
| LM Studio | Proprietary | Yes | Yes | Ruled out. Not open source. |

## Decision

1. **Local engine: llama.cpp `llama-server`.** It is MIT, it exposes an
   OpenAI-compatible `/v1/chat/completions` endpoint, and it supports tool calls
   with `--jinja`. Some models also need `--chat-template-file`.
2. **Engine-neutral configuration.** Replace `OLLAMA_URL` with `LOCAL_LLM_URL`,
   and add `LOCAL_LLM_MODEL`. The local backend talks to one OpenAI-compatible
   client, so a later engine swap changes two env values and no code.
3. **Model provenance rule.** Pin one GGUF repository, one revision, and one
   SHA256 digest. Record the license next to the pin. Prefer Apache-2.0 or MIT
   weights, such as Qwen or Mistral-Nemo. Note that the Llama and Gemma terms
   are custom licenses, and the OSI has not approved them.
4. **Keep vLLM on the record.** If data-governance sign-off (open question 5)
   blocks Vertex AI, vLLM is the self-hosted production candidate. Do no work on
   it now.

## Consequences

- Open question 1 changes shape. It must ask for a repository, a revision, a
  digest and a license, not for a registry tag.
- §4.1 changes. The compose service runs `llama-server` and mounts a model
  volume. The README documents a GGUF file download, not a registry pull.
- The chat window has no path to a third-party model by accident. The engine has
  no registry client, so the guard is structural, not procedural.
- The provenance rule gives data governance a single line to review per model.

## Accepted risks

1. **Strict OpenAI compatibility has one known gap.** `llama-server` can return
   `tool_calls.arguments` as a JSON object where the OpenAI contract states a
   JSON string ([llama.cpp #20198](https://github.com/ggml-org/llama.cpp/issues/20198)).
   The agentic loop (Chat 6) must accept both shapes.
2. **Docker on Apple Silicon gives a container no Metal access.** A compose
   service runs on the CPU and stays slow. This cost is equal for Ollama and
   `llama-server`, so it does not favour either. A developer who needs speed runs
   the binary on the host and points `LOCAL_LLM_URL` at it.
3. **Small local models call tools badly.** This risk sits in Chat 5 and Chat 6.
   No engine choice removes it. The evaluation fixtures exist to measure it.
4. **Each developer downloads a model file once.** Ollama's registry made that
   one command. The README must carry the exact command and the digest check.

## Alternative considered

**Keep Ollama and forbid cloud tags in the README.** Rejected. A written rule
does not stop a typo in a model tag, and the failure sends user data off the
machine. The guard must be structural. Ollama also gives no gain that pays for
the residual risk: `llama-server` matches it on tool calls, beats it on image
size, and equals it on CPU speed.
