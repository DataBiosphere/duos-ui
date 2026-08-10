import { ExternalProfiles } from 'src/types/model'
import { validateHttpUrl } from 'src/utils/UrlUtils'
import { normalizeIdentifierUrl } from 'src/utils/ExternalProfileUtils'

export interface ExternalProfileLink {
  label: string
  url: string
}

const identifierUrl = (value: string | undefined, baseUrl: string): string | undefined => {
  const trimmedValue = value?.trim()
  return trimmedValue ? normalizeIdentifierUrl(trimmedValue, baseUrl) : undefined
}

const urlValue = (value: string | undefined): string | undefined => {
  const trimmedValue = value?.trim()
  return trimmedValue ? validateHttpUrl(trimmedValue) : undefined
}

export const getExternalProfileLinks = (profiles: ExternalProfiles = {}): ExternalProfileLink[] => {
  const linkedIn = identifierUrl(profiles.linkedIn, 'https://www.linkedin.com/in/')
  const orcid = identifierUrl(profiles.ORCID, 'https://orcid.org/')
  const throughBio = identifierUrl(profiles.throughBio, 'https://through.bio/')
  const institutionalWebsite = urlValue(profiles.institutionalWebsite)
  const otherUrls = (profiles.otherUrls ?? [])
    .map(urlValue)
    .filter((url): url is string => url !== undefined)
    .map((url, index) => ({ label: `Other URL ${index + 1}`, url }))
  const links: Array<ExternalProfileLink | undefined> = [
    linkedIn ? { label: 'LinkedIn', url: linkedIn } : undefined,
    orcid ? { label: 'ORCID', url: orcid } : undefined,
    throughBio ? { label: 'Through.bio', url: throughBio } : undefined,
    institutionalWebsite ? { label: 'Institutional Website', url: institutionalWebsite } : undefined,
    ...otherUrls,
  ]

  return links.filter((link): link is ExternalProfileLink => link !== undefined)
}
