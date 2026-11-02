import { describe, expect, it } from 'vitest'
import { defaultShowcase, resolveShowcase } from 'src/showcases/defaults'
import { MVP_SECTION_KEYS, SECTION_KEYS, type ShowcaseConfigInput } from 'src/types/showcase'
import { checkShowcase } from './guard/checkShowcase'

/** Treats the six MVP sections as implemented, as the S1.1 fixture tests do. */
const guard = (config: unknown) => checkShowcase(config, { implemented: MVP_SECTION_KEYS, readSize: () => 1 })

/** The guard as CI runs it, with only the section types that have a renderer today. */
const ciGuard = (config: unknown) => checkShowcase(config, { readSize: () => 1 })

/** Defaults with the two newest-first shelves on. With every default section off, replacing a
 * section whole and merging it field by field give the same result; these tell them apart. */
const shelvesOn: ShowcaseConfigInput = {
  ...defaultShowcase,
  sections: {
    ...defaultShowcase.sections,
    'latest-data-releases': { enabled: true, ranking: 'newest', limit: 12 },
    'open-access-datasets': { enabled: true, ranking: 'newest', limit: 12 },
  },
}

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

  it('leaves every section off, so a partner opts in to each one in its own config', () => {
    expect(Object.values(defaultShowcase.sections)).toEqual(SECTION_KEYS.map(() => ({ enabled: false })))
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

  it('keeps a default when the partner sets a field to undefined', () => {
    const resolved = resolveShowcase({ schemaVersion: undefined, branding: { theme: undefined, accent: '#a65c00' } })
    expect(resolved.schemaVersion).toBe(1)
    expect(resolved.branding).toEqual({ theme: 'default', accent: '#a65c00' })
    expect(ciGuard(resolved)).toEqual([])
  })

  it('replaces a listed section whole, so it never inherits fields from another variant', () => {
    const resolved = resolveShowcase({ sections: { 'open-access-datasets': { enabled: true, items: ['DUOS-000001'] } } }, shelvesOn)
    expect(resolved.sections['open-access-datasets']).toEqual({ enabled: true, items: ['DUOS-000001'] })
    expect(guard(resolved)).toEqual([])
  })

  it('turns a default section off without keeping its ranking or limit', () => {
    const resolved = resolveShowcase({ sections: { 'latest-data-releases': { enabled: false } } }, shelvesOn)
    expect(resolved.sections['latest-data-releases']).toEqual({ enabled: false })
    expect(guard(resolved)).toEqual([])
  })

  it('keeps the other default sections when a partner lists one', () => {
    const resolved = resolveShowcase({ sections: { 'latest-data-releases': { enabled: false } } }, shelvesOn)
    expect(resolved.sections['open-access-datasets']).toEqual({ enabled: true, ranking: 'newest', limit: 12 })
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

  it('returns a copy, so changing one resolved config changes neither the defaults nor another partner', () => {
    const partner = { sections: { 'latest-data-releases': { enabled: true, ranking: 'newest', limit: 6 } } } as const
    const first = resolveShowcase(partner, shelvesOn)
    Object.assign(first.sections['open-access-datasets'], { limit: 1 })
    Object.assign(first.sections['latest-data-releases'], { limit: 1 })
    Object.assign(first.sections.masthead, { enabled: true })
    expect(shelvesOn.sections['open-access-datasets']).toEqual({ enabled: true, ranking: 'newest', limit: 12 })
    expect(partner.sections['latest-data-releases'].limit).toBe(6)
    expect(defaultShowcase.sections.masthead).toEqual({ enabled: false })
    expect(resolveShowcase(partner, shelvesOn).sections['open-access-datasets']).toEqual({ enabled: true, ranking: 'newest', limit: 12 })
  })

  it('gives every section its own object, so changing one section changes no other', () => {
    const resolved = resolveShowcase({})
    Object.assign(resolved.sections.masthead, { enabled: true })
    expect(Object.values(resolved.sections).filter(section => section.enabled)).toHaveLength(1)
  })
})
