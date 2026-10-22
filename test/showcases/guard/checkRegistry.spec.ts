import { describe, expect, it } from 'vitest'
import { checkRegistry } from './checkRegistry'

const entry = (key: string, flagship = false) => ({ key, title: `${key} title`, status: 'hidden', flagship, order: 1 })
const configs = (...keys: string[]) => Object.fromEntries(keys.map(key => [key, {}]))

describe('checkRegistry', () => {
  it('passes the empty registry from before any real entry', () => {
    expect(checkRegistry({ entries: [], retiredKeys: [] }, {})).toEqual([])
  })

  it('passes one flagship and one partner, each with a config', () => {
    const registry = { entries: [entry('flagship-data', true), entry('example-partner')], retiredKeys: ['old-partner'] }
    expect(checkRegistry(registry, configs('flagship-data', 'example-partner'))).toEqual([])
  })

  it('fails a registry that does not match the schema', () => {
    expect(checkRegistry({ entries: [{ ...entry('example'), route: '/showcase/example' }], retiredKeys: [] }, configs('example')))
      .toEqual([expect.stringContaining('entries.0')])
  })

  it('fails a duplicate key', () => {
    const registry = { entries: [entry('flagship-data', true), entry('example'), entry('example')], retiredKeys: [] }
    expect(checkRegistry(registry, configs('flagship-data', 'example'))).toEqual([expect.stringContaining('duplicate key "example"')])
  })

  it('fails an entry that reuses a retired key', () => {
    const registry = { entries: [entry('flagship-data', true), entry('old-partner')], retiredKeys: ['old-partner'] }
    expect(checkRegistry(registry, configs('flagship-data', 'old-partner'))).toEqual([expect.stringContaining('retired key "old-partner"')])
  })

  it.each([
    ['no flagship', [entry('a'), entry('b')]],
    ['two flagships', [entry('a', true), entry('b', true)]],
  ])('fails %s', (_, entries) => {
    expect(checkRegistry({ entries, retiredKeys: [] }, configs('a', 'b'))).toEqual([expect.stringContaining('exactly one flagship')])
  })

  it('fails an entry with no config', () => {
    const registry = { entries: [entry('flagship-data', true), entry('example')], retiredKeys: [] }
    expect(checkRegistry(registry, configs('flagship-data'))).toEqual([expect.stringContaining('"example" has no config')])
  })

  it('fails a config with no entry', () => {
    const registry = { entries: [entry('flagship-data', true)], retiredKeys: [] }
    expect(checkRegistry(registry, configs('flagship-data', 'stray'))).toEqual([expect.stringContaining('"stray" has no index entry')])
  })
})
