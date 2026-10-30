import { describe, it, expect, afterEach } from 'vitest'
import {
  CLIENT_IP_HEADER,
  CLIENT_IP_SIGNATURE_HEADER,
  CLIENT_IP_TIMESTAMP_HEADER,
  CONSENT_PROXY_SECRET_ENV_VAR,
  consentProxySecretFromEnv,
  signClientIp,
} from '../src/proxy/clientIpSignature.js'

// The same vector is in Consent's SignedClientIpVerifierTest. A change to the
// signed bytes on one side only fails one of the two tests.
const VECTOR = {
  secret: 'test-consent-proxy-secret-0123456789abcdef',
  ip: '203.0.113.7',
  timestamp: 1793376000,
  signature: 'c22a76358b1464270b18f819cc3192670ea01d728241c9754b8973e0333ac6ad',
}

describe('signClientIp', () => {
  it('signs the IP and the timestamp with HMAC-SHA256 as lowercase hex', () => {
    const headers = signClientIp(VECTOR.secret, VECTOR.ip, VECTOR.timestamp)

    expect(headers).toEqual({
      [CLIENT_IP_HEADER]: VECTOR.ip,
      [CLIENT_IP_TIMESTAMP_HEADER]: String(VECTOR.timestamp),
      [CLIENT_IP_SIGNATURE_HEADER]: VECTOR.signature,
    })
  })

  it('signs an IPv6 /64 key in the form rateLimitKey gives it', () => {
    const headers = signClientIp(VECTOR.secret, '2001:db8:1:2::', VECTOR.timestamp)

    expect(headers[CLIENT_IP_SIGNATURE_HEADER]).toBe('b7dc71a8948b2ed1b4a95d40d5787ec2af3c01747465e5027678cbc077c20e33')
  })

  it('uses lowercase header names, as Node sends them', () => {
    expect([CLIENT_IP_HEADER, CLIENT_IP_TIMESTAMP_HEADER, CLIENT_IP_SIGNATURE_HEADER])
      .toEqual(['x-duos-client-ip', 'x-duos-client-ip-timestamp', 'x-duos-client-ip-signature'])
  })
})

describe('consentProxySecretFromEnv', () => {
  afterEach(() => {
    delete process.env[CONSENT_PROXY_SECRET_ENV_VAR]
  })

  it('is undefined when the variable is unset or blank', () => {
    expect(consentProxySecretFromEnv()).toBeUndefined()
    process.env[CONSENT_PROXY_SECRET_ENV_VAR] = '   '
    expect(consentProxySecretFromEnv()).toBeUndefined()
  })

  it('returns a secret of 32 characters or more', () => {
    process.env[CONSENT_PROXY_SECRET_ENV_VAR] = VECTOR.secret

    expect(consentProxySecretFromEnv()).toBe(VECTOR.secret)
  })

  it('throws for a short secret, without the value in the message', () => {
    process.env[CONSENT_PROXY_SECRET_ENV_VAR] = 'too-short-secret'

    expect(() => consentProxySecretFromEnv()).toThrow(CONSENT_PROXY_SECRET_ENV_VAR)
    expect(() => consentProxySecretFromEnv()).not.toThrow('too-short-secret')
  })
})
