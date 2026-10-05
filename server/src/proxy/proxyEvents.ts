import type { FastifyInstance } from 'fastify'
import { logAuthEvent } from '../auth/authEvents.js'

/**
 * `proxy.completed`: one info line per proxied request, unsampled (BFF Epic 6,
 * story 6-F). Every 6-G rate divides an outcome count by this event's count,
 * so sampling the successes would inflate each rate.
 */

export type ProxyUpstream = 'duos' | 'ecm' | 'tdr' | 'bard'

interface RequestFacts {
  hadSession: boolean
  idp: 'google' | 'microsoft' | 'unknown'
}

// Captured before anything runs: the failure paths destroy the session before
// the response is written, so `onResponse` can no longer see it.
const requestFacts = new WeakMap<object, RequestFacts>()
const bffErrorCodes = new WeakMap<object, string>()

/** Marks a request the BFF answered itself, without forwarding it upstream. */
export function recordBffError(request: object, code: string): void {
  bffErrorCodes.set(request, code)
}

export function registerProxyCompletedEvent(app: FastifyInstance, upstream: ProxyUpstream): void {
  // Scope-level hooks run before the route's own `onRequest` hooks, so this
  // sees the session before the Fetch Metadata and CSRF guards can reject.
  app.addHook('onRequest', (request, _reply, done) => {
    requestFacts.set(request, {
      hadSession: Boolean(request.session?.accessToken),
      idp: request.session?.idp ?? 'unknown',
    })
    done()
  })

  app.addHook('onResponse', (request, reply, done) => {
    const facts = requestFacts.get(request)
    logAuthEvent(request, 'proxy.completed', {
      status: reply.statusCode,
      upstream,
      had_session: facts?.hadSession ?? false,
      error_code: bffErrorCodes.get(request),
      idp: facts?.idp ?? 'unknown',
    })
    done()
  })
}
