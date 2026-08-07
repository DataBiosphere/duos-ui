import React, { useEffect, useRef, useState } from 'react'
import { isEmpty } from 'src/utils/NodashUtil'
import { DAR } from 'src/libs/ajax/DAR'
import { DownloadLink } from 'src/components/DownloadLink'
import { User } from 'src/libs/ajax/User'
import { DataAccessRequestData, DataUseTerm, ExternalProfiles, SigningOfficialUserWithData } from 'src/types/model'
import { Theme } from 'src/libs/theme'
import { validateHttpUrl } from 'src/utils/UrlUtils'
import { formattedLinkedIn, formattedOrcid, formattedThroughBio } from 'src/utils/ExternalProfileUtils'
import { DarInfo, DataUseTranslation } from 'src/libs/dataUseTranslation'

const factsColumnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  rowGap: '0.7rem',
  minWidth: 0,
}

const styles: Record<string, React.CSSProperties> = {
  containerRow: {
    margin: '0rem 1.2rem',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'baseline',
    marginLeft: '0px',
    flexWrap: 'wrap',
    rowGap: '0.8rem',
    columnGap: '0.4rem',
  },
  titleRow: {
    marginBottom: '0.8rem',
    flexWrap: 'nowrap',
    minWidth: 0,
  },
  titleText: {
    fontWeight: 700,
    fontSize: 'clamp(1.8rem, 3.2vw, 2.4rem)',
    color: Theme.palette.primary,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  projectTitleText: {
    fontWeight: 700,
    fontSize: 'clamp(1.8rem, 3.2vw, 2.4rem)',
    color: Theme.palette.primary,
    whiteSpace: 'nowrap',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  readOnlyTag: {
    fontWeight: 400,
    fontSize: 'clamp(1.1rem, 1.8vw, 1.4rem)',
    color: '#6b6b6b',
    marginLeft: '0.4rem',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  approvedDatasetsRow: {
    marginBottom: '0.4rem',
  },
  approvedDatasetsText: {
    fontStyle: 'italic',
    fontWeight: 400,
    fontSize: 'clamp(1.05rem, 1.7vw, 1.25rem)',
    color: '#6b6b6b',
    overflowWrap: 'anywhere',
  },
  factsContainer: {
    margin: '0.8rem 1.2rem 1.5rem',
    padding: '1.2rem 1.8rem',
    backgroundColor: Theme.palette.background.secondary,
    borderRadius: '8px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(15rem, 1fr))',
    columnGap: '2rem',
    rowGap: '1.2rem',
    alignItems: 'start',
  },
  factsColumn: factsColumnStyle,
  factsColumnBordered: {
    ...factsColumnStyle,
    borderLeft: '1px solid rgba(31, 59, 80, 0.15)',
    paddingLeft: '1.6rem',
  },
  columnHeading: {
    fontSize: 'clamp(1.15rem, 1.9vw, 1.35rem)',
    fontWeight: 700,
    color: Theme.palette.primary,
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
    marginBottom: '0.2rem',
    borderBottom: '1px solid rgba(31, 59, 80, 0.2)',
    paddingBottom: '0.4rem',
  },
  factItem: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: '0.4rem',
    minWidth: 0,
  },
  factLabel: {
    fontSize: 'clamp(1.1rem, 1.8vw, 1.3rem)',
    fontWeight: 600,
    color: Theme.palette.primary,
    whiteSpace: 'nowrap',
  },
  factValue: {
    fontSize: 'clamp(1.2rem, 2vw, 1.5rem)',
    fontWeight: 400,
    overflowWrap: 'anywhere',
    minWidth: 0,
  },
  factValueMuted: {
    fontSize: 'clamp(1.2rem, 2vw, 1.5rem)',
    fontWeight: 400,
    fontStyle: 'italic',
    color: '#6b6b6b',
  },
  narrativeSectionContainer: {
    margin: '0 1.2rem 1.5rem',
    padding: '1.2rem 1.8rem',
    backgroundColor: Theme.palette.background.secondary,
    borderRadius: '8px',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    columnGap: '2rem',
    rowGap: '1.2rem',
    alignItems: 'start',
  },
  narrativeTextBox: {
    backgroundColor: 'white',
    borderRadius: '6px',
    padding: '1rem 1.2rem',
    fontSize: 'clamp(1.2rem, 2vw, 1.5rem)',
    lineHeight: 1.5,
    overflowWrap: 'anywhere',
    maxHeight: '14rem',
    overflowY: 'auto',
  },
  duoTermsBox: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '0.7rem',
    maxHeight: '14rem',
    overflowY: 'auto',
    paddingRight: '0.4rem',
  },
  duoTermCard: {
    display: 'flex',
    alignItems: 'flex-start',
    columnGap: '0.8rem',
    backgroundColor: 'white',
    borderRadius: '6px',
    padding: '0.6rem 0.9rem',
  },
  duoTermCardPrimary: {
    boxShadow: `0 0 0 1.5px ${Theme.palette.primary}`,
  },
  duoTermCardSecondary: {
    boxShadow: '0 0 0 1px rgba(31, 59, 80, 0.2)',
  },
  duoCodeBadge: {
    flexShrink: 0,
    minWidth: '3.4rem',
    borderRadius: '999px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'white',
    padding: '0.25rem 0.7rem',
  },
  duoCodeBadgePrimary: {
    backgroundColor: Theme.palette.secondary,
  },
  duoCodeBadgeSecondary: {
    backgroundColor: '#7ab8e0',
  },
  duoCodeBadgeManualReview: {
    backgroundColor: '#db5454',
  },
  duoDescription: {
    fontSize: 'clamp(1.15rem, 1.9vw, 1.4rem)',
    fontWeight: 400,
    color: '#333f52',
    overflowWrap: 'anywhere',
    flex: 1,
    minWidth: 0,
  },
  duoDescriptionPrimary: {
    fontWeight: 700,
  },
  duoDescriptionManualReview: {
    color: '#e57373',
  },
  scrollableWrapper: {
    position: 'relative',
  },
  scrollFadeOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '2.8rem',
    pointerEvents: 'none',
    borderRadius: '0 0 6px 6px',
  },
  scrollHintChevron: {
    position: 'absolute',
    bottom: '0.1rem',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '1.3rem',
    lineHeight: 1,
    color: Theme.palette.primary,
    fontWeight: 700,
    pointerEvents: 'none',
  },
  documentLinkRow: {
    margin: '0 1.2rem 1.5rem',
  },
}

const appliedTitleRowStyle: React.CSSProperties = { ...styles.containerRow, ...styles.titleRow }
const appliedApprovedDatasetsRowStyle: React.CSSProperties = { ...styles.containerRow, ...styles.approvedDatasetsRow }

const getApprovedDatasetsText = (approvedDatasets: string[]): string => {
  if (approvedDatasets.length > 0) {
    return `${approvedDatasets.length} Dataset${approvedDatasets.length > 1 ? 's' : ''} approved: ${approvedDatasets.join(', ')}`
  }
  return 'No datasets approved'
}

interface Collaborator {
  name: string
}

const processCollaborators = (collaborators: Collaborator[]) =>
  collaborators.map(collaborator => collaborator.name).join(', ')

const getCloudUseText = (cloudComputing: boolean, cloudProvider: string): string => {
  if (!cloudComputing) return 'No'
  return isEmpty(cloudProvider) || cloudProvider === '- -' ? 'Yes' : `Yes (${cloudProvider})`
}

const trimmedOrUndefined = (value?: string): string | undefined => {
  const trimmed = value?.trim()
  return trimmed || undefined
}

function ProfileFactLink({ label, url, id }: Readonly<{ label: string, url: string, id: string }>) {
  const validUrl = validateHttpUrl(url)
  return (
    <div className="fact-item" style={styles.factItem} id={id}>
      <span style={styles.factLabel}>{label}:</span>
      <span style={styles.factValue}>
        {validUrl
          ? <a href={validUrl} target="_blank" rel="noopener noreferrer" aria-label={`${label}: ${url}`}>{url}</a>
          : url}
      </span>
    </div>
  )
}

function DuoTermCard({ term, id, isPrimary }: Readonly<{ term: DataUseTerm, id: string, isPrimary: boolean }>) {
  return (
    <div
      className="duo-term-card"
      id={id}
      style={{ ...styles.duoTermCard, ...(isPrimary ? styles.duoTermCardPrimary : styles.duoTermCardSecondary) }}
    >
      <span
        style={{
          ...styles.duoCodeBadge,
          ...(isPrimary ? styles.duoCodeBadgePrimary : styles.duoCodeBadgeSecondary),
          ...(term.manualReview ? styles.duoCodeBadgeManualReview : {}),
        }}
      >
        {term.code}
      </span>
      <span
        style={{
          ...styles.duoDescription,
          ...(isPrimary ? styles.duoDescriptionPrimary : {}),
          ...(term.manualReview ? styles.duoDescriptionManualReview : {}),
        }}
      >
        {term.description}
      </span>
    </div>
  )
}

function ScrollableBox({
  children,
  boxStyle,
  className,
  id,
  fadeColor,
  label,
}: Readonly<{
  children: React.ReactNode
  boxStyle: React.CSSProperties
  className: string
  id?: string
  fadeColor: string
  label: string
}>) {
  const contentRef = useRef<HTMLElement>(null)
  const [isScrollable, setIsScrollable] = useState(false)

  // Intentionally runs on every render (no deps) to re-measure overflow as content changes.
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const el = contentRef.current
    if (el) setIsScrollable(el.scrollHeight > el.clientHeight + 1)
  })

  return (
    <div style={styles.scrollableWrapper}>
      <section
        ref={contentRef}
        className={className}
        id={id}
        style={boxStyle}
        aria-label={label}
      >
        {children}
      </section>
      {isScrollable && (
        <>
          <div aria-hidden="true" style={{ ...styles.scrollFadeOverlay, background: `linear-gradient(rgba(255, 255, 255, 0), ${fadeColor})` }} />
          <span aria-hidden="true" className="scroll-hint-chevron" style={styles.scrollHintChevron}>&#9662;</span>
        </>
      )}
    </div>
  )
}

export interface ReviewHeaderProps {
  darCode?: string
  projectTitle?: string
  userName?: string
  institutionName?: string
  approvedDatasets: string[]
  readOnly?: boolean
  isLoading?: boolean
  email?: string
  externalCollaborators?: Collaborator[]
  internalCollaborators?: Collaborator[]
  internalLabStaff?: Collaborator[]
  signingOfficialName?: string
  signingOfficialEmail?: string
  researcherInstitutionId?: number
  itDirectorEmail?: string
  anvilStorage?: boolean
  localComputing?: boolean
  cloudComputing?: boolean
  cloudProvider?: string
  cloudProviderDescription?: string
  referenceId?: string
  collaborationLetterLocation?: string
  collaborationLetterName?: string
  researcherExternalProfiles?: ExternalProfiles
  darInfo?: Partial<DataAccessRequestData>
}

export default function ReviewHeader({
  darCode,
  projectTitle,
  userName,
  institutionName,
  approvedDatasets,
  readOnly = false,
  isLoading,
  email,
  externalCollaborators = [],
  internalCollaborators = [],
  internalLabStaff = [],
  signingOfficialName = '',
  signingOfficialEmail = '',
  researcherInstitutionId,
  itDirectorEmail,
  anvilStorage = false,
  localComputing = false,
  cloudComputing = false,
  cloudProvider = '- -',
  cloudProviderDescription,
  referenceId,
  collaborationLetterLocation,
  collaborationLetterName,
  researcherExternalProfiles,
  darInfo,
}: Readonly<ReviewHeaderProps>) {
  const soLookupKey = researcherInstitutionId && signingOfficialEmail
    ? `${researcherInstitutionId}:${signingOfficialEmail}`
    : undefined
  const [selectedSOResult, setSelectedSOResult] = useState<{
    lookupKey: string
    signingOfficial: SigningOfficialUserWithData | null
  } | null>(null)

  useEffect(() => {
    if (!researcherInstitutionId || !signingOfficialEmail || !soLookupKey) return
    let cancelled = false
    const loadSO = async () => {
      try {
        const sos = await User.getSOsForInstitution(researcherInstitutionId)
        const match = sos.find(so => so.email === signingOfficialEmail)
        if (!cancelled) {
          setSelectedSOResult({ lookupKey: soLookupKey, signingOfficial: match ?? null })
        }
      }
      catch {
        if (!cancelled) {
          setSelectedSOResult({ lookupKey: soLookupKey, signingOfficial: null })
        }
      }
    }
    void loadSO()
    return () => {
      cancelled = true
    }
  }, [researcherInstitutionId, signingOfficialEmail, soLookupKey])

  const selectedSO = selectedSOResult && selectedSOResult.lookupKey === soLookupKey
    ? selectedSOResult.signingOfficial
    : null
  const hasSigningOfficial = Boolean(signingOfficialName || signingOfficialEmail)
  const soName = selectedSO ? selectedSO.displayName : signingOfficialName
  const soEmail = selectedSO ? selectedSO.email : signingOfficialEmail
  const soInstitutionName = selectedSO?.institutionName
  const soExternalProfiles = selectedSO?.userData?.externalProfiles

  const researcherLinkedIn = trimmedOrUndefined(researcherExternalProfiles?.linkedIn)
  const researcherOrcid = trimmedOrUndefined(researcherExternalProfiles?.ORCID)
  const researcherThroughBio = trimmedOrUndefined(researcherExternalProfiles?.throughBio)
  const researcherInstitutionalWebsite = trimmedOrUndefined(researcherExternalProfiles?.institutionalWebsite)
  const soLinkedIn = trimmedOrUndefined(soExternalProfiles?.linkedIn)
  const soOrcid = trimmedOrUndefined(soExternalProfiles?.ORCID)
  const soThroughBio = trimmedOrUndefined(soExternalProfiles?.throughBio)
  const soInstitutionalWebsite = trimmedOrUndefined(soExternalProfiles?.institutionalWebsite)

  const { primary: primaryDuoTerms = [], secondary: secondaryDuoTerms = [] } = darInfo
    ? DataUseTranslation.translateDarInfo(darInfo as DarInfo)
    : { primary: [], secondary: [] }
  const hasDuoTerms = !isEmpty(primaryDuoTerms) || !isEmpty(secondaryDuoTerms)

  return (
    <>
      {!isLoading && (
        <div className="header-container">
          <div className="title-row" style={appliedTitleRowStyle}>
            <span className="dar-code" style={styles.titleText}>{darCode}</span>
            <span aria-hidden="true" style={styles.titleText}>:</span>
            <span className="collection-project-title" style={styles.projectTitleText} title={projectTitle}>{projectTitle}</span>
            {readOnly && <span className="read-only-tag" style={styles.readOnlyTag}>(read-only)</span>}
          </div>
          <div className="secondary-header-row" style={appliedApprovedDatasetsRowStyle}>
            <p style={styles.approvedDatasetsText}>
              {getApprovedDatasetsText(approvedDatasets)}
            </p>
          </div>
          <div className="application-facts-container" style={styles.factsContainer}>
            <div className="facts-column" style={styles.factsColumn} id="researcher-info-column">
              <span style={styles.columnHeading}>Requesting Researcher Info</span>
              {userName && (
                <div className="fact-item" style={styles.factItem} id="researcher-fact">
                  <span style={styles.factLabel}>Researcher:</span>
                  <span style={styles.factValue}>{userName}</span>
                </div>
              )}
              {email && (
                <div className="fact-item" style={styles.factItem} id="researcher-email-fact">
                  <span style={styles.factLabel}>Email:</span>
                  <span style={styles.factValue}>
                    <a href={`mailto:${email}`} aria-label={`Email ${userName || 'researcher'}: ${email}`}>{email}</a>
                  </span>
                </div>
              )}
              {institutionName && (
                <div className="fact-item" style={styles.factItem} id="institution-fact">
                  <span style={styles.factLabel}>Institution:</span>
                  <span style={styles.factValue}>{institutionName}</span>
                </div>
              )}
              {researcherLinkedIn && (
                <ProfileFactLink label="LinkedIn" id="researcher-linkedin-fact" url={formattedLinkedIn(researcherLinkedIn)} />
              )}
              {researcherOrcid && (
                <ProfileFactLink label="ORCID iD" id="researcher-orcid-fact" url={formattedOrcid(researcherOrcid)} />
              )}
              {researcherThroughBio && (
                <ProfileFactLink label="Through.bio" id="researcher-through-bio-fact" url={formattedThroughBio(researcherThroughBio)} />
              )}
              {researcherInstitutionalWebsite && (
                <ProfileFactLink label="Institutional Website" id="researcher-institutional-website-fact" url={researcherInstitutionalWebsite} />
              )}
            </div>
            <div className="facts-column" style={styles.factsColumnBordered} id="collaborators-column">
              <span style={styles.columnHeading}>Internal Lab Staff and Collaborators</span>
              {isEmpty(internalLabStaff) && isEmpty(internalCollaborators) && isEmpty(externalCollaborators)
                ? <span style={styles.factValueMuted}>None listed</span>
                : (
                    <>
                      {!isEmpty(internalLabStaff) && (
                        <div className="fact-item" style={styles.factItem} id="internal-lab-staff-fact">
                          <span style={styles.factLabel}>Internal Lab Staff:</span>
                          <span style={styles.factValue}>{processCollaborators(internalLabStaff)}</span>
                        </div>
                      )}
                      {!isEmpty(internalCollaborators) && (
                        <div className="fact-item" style={styles.factItem} id="internal-collaborators-fact">
                          <span style={styles.factLabel}>Internal Collaborators:</span>
                          <span style={styles.factValue}>{processCollaborators(internalCollaborators)}</span>
                        </div>
                      )}
                      {!isEmpty(externalCollaborators) && (
                        <div className="fact-item" style={styles.factItem} id="external-collaborators-fact">
                          <span style={styles.factLabel}>External Collaborators:</span>
                          <span style={styles.factValue}>{processCollaborators(externalCollaborators)}</span>
                        </div>
                      )}
                    </>
                  )}
            </div>
            <div className="facts-column" style={styles.factsColumnBordered} id="signing-official-column">
              <span style={styles.columnHeading}>Signing Official Info</span>
              {hasSigningOfficial
                ? (
                    <div id="signing-official-fact" style={styles.factsColumn}>
                      {soName && (
                        <div className="fact-item" style={styles.factItem} id="signing-official-name-fact">
                          <span style={styles.factLabel}>Signing Official:</span>
                          <span style={styles.factValue}>{soName}</span>
                        </div>
                      )}
                      {soEmail && (
                        <div className="fact-item" style={styles.factItem} id="signing-official-email-fact">
                          <span style={styles.factLabel}>Email:</span>
                          <span style={styles.factValue}>
                            <a href={`mailto:${soEmail}`} aria-label={`Email ${soName || 'signing official'}: ${soEmail}`}>{soEmail}</a>
                          </span>
                        </div>
                      )}
                      {soInstitutionName && (
                        <div className="fact-item" style={styles.factItem} id="signing-official-institution-fact">
                          <span style={styles.factLabel}>Institution:</span>
                          <span style={styles.factValue}>{soInstitutionName}</span>
                        </div>
                      )}
                      {soLinkedIn && (
                        <ProfileFactLink label="LinkedIn" id="signing-official-linkedin-fact" url={formattedLinkedIn(soLinkedIn)} />
                      )}
                      {soOrcid && (
                        <ProfileFactLink label="ORCID iD" id="signing-official-orcid-fact" url={formattedOrcid(soOrcid)} />
                      )}
                      {soThroughBio && (
                        <ProfileFactLink label="Through.bio" id="signing-official-through-bio-fact" url={formattedThroughBio(soThroughBio)} />
                      )}
                      {soInstitutionalWebsite && (
                        <ProfileFactLink label="Institutional Website" id="signing-official-institutional-website-fact" url={soInstitutionalWebsite} />
                      )}
                    </div>
                  )
                : <span style={styles.factValueMuted}>None listed</span>}
            </div>
            <div className="facts-column" style={styles.factsColumnBordered} id="it-cloud-column">
              <span style={styles.columnHeading}>IT/Cloud Info</span>
              <div className="fact-item" style={styles.factItem} id="it-director-fact">
                <span style={styles.factLabel}>IT Director:</span>
                <span style={itDirectorEmail ? styles.factValue : styles.factValueMuted}>
                  {itDirectorEmail
                    ? <a href={`mailto:${itDirectorEmail}`} aria-label={`Email IT Director: ${itDirectorEmail}`}>{itDirectorEmail}</a>
                    : 'None listed'}
                </span>
              </div>
              <div className="fact-item" style={styles.factItem} id="anvil-storage-fact">
                <span style={styles.factLabel}>AnVIL Storage & Analysis Only:</span>
                <span style={styles.factValue}>{anvilStorage ? 'Yes' : 'No'}</span>
              </div>
              <div className="fact-item" style={styles.factItem} id="local-computing-fact">
                <span style={styles.factLabel}>Local Computing Requested:</span>
                <span style={styles.factValue}>{localComputing ? 'Yes' : 'No'}</span>
              </div>
              <div className="fact-item" style={styles.factItem} id="cloud-computing-fact">
                <span style={styles.factLabel}>Cloud Computing Requested:</span>
                <span style={styles.factValue}>{getCloudUseText(cloudComputing, cloudProvider)}</span>
              </div>
              {cloudComputing && cloudProviderDescription && (
                <div className="cloud-provider-description-textbox" style={styles.factValue}>
                  {cloudProviderDescription}
                </div>
              )}
            </div>
          </div>
          <div className="narrative-section-container" style={styles.narrativeSectionContainer}>
            <div className="facts-column" style={styles.factsColumn} id="non-technical-summary-column">
              <span style={styles.columnHeading}>Non-Technical Summary</span>
              <ScrollableBox className="non-technical-summary-textbox" boxStyle={styles.narrativeTextBox} fadeColor="white" label="Non-Technical Summary">
                {darInfo?.nonTechRus || <span style={styles.factValueMuted}>None provided</span>}
              </ScrollableBox>
            </div>
            <div className="facts-column" style={styles.factsColumnBordered} id="rus-narrative-column">
              <span style={styles.columnHeading}>Research Use Statement (Narrative)</span>
              <ScrollableBox className="rus-textbox" boxStyle={styles.narrativeTextBox} fadeColor="white" label="Research Use Statement (Narrative)">
                {darInfo?.rus || <span style={styles.factValueMuted}>None provided</span>}
              </ScrollableBox>
            </div>
            <div className="facts-column" style={styles.factsColumnBordered} id="rus-duo-terms-column">
              <span style={styles.columnHeading}>Research Use Statement (DUO Terms)</span>
              <ScrollableBox className="rus-duo-terms-box" boxStyle={styles.duoTermsBox} fadeColor={Theme.palette.background.secondary} label="Research Use Statement (DUO Terms)">
                {hasDuoTerms
                  ? (
                      <>
                        {primaryDuoTerms.map((term, idx) => (
                          <DuoTermCard term={term} id={`duo-primary-${idx}-fact`} isPrimary key={`duo-primary-${term.code}-${idx}`} />
                        ))}
                        {secondaryDuoTerms.map((term, idx) => (
                          <DuoTermCard term={term} id={`duo-secondary-${idx}-fact`} isPrimary={false} key={`duo-secondary-${term.code}-${idx}`} />
                        ))}
                      </>
                    )
                  : <span style={styles.factValueMuted}>None listed</span>}
              </ScrollableBox>
            </div>
          </div>
          {referenceId && collaborationLetterLocation && collaborationLetterName && (
            <div className="document-link-container" style={styles.documentLinkRow}>
              <div id="collab-letter">
                <DownloadLink
                  label="Download Collaboration Letter"
                  onDownload={async () => { await DAR.downloadDARDocument(referenceId, 'collaborationDocument', collaborationLetterName) }}
                />
              </div>
            </div>
          )}
        </div>
      )}
      {isLoading && (
        <div className="header-skeleton-loader">
          <div className="title-row-skeleton" style={appliedTitleRowStyle}>
            <div className="text-placeholder" style={{ width: '35rem', height: '2.5rem', marginBottom: '0.5rem' }}></div>
          </div>
          <div style={styles.containerRow}>
            <div className="text-placeholder" style={{ width: '16rem', height: '3rem', marginBottom: '1.5rem' }}></div>
          </div>
          <div style={styles.factsContainer}>
            <div className="text-placeholder" style={{ width: '90%', height: '2.4rem' }}></div>
            <div className="text-placeholder" style={{ width: '90%', height: '2.4rem' }}></div>
            <div className="text-placeholder" style={{ width: '90%', height: '2.4rem' }}></div>
          </div>
        </div>
      )}
    </>
  )
}
