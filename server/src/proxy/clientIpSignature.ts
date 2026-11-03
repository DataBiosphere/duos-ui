import { createHmac } from 'node:crypto'

/**
 * Signed client IP for Consent's anonymous per-IP rate limits (DT-4379).
 * Only the showcase route signs today; another anonymous route can opt in by
 * spreading `signClientIp(...)` into its request headers.
 *
 * The BFF calls Consent at its public URL, and Consent's load balancer
 * overwrites `X-Real-IP` with this pod's egress address, so every BFF-proxied
 * lookup would share one Consent bucket. The BFF sends the browser IP in its
 * own header instead, with a timestamp and an HMAC-SHA256 of both. Consent
 * uses the IP only when the HMAC matches and the timestamp is in its window;
 * otherwise it keys on `X-Real-IP` as before.
 *
 * Contract, shared with Consent's `SignedClientIpVerifier`:
 *   - signed bytes: `<ip>\n<timestamp>`, UTF-8
 *   - timestamp: Unix seconds, decimal
 *   - signature: lowercase hex
 *
 * Consent uses the IP only as a rate-limit key, never to grant access.
 *
 * The secret never leaves the pod. It is not `DUOS_SESSION_SECRET`: Consent
 * holds this one, and a leak from Consent must not let anyone forge sessions.
 */

export const CONSENT_PROXY_SECRET_ENV_VAR = 'DUOS_CONSENT_PROXY_SECRET'

export const CLIENT_IP_HEADER = 'x-duos-client-ip'
export const CLIENT_IP_TIMESTAMP_HEADER = 'x-duos-client-ip-timestamp'
export const CLIENT_IP_SIGNATURE_HEADER = 'x-duos-client-ip-signature'

/** Header names that only the BFF may set; a caller's values never reach an upstream. */
export const SIGNED_CLIENT_IP_HEADERS: readonly string[] = [CLIENT_IP_HEADER, CLIENT_IP_TIMESTAMP_HEADER, CLIENT_IP_SIGNATURE_HEADER]

const MIN_SECRET_LENGTH = 32

// Only ASCII whitespace, the same set that Consent's SignedClientIpVerifier
// trims. String.prototype.trim() also removes U+FEFF and U+00A0, and Java's
// strip() does not, so those are rejected below instead of removed.
const EDGE_ASCII_WHITESPACE = /^[ \t\n\r\f\v]+|[ \t\n\r\f\v]+$/g
const PRINTABLE_ASCII = /^[\x21-\x7E]+$/

/**
 * The secret, or undefined when unset. Without it the route still works, and
 * Consent falls back to one shared bucket for all BFF traffic.
 */
export function consentProxySecretFromEnv(): string | undefined {
  const secret = process.env[CONSENT_PROXY_SECRET_ENV_VAR]?.replace(EDGE_ASCII_WHITESPACE, '')
  if (!secret) return undefined
  if (!PRINTABLE_ASCII.test(secret)) {
    throw new Error(`${CONSENT_PROXY_SECRET_ENV_VAR} has a character that is not printable ASCII — set a value such as the output of openssl rand -base64 32, the same value that Consent holds as rateLimit.clientIpSecret`)
  }
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`${CONSENT_PROXY_SECRET_ENV_VAR} is shorter than ${MIN_SECRET_LENGTH} characters — unset it, or set the value that Consent holds as rateLimit.clientIpSecret`)
  }
  return secret
}

/** The three headers for one request. `ip` is the BFF's own rate-limit key. */
export function signClientIp(secret: string, ip: string, nowSeconds: number): Record<string, string> {
  const timestamp = String(Math.floor(nowSeconds))
  const signature = createHmac('sha256', secret).update(`${ip}\n${timestamp}`).digest('hex')
  return {
    [CLIENT_IP_HEADER]: ip,
    [CLIENT_IP_TIMESTAMP_HEADER]: timestamp,
    [CLIENT_IP_SIGNATURE_HEADER]: signature,
  }
}
