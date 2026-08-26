/**
 * Node 26 defines its own `localStorage`/`sessionStorage` globals. Its
 * `localStorage` is `undefined` unless the process was started with
 * `--localstorage-file`, and because the flag is process-wide it cannot be
 * turned off per worker. Under any pool that reuses the worker's realm (the
 * `threads` pool we run with), vitest's jsdom environment skips populating a
 * global that already exists, so Node's shadow the ones jsdom created. Reinstate
 * jsdom's here: `localStorage` becomes usable again, and `sessionStorage` goes
 * back to being per-file rather than shared by every file a worker runs.
 */
const jsdomWindow = (globalThis as { jsdom?: { window: Window } }).jsdom?.window

if (!jsdomWindow) {
  throw new Error('vitest no longer exposes globalThis.jsdom; test/setup.ts can no longer restore jsdom web storage')
}

for (const key of ['localStorage', 'sessionStorage'] as const) {
  Object.defineProperty(globalThis, key, {
    value: jsdomWindow[key],
    configurable: true,
    writable: true,
    enumerable: true,
  })
}
