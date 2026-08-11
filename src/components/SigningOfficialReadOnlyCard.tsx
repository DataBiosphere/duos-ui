import React from 'react'
import { ExternalProfiles } from 'src/types/model'
import { validateHttpUrl } from 'src/utils/UrlUtils'
import { formattedLinkedIn, formattedOrcid, formattedThroughBio } from 'src/utils/ExternalProfileUtils'

export interface SigningOfficialReadOnlyCardProps {
  name: string
  email: string
  institutionName?: string
  externalProfiles?: ExternalProfiles
}

const dtStyle = { fontWeight: 'bold' as const }
const ddStyle = { margin: 0 }
const dlStyle = {
  display: 'grid',
  gridTemplateColumns: 'max-content 1fr',
  columnGap: '1rem',
  rowGap: '0.25rem',
  alignItems: 'baseline',
  margin: 0,
}

const trimmedOrUndefined = (value?: string): string | undefined => {
  const trimmed = value?.trim()
  return trimmed || undefined
}

function ProfileLink({ label, url }: Readonly<{ label: string, url: string }>) {
  const validUrl = validateHttpUrl(url)
  return (
    <>
      <dt style={dtStyle}>{label}</dt>
      <dd style={ddStyle}>
        {validUrl
          ? (
              <a href={validUrl} target="_blank" rel="noopener noreferrer" aria-label={`${label}: ${url}`}>
                {url}
              </a>
            )
          : <span>{url}</span>}
      </dd>
    </>
  )
}

export default function SigningOfficialReadOnlyCard(props: Readonly<SigningOfficialReadOnlyCardProps>) {
  const { name, email, institutionName, externalProfiles } = props

  const linkedIn = trimmedOrUndefined(externalProfiles?.linkedIn)
  const orcid = trimmedOrUndefined(externalProfiles?.ORCID)
  const throughBio = trimmedOrUndefined(externalProfiles?.throughBio)
  const institutionalWebsite = trimmedOrUndefined(externalProfiles?.institutionalWebsite)

  const hasExternalProfiles = Boolean(linkedIn || orcid || throughBio || institutionalWebsite)

  return (
    <section aria-label={`Signing Official: ${name}`} style={{ marginTop: '0.5rem' }}>
      <dl style={dlStyle}>
        <dt style={dtStyle}>Name</dt>
        <dd style={ddStyle}>{name}</dd>

        <dt style={dtStyle}>Email</dt>
        <dd style={ddStyle}>
          <a href={`mailto:${email}`} aria-label={`Email ${name}: ${email}`}>{email}</a>
        </dd>

        {institutionName && (
          <>
            <dt style={dtStyle}>Institution</dt>
            <dd style={ddStyle}>{institutionName}</dd>
          </>
        )}

        {hasExternalProfiles && (
          <>
            {linkedIn && (
              <ProfileLink label="LinkedIn" url={formattedLinkedIn(linkedIn)} />
            )}
            {orcid && (
              <ProfileLink label="ORCID iD" url={formattedOrcid(orcid)} />
            )}
            {throughBio && (
              <ProfileLink label="Through.bio" url={formattedThroughBio(throughBio)} />
            )}
            {institutionalWebsite && (
              <ProfileLink label="Institutional Website" url={institutionalWebsite} />
            )}
          </>
        )}
      </dl>
    </section>
  )
}
