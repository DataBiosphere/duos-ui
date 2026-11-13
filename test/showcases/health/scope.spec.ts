import { describe, expect, it } from 'vitest'
import { changedRegistryKeys, selectShowcases } from 'src/showcases/health/scope'

const KEYS = ['flagship', 'partner-a', 'partner-b']
const REGISTRY = 'src/showcases/registry.json'
const INDEX = 'src/showcases/index.ts'

const entry = (key: string, status: 'live' | 'hidden' = 'live') => ({ key, title: key, route: `/showcase/${key}`, status, flagship: false, order: 1 })

describe('changedRegistryKeys', () => {
  it('lists added, changed and removed entries', () => {
    const base = { entries: [entry('partner-a'), entry('partner-b', 'hidden'), entry('partner-c')], retiredKeys: [] }
    const current = { entries: [entry('partner-a'), entry('partner-b'), entry('partner-d')], retiredKeys: ['partner-c'] }

    expect(changedRegistryKeys(base, current).sort()).toEqual(['partner-b', 'partner-c', 'partner-d'])
  })
})

describe('selectShowcases', () => {
  it('checks every showcase on a scheduled run', () => {
    expect(selectShowcases(KEYS, undefined)).toEqual(KEYS)
  })

  it('checks only the showcases whose config or images a PR changes, the old path of a rename included', () => {
    const files = ['src/showcases/partner-b.ts', 'src/images/showcase/partner-a/logo.svg', 'README.md']

    expect(selectShowcases(KEYS, { files, registryKeys: [] })).toEqual(['partner-a', 'partner-b'])
  })

  it('adds the showcases whose registry entry changed, such as one that goes live', () => {
    const files = ['src/showcases/partner-a.ts', INDEX, REGISTRY]

    expect(selectShowcases(KEYS, { files, registryKeys: ['partner-a'] })).toEqual(['partner-a'])
    expect(selectShowcases(KEYS, { files, registryKeys: ['partner-a', 'partner-b'] })).toEqual(['partner-a', 'partner-b'])
    expect(selectShowcases(KEYS, { files: [REGISTRY], registryKeys: ['flagship'] })).toEqual(['flagship'])
  })

  it('checks every showcase when the base registry is unknown', () => {
    expect(selectShowcases(KEYS, { files: ['src/showcases/partner-a.ts', REGISTRY] })).toEqual(KEYS)
  })

  it.each([
    ['a shared file', ['src/showcases/partner-a.ts', 'src/showcases/defaults.ts']],
    ['the check itself', ['src/showcases/health/report.ts']],
    ['only the index', [INDEX]],
    ['the showcase types', ['src/types/showcase.ts']],
    ['the check script', ['scripts/showcase-health.ts']],
    ['the check workflow', ['.github/workflows/showcase-health.yml']],
    ['a config file for an unregistered key', ['src/showcases/partner-z.ts']],
  ])('checks every showcase when a PR changes %s', (_, files) => {
    expect(selectShowcases(KEYS, { files, registryKeys: [] })).toEqual(KEYS)
  })

  it('checks nothing for a PR that only retires a showcase', () => {
    const files = ['src/showcases/partner-c.ts', 'src/images/showcase/partner-c/logo.svg', INDEX, REGISTRY]

    expect(selectShowcases(KEYS, { files, registryKeys: ['partner-c'] }, ['partner-c'])).toEqual([])
  })

  it('checks nothing when a PR changes no showcase file', () => {
    expect(selectShowcases(KEYS, { files: ['src/pages/Home.tsx'], registryKeys: [] })).toEqual([])
  })
})
