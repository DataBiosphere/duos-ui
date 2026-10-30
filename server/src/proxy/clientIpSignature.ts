import { createHmac } from 'node:crypto'

/**
 * Signed client IP for Consent's anonymous showcase rate limit (DT-4379).
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

/**
 * The secret, or undefined when unset. Without it the route still works, and
 * Consent falls back to one shared bucket for all BFF traffic.
 */
export function consentProxySecretFromEnv(): string | undefined {
  const secret = process.env[CONSENT_PROXY_SECRET_ENV_VAR]?.trim()
  if (!secret) return undefined
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`${CONSENT_PROXY_SECRET_ENV_VAR} is shorter than ${MIN_SECRET_LENGTH} characters — unset it, or set the value that Consent holds as rateLimit.showcase.clientIpSecret`)
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
