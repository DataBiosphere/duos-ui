import { describe, expect, it } from 'vitest'
import { datasetPath, isPublicPath, LIBRARY_PATH, librarySearchPath } from 'src/components/showcase/handoffs'

/** What `useLibraryUrlState` reads back from a library URL. */
const queryOf = (path: string) => new URL(path, 'https://duos.test').searchParams.get('query')

describe('librarySearchPath', () => {
  it('opens the library for blank text', () => {
    expect(librarySearchPath('')).toBe(LIBRARY_PATH)
    expect(librarySearchPath('   ')).toBe(LIBRARY_PATH)
  })

  it.each(['heart', 'heart & lung', 'a=b?c#d', 'café 日本', '/\\evil.example', '100% GRU'])('round-trips %j as the library query', (text) => {
    const path = librarySearchPath(text)
    expect(path.startsWith(`${LIBRARY_PATH}?`)).toBe(true)
    expect(queryOf(path)).toBe(text)
  })

  it('trims the text', () => {
    expect(queryOf(librarySearchPath('  heart  '))).toBe('heart')
  })

  it('always builds an internal path', () => {
    const url = new URL(librarySearchPath('//evil.example'), 'https://duos.test')
    expect(url.origin).toBe('https://duos.test')
    expect(url.pathname).toBe(LIBRARY_PATH)
  })
})

describe('datasetPath', () => {
  it('links a canonical identifier to its dataset page', () => {
    expect(datasetPath('DUOS-000790')).toBe('/dataset/DUOS-000790')
    expect(datasetPath('DUOS-1234567')).toBe('/dataset/DUOS-1234567')
  })

  it.each(['DUOS-790', 'DUOS-0001234', 'duos-000790', 'DUOS-000790/../admin', 'DUOS-D790', ''])('refuses %j', (identifier) => {
    expect(datasetPath(identifier)).toBeUndefined()
  })
})

describe('isPublicPath', () => {
  it.each(['/', '/home', '/data', '/showcase/example-partner', '/privacy?x=1', '/tos#top'])('treats %s as public', (path) => {
    expect(isPublicPath(path)).toBe(true)
  })

  it.each(['/datalibrary', '/datalibrary?query=x', '/dataset/DUOS-000790', '/dar_application/abc', '/profile', '/data/extra', '/showcase'])('treats %s as signed-in', (path) => {
    expect(isPublicPath(path)).toBe(false)
  })
})
