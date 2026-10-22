import { describe, expect, it } from 'vitest'
import registryJson from 'src/showcases/registry.json'
import { RegistryEntrySchema, ShowcaseRegistrySchema } from 'src/showcases/schema'
import { showcaseRoute } from 'src/showcases'

const entry = { key: 'example-partner', title: 'Example Partner Data', status: 'hidden', flagship: false, order: 3 }

describe('showcase registry', () => {
  it('parses with the registry schema', () => {
    expect(ShowcaseRegistrySchema.safeParse(registryJson).success).toBe(true)
  })

  it('accepts a well-formed entry', () => {
    expect(RegistryEntrySchema.safeParse(entry).success).toBe(true)
  })

  it.each(['data', 'flagship', 'Example', 'example--partner', '-example', 'example-', 'example_partner', ''])('rejects the key "%s"', (key) => {
    expect(RegistryEntrySchema.safeParse({ ...entry, key }).success).toBe(false)
  })

  it.each(['flagship-data', 'data-2026', 'partner2'])('accepts the key "%s"', (key) => {
    expect(RegistryEntrySchema.safeParse({ ...entry, key }).success).toBe(true)
  })

  it('rejects an entry with a stored route, since routes derive from the key', () => {
    expect(RegistryEntrySchema.safeParse({ ...entry, route: '/showcase/example-partner' }).success).toBe(false)
  })
})

describe('showcaseRoute', () => {
  it('serves the flagship at /data', () => {
    expect(showcaseRoute({ key: 'flagship-data', flagship: true })).toBe('/data')
  })

  it('serves a partner at /showcase/<key>', () => {
    expect(showcaseRoute({ key: 'example-partner', flagship: false })).toBe('/showcase/example-partner')
  })
})
