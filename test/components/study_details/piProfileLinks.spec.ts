import { describe, it, expect } from 'vitest'
import { getPiProfileLinks } from 'src/components/study_details/piProfileLinks'

describe('getPiProfileLinks', () => {
  it('expands a bare ORCID identifier to its orcid.org URL', () => {
    const [link] = getPiProfileLinks({ orcid: '0000-0002-1825-0097' })
    expect(link).toEqual({
      href: 'https://orcid.org/0000-0002-1825-0097',
      label: 'ORCID profile',
      kind: 'orcid',
      field: 'orcid',
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

  /** A leading slash would otherwise yield a doubled path under the orcid.org base. */
  it.each(['/0000-0002-1825-0097', '//0000-0002-1825-0097', '  /0000-0002-1825-0097  '])(
    'strips leading slashes from an identifier (%j)',
    (orcid) => {
      const [link] = getPiProfileLinks({ orcid })
      expect(link.href).toBe('https://orcid.org/0000-0002-1825-0097')
    },
  )

  /** A whitespace-only value became a link to the ORCID home page once the base was trimmed. */
  it.each(['', '   ', '\t\n'])('omits a blank ORCID value (%j)', (orcid) => {
    expect(getPiProfileLinks({ orcid })).toEqual([])
  })

  /** Schemes are case-insensitive, so this is an absolute URL, not a bare identifier. */
  it('recognizes an uppercase scheme as a URL rather than an identifier', () => {
    expect(getPiProfileLinks({ orcid: 'HTTPS://orcid.org/0000-0002-1825-0097' }))
      .toEqual([{ href: 'HTTPS://orcid.org/0000-0002-1825-0097', label: 'ORCID profile', kind: 'orcid', field: 'orcid' }])
  })

  it('accepts an orcid.org subdomain', () => {
    expect(getPiProfileLinks({ orcid: 'https://www.orcid.org/0000-0002-1825-0097' })[0])
      .toMatchObject({ label: 'ORCID profile', kind: 'orcid' })
  })

  it('accepts a linkedin.com country subdomain', () => {
    expect(getPiProfileLinks({ linkedinUrl: 'https://uk.linkedin.com/in/someone' })[0])
      .toMatchObject({ label: 'LinkedIn profile', kind: 'linkedin' })
  })

  /**
   * The study page is readable without signing in, and these render under a label and an icon
   * that assert whose profile it is. A submitter-supplied host that is not the service must not
   * borrow that claim.
   */
  it('demotes an off-host profile url to a plain website', () => {
    expect(getPiProfileLinks({ orcid: 'https://evil.example/0000-0002-1825-0097' }))
      .toEqual([{ href: 'https://evil.example/0000-0002-1825-0097', label: 'PI website', kind: 'website', field: 'orcid' }])
    expect(getPiProfileLinks({ linkedinUrl: 'https://evil.example/in/someone' }))
      .toEqual([{ href: 'https://evil.example/in/someone', label: 'PI website', kind: 'website', field: 'linkedin' }])
  })

  /** A suffix test alone would accept this; the boundary dot is what rejects it. */
  it('does not accept a lookalike domain that merely ends with the real one', () => {
    expect(getPiProfileLinks({ linkedinUrl: 'https://notlinkedin.com/in/someone' })[0])
      .toMatchObject({ label: 'PI website', kind: 'website' })
    expect(getPiProfileLinks({ orcid: 'https://notorcid.org/0000-0002-1825-0097' })[0])
      .toMatchObject({ label: 'PI website', kind: 'website' })
  })

  it('drops values that are not plain http(s) URLs', () => {
    expect(getPiProfileLinks({
      linkedinUrl: 'javascript:alert(1)',
      websiteUrl: 'not a url',
    })).toEqual([])
  })

  /**
   * Keys have to survive a submitter reusing one URL across fields, and the demotion path, which
   * gives two links the same generic label. The source field is the only value unique to each.
   */
  it('distinguishes links that share a url or a label', () => {
    const sameUrl = getPiProfileLinks({
      linkedinUrl: 'https://linkedin.com/in/someone',
      websiteUrl: 'https://linkedin.com/in/someone',
    })
    expect(sameUrl.map(link => link.field)).toEqual(['linkedin', 'website'])
    expect(new Set(sameUrl.map(link => link.field)).size).toBe(sameUrl.length)

    const bothDemoted = getPiProfileLinks({
      orcid: 'https://elsewhere.example/a',
      linkedinUrl: 'https://elsewhere.example/b',
      websiteUrl: 'https://elsewhere.example/c',
    })
    expect(bothDemoted.map(link => link.label)).toEqual(['PI website', 'PI website', 'PI website'])
    expect(new Set(bothDemoted.map(link => link.field)).size).toBe(3)
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
