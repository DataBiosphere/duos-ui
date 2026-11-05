import { afterEach, describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useMetaDescription } from 'src/hooks/useMetaDescription'

const descriptionTags = () => document.head.querySelectorAll<HTMLMetaElement>('meta[name="description"]')

describe('useMetaDescription', () => {
  afterEach(() => descriptionTags().forEach(tag => tag.remove()))

  it('adds a description tag and removes it on unmount when there was none', () => {
    const { unmount } = renderHook(() => useMetaDescription('Explore the data'))
    expect(Array.from(descriptionTags(), tag => tag.content)).toEqual(['Explore the data'])
    unmount()
    expect(descriptionTags()).toHaveLength(0)
  })

  it('replaces an existing description and puts it back on unmount', () => {
    const existing = document.createElement('meta')
    existing.name = 'description'
    existing.content = 'The app description'
    document.head.appendChild(existing)

    const { unmount } = renderHook(() => useMetaDescription('Explore the data'))
    expect(Array.from(descriptionTags(), tag => tag.content)).toEqual(['Explore the data'])
    unmount()
    expect(Array.from(descriptionTags(), tag => tag.content)).toEqual(['The app description'])
  })

  it('removes an existing description while there is none to show, and restores it after', () => {
    const existing = document.createElement('meta')
    existing.name = 'description'
    existing.content = 'The app description'
    document.head.appendChild(existing)

    const { unmount } = renderHook(() => useMetaDescription(undefined))
    expect(descriptionTags()).toHaveLength(0)
    unmount()
    expect(Array.from(descriptionTags(), tag => tag.content)).toEqual(['The app description'])
  })

  it('follows a changed description', () => {
    const { rerender, unmount } = renderHook(({ text }) => useMetaDescription(text), { initialProps: { text: 'First' as string | undefined } })
    rerender({ text: 'Second' })
    expect(Array.from(descriptionTags(), tag => tag.content)).toEqual(['Second'])
    rerender({ text: undefined })
    expect(descriptionTags()).toHaveLength(0)
    unmount()
    expect(descriptionTags()).toHaveLength(0)
  })
})
