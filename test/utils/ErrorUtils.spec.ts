import { describe, it, expect, vi, afterEach } from 'vitest'
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

/**
 * The tests above hand-build the error shape. This one drives the real adapter, because whether
 * extractStatus works at all turns on a detail no hand-built object can capture.
 *
 * handleResponse attaches `.response` and throws. fetchRequest reaches it via
 * `return handleResponse(...)` - with no `await` - so the rejection is not caught by the
 * surrounding try/catch, and the error arrives with `.response` intact. Adding `await` there, a
 * very ordinary tidy-up, would route it through that catch, which rewraps as a plain Error and
 * moves the status to `.cause`. extractStatus would start returning undefined and the study page
 * would stop telling a 403 apart from a fault. This test fails if that happens.
 */
describe('extractStatus against the real fetch adapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reads the status off an error the adapter actually threw', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ message: 'User does not have permission' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    )))
    const { fetchGet } = await import('src/libs/ajax/fetchAdapter')

    const caught = await fetchGet('https://example.org/api/thing', {}).catch((error: unknown) => error)

    expect(extractStatus(caught)).toBe(403)
  })

  it('is undefined when the adapter never reached the server', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const { fetchGet } = await import('src/libs/ajax/fetchAdapter')

    const caught = await fetchGet('https://example.org/api/thing', {}).catch((error: unknown) => error)

    expect(extractStatus(caught)).toBeUndefined()
  })
})
