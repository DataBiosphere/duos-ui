import { DuosUserResponse } from './responseTypes';

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
  eraAuthorized: string;
  eraExpiration: string;
  suggestedInstitution: string;
  suggestedSigningOfficial: string;
  selectedSigningOfficial: string;
  daaAcceptance: string;
}

export interface DuosUser {
  createDate: Date;
  displayName: string;
  email: string;
  emailPreference: boolean;
  isAdmin: boolean;
  isAlumni: boolean;
  isChairPerson: boolean;
  isDataSubmitter: boolean;
  isMember: boolean;
  isResearcher: boolean;
  isSigningOfficial: boolean;
  libraryCards: LibraryCard[];
  researcherProperties: UserProperty[];
  roles: UserRole[];
  userId: number;
  userStatusInfo: UserStatusInfo;
}

export interface SimplifiedDuosUser {
  userId: number;
  displayName: string;
  email: string;
}

export interface LibraryCard {
  id: number;
  userId: number;
  institution: Institution;
  institutionId: number;
  eraCommonsId: string;
  userName: string;
  userEmail: string;
  createDate: string;
  createUserId: number;
  updateDate: string;
  updateUserId: number;
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
  datasetName: string;
  datasetId: number;
  createUserId: number;
  createUser: DuosUserResponse;
  dacId: string;
  consentId: string;
  translatedDataUse: string;
  deletable: boolean;
  properties: DatasetProperty[];
  study: Study;
  alias: string;
  datasetIdentifier: string;
  objectId: string;
  dataUse: DataUse;
  dacApproval: boolean;
  nihCertificationFile: FileStorageObject;
  alternativeDataSharingPlanFile: FileStorageObject;
}

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
  | 'nihInstitutionalCertification';

export interface FileStorageObject {
  fileStorageObjectId: number;
  entityId: string;
  fileName: string;
  category: FileStorageCategory;
  mediaType: string;
  createUserId: number;
  createDate: number;
  updateUserId: number;
  updateDate: number;
  deleteUserId: number;
  deleteDate: number;
  deleted: boolean;
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
