import type { FastifySessionOptions, SessionStore } from '@fastify/session'

export const SESSION_COOKIE_NAME = 'sessionId'

const DEFAULT_MAX_AGE_MS = 8 * 60 * 60 * 1000

export interface SessionOptionsInput {
  secret: string
  store?: SessionStore
  secure?: boolean
  maxAge?: number
  /**
   * Test-only input for exercising non-production SameSite behavior.
   *
   * `'strict'` is the only value, and the type is the enforcement. `'lax'` is
   * excluded so a harness cannot restate the production value (the drift this
   * module exists to stop), and `'none'` is excluded because a browser rejects
   * a `SameSite=None` cookie that is not also `Secure` — with `secure`
   * defaulting to production-only, that pairing would build a config no
   * browser would accept and no `app.inject()` test would notice. Nothing
   * needs `None`; if that changes, add it together with a `secure` guard.
   */
  sameSiteOverride?: 'strict'
}

export function sessionPluginOptions(input: SessionOptionsInput): FastifySessionOptions {
  return {
    secret: input.secret,
    store: input.store,
    cookieName: SESSION_COOKIE_NAME,
    cookie: {
      httpOnly: true,
      secure: input.secure ?? process.env.NODE_ENV === 'production',
      // The cross-site GET from B2C requires Lax; see ADR-012.
      sameSite: input.sameSiteOverride ?? 'lax',
      maxAge: input.maxAge ?? (Number(process.env.DUOS_SESSION_MAX_AGE_MS) || DEFAULT_MAX_AGE_MS),
      path: '/',
    },
    saveUninitialized: false,
    // Fastify defaults this to true, which resaves every request and can race
    // the auth handlers' explicit save calls.
    rolling: false,
  }
}
