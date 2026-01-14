// ********************** DUL LOGIC ********************** //

import { isEmpty, isNil, isEqual, isString } from 'lodash'
import { FormValidators } from '../components/forms/forms'
import { extractEraAuthenticationState } from 'src/components/era_commons/ERACommonsUtils'
import {
  Dataset,
  DataUse,
  FileStorageObject,
  Publication,
  Presentation,
  Collaborator,
  DuosUser,
  Author,
  Presenter,
} from 'src/types/model'
import { ValidationError } from 'src/pages/dar_application/FormValidationState'

type ValidationResult = ValidationError

interface PublicationValidation {
  [key: string]: ValidationResult
}

interface PresentationValidation {
  [key: string]: ValidationResult
  presenter: Record<string, ValidationError>
}

interface CollaboratorErrors {
  [key: string]: ValidationError
}

interface FormValidationErrors {
  [key: string]: ValidationError
}

interface DARFormValidationResult {
  researcherInfoErrors: FormValidationErrors
  darErrors: FormValidationErrors
  rusErrors: FormValidationErrors
  nihValid: boolean
}

interface PRFormValidationResult {
  darErrors: FormValidationErrors
}

interface FormDataBase {
  [key: string]: unknown
}

const datasetsContainDataUseFlag = (datasets: Dataset[], flag: keyof DataUse): boolean => {
  return datasets?.some((ds) => {
    const dataUse = ds?.dataUse
    if (!isEmpty(dataUse)) {
      return dataUse[flag] === true
    }
    return false
  }) ?? false
}

export const needsIrbApprovalDocument = (datasets: Dataset[]): boolean => {
  return datasetsContainDataUseFlag(datasets, 'ethicsApprovalRequired')
}

export const needsCollaborationLetter = (datasets: Dataset[]): boolean => {
  return datasetsContainDataUseFlag(datasets, 'collaboratorRequired')
}

export const needsGsoAcknowledgement = (datasets: Dataset[]): boolean => {
  return datasetsContainDataUseFlag(datasets, 'geneticStudiesOnly')
}

export const needsPubAcknowledgement = (datasets: Dataset[]): boolean => {
  return datasetsContainDataUseFlag(datasets, 'publicationResults')
}

export const needsDsAcknowledgement = (dataUseTranslations: unknown[]): boolean => {
  return dataUseTranslations.length > 1 && !dataUseTranslations.every(translation => isEqual(dataUseTranslations[0], translation))
}

export const newIrbDocumentExpirationDate = (): string => {
  const today = new Date()
  return `${(today.getFullYear() + 1).toString().padStart(4, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`
}

// ********************** DAR FORM VALIDATION ********************** //

export const validationFailed = (validation: unknown): boolean => {
  const obj = validation as Record<string, unknown>
  return Object.keys(obj).some(key => !isEmpty(obj[key]))
}

const validationError = (failed: string[]): ValidationError => {
  return { valid: false, failed }
}

const requiredError: ValidationError = {
  valid: false,
  failed: ['required'],
}

const isStringEmpty = (str: unknown): boolean => {
  return isNil(str) || (isString(str) && str.trim() === '')
}

export const computeCollaboratorErrors = ({
  collaborator,
  needsApproverStatus = true,
}: {
  collaborator: Partial<Collaborator>
  needsApproverStatus?: boolean
}): CollaboratorErrors => {
  const errors: CollaboratorErrors = {}
  if (!collaborator) {
    return errors
  }
  if (isStringEmpty(collaborator?.name)) {
    errors.name = requiredError
  }
  if (isStringEmpty(collaborator?.eraCommonsId)) {
    errors.eraCommonsId = requiredError
  }
  if (isStringEmpty(collaborator?.title)) {
    errors.title = requiredError
  }
  if (isStringEmpty(collaborator?.countryOfOperation)) {
    errors.countryOfOperation = requiredError
  }
  if (isStringEmpty(collaborator?.email)) {
    errors.email = requiredError
  }
  if (!isStringEmpty(collaborator?.email) && !FormValidators.EMAIL.isValid(collaborator.email as string)) {
    errors.email = validationError(['email'])
  }
  if (needsApproverStatus) {
    if (isNil(collaborator?.approverStatus)) {
      errors.approverStatus = requiredError
    }
  }
  return errors
}

const calcResearcherInfoErrors = (
  formData: FormDataBase,
  labCollaboratorsCompleted: boolean,
  internalCollaboratorsCompleted: boolean,
  externalCollaboratorsCompleted: boolean,
): FormValidationErrors => {
  const errors: FormValidationErrors = {}
  if (isStringEmpty(formData.researcher)) {
    errors.researcher = requiredError
  }
  if (!formData.nihValid) {
    errors.nihEraId = requiredError
  }
  if (isStringEmpty(formData.piCountryOfOperation)) {
    errors.piCountryOfOperation = requiredError
  }
  if (isStringEmpty(formData.signingOfficial)) {
    errors.signingOfficial = requiredError
  }
  if (isStringEmpty(formData.itDirector)) {
    errors.itDirector = requiredError
  }
  if (isStringEmpty(formData.itDirectorEmail)) {
    errors.itDirectorEmail = requiredError
  }
  if (!labCollaboratorsCompleted) {
    errors.labCollaboratorsCompleted = requiredError
  }
  if (!internalCollaboratorsCompleted) {
    errors.internalCollaborators = requiredError
  }
  if (!externalCollaboratorsCompleted) {
    errors.externalCollaborators = requiredError
  }
  if (isNil(formData.anvilUse)) {
    errors.anvilUse = requiredError
  }
  if (!formData.anvilUse && !formData.localUse && !formData.cloudUse) {
    errors.dataStorageAndAnalysis = requiredError
  }
  if (!formData.anvilUse) {
    if (formData.cloudUse && isStringEmpty(formData.cloudProvider)) {
      errors.cloudProvider = requiredError
    }
    if (formData.cloudUse && isStringEmpty(formData.cloudProviderType)) {
      errors.cloudProviderType = requiredError
    }
    if (formData.cloudUse && isStringEmpty(formData.cloudProviderDescription)) {
      errors.cloudProviderDescription = requiredError
    }
  }
  return errors
}

const calcDarErrors = (
  formData: FormDataBase,
  datasets: Dataset[],
  dataUseTranslations: unknown[],
  irbDocument: FileStorageObject,
  collaborationLetter: FileStorageObject,
): FormValidationErrors => {
  const errors: FormValidationErrors = {}
  if (isEmpty(formData.datasetIds) || isEmpty(datasets)) {
    errors.datasetIds = requiredError
  }
  if (isStringEmpty(formData.projectTitle)) {
    errors.projectTitle = requiredError
  }
  if (isStringEmpty(formData.rus)) {
    errors.rus = requiredError
  }
  if (isNil(formData.diseases)) {
    errors.diseases = requiredError
  }
  if (formData.diseases === true && isEmpty(formData.ontologies)) {
    errors.ontologies = requiredError
  }
  if (formData.diseases === false && isNil(formData.hmb)) {
    errors.hmb = requiredError
  }
  if (formData.hmb === false && isNil(formData.poa)) {
    errors.poa = requiredError
  }
  if (formData.poa === false && isNil(formData.methods)) {
    errors.methods = requiredError
  }
  if (formData.methods === false && isEmpty(formData.otherText)) {
    errors.otherText = requiredError
  }
  if (isStringEmpty(formData.nonTechRus)) {
    errors.nonTechRus = requiredError
  }
  if (needsCollaborationLetter(datasets) && isNil(collaborationLetter) && isEmpty(formData['collaborationLetterLocation'])) {
    errors.collaborationLetter = requiredError
  }
  if (needsIrbApprovalDocument(datasets) && isNil(irbDocument) && isEmpty(formData['irbDocumentLocation'])) {
    errors.irbDocument = requiredError
  }
  calcDUAErrors(formData, datasets, dataUseTranslations, errors)
  return errors
}

const calcSummaryErrors = (nihValid: boolean, errors: FormValidationErrors, formData: FormDataBase): void => {
  if (!nihValid) {
    errors.nihEraId = requiredError
  }
  if (isEmpty(formData.progressReportSummary)) {
    errors.progressReportSummary = requiredError
  }
  if (isNil(formData.intellectualPropertiesYesNo)) {
    errors.intellectualPropertiesYesNo = requiredError
  }
  if (formData.intellectualPropertiesYesNo && isEmpty(formData.intellectualProperties)) {
    errors.intellectualProperties = requiredError
  }
  if (isNil(formData.publicationsYesNo)) {
    errors.publicationsYesNo = requiredError
  }
  if (formData.publicationsYesNo && isEmpty(formData.publications)) {
    errors.publications = requiredError
  }
  if (isNil(formData.presentationsYesNo)) {
    errors.presentationsYesNo = requiredError
  }
  if (formData.presentationsYesNo && isEmpty(formData.presentations)) {
    errors.presentations = requiredError
  }
}

const calcDmiErrors = (formData: FormDataBase, errors: FormValidationErrors): void => {
  if (isNil(formData.dmiYesNo)) {
    errors.dmiYesNo = requiredError
  }
  const dmiFields = [formData.dmiAcknowledgement, formData.dmiCombination, formData.dmiFalsification,
    formData.dmiIdentification, formData.dmiOther, formData.dmiPublication, formData.dmiSecurity, formData.dmiSharing]
  if (formData.dmiYesNo && !dmiFields.some(field => field)) {
    errors.dmiAcknowledgement = requiredError
    errors.dmiCombination = requiredError
    errors.dmiFalsification = requiredError
    errors.dmiIdentification = requiredError
    errors.dmiOther = requiredError
    errors.dmiPublication = requiredError
    errors.dmiSecurity = requiredError
    errors.dmiSharing = requiredError
  }
  if (formData.dmiYesNo && isEmpty(formData.dmiDescription)) {
    errors.dmiDescription = requiredError
  }
}

const calcCloseoutErrors = (formData: FormDataBase, errors: FormValidationErrors): void => {
  const closeoutFields = [formData.closeoutOther, formData.closeoutProjectSuperseded, formData.closeoutProjectTransferred, formData.closeoutRequestorMovedInstitution, formData.closeoutProjectCompleted]
  if (isNil(formData.closeoutYesNo)) {
    errors.closeoutYesNo = requiredError
  }
  if (formData.closeoutOther && isEmpty(formData.closeoutOtherText)) {
    errors.closeoutOtherText = requiredError
  }
  if (formData.closeoutYesNo) {
    const signingOfficial = formData.closeoutSigningOfficial as { userId?: number }
    if (signingOfficial?.userId === undefined) {
      errors.closeoutSigningOfficial = requiredError
    }
    if (!closeoutFields.some(field => field)) {
      errors.closeoutProjectCompleted = requiredError
      errors.closeoutRequestorMovedInstitution = requiredError
      errors.closeoutProjectTransferred = requiredError
      errors.closeoutProjectSuperseded = requiredError
      errors.closeoutOther = requiredError
    }
  }
}

const calcPRErrors = (
  nihValid: boolean,
  formData: FormDataBase,
  datasets: Dataset[],
  dataUseTranslations: unknown[],
): FormValidationErrors => {
  const errors: FormValidationErrors = {}
  calcSummaryErrors(nihValid, errors, formData)
  calcDUAErrors(formData, datasets, dataUseTranslations, errors)
  calcDmiErrors(formData, errors)
  calcCloseoutErrors(formData, errors)
  return errors
}

const calcDUAErrors = (formData: FormDataBase, datasets: Dataset[], dataUseTranslations: unknown[], errors: FormValidationErrors): void => {
  if (needsGsoAcknowledgement(datasets) && !formData.gsoAcknowledgement) {
    errors.gsoAcknowledgement = requiredError
  }
  if (needsPubAcknowledgement(datasets) && !formData.pubAcknowledgement) {
    errors.pubAcknowledgement = requiredError
  }
  if (needsDsAcknowledgement(dataUseTranslations) && !formData.dsAcknowledgement) {
    errors.dsAcknowledgement = requiredError
  }
}

const validateDate = (date: unknown): ValidationError => {
  if (isEmpty(date)) {
    return requiredError
  }
  const dateValue = date as string
  if (!FormValidators.DATE.isValid(dateValue)) {
    return validationError(['date'])
  }
  return { valid: true }
}

export const ORCID_REGEX = /^(\d{4}-){3}\d{3}[\dX]$/

export const calcPublicationErrors = (newPublication: Partial<Publication>): PublicationValidation => {
  const validation: PublicationValidation = {}
  if (isEmpty(newPublication?.title)) {
    validation.title = requiredError
  }
  const publishedDate = newPublication?.publishedDate
  if (!isEmpty(publishedDate)) {
    validation.publishedDate = validateDate(publishedDate)
  }
  const authorsArr = Array.isArray(newPublication?.authors) ? newPublication.authors : []
  if (authorsArr.length === 0) {
    validation.authors = requiredError
  }
  if (authorsArr.length > 0) {
    const failedCodes: string[] = []
    const perAuthor = authorsArr.map((author: Author, idx) => {
      const name = author?.name ?? ''
      const orcId = author?.orcId ?? ''
      const row: Record<string, ValidationError> = {}
      if (isStringEmpty(name)) {
        row.name = requiredError
        failedCodes.push(`name@${idx}`)
      }
      if (!isStringEmpty(orcId) && !ORCID_REGEX.test(orcId)) {
        row.orcId = validationError(['orcIdFormat'])
        failedCodes.push(`orcIdFormat@${idx}`)
      }
      return row
    })
    if (failedCodes.length) {
      validation.authors = { valid: false, failed: failedCodes, perAuthor } as unknown as ValidationError
    }
  }
  if (isStringEmpty(newPublication?.pubmedId)) validation.pubmedId = requiredError
  if (isStringEmpty(newPublication?.bibliographicCitation)) validation.bibliographicCitation = requiredError
  if (isStringEmpty(newPublication?.datasetCitation)) validation.datasetCitation = requiredError
  if (isStringEmpty(newPublication?.journal)) validation.journal = requiredError
  if (isStringEmpty(newPublication?.doi)) validation.doi = requiredError
  if (isStringEmpty(newPublication?.url)) {
    validation.url = requiredError
  }
  if (!isStringEmpty(newPublication?.url) && !FormValidators.URL.isValid(newPublication.url as string)) {
    validation.url = validationError(['url'])
  }
  if (isStringEmpty(newPublication?.access)) validation.access = requiredError
  return validation
}

export const calcPresentationErrors = (newPresentation: Partial<Presentation>): PresentationValidation => {
  const validation: PresentationValidation = {
    presenter: {},
  }
  if (isEmpty(newPresentation?.title)) {
    validation.title = requiredError
  }
  const dateVal = newPresentation?.date
  if (!isEmpty(dateVal)) {
    validation.date = validateDate(dateVal)
  }
  if (isEmpty(newPresentation?.authors)) {
    validation.authors = requiredError
  }
  if (isEmpty(newPresentation?.url)) {
    validation.url = requiredError
  }
  if (isEmpty(newPresentation?.datasetCitation)) {
    validation.datasetCitation = requiredError
  }
  if (newPresentation?.citation === undefined || newPresentation?.citation === null) {
    validation.citation = requiredError
  }
  // Validate presenter (type: Presenter which extends Contact with name and email)
  const presenter: Partial<Presenter> = newPresentation?.presenter ?? {}
  if (isEmpty(presenter?.name)) {
    validation.presenter.name = requiredError
  }
  if (isEmpty(presenter?.email)) {
    validation.presenter.email = requiredError
  }
  if (isEmpty(newPresentation?.event)) {
    validation.event = requiredError
  }
  if (isEmpty(newPresentation?.location)) {
    validation.location = requiredError
  }
  if (isEmpty(newPresentation?.format)) {
    validation.format = requiredError
  }
  if (isEmpty(newPresentation?.access)) {
    validation.access = requiredError
  }
  return validation
}

const requiredRusFields = [
  'aiLlmUse',
  'controls',
  'population',
  'forProfit',
  'oneGender',
  'pediatric',
  'vulnerablePopulation',
  'illegalBehavior',
  'sexualDiseases',
  'psychiatricTraits',
  'notHealth',
  'stigmatizedDiseases',
]

const calcRusErrors = (formData: FormDataBase): FormValidationErrors => {
  const errors: FormValidationErrors = {}
  if (formData.oneGender === true) {
    const genderValue = formData.gender as string
    if (!['M', 'F'].includes(genderValue)) {
      errors.gender = requiredError
    }
  }
  requiredRusFields.forEach((field) => {
    if (isNil(formData[field])) {
      errors[field] = requiredError
    }
  })
  return errors
}

export const validateDARFormData = ({
  formData,
  datasets,
  dataUseTranslations,
  irbDocument,
  collaborationLetter,
  researcher,
  labCollaboratorsCompleted,
  internalCollaboratorsCompleted,
  externalCollaboratorsCompleted,
}: {
  formData: unknown
  datasets: Dataset[]
  dataUseTranslations: unknown[]
  irbDocument: FileStorageObject
  collaborationLetter: FileStorageObject
  researcher: DuosUser
  labCollaboratorsCompleted: boolean
  internalCollaboratorsCompleted: boolean
  externalCollaboratorsCompleted: boolean
}): DARFormValidationResult => {
  const formDataBase = formData as FormDataBase
  return {
    researcherInfoErrors: calcResearcherInfoErrors(formDataBase, labCollaboratorsCompleted, internalCollaboratorsCompleted, externalCollaboratorsCompleted),
    darErrors: calcDarErrors(formDataBase, datasets, dataUseTranslations, irbDocument, collaborationLetter),
    rusErrors: calcRusErrors(formDataBase),
    nihValid: extractEraAuthenticationState(researcher).nihValid,
  }
}

export const validatePRFormData = (
  nihValid: boolean,
  formData: unknown,
  datasets: Dataset[] = [],
  dataUseTranslations: unknown[],
): PRFormValidationResult => {
  return {
    darErrors: calcPRErrors(nihValid, formData as FormDataBase, datasets, dataUseTranslations),
  }
}
