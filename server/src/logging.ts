import { createHash } from 'node:crypto'
import type { FastifyRequest, FastifyServerOptions } from 'fastify'

/**
 * Logger configuration for Cloud Logging, which reads stdout as JSON.
 *
 * Redaction is layered because no single layer is enough: callers log only the
 * fields they name (never a session, tokens or claims), `sanitizeError` cleans
 * errors, and `redact` is the backstop. Pino's `*` matches ONE nesting level,
 * so `redact` alone cannot cover a deeply nested object.
 */

/** Hex SHA-256 — the same digest `user_session_audit.sid_hash` stores, so a log line can be joined to the table. */
export function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

// `sessionId` is the name @fastify/session gives the raw identifier; `sid` is the store's column name.
const REDACT_FIELDS = ['accessToken', 'refreshToken', 'idToken', 'sid', 'sessionId', 'userId', 'email']

export const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  ...REDACT_FIELDS,
  ...REDACT_FIELDS.map(field => `*.${field}`),
]

const SEVERITY: Record<string, string> = { trace: 'DEBUG', debug: 'DEBUG', info: 'INFO', warn: 'WARNING', error: 'ERROR', fatal: 'CRITICAL' }

const BEARER_PATTERN = /\b(Bearer)\s+[\w.~+/=-]+/gi
const QUERY_SECRET_PATTERN = /\b(code|token|access_token|refresh_token|id_token|client_secret|state)=[^&\s"']+/gi

export function scrubSecrets(text: string): string {
  return text.replace(BEARER_PATTERN, '$1 [REDACTED]').replace(QUERY_SECRET_PATTERN, '$1=[REDACTED]')
}

/**
 * Replaces Fastify's default `req` serializer, which writes `req.url` verbatim.
 * `/auth/callback?code=…&state=…` would otherwise reach stdout on every
 * automatic `incoming request` line. Same fields as the default, URL scrubbed.
 */
export function sanitizeRequest(request: FastifyRequest): Record<string, unknown> {
  return {
    method: request.method,
    url: typeof request.url === 'string' ? scrubSecrets(request.url) : undefined,
    version: request.headers?.['accept-version'],
    host: request.host,
    remoteAddress: request.ip,
    remotePort: request.socket?.remotePort,
  }
}

/**
 * Keeps what an operator needs to classify a failure (`name`, `message`,
 * `code`, the OAuth `error`, and a scrubbed `stack`) and drops what can carry a credential: `cause`
 * (openid-client's ResponseBodyError holds the token endpoint's body there) and
 * `response`.
 */
export function sanitizeError(err: unknown): Record<string, unknown> {
  if (!(err instanceof Error)) return { type: 'NonError', message: scrubSecrets(String(err)) }
  const { code, error } = err as Error & { code?: unknown, error?: unknown }
  return {
    type: err.name,
    message: scrubSecrets(err.message),
    ...(typeof err.stack === 'string' ? { stack: scrubSecrets(err.stack) } : {}),
    ...(typeof code === 'string' ? { code } : {}),
    ...(typeof error === 'string' ? { error } : {}),
  }
}

export function buildLoggerOptions(): NonNullable<FastifyServerOptions['logger']> & object {
  return {
    level: process.env.FASTIFY_LOG_LEVEL ?? 'info',
    messageKey: 'message',
    formatters: {
      level: label => ({ severity: SEVERITY[label] ?? 'DEFAULT' }),
    },
    serializers: {
      err: sanitizeError as (err: unknown) => never,
      req: sanitizeRequest,
      // Handlers that log a top-level `url` field (e.g. the Fetch Metadata guard).
      url: (url: unknown) => typeof url === 'string' ? scrubSecrets(url) : url,
    },
    redact: REDACT_PATHS,
  }
}
