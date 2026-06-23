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
    idpToken?: string // Google IDP access token
    tokenExpiry?: number // Unix epoch seconds
    pkceVerifier?: string // stored during OAuth initiation
    pkceState?: string
    idp?: 'google' | 'azure' // which IDP authenticated this session
  }
}
