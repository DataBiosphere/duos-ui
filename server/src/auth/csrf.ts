import type { FastifyRequest } from 'fastify'

/**
 * How the BFF registers `@fastify/csrf-protection` — one object, imported by
 * index.ts and by every test harness that stands the plugin up.
 *
 * Shared rather than repeated because it drifted once already: review of story
 * 3-D found three different CSRF configurations across the suite (index.ts's,
 * a copy of the same lambda in apiProxy.test.ts, and the plugin's bare defaults
 * in auth.test.ts), which meant deleting the `getToken` narrowing below left the
 * whole suite green — and that auth.test.ts's logout tests would have accepted a
 * body-borne token production rejects. Anything registering this plugin has to
 * use this object, so the narrowing cannot be lost without a test noticing.
 */

/**
 * The one header the BFF reads a CSRF token from.
 *
 * `/auth/csrf-token` tells the client to send this and nothing else; the proxy
 * strips it before forwarding, since it is meaningless upstream.
 */
export const CSRF_HEADER = 'x-csrf-token'

/**
 * Header-only, narrowed from the plugin's default — which also accepts
 * `body._csrf` and three further header spellings (`csrf-token`, `xsrf-token`,
 * `x-xsrf-token`). Two reasons, per ADR-004(c):
 *
 *   - Bodies pass through the proxy unparsed, so a body-borne token could not be
 *     read there without buffering the upload it is attached to.
 *   - One documented spelling is a clearer contract than four, and it is the one
 *     `/auth/csrf-token` hands out.
 *
 * `sessionPlugin` ties the secret to `@fastify/session`, which is why the plugin
 * must be registered after it.
 */
export const csrfPluginOptions = {
  sessionPlugin: '@fastify/session',
  getToken: (request: FastifyRequest): string | undefined =>
    request.headers[CSRF_HEADER] as string | undefined,
} as const
