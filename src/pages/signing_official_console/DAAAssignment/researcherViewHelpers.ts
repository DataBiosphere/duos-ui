import { DAAObject, DuosUser } from 'src/types/model'
import { AuthStatus, DAAAccordionData, DAAResearcherRowData, DAARowData, ResearcherRowData } from './types'

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

function getAuthorizedDaaIdSet(researcher: DuosUser): Set<number> {
  const authorizedIds = new Set<number>()

  // Prefer the newer daaDetails array when available.
  const daaDetails = researcher.libraryCard?.daaDetails
  if (Array.isArray(daaDetails)) {
    daaDetails.forEach(detail => authorizedIds.add(detail.daaId))
    return authorizedIds
  }

  // Fall back to the legacy daaIds array, assumed to be numbers if valid
  const daaIds = researcher.libraryCard?.daaIds
  if (Array.isArray(daaIds)) {
    daaIds.forEach((id) => {
      // Cast safely since legacy arrays could be mixed types (we filter bad data out)
      const num = Number(id)
      if (Number.isFinite(num)) authorizedIds.add(num)
    })
  }

  return authorizedIds
}

/**
 * Maps each DAA the researcher is authorized for to the SO who granted it.
 * On duplicate `daaId` entries the first wins.
 */
function buildAuthorizedByMap(researcher: DuosUser): Map<number, string | undefined> {
  const authorizedByDaaId = new Map<number, string | undefined>()
  const daaDetails = researcher.libraryCard?.daaDetails
  if (!Array.isArray(daaDetails)) return authorizedByDaaId

  daaDetails.forEach((detail) => {
    if (!authorizedByDaaId.has(detail.daaId)) {
      authorizedByDaaId.set(detail.daaId, detail.authorizedBy)
    }
  })
  return authorizedByDaaId
}

/**
 * Returns the email address of the SO who authorized a researcher for a given
 * DAA, as recorded in the `daaDetails` array of their library card.
 */
export function getAuthorizedBy(researcher: DuosUser, daaId: number): string | undefined {
  return buildAuthorizedByMap(researcher).get(daaId)
}

/** The single definition of the researcher/DAA authorization rule. */
function statusFromAuthorizedIds(authorizedDaaIds: ReadonlySet<number>, daaId: number): AuthStatus {
  if (!daaId) return 'not_requested'
  return authorizedDaaIds.has(daaId) ? 'authorized' : 'not_requested'
}

/**
 * One researcher's library card flattened for repeated lookup.
 *
 * The DAA View asks the same two questions (is this researcher authorized for
 * this DAA, and by whom) once per researcher/DAA pair, so building this index
 * once per researcher keeps the grid linear instead of re-walking the library
 * card for every cell — the Admin Console's system-wide list makes that
 * difference material.
 */
interface ResearcherAuthIndex {
  authorizedDaaIds: Set<number>
  authorizedByDaaId: Map<number, string | undefined>
}

function buildAuthIndex(researcher: DuosUser): ResearcherAuthIndex {
  return {
    authorizedDaaIds: getAuthorizedDaaIdSet(researcher),
    authorizedByDaaId: buildAuthorizedByMap(researcher),
  }
}

/** API payloads can include duplicate DAA entries; daaId is the canonical key. */
function dedupeDaas(daas: readonly DAAObject[]): DAAObject[] {
  return Array.from(new Map(daas.map(daa => [daa.daaId, daa])).values())
}

/**
 * Human-readable label for a DAA. Uses the uploaded file's name, falling back to
 * a stable `DAA-<id>` token when no file name is available. Single source of truth
 * for the DAA label shown across the DAA-assignment views, dialogs, and toasts.
 */
export function daaLabel(daa: DAAObject): string {
  return daa.file?.fileName ?? `DAA-${daa.daaId}`
}

/**
 * Display name of a researcher's institution.
 *
 * Falls back to a dash rather than the users table's "N/A" so it matches the
 * dash this folder's tables already use for missing values. Searching matches on
 * the raw name, so the placeholder is never itself a search hit.
 */
export function institutionLabel(researcher: DuosUser): string {
  return researcher.institution?.name || DASH
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
  return statusFromAuthorizedIds(getAuthorizedDaaIdSet(researcher), daaId)
}

/** buildDAARows against an already-deduplicated DAA list. */
function buildDAARowsFor(researcher: DuosUser, uniqueDaas: readonly DAAObject[]): DAARowData[] {
  const authorizedDaaIds = getAuthorizedDaaIdSet(researcher)

  return uniqueDaas.map(daa => ({
    daa,
    dacName: getDacName(daa),
    status: statusFromAuthorizedIds(authorizedDaaIds, daa.daaId),
  }))
}

/**
 * Builds the full list of DAARowData for a single researcher across all DAAs.
 */
export function buildDAARows(researcher: DuosUser, daas: readonly DAAObject[]): DAARowData[] {
  return buildDAARowsFor(researcher, dedupeDaas(daas))
}

/**
 * Enriches each researcher with their computed DAA rows and badge counts.
 */
export function buildResearcherRows(
  researchers: readonly DuosUser[],
  daas: readonly DAAObject[],
): ResearcherRowData[] {
  // Deduplicated once for the whole grid rather than once per researcher.
  const uniqueDaas = dedupeDaas(daas)

  return researchers
    .map((researcher) => {
      const daaRows = buildDAARowsFor(researcher, uniqueDaas)
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
 *
 * `indexByUserId` lets a caller iterating many DAAs (see buildDAAViewRows) build
 * each researcher's index once instead of once per DAA; without it, each row
 * builds its own.
 */
export function buildDAAResearcherRows(
  daa: DAAObject,
  researchers: readonly DuosUser[],
  indexByUserId?: ReadonlyMap<number, ResearcherAuthIndex>,
): DAAResearcherRowData[] {
  return researchers.map((researcher) => {
    const authIndex = indexByUserId?.get(researcher.userId) ?? buildAuthIndex(researcher)
    return {
      researcher,
      status: statusFromAuthorizedIds(authIndex.authorizedDaaIds, daa.daaId),
      authorizedBy: authIndex.authorizedByDaaId.get(daa.daaId),
    }
  })
}

/**
 * Builds the full list of DAAAccordionData — one entry per unique DAA —
 * with each DAA enriched by all researchers' authorization status.
 */
export function buildDAAViewRows(
  daas: readonly DAAObject[],
  researchers: readonly DuosUser[],
): DAAAccordionData[] {
  const uniqueDaas = dedupeDaas(daas)
  // Built once per researcher rather than once per researcher/DAA pair.
  const indexByUserId = new Map(
    researchers.map(researcher => [researcher.userId, buildAuthIndex(researcher)]),
  )

  return uniqueDaas.map((daa) => {
    const researcherRows = buildDAAResearcherRows(daa, researchers, indexByUserId)
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
