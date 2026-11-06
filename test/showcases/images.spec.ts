import { describe, expect, it } from 'vitest'
import { isShowcaseImagePath, resolveShowcaseImage } from 'src/showcases/images'

describe('resolveShowcaseImage', () => {
  // A real file below src/images/showcase/, so a broken glob or lookup prefix fails here. Vite
  // resolves the glob when it transforms images.ts: after adding a file, run `vitest --clearCache`
  // or the cached transform still lacks it.
  it('resolves a bundled showcase image to its URL', () => {
    // Vite inlines a file this small as a data: URL, in tests and in the build.
    expect(resolveShowcaseImage('showcase/e2e-flagship/logo.svg')).toMatch(/^data:image\/svg\+xml[;,]/)
  })

  it.each([
    'showcase/no-such-key/logo.svg',
    'anvil-logo.svg',
    '../package.json',
    '/src/images/anvil-logo.svg',
    'showcase/../anvil-logo.svg',
    'constructor',
  ])('resolves nothing for %j, which is not a bundled showcase image', (src) => {
    expect(resolveShowcaseImage(src)).toBeUndefined()
  })
})

describe('isShowcaseImagePath', () => {
  it.each(['showcase/flagship/logo.svg', 'showcase/quillmere/partners/a.png', 'showcase/x/hero.webp'])('accepts %j', (src) => {
    expect(isShowcaseImagePath(src)).toBe(true)
  })

  it.each(['anvil-logo.svg', 'showcase/logo.svg', 'showcase/x/../y.svg', 'showcase/./x/y.svg', 'showcase/x/y.bmp', 'showcase/x/y', ''])('refuses %j', (src) => {
    expect(isShowcaseImagePath(src)).toBe(false)
  })
})
