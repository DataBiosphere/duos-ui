import { describe, expect, it } from 'vitest'
import { formattedLinkedIn, formattedOrcid, formattedThroughBio } from 'src/utils/ExternalProfileUtils'

describe('ExternalProfileUtils', () => {
  it.each([
    [formattedLinkedIn, 'janedoe', 'https://www.linkedin.com/in/janedoe'],
    [formattedOrcid, '0000-0002-1825-0097', 'https://orcid.org/0000-0002-1825-0097'],
    [formattedThroughBio, 'janedoe', 'https://through.bio/janedoe'],
  ])('formats an identifier with its provider URL', (formatter, identifier, expected) => {
    expect(formatter(identifier)).toBe(expected)
  })

  it.each([
    [formattedLinkedIn, ' https://www.linkedin.com/in/janedoe '],
    [formattedOrcid, 'https://orcid.org/0000-0002-1825-0097'],
    [formattedThroughBio, 'https://through.bio/janedoe'],
  ])('preserves a fully qualified URL', (formatter, url) => {
    expect(formatter(url)).toBe(url.trim())
  })

  it('removes leading slashes from an identifier', () => {
    expect(formattedOrcid('/0000-0002-1825-0097')).toBe('https://orcid.org/0000-0002-1825-0097')
  })
})
