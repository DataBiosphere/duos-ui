import { describe, expect, it } from 'vitest'
import { defaultSectionsFor, defaultShowcase, resolveShowcase } from 'src/showcases/defaults'
import { MVP_SECTION_KEYS, SECTION_KEYS } from 'src/types/showcase'
import { checkShowcase } from './guard/checkShowcase'

/** Treats the six MVP sections as implemented, as the S1.1 fixture tests do. */
const guard = (config: unknown) => checkShowcase(config, { implemented: MVP_SECTION_KEYS, readSize: () => 1 })

/** The guard as CI runs it, with only the section types that have a renderer today. */
const ciGuard = (config: unknown) => checkShowcase(config, { readSize: () => 1 })

describe('defaultShowcase', () => {
  it('passes the guard as CI runs it', () => {
    expect(ciGuard(defaultShowcase)).toEqual([])
  })

  it('lists every section key in fixed order', () => {
    expect(Object.keys(defaultShowcase.sections)).toEqual([...SECTION_KEYS])
  })

  it('uses the default theme with no colour overrides', () => {
    expect(defaultShowcase.branding).toEqual({ theme: 'default' })
  })
})

describe('defaultSectionsFor', () => {
  it('turns the newest-first shelves on once their renderers are implemented', () => {
    const sections = defaultSectionsFor(MVP_SECTION_KEYS)
    expect(sections['latest-data-releases']).toEqual({ enabled: true, ranking: 'newest', limit: 12 })
    expect(sections['open-access-datasets']).toEqual({ enabled: true, ranking: 'newest', limit: 12 })
    expect(guard({ ...defaultShowcase, sections })).toEqual([])
  })

  it('leaves every section off while nothing is implemented', () => {
    expect(Object.values(defaultSectionsFor([]))).toEqual(SECTION_KEYS.map(() => ({ enabled: false })))
  })
})

describe('resolveShowcase', () => {
  it('resolves a config that only overrides branding to one that passes the guard as CI runs it', () => {
    const resolved = resolveShowcase({ branding: { theme: 'blue', primary: '#00609f' } })
    expect(ciGuard(resolved)).toEqual([])
    expect(resolved.branding).toEqual({ theme: 'blue', primary: '#00609f' })
    expect(resolved.sections).toEqual(defaultShowcase.sections)
  })

  it('merges branding field by field', () => {
    expect(resolveShowcase({ branding: { accent: '#a65c00' } }).branding).toEqual({ theme: 'default', accent: '#a65c00' })
  })

  it('replaces a listed section whole, so it never inherits fields from another variant', () => {
    const resolved = resolveShowcase({ sections: { 'open-access-datasets': { enabled: true, items: ['DUOS-000001'] } } })
    expect(resolved.sections['open-access-datasets']).toEqual({ enabled: true, items: ['DUOS-000001'] })
    expect(guard(resolved)).toEqual([])
  })

  it('turns a default section off', () => {
    const resolved = resolveShowcase({ sections: { 'latest-data-releases': { enabled: false } } })
    expect(resolved.sections['latest-data-releases']).toEqual({ enabled: false })
    expect(guard(resolved)).toEqual([])
  })

  it('keeps every key in fixed order whatever order the partner lists them in', () => {
    const resolved = resolveShowcase({ sections: { 'tech-policy-interns': { enabled: false }, 'masthead': { enabled: false } } })
    expect(Object.keys(resolved.sections)).toEqual([...SECTION_KEYS])
  })

  it('keeps a misspelt section key, so the guard reports it', () => {
    const partial = { sections: { heroo: { enabled: false } } } as unknown as Parameters<typeof resolveShowcase>[0]
    expect(guard(resolveShowcase(partial))).toContainEqual(expect.stringContaining('heroo'))
  })

  it('leaves defaultShowcase unchanged', () => {
    const before = structuredClone(defaultShowcase)
    resolveShowcase({ branding: { theme: 'teal' }, sections: { hero: { enabled: false, intro: 'x' } } })
    expect(defaultShowcase).toEqual(before)
  })
})
