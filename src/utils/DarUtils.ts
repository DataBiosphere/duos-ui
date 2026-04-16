import {
  Author,
  Closeout,
  CombinedDataAccessRequest, DarCollection, DataAccessRequest,
  DataManagementIncident,
  Election, IntellectualProperty,
  Presentation,
  Publication, Vote,
} from 'src/types/model'
import { CLOSEOUT_KEYS, DMI_INCIDENT_KEYS, FormState } from 'src/pages/progress_reports/ProgressReportFormState'

export const VOTE_TYPES = {
  FINAL: 'FINAL',
  RADAR_APPROVE: 'RADAR_APPROVE',
}
export const APPROVED_VOTETYPES = [
  VOTE_TYPES.FINAL,
  VOTE_TYPES.RADAR_APPROVE,
]
export const ElectionType = {
  DATA_ACCESS: 'DataAccess',
}
export const ElectionStatus = {
  OPEN: 'Open',
  CLOSED: 'Closed',
}

export function getApprovedElectionDatasetIds(elections: Array<Election>): Array<number> {
  const approvedDatasetIds = []
  for (const election of elections) {
    if (election.electionType === ElectionType.DATA_ACCESS) {
      const votes = Object.values(election.votes)
      const anyApprovedFinalVotes = votes.some(vote => (APPROVED_VOTETYPES.includes(vote.type)) && vote.vote)
      if (anyApprovedFinalVotes) {
        approvedDatasetIds.push(election.datasetId)
      }
    }
  }
  return approvedDatasetIds
}

export function convertFormStateToDAR(formState: FormState): Partial<CombinedDataAccessRequest> {
  const expectedForm: Partial<CombinedDataAccessRequest> = {} as Partial<CombinedDataAccessRequest>
  expectedForm.progressReportSummary = formState.progressReportSummary
  if (formState.intellectualPropertiesYesNo) {
    expectedForm.intellectualProperties = formState.intellectualProperties
  }
  expectedForm.datasetIds = formState.datasetIds ?? []
  expectedForm.daaIds = [...new Set((formState.daaIds ?? [])
    .map(id => Number(id))
    .filter(id => Number.isInteger(id) && id > 0))]
  if (formState.publicationsYesNo) {
    expectedForm.publications = getPublicationList(formState)
  }
  if (formState.presentationsYesNo) {
    expectedForm.presentations = getPresentationList(formState)
  }
  expectedForm.labCollaborators = formState.labCollaborators
  expectedForm.internalCollaborators = formState.internalCollaborators
  expectedForm.externalCollaborators = formState.externalCollaborators
  if (formState.dmiYesNo) {
    expectedForm.dmi = getDataManagementIncidents(formState)
  }
  if (formState.closeoutYesNo) {
    expectedForm.closeoutSupplement = getCloseoutInfo(formState)
  }
  expectedForm.dsAcknowledgement = formState.dsAcknowledgement
  expectedForm.gsoAcknowledgement = formState.gsoAcknowledgement
  expectedForm.pubAcknowledgement = formState.pubAcknowledgement
  expectedForm.irbDocumentLocation = formState.irbDocumentLocation
  expectedForm.irbDocumentName = formState.irbDocumentName
  expectedForm.irbProtocolExpiration = formState.irbProtocolExpiration
  expectedForm.collaborationLetterLocation = formState.collaborationLetterLocation
  expectedForm.collaborationLetterName = formState.collaborationLetterName
  return expectedForm
}

export function getIntellectualPropertyList(formState: FormState): IntellectualProperty[] {
  const intellectualProperties: IntellectualProperty[] = formState.intellectualProperties ?? []
  return intellectualProperties.map((ip: IntellectualProperty) => ({
    ipId: ip.ipId,
    studyId: ip.studyId,
    type: ip.type,
    title: ip.title,
    assignee: ip.assignee,
    patentNumber: ip.patentNumber,
    filingDate: ip.filingDate,
    status: ip.status,
    url: ip.url,
    contact: ip.contact,
    tags: ip.tags ? [...ip.tags] : [],
  }))
}

export function getPublicationList(formState: FormState): Publication[] {
  const publications: Publication[] = formState.publications ?? []
  return publications.map((p: Publication) => ({
    title: p.title,
    pubmedId: p.pubmedId,
    publishedDate: p.publishedDate,
    authors: (p.authors ?? []).map((a: Author) => ({ name: a.name, orcId: a.orcId })),
    bibliographicCitation: p.bibliographicCitation,
    datasetCitation: p.datasetCitation,
    citation: p.citation,
    publicationId: p.publicationId,
    studyId: p.studyId,
    journal: p.journal,
    doi: p.doi,
    url: p.url,
    access: p.access,
    tags: p.tags ? [...p.tags] : [],
  }))
}

export function getPresentationList(formState: FormState): Presentation[] {
  const presentations: Presentation[] = formState.presentations ?? []
  return presentations.map((p: Presentation): Presentation => ({
    title: p.title,
    date: p.date,
    url: p.url,
    authors: p.authors,
    datasetCitation: p.datasetCitation,
    citation: p.citation,
    presentationId: p.presentationId,
    studyId: p.studyId,
    presenter: p.presenter
      ? { name: p.presenter.name, email: p.presenter.email }
      : { name: '', email: '' },
    event: p.event,
    location: p.location,
    format: p.format,
    access: p.access,
    tags: p.tags ? [...p.tags] : [],
  }))
}

export function getDataManagementIncidents(formState: FormState): DataManagementIncident {
  const dataManagementIncident: DataManagementIncident = {} as DataManagementIncident
  dataManagementIncident.incidents = []
  DMI_INCIDENT_KEYS.forEach((key) => {
    const incident = formState[key] ?? undefined
    if (incident) {
      dataManagementIncident.incidents.push(key)
    }
  })
  dataManagementIncident.description = formState.dmiDescription ?? ''

  return dataManagementIncident
}

export function getCloseoutInfo(formState: FormState): Closeout {
  const closeout: Closeout = {} as Closeout
  closeout.reasons = []
  CLOSEOUT_KEYS.forEach((key) => {
    const reason = formState[key] ?? undefined
    if (reason) {
      closeout.reasons.push(key)
    }
  })
  closeout.otherText = formState.closeoutOtherText ?? ''
  closeout.signingOfficialId = formState.closeoutSigningOfficial?.userId

  return closeout
}

export function userHasOpenDataAccessElection(collection: DarCollection, userId: number): boolean {
  if (!collection.dars) return false
  return Object.values(collection.dars).some((item: DataAccessRequest) =>
    item?.elections && Object.values(item.elections).some(
      (election: Election) =>
        election.status === ElectionStatus.OPEN
        && election.electionType === ElectionType.DATA_ACCESS
        && election.votes
        && Object.values(election.votes).some(
          (vote: Vote) =>
            vote.userId === userId && vote.electionStatus === ElectionStatus.OPEN,
        ),
    ),
  )
}
