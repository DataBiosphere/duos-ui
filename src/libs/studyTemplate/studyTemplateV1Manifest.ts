/**
 * The study-template CSV v1 field catalogue.
 *
 * Canonical contract: `docs/study-template-v1.md` in the `consent` repository. Field order here is
 * the declared wire order of `StudyRegistrationRequest`, `ConsentGroupRequest`, and
 * `FileTypeObject`, so a reviewer can diff this manifest against those DTOs' `@JsonPropertyOrder`
 * rather than against prose.
 *
 * v1 carries no JSON: every structured wire value is a row. The free-form `assets` and `data` maps,
 * the file-backed `alternativeDataSharingPlan*` group, and integration-owned identifiers are
 * therefore excluded — Consent rejects them by name, so emitting one would produce a template that
 * cannot validate.
 */

export const TEMPLATE_VERSION = '1'

export const TEMPLATE_HEADER = [
  'templateVersion',
  'recordType',
  'recordId',
  'parentRecordId',
  'field',
  'value',
] as const

export const RECORD_TYPE = {
  study: 'study',
  consentGroup: 'consentGroup',
  fileType: 'fileType',
} as const

/**
 * Scaffold record ids. `study` is fixed by the contract; the other two are template-only grouping
 * keys that never reach the wire, so a producer may rename them or add sibling records freely.
 */
export const SCAFFOLD_RECORD_ID = {
  study: 'study',
  consentGroup: 'consentGroup-1',
  fileType: 'fileType-1',
} as const

/** Wire order items 1–27 of `StudyRegistrationRequest`. */
export const STUDY_FIELDS = [
  'studyName',
  'studyType',
  'studyDescription',
  'dataTypes',
  'phenotypeIndication',
  'species',
  'piName',
  'piEmail',
  'dataCustodianEmail',
  'publicVisibility',
  'throughBioId',
  'nihAnvilUse',
  'submittingToAnvil',
  'dbGaPPhsID',
  'dbGaPStudyRegistrationName',
  'embargoReleaseDate',
  'sequencingCenter',
  'piInstitution',
  'nihGrantContractNumber',
  'nihICsSupportingStudy',
  'nihProgramOfficerName',
  'nihInstitutionCenterSubmission',
  'nihGenomicProgramAdministratorName',
  'multiCenterStudy',
  'collaboratingSites',
  'controlledAccessRequiredForGenomicSummaryResultsGSR',
  'controlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation',
] as const

/** Wire order items 2–23 of `ConsentGroupRequest`; `fileTypes` is a record type, not a field. */
export const CONSENT_GROUP_FIELDS = [
  'consentGroupName',
  'accessManagement',
  'generalResearchUse',
  'hmb',
  'diseaseSpecificUse',
  'poa',
  'otherPrimary',
  'nmds',
  'gso',
  'pub',
  'col',
  'irb',
  'gs',
  'mor',
  'morDate',
  'npu',
  'otherSecondary',
  'dataAccessCommitteeId',
  'dataLocation',
  'url',
  'requestLocation',
  'numberOfParticipants',
] as const

export const FILE_TYPE_FIELDS = [
  'fileType',
  'functionalEquivalence',
] as const

/**
 * Wire properties Consent reports as excluded rather than unknown, so a producer who names one is
 * told it belongs on the draft form. Mirrors `StudyTemplateV1Fields.UNSUPPORTED_STUDY_FIELDS`.
 */
export const EXCLUDED_STUDY_FIELDS = [
  'alternativeDataSharingPlan',
  'alternativeDataSharingPlanReasons',
  'alternativeDataSharingPlanExplanation',
  'alternativeDataSharingPlanFileName',
  'alternativeDataSharingPlanFile',
  'alternativeDataSharingPlanDataSubmitted',
  'alternativeDataSharingPlanDataReleased',
  'alternativeDataSharingPlanTargetDeliveryDate',
  'alternativeDataSharingPlanTargetPublicReleaseDate',
  'alternativeDataSharingPlanAccessManagement',
  'nihInstitutionalCertificationFile',
  'assets',
  'data',
  'externalIdentifier',
  'externalIdentifierType',
] as const

export const EXCLUDED_CONSENT_GROUP_FIELDS = [
  'datasetId',
  'data',
] as const
