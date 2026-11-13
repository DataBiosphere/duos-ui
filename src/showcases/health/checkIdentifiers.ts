/**
 * The identifier and shelf half of the showcase health check (DT-4359, S4.3). The editorial shelf's
 * `items` are resolved through the public `identifiers` lookup, the only section that mode accepts.
 * Each enabled computed shelf runs its `ranking` request once, with `limit` raised to the maximum.
 *
 * A ranking puts eligible pins first and silently drops a pin that is not eligible or is outside
 * the shelf's `scope`. Pins are capped at the ranking maximum, so with that limit every pin the
 * page could show is in the answer, and a pin missing from it is reported as unavailable. An empty
 * answer is an empty shelf at any limit. Exclusions are not checked: an excluded dataset that
 * becomes unavailable changes nothing on the page.
 *
 * The check uses the same anonymous contract as the page. An `unavailable` result is reported as
 * just that, with no reason: the lookup gives the same answer for a private record and a
 * nonexistent one, and owners investigate through the authorized catalog tools.
 */
import {
  DATASET_SECTION_KEYS,
  type DatasetSectionKey,
  type DuosIdentifierInput,
  LOOKUP_LIMITS,
  type LookupRequestInput,
  type RegistryEntry,
  type ShowcaseConfig,
  type ShowcaseConfigInput,
} from 'src/types/showcase'
import type { HealthLookup } from './lookup'

/** One registered showcase with its resolved config. */
export interface CheckedShowcase {
  entry: Pick<RegistryEntry, 'key' | 'status'>
  config: Pick<ShowcaseConfigInput | ShowcaseConfig, 'sections'>
}

interface Where {
  showcase: string
  /** `hidden` entries are checked too, so owners can fix them before launch. */
  status: RegistryEntry['status']
  section: DatasetSectionKey
}

export interface UnavailableIdentifier extends Where {
  /** `items` for an editorial shelf, `pin` for a computed one. */
  field: 'items' | 'pin'
  identifier: string
}

export interface EmptyShelf extends Where {
  ranking: string
}

export interface LookupFailure extends Where {
  mode: 'identifiers' | 'ranking'
  reason: string
}

export interface IdentifierReport {
  unavailable: UnavailableIdentifier[]
  emptyShelves: EmptyShelf[]
  lookupFailures: LookupFailure[]
  /** Consent answered 405: its public lookup is turned off, so nothing could be checked. */
  lookupDisabled: boolean
  /** A lookup failed after all its retries, so the rest were skipped rather than each waiting out
   * its own retries. Findings made before it stand. */
  lookupUnreachable: boolean
}

/** The fields the check reads; the schema guarantees their types for the sections that have them. */
interface LooseShelf {
  enabled: boolean
  items?: string[]
  ranking?: string
  scope?: { dac?: string[] }
  pin?: string[]
  exclude?: string[]
}

const definedFields = <T extends object>(value: T) =>
  Object.fromEntries(Object.entries(value).filter(([, field]) => field !== undefined)) as T

const chunks = <T>(values: readonly T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(values.length / size) }, (_, index) => values.slice(index * size, (index + 1) * size))

class LookupDisabled extends Error {}
class LookupUnreachable extends Error {}

export async function checkIdentifiers(showcases: readonly CheckedShowcase[], lookup: HealthLookup): Promise<IdentifierReport> {
  const report: IdentifierReport = { unavailable: [], emptyShelves: [], lookupFailures: [], lookupDisabled: false, lookupUnreachable: false }

  // Once Consent says the lookup is off, or stops answering, every other request would do the same.
  // A request's type narrows by section as well as mode, so callers build it loosely and name the mode.
  const call = async <M extends 'identifiers' | 'ranking'>(where: Where, mode: M, request: LookupRequestInput) => {
    const result = await lookup<M>(request as Extract<LookupRequestInput, { mode: M }>)
    if (result.kind === 'disabled') throw new LookupDisabled()
    if (result.kind === 'failed') {
      report.lookupFailures.push({ ...where, mode, reason: result.reason })
      if (result.unreachable) throw new LookupUnreachable()
      return undefined
    }
    return result.data
  }

  const checkIdentifierList = async (where: Where, identifiers: readonly string[]) => {
    for (const batch of chunks([...new Set(identifiers)], LOOKUP_LIMITS.identifiers)) {
      const data = await call(where, 'identifiers', { mode: 'identifiers', section: where.section, identifiers: batch as DuosIdentifierInput[] } as LookupRequestInput)
      if (!data) continue
      // The page shows only the summaries that come back, so an identifier missing from the answer
      // is as hidden as one marked unavailable.
      const found = new Set<string>(data.datasets.flatMap(result => 'status' in result ? [] : [result.identifier]))
      for (const identifier of batch) {
        if (!found.has(identifier)) report.unavailable.push({ ...where, field: 'items', identifier })
      }
    }
  }

  try {
    for (const { entry, config } of showcases) {
      for (const section of DATASET_SECTION_KEYS) {
        const shelf = config.sections[section] as LooseShelf
        if (!shelf.enabled) continue
        const where: Where = { showcase: entry.key, status: entry.status, section }

        if (shelf.items) await checkIdentifierList(where, shelf.items)

        if (shelf.ranking) {
          const { ranking, scope, pin, exclude } = shelf
          const request = definedFields({ mode: 'ranking', section, ranking, scope, limit: LOOKUP_LIMITS.rankingLimit, pin, exclude }) as LookupRequestInput
          const data = await call(where, 'ranking', request)
          if (!data) continue
          if (data.datasets.length === 0) report.emptyShelves.push({ ...where, ranking })
          const shown = new Set<string>(data.datasets.map(dataset => dataset.identifier))
          // A pin the shelf also excludes is hidden by the config, not by the catalog.
          const excluded = new Set<string>(exclude)
          for (const identifier of new Set(pin)) {
            if (!shown.has(identifier) && !excluded.has(identifier)) report.unavailable.push({ ...where, field: 'pin', identifier })
          }
        }
      }
    }
  }
  catch (error) {
    if (error instanceof LookupUnreachable) return { ...report, lookupUnreachable: true }
    if (!(error instanceof LookupDisabled)) throw error
    return { unavailable: [], emptyShelves: [], lookupFailures: [], lookupDisabled: true, lookupUnreachable: false }
  }
  return report
}
