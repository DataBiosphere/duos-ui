import 'fastify'

/**
 * Application session shape stored in `user_sessions.sess`.
 *
 * `@fastify/session` exposes the session as `request.session`, whose data is
 * the `fastify` module's `Session` interface. Augmenting it makes these fields
 * type-safe everywhere the session is read or written. Tokens live only in the
 * server session and are never sent to the browser.
 */
declare module 'fastify' {
  interface Session {
    userId?: string
    accessToken?: string
    idToken?: string
    refreshToken?: string
    tokenExpiry?: number // Unix epoch seconds
    pkceVerifier?: string // stored during OAuth initiation
    pkceState?: string
    returnTo?: string // post-login redirect target, stored during OAuth initiation
    // Sub-provider the user chose on the B2C login page, derived from the B2C
    // id_token's `idp` claim at callback (Phase 2). All tokens are B2C-issued
    // regardless — this field exists for the audit trail and observability,
    // not client selection.
    idp?: 'google' | 'microsoft'
  }
}
