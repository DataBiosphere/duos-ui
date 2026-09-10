import { afterAll } from 'vitest'
import { act, cleanup, configure } from '@testing-library/react'
import { dismissAllNotifications } from 'src/libs/ToastNotifications'

// Testing Library's default `asyncUtilTimeout` is 1000ms, which is the wall-clock
// budget every bare `waitFor`/`findBy*` call gets. On a loaded CI machine a single
// MUI DataGrid render can exceed that on its own, so the suite fails for lack of
// time rather than for a real defect. Give async utilities a load-tolerant budget;
// it costs nothing when the expectation resolves promptly.
configure({ asyncUtilTimeout: 5000 })

// A render outside `act` leaves React to commit passive effects from a scheduler callback on
// Node's immediate queue, which outlives the jsdom window Vitest destroys after each file, and
// that callback reads `window.event` — one still queued at teardown fails the whole shard.
// Setup runs again per test file with the worker's globals intact, so wrap the native
// implementation every time rather than the previous file's wrapper. The browser config
// shares this file and has no immediate queue.
const workerGlobals = globalThis as typeof globalThis & { nativeSetImmediate?: typeof setImmediate }
const queueImmediate = workerGlobals.nativeSetImmediate
  ?? (typeof setImmediate === 'function' ? setImmediate : undefined)
let pendingImmediates = 0

if (queueImmediate) {
  workerGlobals.nativeSetImmediate = queueImmediate
  globalThis.setImmediate = ((callback: (...args: unknown[]) => void, ...args: unknown[]) => {
    pendingImmediates++
    return queueImmediate(() => {
      pendingImmediates--
      callback(...args)
    })
  }) as typeof setImmediate
}

afterAll(async () => {
  cleanup()
  dismissAllNotifications()
  await act(async () => {})
  if (!queueImmediate) return
  // React re-posts the callback per time slice, so drain rather than yield once. Bounded so a
  // self-perpetuating callback stalls this file rather than the whole run.
  for (let turn = 0; pendingImmediates > 0 && turn < 50; turn++) {
    await new Promise(resolve => queueImmediate(resolve))
  }
})
