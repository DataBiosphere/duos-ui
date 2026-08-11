import { validateHttpUrl } from 'src/utils/UrlUtils'

export const normalizeIdentifierUrl = (profileId: string, baseUrl: string): string => {
  const normalizedProfileValue = profileId.trim()
  return validateHttpUrl(normalizedProfileValue) ?? `${baseUrl}${normalizedProfileValue.replace(/^\/+/, '')}`
}

export const formattedLinkedIn = (profileId: string): string =>
  normalizeIdentifierUrl(profileId, 'https://www.linkedin.com/in/')

export const formattedOrcid = (profileId: string): string =>
  normalizeIdentifierUrl(profileId, 'https://orcid.org/')

export const formattedThroughBio = (profileId: string): string =>
  normalizeIdentifierUrl(profileId, 'https://through.bio/')
