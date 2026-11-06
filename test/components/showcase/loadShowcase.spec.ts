import { afterEach, describe, expect, it, vi } from 'vitest'
import { findShowcase, type ShowcaseSources } from 'src/components/showcase/loadShowcase'
import { resolveShowcase } from 'src/showcases/defaults'
import { ShowcaseConfigSchema } from 'src/showcases/schema'
import type { RegistryEntry, ShowcasePartialInput } from 'src/types/showcase'

const flagship: RegistryEntry = { key: 'flagship-data', title: 'Flagship Data', status: 'live', flagship: true, order: 0 }
const partner: RegistryEntry = { key: 'example-partner', title: 'Example Partner Data', status: 'live', flagship: false, order: 1 }
const hidden: RegistryEntry = { key: 'hidden-partner', title: 'Hidden Partner Data', status: 'hidden', flagship: false, order: 2 }
const unconfigured: RegistryEntry = { key: 'unconfigured-partner', title: 'Unconfigured Partner Data', status: 'live', flagship: false, order: 3 }

const partnerConfig: ShowcasePartialInput = { branding: { theme: 'default', primary: '#123456' } }

const sources = (overrides: Partial<ShowcaseSources> = {}): ShowcaseSources => ({
  entries: [flagship, partner, hidden, unconfigured],
  configs: {
    'flagship-data': {},
    'example-partner': partnerConfig,
    'hidden-partner': {},
  },
  retiredKeys: ['retired-partner'],
  enabled: true,
  ...overrides,
})

const NOT_FOUND = { status: 'not-found' }

describe('findShowcase', () => {
  it('finds a live partner and returns its resolved config', () => {
    expect(findShowcase({ route: 'key', key: 'example-partner' }, sources())).toEqual({
      status: 'found',
      entry: partner,
      config: ShowcaseConfigSchema.parse(resolveShowcase(partnerConfig)),
    })
  })

  it('finds the flagship at /data', () => {
    expect(findShowcase({ route: 'flagship' }, sources())).toEqual({
      status: 'found',
      entry: flagship,
      config: ShowcaseConfigSchema.parse(resolveShowcase({})),
    })
  })

  it.each([
    ['absent', undefined],
    ['false', false],
    ['the string "true"', 'true'],
    ['1', 1],
  ])('finds nothing when the rollout flag is %s', (_label, enabled) => {
    expect(findShowcase({ route: 'key', key: 'example-partner' }, sources({ enabled }))).toEqual(NOT_FOUND)
    expect(findShowcase({ route: 'flagship' }, sources({ enabled }))).toEqual(NOT_FOUND)
  })

  it('answers a hidden key exactly as an unknown one', () => {
    const hiddenResult = findShowcase({ route: 'key', key: 'hidden-partner' }, sources())
    expect(hiddenResult).toEqual(NOT_FOUND)
    expect(hiddenResult).toEqual(findShowcase({ route: 'key', key: 'unknown-partner' }, sources()))
  })

  it('finds no hidden flagship', () => {
    const entries = [{ ...flagship, status: 'hidden' as const }, partner]
    expect(findShowcase({ route: 'flagship' }, sources({ entries }))).toEqual(NOT_FOUND)
  })

  it('finds no retired key, even if an entry still lists it', () => {
    const retired: RegistryEntry = { key: 'retired-partner', title: 'Retired Partner Data', status: 'live', flagship: false, order: 4 }
    const result = findShowcase({ route: 'key', key: 'retired-partner' }, sources({
      entries: [flagship, retired],
      configs: { 'retired-partner': {} },
    }))
    expect(result).toEqual(NOT_FOUND)
  })

  it('finds no entry without a config', () => {
    expect(findShowcase({ route: 'key', key: 'unconfigured-partner' }, sources())).toEqual(NOT_FOUND)
  })

  it('serves the flagship only at /data, not at /showcase/<flagship key>', () => {
    expect(findShowcase({ route: 'key', key: 'flagship-data' }, sources())).toEqual(NOT_FOUND)
  })

  it.each(['data', 'flagship', 'Example-Partner', 'example--partner', 'example_partner', '../example-partner', '', 'constructor-'])('finds nothing for the key "%s"', (key) => {
    expect(findShowcase({ route: 'key', key }, sources())).toEqual(NOT_FOUND)
  })

  it('finds nothing for a missing key', () => {
    expect(findShowcase({ route: 'key', key: undefined }, sources())).toEqual(NOT_FOUND)
  })

  it('does not read an inherited property as a config', () => {
    const entry: RegistryEntry = { key: 'constructor', title: 'Constructor', status: 'live', flagship: false, order: 5 }
    expect(findShowcase({ route: 'key', key: 'constructor' }, sources({ entries: [entry], configs: {} }))).toEqual(NOT_FOUND)
  })

  it.each([
    ['no flagship', [partner]],
    ['two flagships', [flagship, { ...partner, flagship: true }]],
  ])('finds nothing at /data with %s', (_label, entries) => {
    expect(findShowcase({ route: 'flagship' }, sources({ entries }))).toEqual(NOT_FOUND)
  })

  it('finds nothing, and logs why, when the resolved config fails the schema', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const invalid = { branding: { primary: 'not-a-color' } } as unknown as ShowcasePartialInput
    const result = findShowcase({ route: 'key', key: 'example-partner' }, sources({ configs: { 'example-partner': invalid } }))
    expect(result).toEqual(NOT_FOUND)
    expect(error).toHaveBeenCalledWith('Showcase "example-partner" has an invalid config', expect.any(Array))
    error.mockRestore()
  })

  it('finds nothing when two entries share a key', () => {
    const entries = [partner, { ...partner, title: 'Duplicate', order: 6 }]
    expect(findShowcase({ route: 'key', key: 'example-partner' }, sources({ entries }))).toEqual(NOT_FOUND)
  })
})

describe('loadShowcase', () => {
  const loadWith = async (isShowcaseEnabled: () => Promise<boolean>, isShowcaseHandoffsEnabled = () => Promise.resolve(false)) => {
    vi.resetModules()
    vi.doMock('src/libs/config', () => ({ isShowcaseEnabled, isShowcaseHandoffsEnabled }))
    vi.doMock('src/showcases', () => ({
      showcaseEntries: [partner],
      showcaseConfigs: { 'example-partner': partnerConfig },
      retiredShowcaseKeys: [],
    }))
    const { loadShowcase } = await import('src/components/showcase/loadShowcase')
    return loadShowcase({ route: 'key', key: 'example-partner' })
  }

  afterEach(() => {
    vi.doUnmock('src/libs/config')
    vi.doUnmock('src/showcases')
    vi.resetModules()
  })

  it('finds a showcase in the index when config.json turns the flag on', async () => {
    expect(await loadWith(() => Promise.resolve(true))).toEqual({
      status: 'found',
      entry: partner,
      config: ShowcaseConfigSchema.parse(resolveShowcase(partnerConfig)),
      handoffsEnabled: false,
    })
  })

  it.each([
    ['on', () => Promise.resolve(true), true],
    ['off', () => Promise.resolve(false), false],
    ['unreadable', () => Promise.reject(new Error('config.json unavailable')), false],
  ])('reports handoffs %s from the environment binding', async (_label, isShowcaseHandoffsEnabled, expected) => {
    const result = await loadWith(() => Promise.resolve(true), isShowcaseHandoffsEnabled)
    expect(result.status === 'found' && result.handoffsEnabled).toBe(expected)
  })

  it('finds nothing when config.json leaves the flag off', async () => {
    expect(await loadWith(() => Promise.resolve(false))).toEqual(NOT_FOUND)
  })

  it('treats a config that fails to load as the flag being off', async () => {
    expect(await loadWith(() => Promise.reject(new Error('config.json unavailable')))).toEqual(NOT_FOUND)
  })
})
