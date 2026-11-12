/**
 * The synthetic showcases the Playwright specs load (DT-4424) are built only by `build:e2e`, and
 * pass the same rules as a real entry.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { E2E_SHOWCASES_ENV, e2eShowcaseAliases } from '../../aliases'
import { findShowcase } from 'src/components/showcase/loadShowcase'
import { resolveShowcase } from 'src/showcases/defaults'
import type * as RealIndex from '../../src/showcases/index'
import * as synthetic from '../e2e/showcase'
import { checkRegistry } from './guard/checkRegistry'
import { checkShowcase } from './guard/checkShowcase'

const ROOT = resolve(__dirname, '..', '..')

describe('synthetic e2e showcases', () => {
  it('export what the real index exports', () => {
    // Fails type-checking if the real index gains an export the synthetic one lacks.
    const asIndex: typeof RealIndex = synthetic
    expect(Object.keys(asIndex).sort()).toEqual(expect.arrayContaining(['retiredShowcaseKeys', 'showcaseConfigs', 'showcaseEntries', 'showcaseRoute']))
  })

  it('pass the index guard', () => {
    expect(checkRegistry({ entries: synthetic.showcaseEntries, retiredKeys: synthetic.retiredShowcaseKeys }, synthetic.showcaseConfigs)).toEqual([])
  })

  it.each(synthetic.showcaseEntries.map(entry => [entry.key]))('%s passes every config rule', (key) => {
    expect(checkShowcase(resolveShowcase(synthetic.showcaseConfigs[key]))).toEqual([])
  })

  it('serve the flagship and the partner, and hide the hidden entry', () => {
    const sources = { entries: synthetic.showcaseEntries, configs: synthetic.showcaseConfigs, retiredKeys: synthetic.retiredShowcaseKeys, enabled: true }
    expect(findShowcase({ route: 'flagship' }, sources)).toMatchObject({ status: 'found', entry: synthetic.E2E_FLAGSHIP })
    expect(findShowcase({ route: 'key', key: synthetic.E2E_PARTNER.key }, sources)).toMatchObject({ status: 'found', entry: synthetic.E2E_PARTNER })
    expect(findShowcase({ route: 'key', key: synthetic.E2E_HIDDEN.key }, sources)).toEqual({ status: 'not-found' })
  })

  it('serve the hidden entry in a non-production preview', () => {
    const sources = { entries: synthetic.showcaseEntries, configs: synthetic.showcaseConfigs, retiredKeys: synthetic.retiredShowcaseKeys, enabled: true, showHidden: true }
    expect(findShowcase({ route: 'key', key: synthetic.E2E_HIDDEN.key }, sources)).toMatchObject({ status: 'found', entry: synthetic.E2E_HIDDEN })
  })
})

describe('the e2e showcase build switch', () => {
  it('aliases the index only when the variable is exactly "true"', () => {
    for (const value of [undefined, '', 'false', '1', 'TRUE']) {
      expect(e2eShowcaseAliases({ [E2E_SHOWCASES_ENV]: value })).toEqual([])
    }
    const [alias] = e2eShowcaseAliases({ [E2E_SHOWCASES_ENV]: 'true' })
    expect(alias.replacement).toBe(join(ROOT, 'test', 'e2e', 'showcase', 'index.ts'))
    expect(existsSync(alias.replacement)).toBe(true)
  })

  it('matches the bare index import only, not its sibling modules', () => {
    const [{ find }] = e2eShowcaseAliases({ [E2E_SHOWCASES_ENV]: 'true' })
    expect(find.test('src/showcases')).toBe(true)
    for (const other of ['src/showcases/schema', 'src/showcases/defaults', 'src/showcases/registry.json']) {
      expect(find.test(other)).toBe(false)
    }
  })

  describe('in vite.config.ts', () => {
    afterEach(() => {
      vi.unstubAllEnvs()
      vi.resetModules()
    })

    const aliasesWith = async (value: string | undefined) => {
      vi.resetModules()
      vi.stubEnv(E2E_SHOWCASES_ENV, value)
      const { default: config } = await import('../../vite.config')
      return config.resolve?.alias as { find: string | RegExp, replacement: string }[]
    }

    it('puts the e2e alias first, ahead of the src prefix alias that would otherwise match', async () => {
      const [first] = await aliasesWith('true')
      expect(first).toEqual(e2eShowcaseAliases({ [E2E_SHOWCASES_ENV]: 'true' })[0])
    })

    it('adds no e2e alias without the variable', async () => {
      const aliases = await aliasesWith(undefined)
      expect(aliases.some(({ replacement }) => replacement.includes(join('test', 'e2e')))).toBe(false)
    })
  })

  // A path like `src/showcases/index` or `../showcases` would bypass the alias and mix real and
  // synthetic entries in one e2e build.
  const OTHER_INDEX_IMPORT = /['"](?:(?:\.{1,2}\/)+|src\/)(?:[\w-]+\/)*?showcases(?:\/index(?:\.[jt]sx?)?|\/)['"]|['"](?:\.{1,2}\/)+showcases['"]/

  it('flags every other path to the index, with or without an extension', () => {
    for (const ext of ['', '.ts', '.tsx', '.js', '.jsx']) {
      expect(OTHER_INDEX_IMPORT.test(`'src/showcases/index${ext}'`)).toBe(true)
      expect(OTHER_INDEX_IMPORT.test(`'../showcases/index${ext}'`)).toBe(true)
    }
    for (const allowed of ['src/showcases', 'src/showcases/schema', 'src/showcases/indexes']) {
      expect(OTHER_INDEX_IMPORT.test(`'${allowed}'`)).toBe(false)
    }
  })

  it('is the only way src imports the index, so the alias catches every import', () => {
    const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true })
      .flatMap(entry => entry.isDirectory() ? files(join(dir, entry.name)) : /\.[jt]sx?$/.test(entry.name) ? [join(dir, entry.name)] : [])
    const offenders = files(join(ROOT, 'src'))
      .filter(file => OTHER_INDEX_IMPORT.test(readFileSync(file, 'utf8')))
    expect(offenders).toEqual([])
  })

  it('is set by no deployed build', () => {
    const workflows = join(ROOT, '.github', 'workflows')
    const deployFiles = [
      join(ROOT, 'Dockerfile'),
      ...readdirSync(workflows).filter(name => name !== 'integration-tests.yml').map(name => join(workflows, name)),
    ]
    for (const file of deployFiles) {
      const text = readFileSync(file, 'utf8')
      expect(text, file).not.toContain(E2E_SHOWCASES_ENV)
      expect(text, file).not.toContain('build:e2e')
    }
  })
})
