import { describe, expect, it } from 'vitest'
import { getExternalProfileLinks } from 'src/pages/user_profile/externalProfileUtils'

describe('getExternalProfileLinks', () => {
  it('formats profile identifiers and preserves complete URLs', () => {
    expect(getExternalProfileLinks({
      linkedIn: 'researcher',
      ORCID: 'https://orcid.org/0000-0000-0000-0001',
      throughBio: '',
      institutionalWebsite: 'https://example.edu/researcher',
      otherUrls: ['not-a-url', 'https://example.com/profile'],
    })).toEqual([
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/researcher' },
      { label: 'ORCID', url: 'https://orcid.org/0000-0000-0000-0001' },
      { label: 'Institutional Website', url: 'https://example.edu/researcher' },
      { label: 'Other URL 2', url: 'https://example.com/profile' },
    ])
  })
})
