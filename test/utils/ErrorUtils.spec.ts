import { describe, it, expect } from 'vitest'
import { extractError, extractStatus } from 'src/utils/ErrorUtils'

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

describe('extractStatus', () => {
  it('reads the status fetchAdapter attaches to a non-ok response', () => {
    expect(extractStatus({ response: { status: 403 } })).toBe(403)
  })

  it('is undefined for a network failure, which carries no status', () => {
    expect(extractStatus(new Error('Network error'))).toBeUndefined()
  })

  it('is undefined for a malformed or absent response', () => {
    expect(extractStatus({ response: {} })).toBeUndefined()
    expect(extractStatus({ response: { status: 'nope' } })).toBeUndefined()
    expect(extractStatus(undefined)).toBeUndefined()
  })
})
