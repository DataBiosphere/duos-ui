/**
 * Which showcases a health check run covers (DT-4359, S4.3). A scheduled run checks every
 * registered showcase. A PR run checks only the showcases the PR changes, so a dataset that went
 * private in another showcase doesn't fail an unrelated PR.
 *
 * A PR changes a showcase through its config `src/showcases/<key>.ts`, its images under
 * `src/images/showcase/<key>/`, or its entry in `registry.json` (compared with the PR's base
 * branch, so flipping another showcase to `live` checks that one too). Retiring a showcase deletes
 * the files of a key now in `retiredKeys` and needs nothing checked. Editing `index.ts` registers a
 * config, so it counts as part of the PR's showcase change. A change to any other file under
 * `src/showcases/` (defaults, schema, this check), to the showcase types, or to the check's script
 * or workflow can affect every showcase, so it checks them all; so does a registry change when the
 * base registry is unknown, and a PR whose only showcase change is `index.ts`.
 */

// Built from one constant: test/showcases/e2eShowcases.spec.ts reads a quoted path to the index as an import.
const DIR = 'src/showcases'
const INDEX_FILE = `${DIR}/index.ts`
const REGISTRY_FILE = `${DIR}/registry.json`
const CONFIG_FILE = /^src\/showcases\/([a-z0-9-]+)\.ts$/
const IMAGE_FILE = /^src\/images\/showcase\/([a-z0-9-]+)\//
const SHARED_FILES = new Set(['src/types/showcase.ts', 'scripts/showcase-health.ts', '.github/workflows/showcase-health.yml'])

interface RegistryLike { entries: ReadonlyArray<{ key: string }>, retiredKeys: readonly string[] }

/** The keys whose registry entry was added, changed or removed between `base` and `current`. */
export function changedRegistryKeys(base: RegistryLike, current: RegistryLike): string[] {
  const byKey = (registry: RegistryLike) => new Map(registry.entries.map(entry => [entry.key, JSON.stringify(entry)]))
  const before = byKey(base)
  const after = byKey(current)
  return [...new Set([...before.keys(), ...after.keys()])].filter(key => before.get(key) !== after.get(key))
}

export interface ChangedShowcaseFiles {
  /** The PR's changed paths, with a renamed file's old path too. */
  files: readonly string[]
  /** `changedRegistryKeys` against the base branch; `undefined` when the base registry is unknown. */
  registryKeys?: readonly string[]
}

/** The keys to check: all of `keys`, or those the PR changes. `undefined` means a scheduled run. */
export function selectShowcases(keys: readonly string[], changed: ChangedShowcaseFiles | undefined, retiredKeys: readonly string[] = []): string[] {
  if (changed === undefined) return [...keys]
  const touched = new Set<string>()
  let shared = false
  let indexOnly = false
  let retiring = false
  const touch = (key: string) => {
    if (keys.includes(key)) touched.add(key)
    else if (retiredKeys.includes(key)) retiring = true
    else shared = true
  }
  for (const file of changed.files) {
    const key = (CONFIG_FILE.exec(file) ?? IMAGE_FILE.exec(file))?.[1]
    if (file === INDEX_FILE) indexOnly = true
    else if (file === REGISTRY_FILE) {
      if (changed.registryKeys === undefined) shared = true
      else changed.registryKeys.forEach(touch)
    }
    else if (key !== undefined && (keys.includes(key) || retiredKeys.includes(key))) touch(key)
    else if (file.startsWith(`${DIR}/`) || SHARED_FILES.has(file)) shared = true
  }
  if (shared || (indexOnly && touched.size === 0 && !retiring)) return [...keys]
  return keys.filter(key => touched.has(key))
}
