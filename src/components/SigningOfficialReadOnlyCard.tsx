import { ExternalProfiles } from 'src/types/model'
import { validateHttpUrl } from 'src/utils/UrlUtils'

export interface SigningOfficialReadOnlyCardProps {
  name: string
  email: string
  institutionName?: string
  externalProfiles?: ExternalProfiles
}

const formattedLinkedIn = (profileId: string): string => `https://www.linkedin.com/in/${profileId}`
const formattedOrcid = (profileId: string): string => `https://orcid.org/${profileId}`
const formattedThroughBio = (profileId: string): string => `https://through.bio/${profileId}`

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

  const hasExternalProfiles = Boolean(
    externalProfiles?.linkedIn
    || externalProfiles?.ORCID
    || externalProfiles?.throughBio
    || externalProfiles?.institutionalWebsite,
  )

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
            <dt style={{ ...dtStyle, gridColumn: '1 / -1', marginTop: '0.5rem' }}>External Profile</dt>
            {externalProfiles?.linkedIn && (
              <ProfileLink label="LinkedIn" url={formattedLinkedIn(externalProfiles.linkedIn)} />
            )}
            {externalProfiles?.ORCID && (
              <ProfileLink label="ORCID iD" url={formattedOrcid(externalProfiles.ORCID)} />
            )}
            {externalProfiles?.throughBio && (
              <ProfileLink label="Through.bio" url={formattedThroughBio(externalProfiles.throughBio)} />
            )}
            {externalProfiles?.institutionalWebsite && (
              <ProfileLink label="Institutional Website" url={externalProfiles.institutionalWebsite} />
            )}
          </>
        )}
      </dl>
    </section>
  )
}
