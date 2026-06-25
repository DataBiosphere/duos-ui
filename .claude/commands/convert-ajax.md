---
description: Convert one src/libs/ajax JS file to TypeScript with vitest tests
---

Convert `src/libs/ajax/$ARGUMENTS` from JavaScript to TypeScript and add vitest tests for it, following the exact pattern established for Email.ts.

The canonical example of the pattern (study these first):
- `src/libs/ajax/Email.ts` — the converted module
- `test/libs/ajax/Email.spec.ts` — the test style

Steps:
1. Read "Unit / Integration Test Conventions (Vitest)" in .github/copilot-instructions.md for preliminary test context
2. Read the target `.js` file and `src/libs/ajax/fetchAdapter.ts` to understand which fetch helpers it uses.
3. `git mv` the file from `.js` to `.ts`, then immediately rewrite it in TypeScript (do NOT commit the rename separately):
   - Add parameter and return types to every function. Use `Promise<void>` where the result is unused; define or reuse interfaces for response shapes where the call sites make the shape clear (check usages with grep before inventing types — prefer existing types in `src/types` or nearby `.ts` ajax modules).
   - Pass explicit type parameters to the fetch helpers (e.g. `fetchPost<void>(...)`).
   - Add a JSDoc comment per exported method describing what it does, its params, and return.
   - Do not change runtime behavior, URLs, or method signatures beyond typing.
   - When tightening types in the module causes type errors in callers, fix them with `?? fallback` rather than `!` assertions — `!` lies to the type checker and triggers Sonar's "unnecessary assertion" warning. Use `!` only when narrowing is genuinely impossible (e.g. inside a callback closure where TypeScript can't follow a JSX conditional guard).
   - Commit the rename + rewrite together as `feat: convert to typescript`.
   - **Why one commit:** GitHub's PR diff uses similarity-based rename detection on the net base→HEAD diff. A separate "rename only" commit doesn't help — GitHub still compares the original `.js` to the final `.ts`. Combining rename + rewrite into one commit keeps the history clean and avoids a pointless intermediate state.
4. Create `test/libs/ajax/<Name>.spec.ts` mirroring `test/libs/ajax/Email.spec.ts`:
   - `vi.mock('src/libs/config')` exposing `getApiUrl` and `authOpts`, and `vi.mock('src/libs/ajax/fetchAdapter')` exposing only the helpers the module uses.
   - In `beforeEach`: `vi.clearAllMocks()`, mock `getApiUrl` to resolve `'https://duos.example.org'`, mock `authOpts` to return the standard headers object, and give fetch mocks default resolved values matching the `FetchData<T>` shape from fetchAdapter (`{ data: ... }`, e.g. `mockResolvedValue({ data: undefined })` for void methods) — never coerce a wrong-shaped value with `as never`/`as any`, which trips Sonar and hides type errors.
   - One `describe` per exported method. For each method: a happy-path test asserting the exact URL, payload, and auth opts passed to the fetch helper, plus a test that fetch failures propagate. Where the method returns data, assert the return value.
   - For every method that propagates fetch errors (i.e. does NOT catch them internally), add a ConsentError test: reject the fetch mock with `{ message: '<descriptive message>', code: <status> }` (the `ConsentError` shape from `src/types/model.ts`), capture the rejection, and assert that the real (unmocked) `extractConsentError` and `extractError` from `src/utils/ErrorUtils` recover the shape and message. Always expand the `.then(onFulfilled, onRejected)` call across multiple lines — putting `() => { throw ... }` inline triggers the `@stylistic/max-statements-per-line` lint rule. The one exception is methods that catch all errors internally and return a fallback (e.g. `searchOntologyIdList` returns `[]` on error) — those swallow ConsentErrors too, so no test is needed. See `test/libs/ajax/DAR.spec.ts` for examples of this pattern across multiple methods.
   - Commit as `test: add tests`.
5. Verify, fixing anything that fails before finishing:
   - `pnpm run type-check`
   - `pnpm run test -- test/libs/ajax/<Name>.spec.ts`
   - `pnpx eslint src/libs/ajax/<Name>.ts test/libs/ajax/<Name>.spec.ts`
   - Grep for imports of the old module path; the extension change should be transparent, but confirm nothing imported it with an explicit `.js` extension.
