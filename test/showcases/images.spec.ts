import { describe, expect, it } from 'vitest'
import { isShowcaseImagePath, resolveShowcaseImage } from 'src/showcases/images'

describe('resolveShowcaseImage', () => {
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
