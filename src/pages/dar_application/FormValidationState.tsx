export interface FormValidationState {
  researcherInfoErrors?: ResearcherErrors
  darErrors?: DarErrors
  rusErrors?: RusErrors
  nihValid?: boolean
}
export interface ResearcherErrors {
  researcher?: ValidationError
  nihEraId?: ValidationError
  piName?: ValidationError
  signingOfficial?: ValidationError
  itDirector?: ValidationError
  labCollaboratorsCompleted?: ValidationError
  internalCollaborators?: ValidationError
  externalCollaborators?: ValidationError
  anvilUse?: ValidationError
  dataStorageAndAnalysis?: ValidationError
  cloudProvider?: ValidationError
  cloudProviderType?: ValidationError
  cloudProviderDescription?: ValidationError
}

export interface DarErrors {
  nihEraId?: ValidationError
  datasetIds?: ValidationError
  projectTitle?: ValidationError
  rus?: ValidationError
  diseases?: ValidationError
  ontologies?: ValidationError
  nonTechRus?: ValidationError
  collaborationLetter?: ValidationError
  irbDocument?: ValidationError
  gsoAcknowledgement?: ValidationError
  pubAcknowledgement?: ValidationError
  dsAcknowledgement?: ValidationError
  progressReportSummary?: ValidationError
  intellectualPropertyYesNo?: ValidationError
  intellectualPropertySummary?: ValidationError
  publicationsYesNo?: ValidationError
  publications?: ValidationError
  presentationsYesNo?: ValidationError
  presentations?: ValidationError
  labCollaborators?: ValidationError
  internalCollaborators?: ValidationError
  externalCollaborators?: ValidationError
  dmiYesNo?: ValidationError
  dmiCombination?: ValidationError
  dmiIdentification?: ValidationError
  dmiSharing?: ValidationError
  dmiSecurity?: ValidationError
  dmiAcknowledgement?: ValidationError
  dmiPublication?: ValidationError
  dmiFalsification?: ValidationError
  dmiOther?: ValidationError
  dmiDescription?: ValidationError
  closeoutYesNo?: ValidationError
  closeoutSigningOfficial?: ValidationError
  closeoutProjectCompleted?: ValidationError
  closeoutRequestorMovedInstitution?: ValidationError
  closeoutProjectTransferred?: ValidationError
  closeoutProjectSuperseded?: ValidationError
  closeoutOther?: ValidationError
  closeoutOtherText?: ValidationError
  aiModels?: ValidationError
  clinicalTrials?: ValidationError
  fundingResources?: ValidationError
  workspaces?: ValidationError
}

export interface RusErrors {
  aiLlmUse?: ValidationError
  gender?: ValidationError
  controls?: ValidationError
  population?: ValidationError
  forProfit?: ValidationError
  oneGender?: ValidationError
  pediatric?: ValidationError
  vulnerablePopulation?: ValidationError
  illegalBehavior?: ValidationError
  sexualDiseases?: ValidationError
  psychiatricTraits?: ValidationError
  notHealth?: ValidationError
  stigmatizedDiseases?: ValidationError
}

export interface ValidationError {
  valid?: boolean
  failed?: Array<string>
}
