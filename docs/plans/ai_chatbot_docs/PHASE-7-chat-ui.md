# Phase 7: The chat UI — panel, messages, stream hook, flag, accessibility

**Phase:** 7 of 8 (near-term set) &nbsp;|&nbsp; **Effort:** ~6d &nbsp;|&nbsp; **Risk:** 🟡 Medium
**Depends on:** Phase 1 story 1-E (the event contract) and 1-D (`MAX_HISTORY_TURNS`); Phase 6 stories 6-A and 6-C for the two `429` codes it styles
**Blocks:** Phase 8 (the E2E drives this UI), Chat 11 (rollout)
**Can parallelize with:** Phase 0, Phase 6 (against the canned emitter from Phase 1)
**Reference:** [AI_Chatbot_Overview.md](../AI_Chatbot_Overview.md) §5, §7, open question 9 &nbsp;|&nbsp; [ADR-002](ADR-002-sse-transport.md) decisions 7 and 8

---

## Goal

A floating button and a slide-up panel, visible only to a signed-in user in an
environment with the flag on. The panel sends a question, renders the stream
as it arrives, and cancels what nobody reads.

---

## Background

**What the client already has.** The signed-in state is
`useUserIsLogged()` in `src/hooks/useSession.ts`, backed by the `/auth/me`
probe in `src/libs/auth/session.ts`. The CSRF token is `getCsrfToken()` in
`src/libs/ajax/csrf.ts`, and `isCsrfRejection()` identifies a rejected one by
its body. A `401` from the BFF signs the user out through `redirectOnLogout()`
in `src/libs/ajax/fetchAdapter.ts`; the chat must reach the same path, not
build its own. `react-markdown` 10.1.0 is already a dependency, and
`rehype-raw` is not.

**What the CSP allows.** The enforced policy (`server/src/security/csp.ts`)
has `script-src 'self'`, `style-src 'self' 'unsafe-inline'` for React style
props, and `connect-src 'self'` plus the banner bucket. Same-origin SSE fits.
No inline script, no new origin, and no `blob:` image.

**What the transport demands.** ADR-002 decision 7: no `EventSource`, because
it cannot POST and cannot send `X-CSRF-Token`. The hook reads the response
body stream and parses SSE frames by hand. Decision 8: every turn holds an
`AbortController`.

**The flag is environment-wide.** §5.3: `chatEnabled` in `config.json` cannot
serve a per-user canary. The first rollout is by environment. Chat 12 moves it
to the Consent feature-flag service later.

---

## Stories

### 7-A: The `chatEnabled` flag, end to end

Follow the `bffEnabled` delivery path exactly, because Epic 6 story 6-J lists
every place that key lives and the chat key goes to the same places:

| Where | Change |
|---|---|
| `terra-helmfile`: `charts/duos/templates/_config.json.tpl`, `charts/duos/values.yaml`, `values/app/duos/live/{dev,staging,prod}.yaml`, `bee.yaml.gotmpl` | Add `chatEnabled`, default `false`, `true` in BEEs only at first |
| `public/config-example.json`, `config/dev.json` | Add the key, `false` |
| `src/libs/config.ts` | `chatEnabled?: boolean` on `ConfigType`; `isChatEnabled()` and `ConfigClass.isChatEnabled()`, shaped like `isBffEnabled()`; a missing key reads as `false` |
| `server/src/index.ts` | Register the chat route only when `clientConfig.chatEnabled === true`, inside the `bffEnabled` block |

The server gate is the point of the story. A client could call `/api/chat`
with the button hidden, so hiding the button is a courtesy and the server gate
is the control. A missing key fails safe, the way a missing `bffEnabled` does.

Tests: `config.test.ts` covers the missing key; `index.test.ts` proves the
route is absent when the flag is off and present when it is on.

**Files:** `src/libs/config.ts`, `server/src/index.ts`, `public/config-example.json`, `config/dev.json`, `test/libs/config.spec.ts`, `server/test/index.test.ts`; `terra-helmfile` as listed
**Effort:** 0.5d &nbsp;|&nbsp; **Risk:** Low

---

### 7-B: `useChatStream` — history, POST, SSE parse, abort, error codes

One hook owns the transcript and the transport.

**State.** An array of `{ role: 'user' | 'assistant', content }` entries, the
current `status` line, and a `phase` of `idle | streaming | error`. Trim to
`MAX_HISTORY_TURNS` from the shared module before every send (Phase 1 story
1-D); the server trims again.

**Request.** `fetch('/api/chat', { method: 'POST', credentials: 'include',
headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': await
getCsrfToken() }, body, signal })`. No `Authorization` header, ever (§7).

**Response handling, in order:**

1. `403` with the CSRF body (`isCsrfRejection`): reset the token with
   `resetCsrfToken()` and retry once, as the fetch adapter does. A second `403`
   is an error.
2. `401`: the session is gone. Call the adapter's sign-out path so the user
   lands where every other `401` lands. Do not show a chat error first.
3. `429` with `rate_limited`: show "wait a minute". `429` with
   `quota_exceeded`: show "daily limit reached, resets at <local time of
   `resetsAt`>". `409` with `turn_in_progress`: "a turn is already running in
   another tab". Each is a message in the panel, not a toast, because the user
   is looking at the panel.
4. `413`: "message too long" — the body limit from Phase 1 story 1-D. Keep
   the draft in the textarea so the user can shorten it.
5. `503`: "chat is unavailable". Do not retry automatically.
6. `200 text/event-stream`: parse frames.

**The parser.** Read `response.body` with a `TextDecoder`; split on blank
lines; for each frame read `event:` and `data:`; ignore comment lines (the
`:keep-alive` frame). Dispatch on the four event types from the shared
contract module and nothing else. `token` appends to the open assistant entry;
`status` replaces the status line; `done` closes the entry and clears the
status; `error` closes the entry, sets `phase: 'error'`, and maps its `code`
from the Phase 2 story 2-A taxonomy: `session_expired` goes to the sign-out
path; `upstream_rate_limited` renders the wait from the preceding `status`
frame, worded as the DUOS API's limit rather than the chat's; every other code
renders its message. Treat an `error` frame as seriously as a failed request
(ADR-002).

**Abort.** One `AbortController` per turn. Closing the panel aborts; sending a
new question aborts the previous one first; unmount aborts. An abort leaves the
partial assistant text in the transcript with a visible "stopped" marker, so
the next request's history carries what the user saw.

Tests, with a mocked `fetch` that yields a `ReadableStream`: frames split
across chunk boundaries parse correctly; a comment frame is ignored; an
`error` frame after two tokens ends the turn with the text kept; the CSRF
retry happens once; a `401` reaches the sign-out spy; abort cancels the
in-flight request and marks the entry.

**Files:** `src/components/chat/useChatStream.ts`, `src/libs/chat/sseParser.ts`, `src/libs/chat/events.ts` (shared with the server, from story 1-E), `test/components/chat/useChatStream.spec.ts`, `test/libs/chat/sseParser.spec.ts`
**Effort:** 1.5d &nbsp;|&nbsp; **Risk:** Medium — the parser meets real chunking only in Phase 8

---

### 7-C: `ChatPanel` — the button and the panel

Mount point: `src/App.tsx`, beside `DuosHeader`, rendered only when
`useUserIsLogged()` is `true` **and** `Config.isChatEnabled()` resolves `true`.
A signed-out user never sees the button (§5.2), and neither does a user in an
environment with the flag off.

Shape: a fixed-position button in the lower right, and a panel that slides up
from it. Use the MUI primitives the codebase already uses (`Drawer` is in use
in `src/components/`) rather than a new overlay library. The panel holds the
transcript, the status line, a textarea, a send button, and a close button.
Send on Enter, newline on Shift+Enter.

Rules:

- Closing the panel keeps the transcript for the page's lifetime and aborts
  any open turn (story 7-B). A page navigation inside the SPA keeps it; a
  reload clears it. Nothing is written to `localStorage` — the transcript is
  user data, and §7 keeps it in the browser's memory only.
- The send button is disabled while a turn streams; a second click is not a
  second turn. The server's concurrency cap (Phase 6 story 6-D) is the
  backstop, not the control.
- No inline `style` attribute that the CSP would reject is needed; MUI's
  runtime styles are covered by `'unsafe-inline'` in `style-src`.

Tests (`test/components/chat/ChatPanel.spec.tsx`, testing-library): the button
is absent when signed out; absent when the flag is off; present and the panel
opens when both hold; Enter sends and Shift+Enter does not; closing calls the
hook's abort.

**Files:** `src/components/chat/ChatPanel.tsx`, `src/App.tsx`, `test/components/chat/ChatPanel.spec.tsx`
**Effort:** 1.5d &nbsp;|&nbsp; **Risk:** Low

---

### 7-D: `ChatMessage` — markdown without raw HTML

Render assistant text with `react-markdown`, **without `rehype-raw`** (§7).
Model output and dataset text are untrusted.

Rules, each a test:

- No `rehype-raw` import anywhere under `src/components/chat/`. Add a test that
  greps the module source, so a later "just this once" fails CI.
- `disallowedElements: ['img', 'script', 'iframe', 'object']` with
  `unwrapDisallowed`, so a markdown image syntax renders as its alt text and
  loads nothing. The CSP would block the load anyway; the point is that the
  panel never tries.
- Links open in a new tab with `rel="noopener noreferrer"`. The existing
  `ScrollableMarkdownContainer` and `Notification` components already use
  `react-markdown`; follow their component overrides for consistency.
- A `user` entry renders as plain text, never as markdown — the user typed it,
  and rendering their own markdown back at them is confusing at best.
- The status line sits below the transcript and **replaces**; the assistant
  entry **appends** (Phase 5 story 5-D states this rule in the contract).

**Files:** `src/components/chat/ChatMessage.tsx`, `test/components/chat/ChatMessage.spec.tsx`
**Effort:** 0.5d &nbsp;|&nbsp; **Risk:** Low

---

### 7-E: Accessibility, shipped with the panel

§5.1: not a follow-up. Agree the detail with the designer, then build:

| Need | Implementation |
|---|---|
| A screen reader hears the answer | One `aria-live="polite"` region. Announce the **status** line as it changes and the **completed** answer on `done`. Do not announce every `token`; a live region that updates ten times a second is noise. |
| Focus on open and close | Opening moves focus to the textarea; closing returns it to the button. |
| Keyboard route to close | Escape closes the panel. The close button is in the tab order. |
| Reduced motion | The slide-up animation respects `prefers-reduced-motion: reduce` and becomes an instant show. |
| Names | The button has an accessible name; the panel is a labelled `dialog` or `complementary` region — pick one with the designer and record it. |
| Contrast and sizing | Follow the existing MUI theme; no new colours. |

Tests: extend `test/accessibility.spec.tsx` in the style it already uses;
assert the live region exists and updates on `done`, that focus moves on open
and returns on close, and that Escape closes.

**Files:** `src/components/chat/ChatPanel.tsx`, `src/components/chat/ChatMessage.tsx`, `test/accessibility.spec.tsx`
**Effort:** 1d &nbsp;|&nbsp; **Risk:** Low

---

### 7-F: A feedback control, and where its answer goes

Open question 9 asks how the team knows the chat helps. A rating needs a
control and a place to put the result, and §5.1 says decide it before the UI
story starts.

*Proposal — confirm in review:* **a thumbs-up / thumbs-down pair on each
completed assistant entry, recorded as an identified Bard event through the
existing metrics path, carrying no text.**

- The control calls `Metrics.captureEvent` (`src/libs/ajax/Metrics.ts`) with a
  new event name, the rating, and the turn's end reason. Identified events
  already route through the authenticated proxy at `/bard-api`, so there is no
  new server route, no new CSRF surface, and no new table.
- The payload carries **no question text and no answer text** (§7, open
  question 8). It may carry the tool names the turn used, if the server
  surfaces them in the `done` event — decide that with story 5-D, and record
  it in the Phase 0 story 0-A data contract either way, because a metric
  leaves DUOS.
- If the team wants a baseline for support-request volume instead, capture it
  **before** launch (open question 9) — that is a measurement task, not UI
  work, and it belongs in Chat 11.

Tests: a click sends one event with the rating and no text; a second click on
the same entry changes the rating rather than sending a second event.

**Files:** `src/components/chat/ChatMessage.tsx`, `src/libs/ajax/Metrics.ts`, `src/libs/events.ts`, `test/components/chat/ChatMessage.spec.tsx`
**Effort:** 0.5d &nbsp;|&nbsp; **Risk:** Low

---

## Suggested sequencing

7-A and 7-B first and in parallel: the flag gates everything, and the hook is
what the panel renders. 7-D is small and can go with 7-C. 7-E is last so it
tests the finished panel. 7-F waits on the open-question decision and can slip
to a follow-on sprint without blocking Phase 8.

```
7-A ─┐
     ├─→ 7-C ─→ 7-D ─→ 7-E ─→ 7-F
7-B ─┘
```

---

## Exit criteria

1. The button is absent when signed out and when `chatEnabled` is off, and
   the server registers no route when the flag is off.
2. A turn streams into the panel token by token through a hand-written SSE
   parser, with no `EventSource` and no `Authorization` header.
3. Closing the panel, sending a new question, and unmounting each abort the
   open turn.
4. `401` reaches the shared sign-out path; `403` CSRF retries once; the three
   limit codes render distinct messages.
5. No raw HTML renders, no image loads, and a test fails if `rehype-raw` is
   imported.
6. The live region, focus management, Escape, and reduced motion all hold under
   test.
7. A feedback rating leaves the browser with no text attached, or the decision
   not to ship one is recorded against open question 9.
