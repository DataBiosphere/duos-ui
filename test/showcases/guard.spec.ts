/**
 * The showcase CI guard (DT-4273, S1.2): the index and every entry must pass every rule. The rules
 * live in `test/showcases/guard/`, each with broken-fixture tests beside it. Each entry is checked
 * as resolved over `defaultShowcase` (DT-4276, S1.3), which is what the page renders.
 */
import { describe, expect, it } from 'vitest'
import registry from 'src/showcases/registry.json'
import { showcaseConfigs, showcaseEntries } from 'src/showcases'
import { resolveShowcase } from 'src/showcases/defaults'
import { checkRegistry } from './guard/checkRegistry'
import { checkShowcase } from './guard/checkShowcase'

describe('showcase guard', () => {
  it('passes the index', () => {
    expect(checkRegistry(registry, showcaseConfigs)).toEqual([])
  })

  describe.each(showcaseEntries.map(entry => [entry.key] as const))('%s', (key) => {
    it('passes every config rule', () => {
      // An entry with no config still gets the guard's own messages, not a crash in the merge.
      const config = showcaseConfigs[key]
      expect(checkShowcase(config && resolveShowcase(config))).toEqual([])
    })
  })
})
