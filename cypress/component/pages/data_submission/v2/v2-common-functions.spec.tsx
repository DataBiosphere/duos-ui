import { extractThroughBioId } from 'src/pages/data_submission/v2/v2-common-functions'

describe('extractThroughBioId', () => {
  it('extracts ID from a valid through.bio URL', () => {
    expect(extractThroughBioId('https://through.bio/abc123')).to.equal('abc123')
    expect(extractThroughBioId('https://through.bio/xyz')).to.equal('xyz')
    expect(extractThroughBioId('https://through.bio/abc/def')).to.equal('abc/def')
  })

  it('returns empty string for non-through.bio URLs', () => {
    expect(extractThroughBioId('https://example.com/abc123')).to.equal('')
    expect(extractThroughBioId('http://throughbio.com/abc')).to.equal('')
  })

  it('returns trimmed input for non-URL strings', () => {
    expect(extractThroughBioId('  myid  ')).to.equal('myid')
    expect(extractThroughBioId('anotherId')).to.equal('anotherId')
  })

  it('returns empty string for empty input', () => {
    expect(extractThroughBioId('')).to.equal('')
    expect(extractThroughBioId('   ')).to.equal('')
  })
})
