import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  isLegacyOidcKey,
  purgeLegacyOidcKeys,
  reportLegacyOidcKeys,
  resetLegacyKeyReports,
} from 'src/libs/auth/legacyOidcKeys'
import { Metrics } from 'src/libs/ajax/Metrics'

describe('legacy OIDC keys', () => {
  beforeEach(() => {
    localStorage.clear()
    resetLegacyKeyReports()
    vi.spyOn(Metrics, 'captureEvent').mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  describe('isLegacyOidcKey', () => {
    it.each(['OidcUser', 'OidcUser:https://authority:client', 'oidc.user:authority:client', 'oidc.abc'])(
      'matches %s',
      key => expect(isLegacyOidcKey(key)).toBe(true),
    )

    it.each(['anonymousId', 'currentUser', 'oidc', 'xOidcUser', 'Oidc'])(
      'does not match %s',
      key => expect(isLegacyOidcKey(key)).toBe(false),
    )
  })

  describe('purgeLegacyOidcKeys', () => {
    it('removes every key the predicate matches and keeps the rest', () => {
      localStorage.setItem('OidcUser:a', '1')
      localStorage.setItem('oidc.b', '2')
      localStorage.setItem('anonymousId', '3')

      purgeLegacyOidcKeys()

      expect(Object.keys(localStorage)).toEqual(['anonymousId'])
    })
  })

  describe('reportLegacyOidcKeys', () => {
    it('sends nothing when no legacy key is present', () => {
      localStorage.setItem('anonymousId', '3')

      reportLegacyOidcKeys('residue')

      expect(Metrics.captureEvent).not.toHaveBeenCalled()
    })

    it('sends an explicitly anonymous event with the phase and a key count', () => {
      localStorage.setItem('OidcUser:a', '1')
      localStorage.setItem('oidc.b', '2')

      reportLegacyOidcKeys('residue')

      expect(Metrics.captureEvent).toHaveBeenCalledWith(
        'legacy_oidc_key_seen',
        { phase: 'residue', keyCount: 2 },
        undefined,
        { anonymous: true },
      )
    })

    it('never sends the key names or values', () => {
      localStorage.setItem('OidcUser:secret-authority', 'secret-token')

      reportLegacyOidcKeys('regression')

      expect(JSON.stringify(vi.mocked(Metrics.captureEvent).mock.calls)).not.toContain('secret')
    })

    it('reports each phase at most once per page load', () => {
      localStorage.setItem('OidcUser:a', '1')

      reportLegacyOidcKeys('regression')
      reportLegacyOidcKeys('regression')
      reportLegacyOidcKeys('residue')

      expect(Metrics.captureEvent).toHaveBeenCalledTimes(2)
    })

    it('does not use up the once-per-load report when no key is present', () => {
      reportLegacyOidcKeys('regression')
      localStorage.setItem('OidcUser:a', '1')
      reportLegacyOidcKeys('regression')

      expect(Metrics.captureEvent).toHaveBeenCalledTimes(1)
    })
  })
})
