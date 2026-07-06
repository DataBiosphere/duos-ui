import { describe, it, expect } from 'vitest'
import { extractError } from 'src/utils/ErrorUtils'

describe('extractError', () => {
  it('should extract message from Error instance', () => {
    expect(extractError(new Error('Fetch failed'))).toBe('Fetch failed')
  })

  it('should extract message from ConsentError shape', () => {
    expect(extractError({ message: 'Consent error occurred' })).toBe('Consent error occurred')
  })

  it('should return "Unknown error" if message is missing', () => {
    expect(extractError({})).toBe('Unknown error')
  })

  it('should handle non-object error', () => {
    expect(extractError('some string')).toMatch(/^Unknown error/)
  })
})
