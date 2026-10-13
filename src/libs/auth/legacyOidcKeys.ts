import eventList from 'src/libs/events'
import { Metrics } from 'src/libs/ajax/Metrics'

/**
 * The oidc-client-ts keys the legacy sign-in flow wrote to localStorage.
 * The BFF flow purges them, and the regression check reports them, using this
 * one predicate so the two cannot drift apart.
 */
export const isLegacyOidcKey = (key: string): boolean =>
  key.startsWith('OidcUser') || key.startsWith('oidc.')

const legacyOidcKeys = (): string[] => Object.keys(localStorage).filter(isLegacyOidcKey)

export const purgeLegacyOidcKeys = (): void => {
  legacyOidcKeys().forEach(key => localStorage.removeItem(key))
}

/**
 * `residue`: keys left by a pre-cutover browser, seen before the purge.
 * `regression`: keys present after a BFF session is confirmed, so something
 * wrote them again. Only `regression` is a defect.
 */
export type LegacyKeyPhase = 'residue' | 'regression'

const reported = new Set<LegacyKeyPhase>()

/** Test seam: forgets which phases already reported in this page load. */
export const resetLegacyKeyReports = (): void => {
  reported.clear()
}

/**
 * Reports legacy keys as an anonymous Bard event, at most once per phase per
 * page load so a persistent writer cannot flood the event stream on every
 * focus. Call only on the BFF flow: in legacy mode the keys belong there.
 * Sends a count, never key names or values.
 */
export const reportLegacyOidcKeys = (phase: LegacyKeyPhase): void => {
  if (reported.has(phase)) return
  const keyCount = legacyOidcKeys().length
  if (keyCount === 0) return
  reported.add(phase)
  void Metrics.captureEvent(eventList.legacyOidcKeySeen, { phase, keyCount }, undefined, { anonymous: true })
}
