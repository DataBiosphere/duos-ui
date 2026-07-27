import { ExternalProfiles } from 'src/types/model'
import { validateHttpUrl } from 'src/utils/UrlUtils'

export interface ExternalProfileLink {
  label: string
  url: string
}

const identifierUrl = (value: string | undefined, baseUrl: string): string | undefined => {
  const trimmedValue = value?.trim()
  if (!trimmedValue) {
    return undefined
  }
  return validateHttpUrl(trimmedValue) ?? `${baseUrl}${trimmedValue.replace(/^\/+/, '')}`
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
  const links: Array<ExternalProfileLink | undefined> = [
    linkedIn ? { label: 'LinkedIn', url: linkedIn } : undefined,
    orcid ? { label: 'ORCID', url: orcid } : undefined,
    throughBio ? { label: 'Through.bio', url: throughBio } : undefined,
    institutionalWebsite ? { label: 'Institutional Website', url: institutionalWebsite } : undefined,
    ...(profiles.otherUrls ?? []).map((value, index) => {
      const url = urlValue(value)
      return url ? { label: `Other URL ${index + 1}`, url } : undefined
    }),
  ]

  return links.filter((link): link is ExternalProfileLink => link !== undefined)
}
