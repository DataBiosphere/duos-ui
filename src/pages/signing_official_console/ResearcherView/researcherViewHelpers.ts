import { DAAObject, DuosUser } from 'src/types/model'
import { AuthStatus, DAARowData, ResearcherRowData } from './types'

/**
 * Returns the display name for a DAA's associated DAC(s).
 * Joins multiple DAC names with " / " when a DAA spans more than one DAC.
 */
export function getDacName(daa: DAAObject): string {
  if (!daa.dacs || daa.dacs.length === 0) return '—'
  return daa.dacs
    .map(d => d.name ?? d.dacName ?? '')
    .filter(Boolean)
    .join(' / ') || '—'
}

/**
 * Derives the authorization status for a researcher/DAA pair from the
 * researcher's library card. Pending state is reserved for future API
 * support; today it is never returned for a freshly-loaded researcher list.
 */
export function getAuthStatus(researcher: DuosUser, daaId: number): AuthStatus {
  const normalizedDaaId = Number(daaId)
  const authorizedDaaIds = new Set(
    (researcher.libraryCard?.daaIds ?? [])
      .map(id => Number(id))
      .filter(id => Number.isFinite(id)),
  )

  return authorizedDaaIds.has(normalizedDaaId) ? 'authorized' : 'not_requested'
}

/**
 * Builds the full list of DAARowData for a single researcher across all DAAs.
 */
export function buildDAARows(researcher: DuosUser, daas: readonly DAAObject[]): DAARowData[] {
  // API payloads can include duplicate DAA entries; use daaId as the canonical key.
  const uniqueDaas = Array.from(new Map(daas.map(daa => [daa.daaId, daa])).values())

  return uniqueDaas.map(daa => ({
    daa,
    dacName: getDacName(daa),
    status: getAuthStatus(researcher, daa.daaId),
  }))
}

/**
 * Enriches each researcher with their computed DAA rows and badge counts,
 * then sorts so researchers with pending items appear first.
 */
export function buildResearcherRows(
  researchers: readonly DuosUser[],
  daas: readonly DAAObject[],
): ResearcherRowData[] {
  return researchers
    .map((researcher) => {
      const daaRows = buildDAARows(researcher, daas)
      const authorizedCount = daaRows.filter(r => r.status === 'authorized').length
      const pendingCount = daaRows.filter(r => r.status === 'pending').length
      return { researcher, daaRows, authorizedCount, pendingCount, hasPending: pendingCount > 0 }
    })
    .sort(
      (a, b) =>
        Number(b.hasPending) - Number(a.hasPending)
        || b.pendingCount - a.pendingCount,
    )
}
