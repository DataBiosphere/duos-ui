/**
 * Client-managed metadata stored in the `data` field on Study and
 * Dataset/ConsentGroup objects. These keys are not validated by the backend.
 * The backend stores and returns the `data` bag opaquely; all key semantics
 * are owned by the frontend.
 */

/** Keys for `Study.data`. */
export const StudyDataKeys = {
  TAGS: 'tags',
  PRINCIPAL_INVESTIGATORS: 'principalInvestigators',
  DATA_CUSTODIANS: 'dataCustodians',
  DOI: 'doi',
  DATA_COLLECTION_CONTEXT: 'dataCollectionContext',
  POPULATION_SAME_ACROSS_ASSETS: 'populationSameAcrossAssets',
  POPULATION: 'population',
  TARGET_DATES_SAME_ACROSS_ASSETS: 'targetDatesSameAcrossAssets',
  PUBLIC_VISIBILITY_SAME_ACROSS_ASSETS: 'publicVisibilitySameAcrossAssets',
  DATA_COLLECTION_METHOD: 'dataCollectionMethod',
  DATA_COLLECTION_MODALITY: 'dataCollectionModality',
  ANATOMICAL_AREAS: 'anatomicalAreas',
} as const
export type StudyDataKey = typeof StudyDataKeys[keyof typeof StudyDataKeys]

/**
 * One place, as precise as the submitter knows it: a country, with optionally a state/department,
 * county, and city/town in it. The country comes from Consent's ISO list; the rest are typed.
 */
export interface GeographyMetadata {
  country?: string
  /** State, province, department, or other first-level subdivision. */
  region?: string
  county?: string
  city?: string
}

/**
 * Who a study or dataset describes. Held at the study when the population is the same across all
 * its datasets, and on each dataset otherwise; see `StudyDataMetadata.populationSameAcrossAssets`.
 */
export interface PopulationMetadata {
  /** Whole years, inclusive. `max` at AGE_RANGE_TOP (90) means "90 and over". */
  ageRange?: { min: number, max: number }
  sex?: string[]
  ancestry?: string[]
  /** Where participants were recruited or samples collected; each entry at whatever level is known. */
  geography?: GeographyMetadata[]
}

/** One Principal Investigator. The first in the list is the study's primary PI. */
export interface PrincipalInvestigatorMetadata {
  firstName?: string
  lastName?: string
  email?: string
  /** Bare 16-digit ORCID iDs (0000-0000-0000-000X), no https://orcid.org/ prefix. */
  orcids?: string[]
}

/** One Data Custodian: an institutional contact for data access or data quality questions. */
export interface DataCustodianMetadata {
  firstName?: string
  lastName?: string
  email?: string
}

/** Typed overlay for `Study.data`. Unknown keys are preserved for round-trip. */
export interface StudyDataMetadata {
  [key: string]: unknown
  /** Free-form tags for study discovery (e.g. disease area, assay type). */
  tags?: string[]
  /**
   * Every PI, in the order entered. Consent still requires and displays the single `Study.piName`
   * and `Study.piEmail`, so those are kept equal to the first PI's composed name and email.
   */
  principalInvestigators?: PrincipalInvestigatorMetadata[]
  /**
   * Every Data Custodian, in the order entered. Consent stores only the `dataCustodianEmail` list,
   * so that study property is kept equal to these rows' emails.
   */
  dataCustodians?: DataCustodianMetadata[]
  /** Bare DOI (10.xxxx/...), no https://doi.org/ prefix. */
  doi?: string
  /** How the data was collected, and the biases and nuances a requester should know about. */
  dataCollectionContext?: string
  /**
   * True: `population` is entered once here, optionally, and copied onto every dataset on submission.
   * False: each dataset must carry its own complete population. Absent reads as true, so studies
   * registered before this existed can still be updated without entering a population.
   */
  populationSameAcrossAssets?: boolean
  population?: PopulationMetadata
  /**
   * Same rule as `populationSameAcrossAssets`, for the two target dates. When false, the dates are
   * entered on each dataset and the study-level ones are not submitted. Absent reads as true.
   */
  targetDatesSameAcrossAssets?: boolean
  /**
   * Same rule, for Public Visibility. Consent only knows a study-level `publicVisibility`, so when
   * this is false the study is submitted as visible only if every dataset is. Absent reads as true.
   */
  publicVisibilitySameAcrossAssets?: boolean
  /** How the data was gathered, e.g. 'Survey / Questionnaire', 'Electronic Health Records'. */
  dataCollectionMethod?: string[]
  /** The mode it was gathered in, e.g. 'In-person', 'Remote / Online'. */
  dataCollectionModality?: string[]
  /** Organs, tissues, or body systems studied, e.g. 'Brain', 'Liver'. Consent has no field for these. */
  anatomicalAreas?: string[]
}

/**
 * Keys for `ConsentGroup2.data` (dataset level).
 * Kept separate from StudyDataKeys intentionally: Study and Dataset are distinct
 * backend objects whose data bags may evolve independently.
 */
export const DatasetDataKeys = {
  TAGS: 'tags',
  CLOUD: 'cloud',
  DESCRIPTION: 'description',
  DATA_COLLECTION_CONTEXT: 'dataCollectionContext',
  DOI: 'doi',
  POPULATION: 'population',
  STORAGE_PROFILES: 'storageProfiles',
  TARGET_DELIVERY_DATE: 'targetDeliveryDate',
  TARGET_PUBLIC_RELEASE_DATE: 'targetPublicReleaseDate',
  PUBLIC_VISIBILITY: 'publicVisibility',
} as const
export type DatasetDataKey = typeof DatasetDataKeys[keyof typeof DatasetDataKeys]

/**
 * One file/storage profile of a dataset: a set of files of one type, and where and how they are kept.
 * A dataset may hold several, e.g. CRAMs in Standard storage and older FASTQs in Archive.
 */
export interface StorageProfileMetadata {
  /** One of Consent's file type values; the dataset's `fileTypes` are derived from these on save. */
  fileType?: string
  /** e.g. 'Standard', 'Coldline' */
  storageClass?: string
  /** e.g. 'Cloud', 'On-prem' */
  storageType?: string
  /** e.g. 'us-central1' */
  region?: string
  fileCount?: number
  aggregateFileSizeBytes?: number
}

/** Typed overlay for `ConsentGroup2.data`. Unknown keys are preserved for round-trip. */
export interface DatasetDataMetadata {
  [key: string]: unknown
  /** Free-form tags for dataset discovery (e.g. disease area, assay type). */
  tags?: string[]
  /** Cloud providers where data is hosted (e.g. 'GCP', 'AWS'). */
  cloud?: string[]
  /** General annotations on the dataset; distinct from the study description. */
  description?: string
  dataCollectionContext?: string
  doi?: string
  /** Copied from the study on submission when the study's population is shared across datasets. */
  population?: PopulationMetadata
  storageProfiles?: StorageProfileMetadata[]
  /** YYYY-MM-DD. Copied from the study on submission when the study's dates are shared. */
  targetDeliveryDate?: string
  targetPublicReleaseDate?: string
  /** Copied from the study on submission when the study's visibility is shared. */
  publicVisibility?: boolean
}

/**
 * Elasticsearch field paths derived from StudyDataKeys.
 * These are query-time paths, not stored data shapes.
 */
const _studyDataTagsEsField = 'study.data.tags' as const
export const StudyDataEsFields = {
  TAGS: _studyDataTagsEsField,
  TAGS_KEYWORD: `${_studyDataTagsEsField}.keyword` as const,
} as const
