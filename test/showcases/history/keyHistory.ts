/**
 * The historical showcase key check (DT-4273, S1.2; delivery plan section 3).
 *
 * Showcase keys are permanent. Compared with the target branch's registry, every key that the index
 * drops must become a tombstone in `retiredKeys`, every tombstone must stay, and no entry may use a
 * retired key. Branch protection requires PR branches to be up to date with the target (`strict`), so
 * the comparison is always with the current target registry, and concurrent PRs can't both pass
 * against an old one.
 *
 * The base registry is read with `git show`, so the check never runs code from another revision.
 */
import { execFileSync } from 'node:child_process'
import * as z from 'zod'

export const REGISTRY_PATH = 'src/showcases/registry.json'

/** Only the keys matter to key history. Other entry fields may differ between revisions, so a field
 * that the current schema adds or removes can't make an older base registry unreadable. */
const KeyHistorySchema = z.object({
  entries: z.array(z.looseObject({ key: z.string() })),
  retiredKeys: z.array(z.string()),
})

export type KeyHistory = z.infer<typeof KeyHistorySchema>

/** A registry with no keys, as before the first showcase. */
export const EMPTY_REGISTRY: KeyHistory = { entries: [], retiredKeys: [] }

/** Returns why the proposed registry breaks key history; an empty list means it keeps it. */
export const checkKeyHistory = (base: KeyHistory, proposed: KeyHistory): string[] => {
  const proposedKeys = new Set(proposed.entries.map(entry => entry.key))
  const proposedRetired = new Set(proposed.retiredKeys)
  return [
    ...base.entries
      .filter(({ key }) => !proposedKeys.has(key) && !proposedRetired.has(key))
      .map(({ key }) => `"${key}" was removed without a tombstone; add it to retiredKeys`),
    ...base.retiredKeys
      .filter(key => !proposedRetired.has(key))
      .map(key => `tombstone "${key}" was deleted; retired keys are permanent`),
    ...proposed.entries
      .filter(({ key }) => base.retiredKeys.includes(key))
      .map(({ key }) => `retired key "${key}" can't be reused; use status "hidden" for a reversible withdrawal`),
  ]
}

/** Runs git with `args` and returns its output, or throws when git fails. */
export type Git = (args: string[]) => string

/** A fixed path, so a writable directory in `PATH` can't supply a different `git`. macOS and the
 * Ubuntu CI runners both install git here. Without it, the base reads as unavailable: CI fails and
 * a local run skips the check. */
const GIT = '/usr/bin/git'

const runGit: Git = args => execFileSync(GIT, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })

const attempt = <T>(action: () => T): T | undefined => {
  try {
    return action()
  }
  catch {
    return undefined
  }
}

export type BaseRegistry
  = | { status: 'ok', registry: KeyHistory }
    | { status: 'absent' }
    | { status: 'unavailable' }
    | { status: 'invalid' }

/** Reads the registry at `ref`. `absent`: the revision has no registry file. `unavailable`: git does
 * not have the revision, as in a shallow checkout that didn't fetch it. */
export const readBaseRegistry = (ref: string, git: Git = runGit): BaseRegistry => {
  if (attempt(() => git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`])) === undefined) {
    return { status: 'unavailable' }
  }
  const file = attempt(() => git(['show', `${ref}:${REGISTRY_PATH}`]))
  if (file === undefined) {
    return { status: 'absent' }
  }
  const registry = KeyHistorySchema.safeParse(attempt(() => JSON.parse(file)))
  return registry.success ? { status: 'ok', registry: registry.data } : { status: 'invalid' }
}

export type Baseline = { registry: KeyHistory } | { skip: string } | { error: string }

/**
 * Missing base history fails CI. On a developer's machine the check is skipped instead.
 *
 * The registry has been on develop since #4035, so a base revision without it means the file moved.
 * An empty baseline would then drop every tombstone, so that is an error too. To move the registry,
 * update `REGISTRY_PATH` in a separate PR after the move reaches the target branch.
 */
export const baselineFor = (base: BaseRegistry, ref: string, inCi: boolean): Baseline => {
  switch (base.status) {
    case 'ok':
      return { registry: base.registry }
    case 'absent':
      return { error: `there is no registry at ${ref}:${REGISTRY_PATH}; if the file moved, update REGISTRY_PATH after the move merges` }
    case 'invalid':
      return { error: `the registry at ${ref} is invalid` }
    case 'unavailable':
      return inCi
        ? { error: `base revision ${ref} is not available; CI must fetch the PR's base branch` }
        : { skip: `base revision ${ref} is not available; run "git fetch origin" to check key history` }
  }
}
