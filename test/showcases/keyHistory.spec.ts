/**
 * The required historical key check (DT-4273, S1.2): this branch's showcase registry must keep the
 * key history of its target branch. CI sets `SHOWCASE_BASE_REF` to the PR's base branch and fetches
 * it in every Vitest shard. Missing base history fails CI and skips the check locally.
 */
import { describe, expect, it } from 'vitest'
import registry from 'src/showcases/registry.json'
import { ShowcaseRegistrySchema } from 'src/showcases/schema'
import { baselineFor, checkKeyHistory, readBaseRegistry } from './history/keyHistory'

const ref = process.env.SHOWCASE_BASE_REF || 'origin/develop'
const baseline = baselineFor(readBaseRegistry(ref), ref, Boolean(process.env.CI))

describe('showcase key history', () => {
  it.skipIf('skip' in baseline)(`keeps the key history of ${ref}`, () => {
    if ('error' in baseline) {
      throw new Error(baseline.error)
    }
    if ('registry' in baseline) {
      expect(checkKeyHistory(baseline.registry, ShowcaseRegistrySchema.parse(registry))).toEqual([])
    }
  })
})
