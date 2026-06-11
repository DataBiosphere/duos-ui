import { describe, it, expect } from 'vitest'
import { validateHttpUrl, isValidHttpUrl } from 'src/utils/UrlUtils'

describe('UrlUtils', () => {
  it('allows absolute http and https URLs', () => {
    expect(validateHttpUrl(' https://example.com/path ')).toBe('https://example.com/path')
    expect(isValidHttpUrl('http://example.com')).toBe(true)
  })

  it('rejects non-http schemes and relative URLs', () => {
    expect(validateHttpUrl('javascript:alert(1)')).toBe(undefined)
    expect(validateHttpUrl('data:text/html,<script>alert(1)</script>')).toBe(undefined)
    expect(validateHttpUrl('mailto:user@example.com')).toBe(undefined)
    expect(validateHttpUrl('/local/path')).toBe(undefined)
  })
})
