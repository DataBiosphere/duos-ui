import { describe, expect, it } from 'vitest'
import { imageLoading } from 'src/showcases/imageLoading'
import { SECTION_KEYS } from 'src/types/showcase'

describe('imageLoading', () => {
  it('loads masthead logos eagerly', () => {
    expect(imageLoading('masthead')).toBe('eager')
  })

  it('loads every other section\'s images lazily', () => {
    SECTION_KEYS.filter(key => key !== 'masthead').forEach(key => expect(imageLoading(key)).toBe('lazy'))
  })
})
