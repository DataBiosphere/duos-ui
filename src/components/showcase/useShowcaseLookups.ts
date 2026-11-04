import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { lookupShowcaseDatasets, ShowcaseLookupError } from 'src/libs/ajax/ShowcaseCatalog'
import {
  DATASET_SECTION_KEYS,
  type DatasetSectionKey,
  type DatasetSummary,
  type DuosIdentifierInput,
  EDITORIAL_SECTION_KEY,
  type IdentifiersResponse,
  LOOKUP_LIMITS,
  type LookupRequestInput,
  type SectionKey,
  type ShowcaseConfigInput,
  type StatsResponse,
} from 'src/types/showcase'

/**
 * The catalog lookups a showcase page makes (DT-4353): one `identifiers` batch for the editorial
 * shelf, one `ranking` request per computed shelf and one `stats` request for the hero counts. Only
 * enabled sections with a renderer ask for anything. A failed lookup stays failed until its
 * `retry()`; nothing substitutes mock or cached data.
 */

export type LookupState<T>
  = | { status: 'loading', retry: () => void }
    | { status: 'ready', data: T, retry: () => void }
    | { status: 'error', error: ShowcaseLookupError, retry: () => void }

export interface ShowcaseLookups {
  /** Dataset shelves that make a lookup. Editorial shelves share the one batch's status. */
  datasets: Partial<Record<DatasetSectionKey, LookupState<DatasetSummary[]>>>
  /** The hero's study and dataset counts, when the hero shows either. */
  hero?: LookupState<StatsResponse>
}

interface PlannedRequest {
  /** `editorial`, a computed section key, or `stats`. */
  id: string
  request: LookupRequestInput
}

type RawState
  = | { status: 'loading' }
    | { status: 'ready', data: unknown }
    | { status: 'error', error: ShowcaseLookupError }

/** The fields the planner reads; the schema guarantees their types for the section that has them. */
interface LooseSection {
  enabled: boolean
  items?: DuosIdentifierInput[]
  ranking?: string
  scope?: { dac?: string[] }
  limit?: number
  pin?: DuosIdentifierInput[]
  exclude?: DuosIdentifierInput[]
  stats?: string[]
}

const EDITORIAL_ID = 'editorial'
const STATS_ID = 'stats'

const definedFields = <T extends object>(value: T) =>
  Object.fromEntries(Object.entries(value).filter(([, field]) => field !== undefined)) as T

/** The requests a page with `config` makes, in a stable order. */
export function planShowcaseLookups(
  config: Pick<ShowcaseConfigInput, 'sections'>,
  implemented: readonly SectionKey[],
): PlannedRequest[] {
  const live = (key: SectionKey): LooseSection | undefined => {
    const section = config.sections[key] as LooseSection
    return section.enabled && implemented.includes(key) ? section : undefined
  }
  const plan: PlannedRequest[] = []

  const editorial = live(EDITORIAL_SECTION_KEY)
  if (editorial?.items) {
    const identifiers = [...new Set(editorial.items)].slice(0, LOOKUP_LIMITS.identifiers)
    if (identifiers.length > 0) {
      plan.push({ id: EDITORIAL_ID, request: { mode: 'identifiers', section: EDITORIAL_SECTION_KEY, identifiers } })
    }
  }

  for (const key of DATASET_SECTION_KEYS) {
    const section = live(key)
    if (!section?.ranking) continue
    const { ranking, scope, limit, pin, exclude } = section
    plan.push({
      id: key,
      request: definedFields({ mode: 'ranking', section: key, ranking, scope, limit, pin, exclude }) as LookupRequestInput,
    })
  }

  const hero = live('hero')
  if (hero?.stats?.some(stat => stat === 'studies' || stat === 'datasets')) {
    plan.push({ id: STATS_ID, request: definedFields({ mode: 'stats' as const, scope: hero.scope }) })
  }
  return plan
}

/** The editorial shelf's datasets in configured order, without repeats or unavailable results. */
const rebuildEditorial = (items: readonly string[], response: IdentifiersResponse): DatasetSummary[] => {
  const found = new Map<string, DatasetSummary>()
  for (const result of response.datasets) {
    if (!('status' in result)) found.set(result.identifier, result)
  }
  return [...new Set(items)].flatMap(identifier => found.get(identifier) ?? [])
}

const asLookupError = (error: unknown): ShowcaseLookupError =>
  error instanceof ShowcaseLookupError ? error : new ShowcaseLookupError('network', 'Showcase lookup failed', { cause: error })

export function useShowcaseLookups(
  config: Pick<ShowcaseConfigInput, 'sections'>,
  implemented: readonly SectionKey[],
): ShowcaseLookups {
  // A page may pass a fresh config object on every render; only a change in requests re-fetches.
  const planKey = JSON.stringify(planShowcaseLookups(config, implemented))
  const plan = useMemo(() => JSON.parse(planKey) as PlannedRequest[], [planKey])

  // Each state records the plan it answers, so a previous config's result never shows for this one.
  const [states, setStates] = useState<Record<string, RawState & { planKey: string }>>({})
  const controllers = useRef(new Map<string, AbortController>())
  const livePlanKey = useRef<string | undefined>(undefined)

  const run = useCallback(({ id, request }: PlannedRequest, key: string) => {
    controllers.current.get(id)?.abort()
    const controller = new AbortController()
    controllers.current.set(id, controller)
    const settle = (state: RawState) => {
      // An abort is the page moving on, not a failed lookup.
      if (!controller.signal.aborted) setStates(prev => ({ ...prev, [id]: { ...state, planKey: key } }))
    }
    settle({ status: 'loading' })
    lookupShowcaseDatasets(request as never, controller.signal)
      .then(data => settle({ status: 'ready', data }), (error: unknown) => settle({ status: 'error', error: asLookupError(error) }))
  }, [])

  useEffect(() => {
    const active = controllers.current
    livePlanKey.current = planKey
    plan.forEach(planned => run(planned, planKey))
    return () => {
      livePlanKey.current = undefined
      active.forEach(controller => controller.abort())
      active.clear()
      // Forget this plan's results, so returning to it later starts from loading.
      setStates({})
    }
  }, [plan, planKey, run])

  // One object per change in state or plan, so a component that memoizes the lookups, or uses them
  // or their retry functions as effect dependencies, does not re-run on every render.
  return useMemo(() => {
    const stateOf = <T>(id: string, select: (data: unknown) => T): LookupState<T> => {
      const retry = () => {
        // A retry from an earlier render or after unmount must not replace the current request.
        if (livePlanKey.current !== planKey) return
        const planned = plan.find(entry => entry.id === id)
        if (planned) run(planned, planKey)
      }
      const raw: RawState = states[id]?.planKey === planKey ? states[id] : { status: 'loading' }
      if (raw.status === 'ready') return { status: 'ready', data: select(raw.data), retry }
      return raw.status === 'error' ? { status: 'error', error: raw.error, retry } : { status: 'loading', retry }
    }

    const lookups: ShowcaseLookups = { datasets: {} }
    for (const { id, request } of plan) {
      if (id === EDITORIAL_ID) {
        // The planned batch holds the configured items without repeats, in order.
        const { identifiers } = request as { identifiers: readonly string[] }
        lookups.datasets[EDITORIAL_SECTION_KEY] = stateOf(id, data => rebuildEditorial(identifiers, data as IdentifiersResponse))
      }
      else if (id === STATS_ID) {
        lookups.hero = stateOf(id, data => data as StatsResponse)
      }
      else {
        lookups.datasets[id as DatasetSectionKey] = stateOf(id, data => (data as { datasets: DatasetSummary[] }).datasets)
      }
    }
    return lookups
  }, [states, plan, planKey, run])
}
