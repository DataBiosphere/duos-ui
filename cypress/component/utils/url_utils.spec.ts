import { getSafeHttpUrl, isSafeHttpUrl } from 'src/utils/UrlUtils'

describe('UrlUtils', () => {
  it('allows absolute http and https URLs', () => {
    expect(getSafeHttpUrl(' https://example.com/path ')).to.equal('https://example.com/path')
    expect(isSafeHttpUrl('http://example.com')).to.equal(true)
  })

  it('rejects non-http schemes and relative URLs', () => {
    expect(getSafeHttpUrl('javascript:alert(1)')).to.equal(undefined)
    expect(getSafeHttpUrl('data:text/html,<script>alert(1)</script>')).to.equal(undefined)
    expect(getSafeHttpUrl('mailto:user@example.com')).to.equal(undefined)
    expect(getSafeHttpUrl('/local/path')).to.equal(undefined)
  })
})
