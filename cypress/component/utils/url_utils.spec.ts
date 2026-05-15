import { validateHttpUrl, isValidHttpUrl } from 'src/utils/UrlUtils'

describe('UrlUtils', () => {
  it('allows absolute http and https URLs', () => {
    expect(validateHttpUrl(' https://example.com/path ')).to.equal('https://example.com/path')
    expect(isValidHttpUrl('http://example.com')).to.equal(true)
  })

  it('rejects non-http schemes and relative URLs', () => {
    expect(validateHttpUrl('javascript:alert(1)')).to.equal(undefined)
    expect(validateHttpUrl('data:text/html,<script>alert(1)</script>')).to.equal(undefined)
    expect(validateHttpUrl('mailto:user@example.com')).to.equal(undefined)
    expect(validateHttpUrl('/local/path')).to.equal(undefined)
  })
})
