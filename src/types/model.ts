import externalAccessIcon from 'src/images/external_access.svg'
import openAccessIcon from 'src/images/open_access.svg'
import controlledAccessIcon from 'src/images/controlled_access.svg'

export interface ResponseError {
  readonly response?: {
    readonly data?: ConsentError
    readonly status?: number
  }
}

export interface ConsentError {
  readonly message?: string
  readonly code?: number
}

export type UserRoleName
  = | 'Admin'
    | 'Chairperson'
    | 'Member'
    | 'Researcher'
    | 'Alumni'
    | 'SigningOfficial'
    | 'DataSubmitter'
    | 'All'

export enum AbstainDataUseCodes {
  'OTHER',
  'POP-M',
  'POP-F',
  'COL',
  'IRB',
  'GSO',
  'PUB',
  'MOR',
  'POP-PD',
}

export interface UserRole {
  roleId: number
  name: UserRoleName
  userId: number
  userRoleId: number
  dacId?: number
}

export interface UserStatusInfo {
  adminEnabled?: boolean
  enabled: boolean
  userEmail: string
  userSubjectId: string
  tosAccepted?: boolean
}

export interface ExternalProfiles {
  linkedIn?: string
  ORCID?: string
  throughBio?: string
  institutionalWebsite?: string
  otherUrls?: string[]
}

export interface UserProperty {
  propertyId: number
  userId: number
  propertyKey: string
  propertyValue: string
}

export interface DuosUser {
  createDate: Date
  displayName: string
  email: string
  emailPreference: boolean
  eraCommonsId?: string
  institutionId?: number
  institution?: InstitutionInterface
  isAdmin: boolean
  isAlumni: boolean
  isChairPerson: boolean
  isDataSubmitter: boolean
  isMember: boolean
  isResearcher: boolean
  isSigningOfficial: boolean
  libraryCard?: LibraryCard
  properties?: UserProperty[]
  roles: UserRole[]
  userId: number
  userStatusInfo?: UserStatusInfo
  userData?: {
    externalProfiles?: ExternalProfiles
  }
}

export interface SimplifiedDuosUser {
  userId: number
  displayName: string
  email: string
}

export interface DAAObject {
  // Define the shape of a DAA object as needed
  broadDaa: boolean
  daaId: number
  createUserId: number
  createDate: string
  updateUserId: number
  updateDate: string
  initialDacId: number
  file: FileStorageObject
  dacs: Array<DacObject>
}

export interface DacObject {
  dacId?: number
  dacName?: string
  name?: string
  description?: string
  email?: string
  associatedDaa?: DAAObject
  createDate?: string
  updateDate?: string
  chairpersons?: DuosUser[]
  members?: DuosUser[]
}

export interface DataAccessAgreement {
  daaId: number
  createUserId: number
  createDate: number
  updateUserId?: number
  updateDate?: number
  file?: FileStorageObject
  dacs?: DacObject[]
}

export interface LibraryCard {
  id: number
  userId: number
  userName: string
  userEmail: string
  createDate: Date
  createUserId: number
  daaIds?: number[]
}

export type OrganizationType = 'For-Profit' | 'Nonprofit'

export interface InstitutionInterface {
  id: number
  name: string
  itDirectorName?: string
  itDirectorEmail?: string
  institutionUrl?: string
  dunsNumber?: number
  orgChartUrl?: string
  verificationUrl?: string
  verificationFilename?: string
  organizationType?: OrganizationType
  createUser: DuosUser
  createUserId: number
  createDate: string
  updateUser?: DuosUser
  updateUserId?: number
  updateDate?: string
  signingOfficials: SimplifiedDuosUser[]
  domains?: string[]
}

export interface Dataset {
  name: string
  // @deprecated datasetName is deprecated, use name instead
  datasetName?: string
  datasetId: number
  createUserId: number
  createUser: DuosUser
  createDate: Date
  dacId: number
  translatedDataUse: string
  deletable: boolean
  properties: DatasetProperty[]
  study: Study
  alias: number
  datasetIdentifier: string
  objectId?: string
  dataUse: DataUse
  dacApproval?: boolean
  nihInstitutionalCertificationFile?: FileStorageObject
  updateUserId?: number
  updateDate?: Date
  indexedDate?: Date
}

export interface DacTerm {
  dacId: number
  dacName: string
  dacEmail: string
}

interface InstitutionTerm {
  id: number
  name: string
}

export interface UserTerm {
  userId: number
  displayName: string
  institution: InstitutionTerm
}

export interface StudyTerm {
  description: string
  studyName: string
  studyId: number
  phsId: string
  phenotype: string
  species: string
  piName: string
  dataSubmitterEmail: string
  dataSubmitterId: number
  dataCustodianEmail: string[]
  publicVisibility: boolean
  dataTypes: string[]
}

export interface DataUseTerm {
  code: string
  description: string
  manualReview?: boolean
  type?: string
}

export interface DataUseSummary {
  primary: DataUseTerm[]
  secondary?: DataUseTerm[]
}

export interface DatasetTerm {
  datasetId: number
  createUserId: number
  createUserDisplayName: string
  datasetIdentifier: string
  deletable: boolean
  datasetName: string
  participantCount: number
  dataUse: DataUseSummary
  dataLocation: string
  url: string
  dacId: number
  dacApproval: boolean
  accessManagement: string
  approvedUserIds: number[]
  study: StudyTerm
  submitter: UserTerm
  updateUser: UserTerm
  dac: DacTerm
  piName: string
}

export interface AccessManagementSummary {
  name: string
  icon: string
  description: string
}

export const getAccessManagementSummary = (accessManagement: string): AccessManagementSummary => {
  switch (accessManagement) {
    case 'external':
      return {
        name: 'External',
        icon: externalAccessIcon,
        description: 'External access request required',
      }
    case 'open':
      return {
        name: 'Open',
        icon: openAccessIcon,
        description: 'Open access',
      }
    case 'controlled':
      return {
        name: 'Controlled',
        icon: controlledAccessIcon,
        description: 'Controlled access',
      }
    default:
      return {
        name: 'Unknown',
        icon: '',
        description: 'Unknown access management',
      }
  }
}

export interface DataUse {
  // One of the primary fields must be present: generalUse | hmbResearch | diseaseRestrictions | other
  // Otherwise, all other fields are optional.
  generalUse?: boolean
  hmbResearch?: boolean
  diseaseRestrictions?: string[]
  populationOriginsAncestry?: boolean
  methodsResearch?: boolean // when this value is false, it indicates NMDS.
  nonProfitUse?: boolean
  other?: string
  secondaryOther?: string
  ethicsApprovalRequired?: boolean
  collaboratorRequired?: boolean
  geographicalRestrictions?: string
  geneticStudiesOnly?: boolean
  publicationResults?: boolean
  publicationMoratorium?: string
  aiLlmUse?: boolean
  controls?: boolean
  gender?: string
  pediatric?: boolean
  population?: boolean
  illegalBehavior?: boolean
  sexualDiseases?: boolean
  stigmatizeDiseases?: boolean
  vulnerablePopulations?: boolean
  psychologicalTraits?: boolean
  notHealth?: boolean
}

export interface DatasetProperty {
  propertyName: string
  propertyValue: string
}

interface Person {
  name: string
}

interface Contact extends Person {
  email: string
}

export interface Author extends Person {
  orcId?: string
}

export type Maintainer = Contact

export interface Study {
  studyId: number
  name: string
  description: string
  dataTypes: string[]
  piName: string
  publicVisibility: boolean
  datasetIds: number[]
  datasets: Dataset[]
  properties: StudyProperty[]
  alternativeDataSharingPlan?: FileStorageObject
  createDate: string // Date?
  createUserId: number
  updateDate?: string // Date?
  updateUserId?: number
  assets?: {
    models?: Array<AiModel>
    workspaces?: Array<Workspace>
    publications?: Array<Publication>
    presentations?: Array<Presentation>
    clinicalTrials?: Array<ClinicalTrial>
    funding?: Array<FundingResource>
    intellectualProperties?: Array<IntellectualProperty>
    biospecimens?: Array<Biospecimen>
  }
}

export interface AiModel {
  modelId: string
  studyId: string
  name: string
  description: string
  url: string
  format: string
  license: string
  trainedOnDatasets: string[]
  maintainer: Maintainer
  tags?: string[]
}

export interface Workspace {
  workspaceId: string
  studyId: string
  name: string
  platform: string
  url: string
  description: string
  tools?: string[]
  access?: string
  tags?: string[]
}

export enum ClinicalTrialStatus {
  ACTIVE_NOT_RECRUITING = 'Active, not recruiting',
  COMPLETED = 'Completed',
  ENROLLING_BY_INVITATION = 'Enrolling by invitation',
  NOT_YET_RECRUITING = 'Not yet recruiting',
  RECRUITING = 'Recruiting',
  SUSPENDED = 'Suspended',
  TERMINATED = 'Terminated',
  WITHDRAWN = 'Withdrawn',
  AVAILABLE = 'Available',
  NO_LONGER_AVAILABLE = 'No longer available',
  TEMPORARILY_NOT_AVAILABLE = 'Temporarily not available',
  APPROVED_FOR_MARKETING = 'Approved for marketing',
  WITHHELD = 'Withheld',
  UNKNOWN = 'Unknown',
}

export enum ClinicalTrialInterventionType {
  BEHAVIORAL = 'Behavioral',
  BIOLOGICAL = 'Biological',
  COMBINATION_PRODUCT = 'Combination product',
  DEVICE = 'Device',
  DIAGNOSTIC_TEST = 'Diagnostic test',
  DIETARY_SUPPLEMENT = 'Dietary supplement',
  DRUG = 'Drug',
  GENETIC = 'Genetic',
  PROCEDURE = 'Procedure',
  RADIATION = 'Radiation',
  OTHER = 'Other',
}

export enum ClinicalTrialPhase {
  NA = 'Not Applicable',
  EARLY_PHASE1 = 'Early Phase 1',
  PHASE1 = 'Phase 1',
  PHASE2 = 'Phase 2',
  PHASE3 = 'Phase 3',
  PHASE4 = 'Phase 4',
}

export interface ClinicalTrial {
  clinicalTrialId: string
  studyId: string
  title: string
  registry: string
  identifier: string
  status: ClinicalTrialStatus
  sponsor: string
  startDate: string
  endDate?: string
  interventionType: ClinicalTrialInterventionType
  description: string
  phase: ClinicalTrialPhase
  url: string
  tags?: string[]
}

export interface FundingResource {
  fundingId: string
  studyId: string
  funderName: string
  funderProgram: string
  grantNumber: string
  projectTitle: string
  startDate?: string
  endDate?: string
  url: string
  tags?: string[]
}

export interface IntellectualProperty {
  ipId: string
  studyId: string
  type: string
  title: string
  assignee: string
  patentNumber: string
  filingDate: string
  status: string
  url: string
  contact: string
  tags?: string[]
}

export enum BioSpecimenType {
  BLOOD = 'BLOOD',
  PLASMA = 'PLASMA',
  SERUM = 'SERUM',
  TISSUE = 'TISSUE',
  SALIVA = 'SALIVA',
  CSF = 'CSF',
  PBMC = 'PBMC',
  TUMOR = 'TUMOR',
  NORMAL_ADJACENT = 'NORMAL_ADJACENT',
}

export enum BioSpecimenPreservationMethod {
  FFPE = 'FFPE',
  FRESH_FROZEN = 'FRESH_FROZEN',
  CRYO_PRESERVED = 'CRYO_PRESERVED',
  RNA_LATER = 'RNA_LATER',
  FORMALIN_FIXED = 'FORMALIN_FIXED',
}

export enum PostMortemIntervalUnit {
  HOURS = 'HOURS',
  MINUTES = 'MINUTES',
  DAYS = 'DAYS',
  WEEKS = 'WEEKS',
}

export enum Sex {
  FEMALE = 'FEMALE',
  MALE = 'MALE',
  UNKNOWN = 'UNKNOWN',
  NOT_REPORTED = 'NOT_REPORTED',
}

export interface Biospecimen {
  biospecimenId: string
  studyId: string
  donorId: string
  specimenType: BioSpecimenType
  preservationMethod: BioSpecimenPreservationMethod
  preservationDetails?: string
  dateOfCollection?: string
  postMortemInterval?: { value: number, unit: PostMortemIntervalUnit }
  sex?: Sex
  age?: number
  race?: string
  countryOfOrigin?: string // {domain}/api-docs/ISO-3166-countries.json e.g. "United States of America (the)"
  extractedDiagnoses?: string[] // diseaseSpecificUse e.g. "Alzheimer's disease", "Parkinson's disease"
  pathology?: string
  organization: string // e.g. institution/biobank/provider
  sourceSite?: string // e.g. clinic/hospital/collection site
  optionalDataUse?: string // structured policy (same pattern as dataset Data Use, if supported) OR free-text for MVP
}

export interface StudyProperty {
  key: string
  value: string
  type: string
}

export type FileStorageCategory
  = | 'irbCollaborationLetter'
    | 'dataUseLetter'
    | 'alternativeDataSharingPlan'
    | 'nihInstitutionalCertification'
    | 'dataAccessAgreement'
    | 'draftUploadedFile'

export interface FileStorageObject {
  fileStorageObjectId: number
  entityId: string
  fileName: string
  category: FileStorageCategory
  mediaType: string
  createUserId: number
  createDate: number
  updateUserId?: number
  updateDate?: number
  deleteUserId?: number
  deleteDate?: number
  deleted?: boolean
}

export interface ApprovedDataset {
  darId: string
  datasetId: number
  datasetName: string
  dacName: string
  expirationDate: number
}

export interface AcknowledgementMap {
  [key: string]: Acknowledgement
}

export interface Acknowledgement {
  userId: number
  ackKey: string
  firstAcknowledged: number
  lastAcknowledged: number
}

export interface DatasetStatisticsDar {
  updateDate: number
  projectTitle: string
  darCode: string
  nonTechRus: string
  referenceId: string
  expired: boolean
}

/**
 * This interface combines the DataAccessRequest with all fields from the DataAccessRequestData object stored
 * in DataAccessRequest.data field. This model simplifies usages in ProgressReport forms.
 */
export interface CombinedDataAccessRequest extends DataAccessRequest {
  projectTitle: string
  checkNihDataOnly: boolean
  rus: string
  nonTechRus: string
  diseases: boolean
  methods: boolean
  aiLlmUse: boolean
  controls: boolean
  population: boolean
  other: boolean
  otherText: string
  ontologies: string[]
  daaIds?: number[]
  forProfit: boolean
  oneGender: boolean
  gender: string
  pediatric: boolean
  illegalBehavior: boolean
  addiction: boolean
  sexualDiseases: boolean
  stigmatizedDiseases: boolean
  vulnerablePopulation: boolean
  populationMigration: boolean
  psychiatricTraits: boolean
  notHealth: boolean
  hmb: boolean
  poa: boolean
  status: string
  darCode: string
  validRestriction: boolean
  progressReportSummary: string
  intellectualProperties?: Array<IntellectualProperty>
  publications?: Array<Publication>
  presentations?: Array<Presentation>
  dmi?: DataManagementIncident
  researchPlans?: string
  closeoutSupplement?: Closeout
  anvilUse: boolean
  cloudUse: boolean
  localUse: boolean
  cloudProvider: string
  cloudProviderType: string
  cloudProviderDescription: string
  geneticStudiesOnly: boolean
  irb: boolean
  irbDocumentLocation?: string
  irbDocumentName?: string
  irbProtocolExpiration?: string
  itDirector: string
  itDirectorEmail: string
  signingOfficial: string
  signingOfficialEmail: string
  publication: boolean
  collaboration: boolean
  collaborationLetterLocation?: string
  collaborationLetterName?: string
  forensicActivities?: boolean
  sharingDistribution?: boolean
  labCollaborators?: Array<Collaborator>
  internalCollaborators?: Array<Collaborator>
  externalCollaborators?: Array<Collaborator>
  dsAcknowledgement: boolean
  gsoAcknowledgement: boolean
  pubAcknowledgement: boolean
  piName: string
  piEmail: string
  piCountryOfOperation: string
}

export interface DarCollection {
  id: number
  darCode: string
  createDate: number
  createUserId: number
  updateDate?: number
  updateUserId?: number
  dars: Record<string, DataAccessRequest>
  datasets: Dataset[]
}

export interface DarCollectionSummary {
  actions: string[]
  dacNames: string[]
  dacCode: string
  darCode: string
  darCollectionId: number
  datasetCount: number
  datasetIds: number[]
  expired: boolean
  expiresAt: number
  institutionName: string
  latestReferenceId: string
  name: string
  progressReport: boolean
  referenceIds: string[]
  requiresSOApproval: boolean
  researcherName: string
  status: string
  submissionDate: number
}

export interface DataAccessRequest {
  id: number
  referenceId: string
  collectionId: number
  parentId?: number
  data: DataAccessRequestData
  draft: boolean
  progressReport: boolean
  expired: boolean
  expiresAt: number
  userId: number
  createDate: number
  submissionDate: number
  updateDate: number
  datasetIds: number[]
  elections: Record<number, Election>
  eraCommonsId: string
  closeoutSigningOfficialApprovedDate?: number
  closeoutSigningOfficialApprovedUserId?: number
}

export interface DataAccessRequestData {
  projectTitle: string
  checkNihDataOnly: boolean
  rus: string
  nonTechRus: string
  diseases: boolean
  methods: boolean
  aiLlmUse: boolean
  controls: boolean
  population: boolean
  other: boolean
  otherText: string
  ontologies: OntologyEntry[]
  forProfit: boolean
  oneGender: boolean
  gender: string
  pediatric: boolean
  illegalBehavior: boolean
  addiction: boolean
  sexualDiseases: boolean
  stigmatizedDiseases: boolean
  vulnerablePopulation: boolean
  populationMigration: boolean
  psychiatricTraits: boolean
  notHealth: boolean
  hmb: boolean
  status: string
  poa: boolean
  datasets: DatasetEntry[]
  darCode?: string
  restriction: object
  validRestriction: boolean
  progressReportSummary?: string
  intellectualPropertySummary?: string
  publications?: Publication[]
  presentations?: Presentation[]
  dmi?: DataManagementIncident
  researchPlans: string
  closeoutSupplement?: Closeout
  anvilUse: boolean
  cloudUse: boolean
  localUse: boolean
  cloudProvider: string
  cloudProviderType: string
  cloudProviderDescription: string
  geneticStudiesOnly: boolean
  irb: boolean
  irbDocumentLocation?: string
  irbDocumentName?: string
  irbProtocolExpiration?: string
  itDirector: string
  itDirectorEmail: string
  signingOfficial: string
  signingOfficialEmail: string
  publication: boolean
  collaboration: boolean
  collaborationLetterLocation?: string
  collaborationLetterName?: string
  forensicActivities: boolean
  sharingDistribution: boolean
  labCollaborators: Collaborator[]
  internalCollaborators: Collaborator[]
  externalCollaborators: Collaborator[]
  dsAcknowledgement: boolean
  gsoAcknowledgement: boolean
  pubAcknowledgement: boolean
  piName: string
  piEmail: string
  piCountryOfOperation: string
}

export interface OntologyEntry {
  id: string
  label: string
  definition: string
  synonyms: string[]
}

export interface DatasetEntry {
  key: string
  value: string
  label: string
}

export interface DataManagementIncident {
  incidents: string[]
  description: string
}

export interface Closeout {
  reasons: string[]
  otherText: string
  signingOfficialId: number
}

export interface Presenter {
  name?: string
  email?: string
}

export interface Presentation {
  title: string
  date: string
  url?: string
  authors?: string
  datasetCitation?: string
  citation: boolean
  presentationId: string
  studyId: string
  presenter?: Presenter
  event?: string
  location?: string
  format?: string
  access?: string
  tags?: string[]
}

export interface Publication {
  title: string
  pubmedId?: string
  publishedDate: string
  authors: Array<Author>
  bibliographicCitation?: string
  datasetCitation: string
  citation: boolean
  publicationId: string
  studyId: string
  journal: string
  doi: string
  url?: string
  access?: string
  tags?: string[]
}

export interface Collaborator {
  approverStatus: boolean
  countryOfOperation: string
  email: string
  eraCommonsId: string
  name: string
  title: string
  uuid: string
}

export interface Election {
  electionId: number
  electionType: string
  finalVote?: boolean
  status: string
  createDate: number
  lastUpdate: number
  finalVoteDate?: string
  referenceId: string
  finalRationale?: string
  finalAccessVote?: boolean
  datasetId: number
  displayId: string
  dulName: string
  version: number
  archived: boolean
  votes: Record<number, Vote>
}

export interface Vote {
  voteId: number
  userId: number
  createDate: string | number
  electionId: number
  displayName: string
  type: string
  vote?: boolean
  rationale?: string
  updateDate?: string | number
  isReminderSent?: boolean
  hasConcerns?: boolean
  electionStatus?: string
}

export interface MatchResult {
  consent: string
  match: boolean
  abstain?: boolean
  algorithmVersion?: string
  rationales: string[]
  createDate: string
  failed: boolean
  id: string
}

export interface AlgorithmResult {
  result: string
  createDate?: string
  rationales?: string[]
  id: string
  failed?: boolean
  match?: boolean
}

export interface VoteHistoryRow extends Vote {
  datasetIdentifier: string
  progressReport: boolean
  electionDate: string | number
}

export interface ElectionWithMemberVotes extends Election {
  datasetIdentifier: string
  progressReport: boolean
  memberVotes: Vote[]
}
