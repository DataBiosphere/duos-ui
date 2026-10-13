import { createHash, generateKeyPairSync, randomBytes, sign, type KeyObject } from 'node:crypto'

/**
 * RS256 signing for the mock provider's `id_token`, the algorithm B2C uses. The
 * key pair lives only as long as the process, and the provider publishes the
 * public half at its `jwks_uri`, so openid-client verifies the signature the
 * same way it verifies B2C's.
 */
export interface SigningKey {
  kid: string
  privateKey: KeyObject
  jwk: Record<string, unknown>
}

export function createSigningKey(): SigningKey {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const kid = randomBytes(8).toString('hex')
  return { kid, privateKey, jwk: { ...publicKey.export({ format: 'jwk' }), kid, use: 'sig', alg: 'RS256' } }
}

const base64url = (value: Buffer | string): string => Buffer.from(value).toString('base64url')

export function signJwt(key: SigningKey, claims: Record<string, unknown>): string {
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: key.kid }))
  const payload = base64url(JSON.stringify(claims))
  const signature = sign('sha256', Buffer.from(`${header}.${payload}`), key.privateKey)
  return `${header}.${payload}.${base64url(signature)}`
}

/** The payload only. The provider reads back its own `id_token_hint`, so it needs no signature check. */
export function decodeJwtPayload(token: string): Record<string, unknown> | undefined {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8')) as unknown
    return typeof payload === 'object' && payload !== null ? payload as Record<string, unknown> : undefined
  }
  catch {
    return undefined
  }
}

/** RFC 7636 S256: base64url(sha256(verifier)). */
export const s256 = (verifier: string): string => createHash('sha256').update(verifier).digest('base64url')

export const randomToken = (): string => randomBytes(24).toString('base64url')
