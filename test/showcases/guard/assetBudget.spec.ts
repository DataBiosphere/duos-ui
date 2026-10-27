import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { ShowcaseConfigInput } from 'src/types/showcase'
import { flagshipConfig } from '../../fixtures/showcase/contracts'
import { ASSET_BUDGET, checkAssetBudget, type ReadSize, readImageSize } from './assetBudget'

const KB = 1024
const LOGO = 'showcase/flagship/logo.svg'

/** The flagship fixture plus a tool thumbnail and a disabled section's icon. */
const withImages = (): ShowcaseConfigInput => {
  const config = structuredClone(flagshipConfig)
  const tools = config.sections['featured-tools']
  if (tools.enabled) {
    tools.items[0].thumbnail = { src: 'showcase/flagship/tool.png', alt: '' }
  }
  config.sections['research-area'] = {
    enabled: false,
    items: [{ id: 'area-1', label: 'Example', description: 'Example', icon: { src: 'showcase/flagship/area.svg', alt: '' }, destinationUrl: '/datalibrary' }],
  }
  return config
}

const sizes = (overrides: Record<string, number> = {}): ReadSize => {
  const table: Record<string, number> = {
    [LOGO]: 10 * KB,
    'showcase/flagship/tool.png': 20 * KB,
    'showcase/flagship/area.svg': 5 * KB,
    ...overrides,
  }
  return src => table[src]
}

const withLogo = (src: string): ShowcaseConfigInput => {
  const config = withImages()
  config.sections.masthead = { enabled: true, logos: [{ src, alt: 'Example Partner' }] }
  return config
}

describe('checkAssetBudget', () => {
  it('passes a config within the budget', () => {
    expect(checkAssetBudget(withImages(), sizes())).toEqual([])
  })

  it('passes an SVG logo at the limit', () => {
    expect(checkAssetBudget(withImages(), sizes({ [LOGO]: ASSET_BUDGET.logoBytes.svg }))).toEqual([])
  })

  it('fails an SVG logo over the limit', () => {
    const errors = checkAssetBudget(withImages(), sizes({ [LOGO]: ASSET_BUDGET.logoBytes.svg + 1 }))
    expect(errors).toEqual([expect.stringContaining('sections.masthead.logos.0')])
  })

  it('applies the PNG logo limit to a PNG logo', () => {
    const png = 'showcase/flagship/logo.png'
    expect(checkAssetBudget(withLogo(png), sizes({ [png]: ASSET_BUDGET.logoBytes.png }))).toEqual([])
    expect(checkAssetBudget(withLogo(png), sizes({ [png]: ASSET_BUDGET.logoBytes.png + 1 }))).toHaveLength(1)
  })

  it('fails a logo that is not SVG or PNG', () => {
    const jpg = 'showcase/flagship/logo.jpg'
    expect(checkAssetBudget(withLogo(jpg), sizes({ [jpg]: 10 * KB }))).toEqual([expect.stringContaining('SVG or PNG')])
  })

  it('fails a non-logo image over the limit', () => {
    const errors = checkAssetBudget(withImages(), sizes({ 'showcase/flagship/tool.png': ASSET_BUDGET.imageBytes + 1 }))
    expect(errors).toEqual([expect.stringContaining('sections.featured-tools.items.0.thumbnail')])
  })

  it('counts images in disabled sections, which still ship in the bundle', () => {
    const errors = checkAssetBudget(withImages(), sizes({ 'showcase/flagship/area.svg': ASSET_BUDGET.imageBytes + 1 }))
    expect(errors).toEqual([expect.stringContaining('sections.research-area.items.0.icon')])
  })

  /** A config whose featured tools have `count` thumbnails, each at the per-image limit. */
  const withThumbnails = (count: number, distinct: boolean) => {
    const config = withImages()
    const tools = config.sections['featured-tools']
    if (tools.enabled) {
      const [first] = tools.items
      tools.items = Array.from({ length: count }, (_, i) => ({
        ...first,
        id: `tool-${i}`,
        thumbnail: { src: `showcase/flagship/tool-${distinct ? i : 0}.png`, alt: '' },
      }))
    }
    return config
  }
  const atImageLimit: ReadSize = src => (src.includes('tool-') ? ASSET_BUDGET.imageBytes : 1)
  const overTotal = Math.floor(ASSET_BUDGET.totalBytes / ASSET_BUDGET.imageBytes) + 1

  it('fails a showcase whose images together exceed the total', () => {
    expect(checkAssetBudget(withThumbnails(overTotal, true), atImageLimit)).toEqual([expect.stringContaining('total')])
  })

  it('counts an image used more than once only once in the total', () => {
    expect(checkAssetBudget(withThumbnails(overTotal, false), atImageLimit)).toEqual([])
  })

  it('fails an image whose file is missing', () => {
    const errors = checkAssetBudget(withImages(), src => (src === 'showcase/flagship/tool.png' ? undefined : 1))
    expect(errors).toEqual([expect.stringContaining('not found')])
  })
})

describe('readImageSize', () => {
  it('reads the size of a file below src/images', () => {
    expect(readImageSize('duos-network-logo.svg')).toBeGreaterThan(0)
  })

  it('returns undefined for a missing file or a directory', () => {
    expect(readImageSize('showcase/missing/logo.svg')).toBeUndefined()
    expect(readImageSize('.')).toBeUndefined()
  })

  it.each(['../../package.json', resolve('package.json')])('returns undefined for a path outside src/images: %s', (src) => {
    expect(readImageSize(src)).toBeUndefined()
  })

  it('reads a path with .. that stays below src/images', () => {
    expect(readImageSize('../images/duos-network-logo.svg')).toBe(readImageSize('duos-network-logo.svg'))
  })
})
