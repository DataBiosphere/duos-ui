import { DAAObject, DuosUser } from 'src/types/model'
import { AuthStatus, DAAAccordionData, DAAResearcherRowData, DAARowData, ResearcherRowData } from './types'

function normalizeNumber(value: number): string | null {
  return Number.isFinite(value) ? String(value) : null
}

function normalizeString(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const numeric = Number(trimmed)
  return Number.isFinite(numeric) ? String(numeric) : trimmed
}

function normalizeObject(value: Record<string, unknown>): string | null {
  if ('daaId' in value) return normalizeId(value.daaId)
  if ('id' in value) return normalizeId(value.id)
  if ('value' in value) return normalizeId(value.value)
  return null
}

function normalizeId(value: unknown): string | null {
  if (typeof value === 'number') return normalizeNumber(value)
  if (typeof value === 'string') return normalizeString(value)
  if (typeof value === 'object' && value !== null) return normalizeObject(value as Record<string, unknown>)
  return null
}

const DASH = '—'

function toIsoDate(date: Date): string {
  return Number.isNaN(date.getTime()) ? DASH : date.toISOString().slice(0, 10)
}

function epochToMs(epoch: number): number {
  return epoch > 1e12 ? epoch : epoch * 1000
}

function parseNumericDate(text: string): string {
  const numeric = Number(text)
  return Number.isFinite(numeric) ? toIsoDate(new Date(epochToMs(numeric))) : DASH
}

/**
 * Formats mixed date inputs (epoch seconds/ms or date strings) as yyyy-mm-dd.
 */
export function formatDateYYYYMMDD(value: unknown): string {
  if (value === null || value === undefined) return DASH

  if (typeof value === 'number') {
    return Number.isFinite(value) ? toIsoDate(new Date(epochToMs(value))) : DASH
  }

  if (typeof value !== 'string') return DASH

  const trimmed = value.trim()
  if (!trimmed) return DASH

  return /^\d+$/.test(trimmed) ? parseNumericDate(trimmed) : toIsoDate(new Date(trimmed))
}

function addNormalizedId(rawId: unknown, ids: Set<string>): void {
  const normalized = normalizeId(rawId)
  if (normalized) ids.add(normalized)
}

function expandCommaSeparatedIds(raw: string, ids: Set<string>): void {
  raw.split(',').forEach(part => addNormalizedId(part, ids))
}

function getAuthorizedDaaIdSet(researcher: DuosUser): Set<string> {
  const authorizedIds = new Set<string>()

  // Prefer the newer daaDetails array when available.
  const daaDetails = researcher.libraryCard?.daaDetails
  if (Array.isArray(daaDetails) && daaDetails.length > 0) {
    daaDetails.forEach(detail => addNormalizedId(detail.daaId, authorizedIds))
    return authorizedIds
  }

  // Fall back to the legacy daaIds array.
  const rawIds = researcher.libraryCard?.daaIds as unknown[] | undefined
  if (!Array.isArray(rawIds)) return authorizedIds

  rawIds.forEach((rawId: unknown) => {
    if (typeof rawId === 'string' && rawId.includes(',')) {
      expandCommaSeparatedIds(rawId, authorizedIds)
      return
    }
    addNormalizedId(rawId, authorizedIds)
  })

  return authorizedIds
}

/**
 * Returns the email address of the SO who authorized a researcher for a given
 * DAA, as recorded in the `daaDetails` array of their library card.
 * Returns `undefined` when not recorded or when the researcher is not
 * authorized (e.g. the authorization came from the legacy `daaIds` field).
 */
export function getAuthorizedBy(researcher: DuosUser, daaId: number): string | undefined {
  const normalizedDaaId = normalizeId(daaId)
  if (!normalizedDaaId) return undefined

  const daaDetails = researcher.libraryCard?.daaDetails
  if (!Array.isArray(daaDetails)) return undefined

  const match = daaDetails.find(
    detail => normalizeId(detail.daaId) === normalizedDaaId,
  )
  return match?.authorizedBy
}

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
 * researcher's library card.
 */
export function getAuthStatus(researcher: DuosUser, daaId: number): AuthStatus {
  const normalizedDaaId = normalizeId(daaId)
  if (!normalizedDaaId) return 'not_requested'

  const authorizedDaaIds = getAuthorizedDaaIdSet(researcher)
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
 * Enriches each researcher with their computed DAA rows and badge counts.
 */
export function buildResearcherRows(
  researchers: readonly DuosUser[],
  daas: readonly DAAObject[],
): ResearcherRowData[] {
  return researchers
    .map((researcher) => {
      const daaRows = buildDAARows(researcher, daas)
      const authorizedCount = daaRows.filter(r => r.status === 'authorized').length
      return { researcher, daaRows, authorizedCount }
    })
}

/**
 * Returns true if a DAA's updateDate is within the past 12 months.
 * Signals to the SO that they should review the updated agreement before
 * authorizing new researchers.
 */
export function isRecentlyUpdated(daa: DAAObject): boolean {
  const raw = daa.updateDate
  if (!raw) return false
  const updateDate = new Date(raw)
  if (Number.isNaN(updateDate.getTime())) return false
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  return updateDate >= oneYearAgo
}

/**
 * Builds the per-researcher auth rows for a single DAA.
 */
export function buildDAAResearcherRows(
  daa: DAAObject,
  researchers: readonly DuosUser[],
): DAAResearcherRowData[] {
  return researchers.map(researcher => ({
    researcher,
    status: getAuthStatus(researcher, daa.daaId),
    authorizedBy: getAuthorizedBy(researcher, daa.daaId),
  }))
}

/**
 * Builds the full list of DAAAccordionData — one entry per unique DAA —
 * with each DAA enriched by all researchers' authorization status.
 */
export function buildDAAViewRows(
  daas: readonly DAAObject[],
  researchers: readonly DuosUser[],
): DAAAccordionData[] {
  const uniqueDaas = Array.from(new Map(daas.map(daa => [daa.daaId, daa])).values())

  return uniqueDaas.map((daa) => {
    const researcherRows = buildDAAResearcherRows(daa, researchers)
    const authorizedCount = researcherRows.filter(r => r.status === 'authorized').length
    return {
      daa,
      dacName: getDacName(daa),
      researcherRows,
      authorizedCount,
      isRecentlyUpdated: isRecentlyUpdated(daa),
    }
  })
}
