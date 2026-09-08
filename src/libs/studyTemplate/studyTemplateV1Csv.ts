import {
  CONSENT_GROUP_FIELDS,
  FILE_TYPE_FIELDS,
  RECORD_TYPE,
  SCAFFOLD_RECORD_ID,
  STUDY_FIELDS,
  TEMPLATE_HEADER,
  TEMPLATE_VERSION,
} from 'src/libs/studyTemplate/studyTemplateV1Manifest'

export const BLANK_TEMPLATE_FILENAME = 'duos-study-template-v1.csv'
export const BLANK_TEMPLATE_MIME = 'text/csv'

/** Bytes Consent accepts for one template; it reports the same limit with this wording. */
export const MAX_TEMPLATE_BYTES = 5 * 1024 * 1024
export const MAX_TEMPLATE_SIZE_MESSAGE = 'Template file must be no larger than 5 MiB'

const FORMULA_PREFIXES = new Set(['=', '+', '-', '@'])

/**
 * Renders one cell: neutralizes a spreadsheet formula prefix, then quotes per RFC 4180.
 *
 * No cell this module currently emits starts with a formula prefix — the manifest is field names and
 * record ids, and every `value` is empty. The guard is applied to every cell anyway so that adding a
 * field or emitting example values later cannot silently turn the download into a CSV-injection
 * vector in the producer's spreadsheet.
 */
export const escapeCsvCell = (value: string): string => {
  const neutralized = FORMULA_PREFIXES.has(value.trimStart().charAt(0)) ? `'${value}` : value
  return /["\r\n,]/.test(neutralized) ? `"${neutralized.replaceAll('"', '""')}"` : neutralized
}

const buildRow = (
  recordType: string,
  recordId: string,
  parentRecordId: string,
  field: string,
): string => [TEMPLATE_VERSION, recordType, recordId, parentRecordId, field, '']
  .map(escapeCsvCell)
  .join(',')

/**
 * Builds the blank v1 template: the canonical header, then one row per offered field with `value`
 * left empty. Scaffolds a single record of each type; a producer adds datasets by copying the
 * `consentGroup` block under a new `recordId`, and array items by repeating a field's row.
 *
 * CRLF and no BOM: CRLF is the RFC 4180 separator and Excel's default, and every cell emitted here
 * is ASCII, so a BOM would buy nothing.
 */
export const buildBlankStudyTemplateV1 = (): string => {
  const rows = [
    TEMPLATE_HEADER.map(escapeCsvCell).join(','),
    ...STUDY_FIELDS.map(field =>
      buildRow(RECORD_TYPE.study, SCAFFOLD_RECORD_ID.study, '', field)),
    ...CONSENT_GROUP_FIELDS.map(field =>
      buildRow(RECORD_TYPE.consentGroup, SCAFFOLD_RECORD_ID.consentGroup, SCAFFOLD_RECORD_ID.study, field)),
    ...FILE_TYPE_FIELDS.map(field =>
      buildRow(RECORD_TYPE.fileType, SCAFFOLD_RECORD_ID.fileType, SCAFFOLD_RECORD_ID.consentGroup, field)),
  ]
  return `${rows.join('\r\n')}\r\n`
}
