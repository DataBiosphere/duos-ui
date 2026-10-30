/**
 * The Data Showcase index (DT-4273, S1.2). `registry.json` holds the entry list and the
 * retired-key list. It is JSON so that the historical key check can read the target branch's
 * revision with `git show` without running its code.
 *
 * The CI guard parses `registry.json` with `ShowcaseRegistrySchema` and checks every entry, so this
 * module reads it without a runtime parse. Showcase keys are permanent: never rename or reuse a key,
 * and add a removed key to `retiredKeys`. Use `status: 'hidden'` for a reversible withdrawal.
 */
import registryJson from './registry.json'
import type { RegistryEntry, ShowcasePartialInput, ShowcaseRegistry } from 'src/types/showcase'

const registry = registryJson as ShowcaseRegistry

export const showcaseEntries: readonly RegistryEntry[] = registry.entries

export const retiredShowcaseKeys: readonly string[] = registry.retiredKeys

/** Each entry's overrides of `defaultShowcase`, by key; `resolveShowcase` gives the full config.
 * Real entries land after the CI guard. */
export const showcaseConfigs: Readonly<Record<string, ShowcasePartialInput>> = {}

/** The flagship is served at `/data`; every other showcase at `/showcase/<key>`. */
export const showcaseRoute = ({ key, flagship }: Pick<RegistryEntry, 'key' | 'flagship'>) =>
  flagship ? '/data' : `/showcase/${key}`
