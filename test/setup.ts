import { afterAll } from 'vitest'
import { act, cleanup, configure } from '@testing-library/react'
import { dismissAllNotifications } from 'src/libs/ToastNotifications'

// Testing Library's default `asyncUtilTimeout` is 1000ms, which is the wall-clock
// budget every bare `waitFor`/`findBy*` call gets. On a loaded CI machine a single
// MUI DataGrid render can exceed that on its own, so the suite fails for lack of
// time rather than for a real defect. Give async utilities a load-tolerant budget;
// it costs nothing when the expectation resolves promptly.
configure({ asyncUtilTimeout: 5000 })

// A render that lands outside `act` leaves React to commit its passive effects from a
// scheduler callback on Node's immediate queue, which outlives the jsdom window Vitest
// destroys after each file. That callback reads `window.event`, so one still queued at
// teardown throws `window is not defined` and fails the shard however the tests went.
// React re-posts the callback per time slice, so drain the queue rather than yielding once.
// The browser config shares this file and has no immediate queue to drain.
const queueImmediate = typeof setImmediate === 'function' ? setImmediate : undefined
let pendingImmediates = 0

if (queueImmediate) {
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
  // Bounded so a self-perpetuating callback stalls this file rather than the whole run.
  for (let turn = 0; pendingImmediates > 0 && turn < 50; turn++) {
    await new Promise(resolve => queueImmediate(resolve))
  }
})
