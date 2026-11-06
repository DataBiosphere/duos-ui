import { StorageProfileMetadata } from 'src/libs/data-metadata'
import { FileType, FileTypeOptions } from 'src/pages/data_submission/consent_group/consentGroupUtils'
import { ValidationError, makeError } from 'src/pages/dar_application/FormValidationState'

/** Consent's file type values; BAM/CRAM/FASTQ/VCF need its enum widened before they can be offered. */
export const FILE_TYPE_OPTIONS = ['Arrays', 'Genome', 'Exome', 'Survey', 'Phenotype']

/** Suggestions only: the selects are creatable, so any provider's class, type or region can be entered. */
export const STORAGE_CLASS_OPTIONS = [
  'Standard', 'Nearline', 'Coldline', 'Archive',
  'S3 Standard', 'S3 Intelligent-Tiering', 'S3 Standard-IA', 'S3 Glacier', 'S3 Glacier Deep Archive',
  'Azure Hot', 'Azure Cool', 'Azure Archive',
]
export const STORAGE_TYPE_OPTIONS = ['Cloud', 'On-prem', 'Hybrid']
export const REGION_OPTIONS = [
  'us', 'us-central1', 'us-east1', 'us-east4', 'us-west1', 'us-west2', 'northamerica-northeast1', 'europe-west1', 'europe-west2', 'asia-southeast1',
  'us-east-1', 'us-east-2', 'us-west-2', 'eu-west-1',
]

/** Sizes are entered in decimal gigabytes, as cloud consoles report them, and stored in bytes. */
export const BYTES_PER_GB = 1e9

/**
 * The profiles a dataset shows: those it stores, or for a dataset saved before profiles existed,
 * one per file type it carries, so its file types are not lost. Never empty: one blank row at least.
 */
export const storageProfilesFor = (profiles: StorageProfileMetadata[] | undefined, fileTypes: FileType[] | undefined): StorageProfileMetadata[] => {
  if (profiles?.length) return profiles
  if (fileTypes?.length) return fileTypes.map(({ fileType }) => ({ fileType }))
  return [{}]
}

/** Consent's `fileTypes`, derived from the profiles: each file type once, in the order first used. */
export const fileTypesFromProfiles = (profiles: StorageProfileMetadata[]): FileType[] =>
  [...new Set(profiles.map(profile => profile.fileType).filter((type): type is string => !!type))]
    .map(fileType => ({ fileType: fileType as FileTypeOptions }))

export type StorageProfileValidation = Partial<Record<'fileCount' | 'aggregateFileSizeBytes', ValidationError>>

/** Errors by row index; only rows with an error appear. */
export const storageProfileErrors = (profiles: StorageProfileMetadata[] | undefined): Record<number, StorageProfileValidation> => {
  const errors: Record<number, StorageProfileValidation> = {}
  ;(profiles ?? []).forEach((profile, index) => {
    const row: StorageProfileValidation = {}
    if ((profile.fileCount ?? 0) < 0) row.fileCount = makeError('greaterThanZero')
    if ((profile.aggregateFileSizeBytes ?? 0) < 0) row.aggregateFileSizeBytes = makeError('greaterThanZero')
    if (Object.keys(row).length) errors[index] = row
  })
  return errors
}
