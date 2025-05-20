
export interface FormValidationState {
    researcherInfoErrors?: ResearcherErrors,
    darErrors?: DarErrors,
    rusErrors?: RusErrors,
    nihValid?: boolean,
}
export interface ResearcherErrors {
    researcher?: ValidationError,
    nihEraId?: ValidationError,
    piName?: ValidationError,
    signingOfficial?: ValidationError,
    itDirector?: ValidationError,
    labCollaboratorsCompleted?: ValidationError,
    internalCollaborators?: ValidationError,
    externalCollaborators?: ValidationError,
    anvilUse?: ValidationError,
    dataStorageAndAnalysis?: ValidationError,
    cloudProvider?: ValidationError,
    cloudProviderType?: ValidationError,
    cloudProviderDescription?: ValidationError,
}

export interface DarErrors {
    datasetIds?: ValidationError,
    projectTitle?: ValidationError,
    rus?: ValidationError,
    diseases?: ValidationError,
    ontologies?: ValidationError,
    nonTechRus?: ValidationError,
    collaborationLetter?: ValidationError,
    irbDocument?: ValidationError,
    gsoAcknowledgement?: ValidationError,
    pubAcknowledgement?: ValidationError,
    dsAcknowledgement?: ValidationError,
}

export interface RusErrors {
    gender?: ValidationError,
    controls?: ValidationError,
    population?: ValidationError,
    forProfit?: ValidationError,
    oneGender?: ValidationError,
    pediatric?: ValidationError,
    vulnerablePopulation?: ValidationError,
    illegalBehavior?: ValidationError,
    sexualDiseases?: ValidationError,
    psychiatricTraits?: ValidationError,
    notHealth?: ValidationError,
    stigmatizedDiseases?: ValidationError,
}

export interface ValidationError {
    valid?: boolean,
    failed?: Array<string>,
}

