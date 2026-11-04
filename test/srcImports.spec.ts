import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

// Test fixtures and mocks live under `test/`, so no deployed build may import them (DT-4353).
const ROOT = resolve(__dirname, '..')
const SRC = join(ROOT, 'src')
const TEST = join(ROOT, 'test')

const SOURCE_FILE = /\.(?:[cm]?[jt]sx?)$/
// `import … from '…'`, `export … from '…'`, side-effect imports, `import('…')` and `require('…')`,
// with single, double or backtick quotes (a template literal in a dynamic import).
const SPECIFIER = /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)['"`]([^'"`]+)['"`]/g

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return SOURCE_FILE.test(entry.name) ? [path] : []
  })

/** Whether `specifier`, imported from `file`, names something under `test/`. */
const importsTest = (file: string, specifier: string): boolean => {
  if (specifier === 'test' || specifier.startsWith('test/')) return true
  // The `src/*` alias resolves too, so `src/../test/...` reaches test/.
  const aliased = specifier === 'src' || specifier.startsWith('src/') ? join(ROOT, specifier) : undefined
  if (!aliased && !specifier.startsWith('.') && !specifier.startsWith('/')) return false
  const target = aliased ?? resolve(dirname(file), specifier)
  return target === TEST || target.startsWith(TEST + sep)
}

describe('source imports', () => {
  it('recognizes imports that reach test/', () => {
    const file = join(SRC, 'components', 'showcase', 'Page.tsx')
    expect(importsTest(file, '../../../test/fixtures/showcase/catalogMock')).toBe(true)
    expect(importsTest(file, 'test/fixtures/showcase/catalogMock')).toBe(true)
    expect(importsTest(file, 'src/../test/fixtures/showcase/catalogMock')).toBe(true)
    expect(importsTest(file, '../../libs/ajax/ShowcaseCatalog')).toBe(false)
    expect(importsTest(file, 'src/libs/ajax/ShowcaseCatalog')).toBe(false)
    expect(importsTest(file, 'react')).toBe(false)
  })

  it('finds specifiers in every quote style', () => {
    const specifiers = (source: string) => [...source.matchAll(SPECIFIER)].map(([, specifier]) => specifier)
    expect(specifiers('import a from \'x\'\nexport * from "y"\nimport(\'z\')\nrequire("w")')).toEqual(['x', 'y', 'z', 'w'])
    expect(specifiers('const m = await import(`../../test/fixtures/${name}`)')).toEqual(['../../test/fixtures/${name}'])
  })

  it('has no file under src/ that imports from test/', () => {
    const offenders = sourceFiles(SRC).flatMap(file =>
      [...readFileSync(file, 'utf8').matchAll(SPECIFIER)]
        .filter(([, specifier]) => importsTest(file, specifier))
        .map(([, specifier]) => `${relative(ROOT, file)}: ${specifier}`))
    expect(offenders).toEqual([])
  })
})
