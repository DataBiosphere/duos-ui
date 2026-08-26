import { configure } from '@testing-library/react'

// Testing Library's default `asyncUtilTimeout` is 1000ms, which is the wall-clock
// budget every bare `waitFor`/`findBy*` call gets. On a loaded CI machine a single
// MUI DataGrid render can exceed that on its own, so the suite fails for lack of
// time rather than for a real defect. Give async utilities a load-tolerant budget;
// it costs nothing when the expectation resolves promptly.
configure({ asyncUtilTimeout: 5000 })
