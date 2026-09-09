import { validateHttpUrl } from 'src/utils/UrlUtils'

export type PiProfileLinkKind = 'orcid' | 'linkedin' | 'website'

export interface PiProfileLink {
  href: string
  label: string
  kind: PiProfileLinkKind
}

interface PiProfileFields {
  orcid?: string
  linkedinUrl?: string
  websiteUrl?: string
}

// A bare identifier is expanded to its orcid.org URL; anything already absolute is validated
// like every other study-submitted URL rather than trusted.
const orcidHref = (orcid: string): string | undefined =>
  validateHttpUrl(orcid.startsWith('http') ? orcid : `https://orcid.org/${orcid}`)

/**
 * The PI's external profile links, dropping any the data submitter typed that isn't a plain
 * http(s) URL. Callers need the list itself, not just the icons, to decide whether the PI row
 * has anything to show at all. Kept apart from the component that renders the icons so this
 * stays a plain module rather than a component file with a second export.
 */
export const getPiProfileLinks = ({ orcid, linkedinUrl, websiteUrl }: PiProfileFields): PiProfileLink[] => {
  const candidates: Array<[string | undefined, string, PiProfileLinkKind]> = [
    [orcid ? orcidHref(orcid) : undefined, 'ORCID profile', 'orcid'],
    [validateHttpUrl(linkedinUrl), 'LinkedIn profile', 'linkedin'],
    [validateHttpUrl(websiteUrl), 'PI website', 'website'],
  ]

  return candidates.flatMap(([href, label, kind]) => href ? [{ href, label, kind }] : [])
}
