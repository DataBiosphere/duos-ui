import { describe, it, expect } from 'vitest'
import { extractThroughBioId } from 'src/pages/data_submission/v2/v2-common-functions'

describe('extractThroughBioId', () => {
  const validUrls: [string, string][] = [
    ['https://through.bio/abc123', 'abc123'],
    ['https://through.bio/xyz', 'xyz'],
    ['https://through.bio/abc/def', 'abc/def'],
  ]
  validUrls.forEach(([input, expected]) => {
    it(`extracts ID "${expected}" from "${input}"`, () => {
      expect(extractThroughBioId(input)).toBe(expected)
    })
  })

  const invalidUrls = [
    'https://example.com/abc123',
    'https://throughbio.com/abc',
  ]
  invalidUrls.forEach((input) => {
    it(`returns empty string for invalid URL "${input}"`, () => {
      expect(extractThroughBioId(input)).toBe('')
    })
  })

  const nonUrlStrings: [string, string][] = [
    ['  myid  ', 'myid'],
    ['anotherId', 'anotherId'],
  ]
  nonUrlStrings.forEach(([input, expected]) => {
    it(`returns trimmed input "${expected}" for non-URL "${input}"`, () => {
      expect(extractThroughBioId(input)).toBe(expected)
    })
  })

  const emptyInputs = ['', '   ']
  emptyInputs.forEach((input) => {
    it(`returns empty string for empty input "${JSON.stringify(input)}"`, () => {
      expect(extractThroughBioId(input)).toBe('')
    })
  })
})
