import { afterAll } from 'vitest'
import { cleanup, configure } from '@testing-library/react'

// Testing Library's default `asyncUtilTimeout` is 1000ms, which is the wall-clock
// budget every bare `waitFor`/`findBy*` call gets. On a loaded CI machine a single
// MUI DataGrid render can exceed that on its own, so the suite fails for lack of
// time rather than for a real defect. Give async utilities a load-tolerant budget;
// it costs nothing when the expectation resolves promptly.
configure({ asyncUtilTimeout: 5000 })

// React flushes on a macrotask, so work still queued at file end runs after Vitest has
// torn down jsdom and fails the shard with `window is not defined`. Drain it first.
// setImmediate is the queue React uses under jsdom; the browser config has no such global.
afterAll(async () => {
  cleanup()
  await new Promise(resolve => typeof setImmediate === 'function' ? setImmediate(resolve) : setTimeout(resolve, 0))
})
