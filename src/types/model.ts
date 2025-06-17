import externalAccessIcon from 'src/images/external_access.svg';
import openAccessIcon from 'src/images/open_access.svg';
import controlledAccessIcon from 'src/images/controlled_access.svg';
import { PublicationOrPresentation } from 'src/components/publications_list/PublicationOrPresentation';

export type UserRoleName =
  | 'Admin'
  | 'Chairperson'
  | 'Member'
  | 'Researcher'
  | 'Alumni'
  | 'SigningOfficial'
  | 'DataSubmitter'
  | 'All';

export interface UserRole {
  roleId: number;
  name: UserRoleName;
  userId: number;
  userRoleId: number;
}

export interface UserStatusInfo {
  adminEnabled: boolean;
  enabled: boolean;
  userEmail: string;
  userSubjectId: string;
}

export interface UserProperty {
  propertyId: number
  userId: number;
  propertyKey: string;
  propertyValue: string;
}

export interface DuosUser {
  createDate: Date;
  displayName: string;
  email: string;
  emailPreference: boolean;
  eraCommonsId?: string;
  institutionId?: number;
  isAdmin: boolean;
  isAlumni: boolean;
  isChairPerson: boolean;
  isDataSubmitter: boolean;
  isMember: boolean;
  isResearcher: boolean;
  isSigningOfficial: boolean;
  libraryCard?: LibraryCard;
  properties?: UserProperty[];
  roles: UserRole[];
  userId: number;
  userStatusInfo?: UserStatusInfo;
}

export interface SimplifiedDuosUser {
  userId: number;
  displayName: string;
  email: string;
}

export interface DAAObject {
  // Define the shape of a DAA object as needed
  daaId: number;
  createUserId: number;
  createDate: string;
  updateUserId: number;
  updateDate: string;
  initialDacId: number;
  file: FileStorageObject;
  dacs: Array<DacObject>;
}

export interface DacObject {
  dacId: number;
  name: string;
  description: string;
  email: string;
  associatedDaa: DAAObject;
  createDate: string;
  updateDate: string;
  chairpersons: DuosUser[];
  members: DuosUser[];
}

export interface LibraryCard {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  createDate: Date;
  createUserId: number;
  daaIds?: number[];
}

export type OrganizationType = 'For-Profit' | 'Nonprofit';

export interface Institution {
  id: number;
  name: string;
  itDirectorName: string;
  itDirectorEmail: string;
  institutionUrl: string;
  dunsNumber: number;
  orgChartUrl: string;
  verificationUrl: string;
  verificationFilename: string;
  organizationType: OrganizationType;
  createUser: number;
  createDate: Date;
  updateUser: number;
  updateDate: Date;
  signingOfficials: SimplifiedDuosUser[];
}

export interface Dataset {
  name: string;
  // @deprecated datasetName is deprecated, use name instead
  datasetName?: string;
  datasetId: number;
  createUserId: number;
  createUser: DuosUser;
  createDate: Date;
  dacId: number;
  translatedDataUse: string;
  deletable: boolean;
  properties: DatasetProperty[];
  study: Study;
  alias: number;
  datasetIdentifier: string;
  objectId?: string;
  dataUse: DataUse;
  dacApproval?: boolean;
  nihCertificationFile?: FileStorageObject;
  updateUserId?: number;
  updateDate?: Date;
  indexedDate?: Date;
}

interface DacTerm {
  dacId: number;
  dacName: string;
  dacEmail: string;
}

interface InstitutionTerm {
  id: number;
  name: string;
}

export interface UserTerm {
  userId: number;
  displayName: string;
  institution: InstitutionTerm;
}

export interface StudyTerm {
  description: string;
  studyName: string;
  studyId: number;
  phsId: string;
  phenotype: string;
  species: string;
  piName: string;
  dataSubmitterEmail: string;
  dataSubmitterId: number;
  dataCustodianEmail: string[];
  publicVisibility: boolean;
  dataTypes: string[];
}

interface DataUseTerm {
  code: string;
  description: string;
}

interface DataUseSummary {
  primary: DataUseTerm[];
  secondary: DataUseTerm[];
}

export interface DatasetTerm {
  datasetId: number;
  createUserId: number;
  createUserDisplayName: string;
  datasetIdentifier: string;
  deletable: boolean;
  datasetName: string;
  participantCount: number;
  dataUse: DataUseSummary;
  dataLocation: string;
  url: string;
  dacId: number;
  dacApproval: boolean;
  accessManagement: string;
  approvedUserIds: number[];
  study: StudyTerm;
  submitter: UserTerm;
  updateUser: UserTerm;
  dac: DacTerm;
}

export interface AccessManagementSummary {
  name: string;
  icon: string;
  description: string;
}

export const getAccessManagementSummary = (accessManagement: string): AccessManagementSummary => {
  switch (accessManagement) {
    case 'external':
      return {
        name: 'External',
        icon: externalAccessIcon,
        description: 'External access request required'
      };
    case 'open':
      return {
        name: 'Open',
        icon: openAccessIcon,
        description: 'Open access'
      };
    case 'controlled':
      return {
        name: 'Controlled',
        icon: controlledAccessIcon,
        description: 'Controlled access'
      };
    default:
      return {
        name: '',
        icon: '',
        description: 'Unknown access management'
      };
  }
};

interface DataUseRequirements {
  required: string[];
}

interface DataUseProperties {
  [key: string]: DataUsePropertyFields;
}

interface DataUsePropertyFields {
  type: string;
  [key: string]: string | DataUsePropertyFields;
}
export interface DataUse {
  $id: string;
  $schema: string;
  title: string;
  version: number;
  type: string;
  anyOf: DataUseRequirements[];
  properties: DataUseProperties;
}

export interface DatasetProperty {
  propertyName: string;
  propertyValue: string;
}

export interface Study {
  studyId: number;
  name: string;
  description: string;
  dataTypes: string[];
  piName: string;
  publicVisibility: boolean;
  datasetIds: number[];
  datasets: Dataset[];
  properties: StudyProperty[];
  alternativeDataSharingPlan: FileStorageObject;
  createDate: string; //Date?
  createUserId: number;
  updateDate: string; //Date?
  updateUserId: number;
}

export interface StudyProperty {
  key: string;
  value: string;
  type: string;
}

export type FileStorageCategory =
  | 'irbCollaborationLetter'
  | 'dataUseLetter'
  | 'alternativeDataSharingPlan'
  | 'nihInstitutionalCertification'
  | 'dataAccessAgreement'
  | 'draftUploadedFile';

export interface FileStorageObject {
  fileStorageObjectId: number;
  entityId: string;
  fileName: string;
  category: FileStorageCategory;
  mediaType: string;
  createUserId: number;
  createDate: number;
  updateUserId?: number;
  updateDate?: number;
  deleteUserId?: number;
  deleteDate?: number;
  deleted?: boolean;
}

export interface ApprovedDataset {
  darId: string;
  datasetId: number;
  datasetName: string;
  dacName: string;
  approvalDate: string;
}

export interface AcknowledgementMap {
  [key: string]: Acknowledgement;
}

export interface Acknowledgement {
  userId: number;
  ackKey: string;
  firstAcknowledged: number;
  lastAcknowledged: number;
}

export interface DatasetStats {
  dataset: Dataset;
  dars: Array<DataAccessRequest>;
  elections: Array<Election>;
}

export interface DataAccessRequest {
  referenceId: string;
  userId: number;
  createDate: string;
  sortDate: string;
  submissionDate: string;
  updateDate: string;
  draft: boolean;
  collectionId: number;
  darCode: string;
  elections: Record<number, Election>;
  projectTitle: string;
  datasetIds: number[];
  rus: string;
  nonTechRus: string;
  diseases: boolean;
  methods: boolean;
  controls: boolean;
  population: boolean;
  other: boolean;
  otherText: string;
  ontologies: string[];
  forProfit: boolean;
  oneGender: boolean;
  gender: string;
  pediatric: boolean;
  illegalBehavior: boolean;
  addiction: boolean;
  sexualDiseases: boolean;
  stigmatizedDiseases: boolean;
  vulnerablePopulation: boolean;
  populationMigration: boolean;
  psychiatricTraits: boolean;
  notHealth: boolean;
  hmb: boolean;
  poa: boolean;
  anvilUse: boolean;
  cloudUse: boolean;
  localUse: boolean;
  cloudProvider: string;
  cloudProviderType: string;
  cloudProviderDescription: string;
  geneticStudiesOnly: boolean;
  irb: boolean;
  irbDocumentLocation: string;
  irbProtocolExpiration: string;
  dsAcknowledgement: boolean;
  gsoAcknowledgement: boolean;
  pubAcknowledgement: boolean;
  itDirector: string;
  signingOfficial: string;
  publication: boolean;
  collaboration: boolean;
  collaborationLetterLocation: string;
  forensicActivities: boolean;
  sharingDistribution: boolean;
  externalCollaborators: Array<Collaborator>;
  internalCollaborators: Array<Collaborator>;
  labCollaborators: Array<Collaborator>;
  progressReportSummary: string;
  intellectualPropertySummary: string;
  publications: Array<PublicationOrPresentation>;
  presentations: Array<PublicationOrPresentation>;
  dmi: DataManagementIncident;
  researchPlans: string;
  closeoutSupplement: Closeout;
  parentId?: number;
}

export interface DataManagementIncident {
  incidents: string[];
  description: string;
}

export interface Closeout {
  reasons: string[];
  otherText: string;
  signingOfficialId: number;
}

export interface Presentation {
  title: string;
  link: string;
  date: string;
  authors: string;
  datasetCitation: string;
  citation: boolean;
}

export interface Publication {
  title: string;
  pubmedId: string;
  date: string;
  authors: string;
  bibliographicCitation: string;
  datasetCitation: string;
  citation: boolean;
}

export interface Collaborator {
  approverStatus: boolean;
  email: string;
  eraCommonsId: string;
  name: string;
  title: string
  uuid: string;
}

export interface Election {
  electionId: number;
  electionType: string;
  finalVote: boolean;
  status:	string;
  createDate: string;
  lastUpdate: string;
  finalVoteDate: string;
  referenceId: string;
  finalRationale: string;
  finalAccessVote: boolean;
  datasetId: number;
  displayId: string;
  dulName: string;
  version: number;
  archived: boolean;
  votes: Map<number, Vote>;
}

export interface Vote {
  voteId: number;
  vote: boolean;
  userId: number;
  createDate: string;
  updateDate: string;
  electionId: number;
  rationale: string;
  type: string;
  isReminderSent: boolean;
  hasConcerns: boolean;
  displayName: string;
}
