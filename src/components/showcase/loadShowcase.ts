/**
 * Decides which showcase a public route renders (DT-4353, S3.1). `/data` is the flagship and
 * `/showcase/:key` is any other live entry. Every refusal is the same `not-found`, so a hidden key
 * can't be told apart from an unknown one (delivery plan section 3: unknown or hidden keys render
 * the standard not-found page).
 *
 * `findShowcase` is pure, for tests; `loadShowcase` reads the rollout flag and the real index.
 * The resolved config is parsed with `ShowcaseConfigSchema`. The CI guard rejects a config that
 * fails it, so a failure here is a bug: it is logged and the route is not found.
 */
import { isShowcaseEnabled, isShowcaseHandoffsEnabled } from 'src/libs/config'
import { resolveShowcase } from 'src/showcases/defaults'
import { ShowcaseConfigSchema } from 'src/showcases/schema'
import { retiredShowcaseKeys, showcaseConfigs, showcaseEntries } from 'src/showcases'
import { SHOWCASE_KEY_PATTERN, type RegistryEntry, type ShowcaseConfig, type ShowcasePartialInput } from 'src/types/showcase'

/** The flagship route (`/data`) or a keyed route (`/showcase/:key`, the key as the URL gave it). */
export type ShowcaseRouteMatch = { route: 'flagship' } | { route: 'key', key: string | undefined }

export type ShowcaseLoadResult = { status: 'found', entry: RegistryEntry, config: ShowcaseConfig } | { status: 'not-found' }

/** What a showcase route renders: `findShowcase`'s answer plus the environment binding
 * (`isShowcaseHandoffsEnabled`), so the page's first render already knows if handoffs open. */
export type ShowcasePageResult = (Extract<ShowcaseLoadResult, { status: 'found' }> & { handoffsEnabled: boolean }) | { status: 'not-found' }

export type ShowcaseSources = {
  entries: readonly RegistryEntry[]
  configs: Readonly<Record<string, ShowcasePartialInput>>
  retiredKeys: readonly string[]
  /** The rollout flag; anything but `true` is off. */
  enabled: unknown
}

const NOT_FOUND: ShowcaseLoadResult = Object.freeze({ status: 'not-found' })

/** The one entry that matches, or undefined when none or several do: an ambiguous index fails closed. */
const single = (entries: readonly RegistryEntry[]): RegistryEntry | undefined =>
  entries.length === 1 ? entries[0] : undefined

export const findShowcase = (match: ShowcaseRouteMatch, sources: ShowcaseSources): ShowcaseLoadResult => {
  const { entries, configs, retiredKeys, enabled } = sources
  if (enabled !== true) return NOT_FOUND

  let entry: RegistryEntry | undefined
  if (match.route === 'flagship') {
    entry = single(entries.filter(candidate => candidate.flagship))
  }
  else {
    const { key } = match
    if (typeof key !== 'string' || !SHOWCASE_KEY_PATTERN.test(key)) return NOT_FOUND
    entry = single(entries.filter(candidate => candidate.key === key))
    // The flagship's only route is `/data` (`showcaseRoute`); `/showcase/<flagship key>` is not
    // generated, so it is not found rather than a second address for the same page.
    if (entry?.flagship) return NOT_FOUND
  }

  if (!entry || entry.status !== 'live' || retiredKeys.includes(entry.key)) return NOT_FOUND
  // `hasOwn`, so a key such as `constructor` can't pick up an inherited property.
  if (!Object.hasOwn(configs, entry.key)) return NOT_FOUND
  const parsed = ShowcaseConfigSchema.safeParse(resolveShowcase(configs[entry.key]))
  if (!parsed.success) {
    console.error(`Showcase "${entry.key}" has an invalid config`, parsed.error.issues)
    return NOT_FOUND
  }
  return { status: 'found', entry, config: parsed.data }
}

/** `findShowcase` over the real index and the config.json flags. A config that fails to load
 * counts as both flags being off. */
export const loadShowcase = async (match: ShowcaseRouteMatch): Promise<ShowcasePageResult> => {
  const [enabled, handoffsEnabled] = await Promise.all([
    isShowcaseEnabled().catch(() => false),
    isShowcaseHandoffsEnabled().catch(() => false),
  ])
  const result = findShowcase(match, { entries: showcaseEntries, configs: showcaseConfigs, retiredKeys: retiredShowcaseKeys, enabled })
  return result.status === 'found' ? { ...result, handoffsEnabled } : result
}
