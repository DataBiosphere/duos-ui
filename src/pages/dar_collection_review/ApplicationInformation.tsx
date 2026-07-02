import React, { useEffect, useState } from 'react'
import { chunk, filter, isEmpty } from 'src/utils/NodashUtil'
import { DAR } from 'src/libs/ajax/DAR'
import { DownloadLink } from 'src/components/DownloadLink'
import { User } from 'src/libs/ajax/User'
import SigningOfficialReadOnlyCard from 'src/components/SigningOfficialReadOnlyCard'
import { DarCollection, SigningOfficialUserWithData } from 'src/types/model'
import { Bucket } from 'src/utils/BucketUtils'

const styles: Record<string, React.CSSProperties> = {
  flexRowElement: {
    fontFamily: 'Montserrat',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    width: '100%',
    minWidth: 0,
    flex: '1 1 28rem',
  },
  label: {
    fontWeight: 600,
    flex: 1,
    fontSize: 'clamp(1.4rem, 2.2vw, 2rem)',
  },
  value: {
    fontWeight: 400,
    flex: 2,
    fontSize: 'clamp(1.4rem, 2.2vw, 2rem)',
    overflowWrap: 'anywhere',
  },
  row: {
    width: '100%',
    display: 'flex',
    justifyContent: 'flex-start',
    marginBottom: '3rem',
    columnGap: '2rem',
    rowGap: '2rem',
    flexWrap: 'wrap',
  },
  title: {
    fontWeight: 800,
    fontSize: 'clamp(1.8rem, 3.2vw, 2.7rem)',
    margin: '1.5rem 0',
  },
  subheader: {
    fontWeight: 800,
    fontSize: 'clamp(1.6rem, 2.8vw, 2.4rem)',
    margin: '1rem 0',
  },
  textBox: {
    marginTop: '1.5rem',
    backgroundColor: 'rgb(237 234 228)',
    padding: 'clamp(1.2rem, 2.8vw, 3rem)',
    fontSize: 'clamp(1.4rem, 2.1vw, 1.9rem)',
    overflowWrap: 'anywhere',
  },
  applicantInfoRow: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '3rem',
    columnGap: '2rem',
    rowGap: '2rem',
    flexWrap: 'wrap',
  },
}

interface AppDetailLabel {
  value: string | boolean
  title: string
  key: string
}

interface Collaborator {
  name: string
}

const generateLabelSpanContents = (
  labelValue: string,
  key: string,
  spanValue: string,
  isLoading: boolean,
): React.ReactElement => {
  return (
    <div className="flex-row-element" style={styles.flexRowElement} id={`${key}-flex-row-element`} key={key}>
      {isLoading
        ? (
            <>
              <div className="text-placeholder" id={`${key}-label-placeholder`} style={{ width: '30%', height: '2.4rem', marginBottom: '1.5rem' }}></div>
              <div className="text-placeholder" id={`${key}-text-placeholder`} style={{ width: '70%', height: '3.2rem' }}></div>
            </>
          )
        : (
            <>
              <div id={`${key}-label`} style={styles.label}>{labelValue}</div>
              <span id={`${key}-span`} style={styles.value}>{spanValue}</span>
            </>
          )}
    </div>
  )
}

const generateLinkContents = (
  key: string,
  id: string | undefined,
  type: string,
  text: string,
  fileName: string | undefined,
  location: string | undefined,
): React.ReactElement => {
  return (
    <div>
      {(id && location && fileName)
        && (
          <div id={key}>
            <DownloadLink label={text} onDownload={async () => { await DAR.downloadDARDocument(id, type, fileName) }} />
          </div>
        )}
    </div>
  )
}

const dynamicRowGeneration = (
  rowElementMaxCount: number,
  appDetailLabels: AppDetailLabel[],
  loading: boolean,
  cloudComputing?: boolean,
): React.ReactElement[] => {
  const labels = filter(appDetailLabels, (label) => {
    return (
      (typeof label.value === 'boolean')
      || (!isEmpty(label.value) && label.key !== 'cloud-provider')
      || (label.key === 'cloud-provider' && cloudComputing === true)
    )
  })

  const labelArray = labels.map((label) => {
    if (typeof label.value === 'boolean') {
      return generateLabelSpanContents(label.title, label.key, label.value ? 'Yes' : 'No', loading)
    }
    else {
      return generateLabelSpanContents(label.title, label.key, label.value, loading)
    }
  })

  const chunkedArr = chunk(labelArray, rowElementMaxCount)

  return chunkedArr.map((chunkItems) => {
    const rowKey = chunkItems.map(item => item.key).join('-')
    return (
      <div className="information-row" key={rowKey} style={styles.applicantInfoRow}>
        {chunkItems}
      </div>
    )
  })
}

export interface ApplicationInformationProps {
  researcher?: string
  email?: string
  institution?: string
  nonTechSummary?: string
  isLoading?: boolean
  externalCollaborators?: Collaborator[]
  internalCollaborators?: Collaborator[]
  signingOfficialName?: string
  signingOfficialEmail?: string
  researcherInstitutionId?: number
  itDirectorEmail?: string
  internalLabStaff?: Collaborator[]
  anvilStorage?: boolean
  localComputing?: boolean
  cloudComputing?: boolean
  cloudProvider?: string
  rus?: string
  cloudProviderDescription?: string
  referenceId?: string
  irbDocumentLocation?: string
  collaborationLetterLocation?: string
  irbDocumentName?: string
  collaborationLetterName?: string
  collection?: DarCollection | Record<string, never>
  dataUseBuckets?: Bucket[]
}

export default function ApplicationInformation({
  researcher = '- -',
  email = '- -',
  institution = '- -',
  nonTechSummary,
  isLoading = false,
  externalCollaborators = [],
  internalCollaborators = [],
  signingOfficialName = '',
  signingOfficialEmail = '',
  researcherInstitutionId,
  itDirectorEmail = '- -',
  internalLabStaff = [],
  anvilStorage = false,
  localComputing = false,
  cloudComputing = false,
  cloudProvider = '- -',
  rus,
  cloudProviderDescription,
  referenceId,
  collaborationLetterLocation,
  collaborationLetterName,
}: Readonly<ApplicationInformationProps>) {
  const [selectedSO, setSelectedSO] = useState<SigningOfficialUserWithData | null>(null)

  useEffect(() => {
    if (!researcherInstitutionId || !signingOfficialEmail) return
    const loadSO = async () => {
      try {
        const sos = await User.getSOsForInstitution(researcherInstitutionId)
        const match = sos.find(so => so.email === signingOfficialEmail)
        setSelectedSO(match ?? null)
      }
      catch {
        setSelectedSO(null)
      }
    }
    void loadSO()
  }, [researcherInstitutionId, signingOfficialEmail])

  const processCollaborators = (collaborators: Collaborator[]) =>
    collaborators.map(collaborator => collaborator.name).join(', ')

  const collaboratorLabels: AppDetailLabel[] = [
    {
      value: processCollaborators(externalCollaborators),
      title: 'External Collaborators',
      key: 'external-collaborators',
    },
    {
      value: processCollaborators(internalCollaborators),
      title: 'Internal Collaborators',
      key: 'internal-collaborators',
    },
    { value: processCollaborators(internalLabStaff), title: 'Internal Lab Staff', key: 'internal-lab-staff' },
  ]

  const itDirectorLabels: AppDetailLabel[] = [
    { value: itDirectorEmail, title: 'IT Director', key: 'it-director' },
  ]

  const cloudUseLabels: AppDetailLabel[] = [
    { value: anvilStorage, title: 'Using AnVIL only for storage and analysis', key: 'anvil-storage' },
    { value: localComputing, title: 'Requesting permission to use local computing', key: 'local-computing' },
    { value: cloudComputing, title: 'Requesting permission to use cloud computing', key: 'cloud-computing' },
    { value: cloudProvider, title: 'Cloud Provider (description below)', key: 'cloud-provider' },
  ]

  return (
    <div className="application-information-page" style={{ padding: '2% 3%', backgroundColor: 'white' }}>
      <div className="applicant-information-container" style={{ margin: '0 0 2.5rem 0' }}>
        <div className="applicant-information-subheader" style={styles.title}>Applicant Information</div>
        <div className="information-row" style={styles.row}>
          {generateLabelSpanContents('Researcher', 'researcher', researcher, isLoading)}
          {generateLabelSpanContents('Researcher Email', 'researcher-email', email, isLoading)}
          {generateLabelSpanContents('Institution', 'institution', institution, isLoading)}
        </div>
      </div>
      {isLoading
        ? (
            <div
              className="text-placeholder"
              style={{ height: '4rem', width: '20%', marginBottom: '2rem' }}
            >
            </div>
          )
        : <div className="non-technical-summary-subheader" style={styles.subheader}>Non-Technical Summary</div>}
      <div className="non-technical-summary-container">
        {isLoading
          ? (
              <div
                className="text-placeholder"
                style={{ height: '18rem', width: '100%' }}
              >
              </div>
            )
          : <div className="non-technical-summary-textbox" style={styles.textBox}>{nonTechSummary}</div>}
      </div>
      {isLoading
        ? (
            <div
              className="text-placeholder"
              style={{ height: '4rem', width: '20%', marginBottom: '2rem' }}
            >
            </div>
          )
        : <div className="rus-subheader" style={styles.subheader}>Research Use Statement</div>}
      <div className="rus-container">
        {isLoading
          ? <div className="text-placeholder" style={{ height: '18rem', width: '100%' }}></div>
          : <div className="rus-textbox" style={styles.textBox}>{rus}</div>}
      </div>
      <div className="collaborator-details-container" style={{ margin: '3rem 0' }}>
        {!(isEmpty(internalCollaborators) && isEmpty(externalCollaborators) && isEmpty(internalLabStaff))
          && <div className="collaborator-details-subheader" style={styles.subheader}>Collaborators</div>}
        {dynamicRowGeneration(2, collaboratorLabels, isLoading)}
      </div>
      <div className="institution-details-container" style={{ margin: '3rem 0' }}>
        <div className="institution-details-subheader" style={styles.subheader}>Institution</div>
        {(signingOfficialName || signingOfficialEmail) && (
          <div className="information-row" style={styles.applicantInfoRow}>
            <div className="flex-row-element" style={styles.flexRowElement}>
              {isLoading
                ? <div className="text-placeholder" style={{ width: '50%', height: '4rem' }} />
                : (
                    <>
                      <div style={styles.label}>Signing Official</div>
                      <SigningOfficialReadOnlyCard
                        name={selectedSO ? selectedSO.displayName : signingOfficialName}
                        email={selectedSO ? selectedSO.email : signingOfficialEmail}
                        institutionName={selectedSO?.institutionName}
                        externalProfiles={selectedSO?.userData?.externalProfiles}
                      />
                    </>
                  )}
            </div>
          </div>
        )}
        {dynamicRowGeneration(2, itDirectorLabels, isLoading)}
      </div>
      <div className="cloud-use-details-container" style={{ margin: '3rem 0' }}>
        <div className="cloud-use-details-subheader" style={styles.subheader}>Cloud Use</div>
        {dynamicRowGeneration(2, cloudUseLabels, isLoading, cloudComputing)}
        {cloudComputing && (
          <div className="cloud-provider-description-container">
            {isLoading
              ? (
                  <div
                    className="text-placeholder"
                    style={{ height: '18rem', width: '100%' }}
                  >
                  </div>
                )
              : (
                  <div
                    className="cloud-provider-description-textbox"
                    style={styles.textBox}
                  >
                    {cloudProviderDescription}
                  </div>
                )}
          </div>
        )}
      </div>
      <div className="document-link-container" style={{ margin: '1rem 0' }}>
        {generateLinkContents('collab-letter', referenceId, 'collaborationDocument', 'Download Collaboration Letter', collaborationLetterName, collaborationLetterLocation)}
      </div>
    </div>
  )
}
