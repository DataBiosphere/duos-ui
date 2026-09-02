import type { FastifySessionOptions, SessionStore } from '@fastify/session'

export const SESSION_COOKIE_NAME = 'sessionId'

const DEFAULT_MAX_AGE_MS = 8 * 60 * 60 * 1000

export interface SessionOptionsInput {
  secret: string
  store?: SessionStore
  secure?: boolean
  maxAge?: number
  /** Test-only input for exercising non-production SameSite behavior. */
  sameSiteOverride?: 'strict' | 'none'
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
