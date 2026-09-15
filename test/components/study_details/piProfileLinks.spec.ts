import { describe, it, expect } from 'vitest'
import { getPiProfileLinks } from 'src/components/study_details/piProfileLinks'

describe('getPiProfileLinks', () => {
  it('expands a bare ORCID identifier to its orcid.org URL', () => {
    const [link] = getPiProfileLinks({ orcid: '0000-0002-1825-0097' })
    expect(link).toEqual({
      href: 'https://orcid.org/0000-0002-1825-0097',
      label: 'ORCID profile',
      kind: 'orcid',
    })
  })

  it('keeps a complete ORCID URL as it was given', () => {
    const [link] = getPiProfileLinks({ orcid: 'https://orcid.org/0000-0002-1825-0097' })
    expect(link.href).toBe('https://orcid.org/0000-0002-1825-0097')
  })

  /**
   * The submitted value is free text. Checked untrimmed, a padded URL failed the startsWith test
   * and was pasted onto the orcid.org base, producing a link to a nonsense path.
   */
  it('recognizes a padded URL as a URL rather than an identifier', () => {
    const [link] = getPiProfileLinks({ orcid: '  https://orcid.org/0000-0002-1825-0097  ' })
    expect(link.href).toBe('https://orcid.org/0000-0002-1825-0097')
  })

  /** A whitespace-only value became a link to the ORCID home page once the base was trimmed. */
  it.each(['', '   ', '\t\n'])('omits a blank ORCID value (%j)', (orcid) => {
    expect(getPiProfileLinks({ orcid })).toEqual([])
  })

  it('drops values that are not plain http(s) URLs', () => {
    expect(getPiProfileLinks({
      linkedinUrl: 'javascript:alert(1)',
      websiteUrl: 'not a url',
    })).toEqual([])
  })

  it('returns the links that are present, in a stable order', () => {
    const links = getPiProfileLinks({
      orcid: '0000-0002-1825-0097',
      linkedinUrl: 'https://linkedin.com/in/example',
      websiteUrl: 'https://example.org',
    })
    expect(links.map(link => link.kind)).toEqual(['orcid', 'linkedin', 'website'])
  })
})
