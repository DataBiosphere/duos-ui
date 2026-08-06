import { validateHttpUrl } from 'src/utils/UrlUtils'

const formattedIdentifierUrl = (profileId: string, baseUrl: string): string => {
  const normalizedProfileValue = profileId.trim()
  return validateHttpUrl(normalizedProfileValue) ?? `${baseUrl}${normalizedProfileValue.replace(/^\/+/, '')}`
}

export const formattedLinkedIn = (profileId: string): string =>
  formattedIdentifierUrl(profileId, 'https://www.linkedin.com/in/')

export const formattedOrcid = (profileId: string): string =>
  formattedIdentifierUrl(profileId, 'https://orcid.org/')

export const formattedThroughBio = (profileId: string): string =>
  formattedIdentifierUrl(profileId, 'https://through.bio/')
