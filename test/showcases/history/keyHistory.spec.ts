import { describe, expect, it } from 'vitest'
import type { ShowcaseRegistry } from 'src/types/showcase'
import { baselineFor, checkKeyHistory, EMPTY_REGISTRY, type Git, readBaseRegistry } from './keyHistory'

type Entry = ShowcaseRegistry['entries'][number]

const entry = (key: string, changes: Partial<Entry> = {}): Entry =>
  ({ key, title: `${key} title`, status: 'live', flagship: false, order: 1, ...changes })

const registry = (entries: Entry[], retiredKeys: string[] = []): ShowcaseRegistry => ({ entries, retiredKeys })

describe('checkKeyHistory', () => {
  describe('passes', () => {
    it('an unchanged registry', () => {
      const base = registry([entry('alpha'), entry('beta')], ['old'])
      expect(checkKeyHistory(base, base)).toEqual([])
    })

    it('a valid retirement', () => {
      const base = registry([entry('alpha'), entry('beta')])
      expect(checkKeyHistory(base, registry([entry('beta')], ['alpha']))).toEqual([])
    })

    it('a title-only edit', () => {
      const base = registry([entry('alpha')])
      expect(checkKeyHistory(base, registry([entry('alpha', { title: 'Alpha Program Data' })]))).toEqual([])
    })

    it('hiding and then restoring the same entry', () => {
      const live = registry([entry('alpha')])
      const hidden = registry([entry('alpha', { status: 'hidden' })])
      expect(checkKeyHistory(live, hidden)).toEqual([])
      expect(checkKeyHistory(hidden, live)).toEqual([])
    })

    it('a new entry', () => {
      expect(checkKeyHistory(registry([entry('alpha')]), registry([entry('alpha'), entry('beta')]))).toEqual([])
    })

    it('the first registry, against a base revision that has no index', () => {
      expect(checkKeyHistory(EMPTY_REGISTRY, registry([entry('alpha')]))).toEqual([])
    })
  })

  describe('fails', () => {
    it('a removal without a tombstone', () => {
      const base = registry([entry('alpha'), entry('beta')])
      expect(checkKeyHistory(base, registry([entry('beta')]))).toEqual([expect.stringContaining('"alpha" was removed without a tombstone')])
    })

    it('a key rename without retiring the old key', () => {
      const base = registry([entry('alpha')])
      expect(checkKeyHistory(base, registry([entry('alpha-program', { title: 'alpha title' })])))
        .toEqual([expect.stringContaining('"alpha" was removed without a tombstone')])
    })

    it('a deleted tombstone', () => {
      const base = registry([entry('beta')], ['alpha'])
      expect(checkKeyHistory(base, registry([entry('beta')]))).toEqual([expect.stringContaining('tombstone "alpha" was deleted')])
    })

    it('reuse of a retired key in a later revision', () => {
      const base = registry([entry('beta')], ['alpha'])
      expect(checkKeyHistory(base, registry([entry('beta'), entry('alpha')], ['alpha'])))
        .toEqual([expect.stringContaining('retired key "alpha" can\'t be reused')])
    })

    it('a key retired in the same PR that keeps its entry', () => {
      const base = registry([entry('alpha')])
      expect(checkKeyHistory(base, registry([entry('alpha')], ['alpha'])))
        .toEqual([expect.stringContaining('retired key "alpha" can\'t be reused')])
    })

    it('a rollback that resurrects a retired identity', () => {
      // `alpha` was retired and `beta` added after the old revision that the rollback restores.
      const current = registry([entry('beta')], ['alpha'])
      const rolledBack = registry([entry('alpha')])
      const errors = checkKeyHistory(current, rolledBack)
      expect(errors).toHaveLength(3)
      expect(errors).toContainEqual(expect.stringContaining('tombstone "alpha" was deleted'))
      expect(errors).toContainEqual(expect.stringContaining('retired key "alpha" can\'t be reused'))
      expect(errors).toContainEqual(expect.stringContaining('"beta" was removed without a tombstone'))
    })
  })

  describe('concurrent PRs', () => {
    // Both PRs branch from `start`. PR A merges first; PR B must then compare with the updated target.
    const start = registry([entry('alpha')])

    it('fails a PR that still uses a key another PR retired', () => {
      const afterA = registry([], ['alpha'])
      const prB = registry([entry('alpha', { title: 'Renamed title' })])
      expect(checkKeyHistory(start, prB)).toEqual([])
      expect(checkKeyHistory(afterA, prB)).toEqual([
        expect.stringContaining('tombstone "alpha" was deleted'),
        expect.stringContaining('retired key "alpha" can\'t be reused'),
      ])
    })

    it('fails a PR that would drop an entry another PR added', () => {
      const afterA = registry([entry('alpha'), entry('beta')])
      const prB = registry([entry('alpha', { status: 'hidden' })])
      expect(checkKeyHistory(start, prB)).toEqual([])
      expect(checkKeyHistory(afterA, prB)).toEqual([expect.stringContaining('"beta" was removed without a tombstone')])
    })
  })
})

describe('readBaseRegistry', () => {
  const REGISTRY = JSON.stringify(registry([entry('alpha')], ['old']))

  /** A fake git that knows `refs` and, for each, the registry file at that ref (or none). */
  const fakeGit = (refs: Record<string, string | undefined>): Git => (args) => {
    const [command, target] = [args[0], args.at(-1) ?? '']
    const ref = target.replace(/\^\{commit\}$/, '').split(':')[0]
    if (!(ref in refs)) {
      throw new Error(`unknown ref ${ref}`)
    }
    if (command === 'rev-parse') {
      return 'abc123\n'
    }
    const file = refs[ref]
    if (file === undefined) {
      throw new Error('path does not exist')
    }
    return file
  }

  it('reads and parses the registry at the base revision', () => {
    expect(readBaseRegistry('origin/develop', fakeGit({ 'origin/develop': REGISTRY })))
      .toEqual({ status: 'ok', registry: JSON.parse(REGISTRY) })
  })

  it('reports a base revision with no registry file as absent', () => {
    expect(readBaseRegistry('origin/develop', fakeGit({ 'origin/develop': undefined }))).toEqual({ status: 'absent' })
  })

  it('reports a missing base revision as unavailable', () => {
    expect(readBaseRegistry('origin/develop', fakeGit({}))).toEqual({ status: 'unavailable' })
  })

  it.each([
    'not json',
    JSON.stringify({ entries: {}, retiredKeys: [] }),
    JSON.stringify({ entries: [{ title: 'No key' }], retiredKeys: [] }),
    JSON.stringify({ entries: [] }),
  ])('reports a registry file without readable keys as invalid: %s', (file) => {
    expect(readBaseRegistry('origin/develop', fakeGit({ 'origin/develop': file }))).toEqual({ status: 'invalid' })
  })

  it('reads only the keys, so a field the current schema adds or removes does not matter', () => {
    const older = JSON.stringify({ entries: [{ key: 'alpha', legacyField: true }], retiredKeys: ['old'] })
    expect(readBaseRegistry('origin/develop', fakeGit({ 'origin/develop': older })))
      .toEqual({ status: 'ok', registry: { entries: [{ key: 'alpha', legacyField: true }], retiredKeys: ['old'] } })
  })

  it('reads the real registry at HEAD', () => {
    expect(readBaseRegistry('HEAD').status).toBe('ok')
  })
})

describe('baselineFor', () => {
  const base = registry([entry('alpha')])

  it('uses the base registry', () => {
    expect(baselineFor({ status: 'ok', registry: base }, 'origin/develop', true)).toEqual({ registry: base })
  })

  // The registry has been on develop since #4035, so a base with no file means the path moved. An
  // empty baseline would then drop every tombstone.
  it.each([true, false])('fails a base revision with no registry file (CI: %s)', (inCi) => {
    expect(baselineFor({ status: 'absent' }, 'origin/develop', inCi)).toEqual({ error: expect.stringContaining('no registry') })
  })

  it('fails CI when the base history is missing', () => {
    expect(baselineFor({ status: 'unavailable' }, 'origin/develop', true)).toEqual({ error: expect.stringContaining('origin/develop') })
  })

  it('skips locally when the base history is missing', () => {
    expect(baselineFor({ status: 'unavailable' }, 'origin/develop', false)).toEqual({ skip: expect.stringContaining('git fetch') })
  })

  it.each([true, false])('fails an invalid base registry (CI: %s)', (inCi) => {
    expect(baselineFor({ status: 'invalid' }, 'origin/develop', inCi)).toEqual({ error: expect.stringContaining('invalid') })
  })
})
