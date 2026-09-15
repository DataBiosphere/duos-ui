import { validateHttpUrl } from 'src/utils/UrlUtils'

export type PiProfileLinkKind = 'orcid' | 'linkedin' | 'website'

export interface PiProfileLink {
  href: string
  label: string
  kind: PiProfileLinkKind
}

const WEBSITE_LABEL = 'PI website'

interface PiProfileFields {
  orcid?: string
  linkedinUrl?: string
  websiteUrl?: string
}

// A bare identifier is expanded to its orcid.org URL; anything already absolute is validated
// like every other study-submitted URL rather than trusted.
const orcidHref = (orcid: string): string | undefined => {
  // Normalize before deciding which of the two this is. Checked raw, a padded URL failed the
  // scheme test and was pasted onto the orcid.org base - a link to a nonsense path - and a
  // whitespace-only value became a link to the ORCID home page once validateHttpUrl trimmed it.
  // Leading slashes go too, so "/0000-0002-..." does not yield a doubled path.
  const normalized = orcid.trim().replace(/^\/+/, '')
  if (!normalized) {
    return undefined
  }
  // Case-insensitive: schemes are, so "HTTPS://orcid.org/0000-..." is an absolute URL. Matched
  // with startsWith('http') it read as a bare identifier and became orcid.org/HTTPS://orcid.org/...
  return validateHttpUrl(/^https?:/i.test(normalized) ? normalized : `https://orcid.org/${normalized}`)
}

/**
 * Whether a URL is served by the profile site it claims to be. Subdomains count, since LinkedIn
 * runs country sites such as uk.linkedin.com, but the leading dot is required: a bare suffix
 * test would also accept notlinkedin.com. `hostname` is already lowercased by the parser.
 */
const isServedBy = (href: string, domain: string): boolean => {
  try {
    const { hostname } = new URL(href)
    return hostname === domain || hostname.endsWith(`.${domain}`)
  }
  catch {
    return false
  }
}

/**
 * A profile link, but only under its own label when the host backs the claim. Anything else is
 * shown as a plain website rather than dropped - the submitter typed something and losing it
 * silently helps nobody - but never beneath the ORCID or LinkedIn label, since these render on a
 * page an unauthenticated visitor can read and the label is what they would be trusting.
 */
const profileLink = (
  href: string | undefined, domain: string, label: string, kind: PiProfileLinkKind,
): PiProfileLink | undefined => {
  if (!href) {
    return undefined
  }
  return isServedBy(href, domain) ? { href, label, kind } : { href, label: WEBSITE_LABEL, kind: 'website' }
}

/**
 * The PI's external profile links, dropping any the data submitter typed that isn't a plain
 * http(s) URL. Callers need the list itself, not just the icons, to decide whether the PI row
 * has anything to show at all. Kept apart from the component that renders the icons so this
 * stays a plain module rather than a component file with a second export.
 */
export const getPiProfileLinks = ({ orcid, linkedinUrl, websiteUrl }: PiProfileFields): PiProfileLink[] => {
  const website = validateHttpUrl(websiteUrl)
  const candidates = [
    profileLink(orcid ? orcidHref(orcid) : undefined, 'orcid.org', 'ORCID profile', 'orcid'),
    profileLink(validateHttpUrl(linkedinUrl), 'linkedin.com', 'LinkedIn profile', 'linkedin'),
    website ? { href: website, label: WEBSITE_LABEL, kind: 'website' as const } : undefined,
  ]

  return candidates.filter(candidate => candidate !== undefined)
}
