import type autocannon from 'autocannon'
import { PROXY_PREFIX } from '../../src/proxy/apiProxy.js'
import { BLOB_PATH } from './upstream.js'
import type { SeededSession } from './harness.js'

/**
 * What the load run drives through the proxy (story 3-H).
 *
 * Four shapes, each putting a different part of the proxy under pressure rather
 * than enumerating the API. The refresh path is deliberately absent: it needs a
 * live B2C token endpoint, and single-flight under concurrency is covered by
 * `refresh.test.ts` (story 3-G).
 */

export interface Scenario {
  name: string
  description: string
  defaultConnections: number
  /** p99 the BFF may add *above* the stub upstream's own latency. */
  p99BudgetMs: number
  request: (session: SeededSession) => autocannon.Request
  needsSession: boolean
}

/** Roughly the size of a DAR draft PUT — the largest body the client sends routinely. */
const WRITE_BODY = JSON.stringify({ referenceId: 'load', data: 'x'.repeat(4096) })

export const SCENARIOS: readonly Scenario[] = [
  {
    name: 'read',
    description: 'authenticated GET of a small JSON resource',
    defaultConnections: 100,
    p99BudgetMs: 100,
    needsSession: true,
    request: session => ({
      method: 'GET',
      path: `${PROXY_PREFIX}/api/dataset/1`,
      headers: { cookie: session.cookie },
    }),
  },
  {
    name: 'write',
    description: 'authenticated POST with a CSRF token and a 4 KB streamed body',
    defaultConnections: 100,
    p99BudgetMs: 100,
    needsSession: true,
    request: session => ({
      method: 'POST',
      path: `${PROXY_PREFIX}/api/dar/v2/draft`,
      headers: {
        'cookie': session.cookie,
        'x-csrf-token': session.csrfToken,
        'content-type': 'application/json',
      },
      body: WRITE_BODY,
    }),
  },
  {
    name: 'download',
    description: 'authenticated GET of a multi-megabyte document body',
    // Lower on purpose: at 100 connections, 5 MB bodies measure the loopback
    // interface rather than the proxy.
    defaultConnections: 20,
    // Transferring the body dominates, so this bounds streaming overhead rather
    // than stating a latency target for the endpoint.
    p99BudgetMs: 500,
    needsSession: true,
    request: session => ({
      method: 'GET',
      path: `${PROXY_PREFIX}${BLOB_PATH}`,
      headers: { cookie: session.cookie },
    }),
  },
  {
    name: 'anonymous',
    description: 'allowlisted GET with no session — proxy overhead without the session store',
    defaultConnections: 100,
    p99BudgetMs: 100,
    needsSession: false,
    request: () => ({
      method: 'GET',
      path: `${PROXY_PREFIX}/status`,
    }),
  },
]

export function scenarioByName(name: string): Scenario {
  const scenario = SCENARIOS.find(candidate => candidate.name === name)
  if (!scenario) {
    throw new Error(`unknown scenario '${name}' — expected one of ${SCENARIOS.map(s => s.name).join(', ')}, or 'all'`)
  }
  return scenario
}
