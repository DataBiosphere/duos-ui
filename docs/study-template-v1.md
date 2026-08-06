# Study Template CSV Contract v1

Jira: [DT-3869](https://broadworkbench.atlassian.net/browse/DT-3869)

Status: **product and Consent API owner approval required before dependent parser or endpoint work
merges**

This is the canonical v1 contract for importing one study and its datasets into a DUOS study
registration draft. It maps template fields to Consent's `StudyRegistrationRequest` wire contract;
it does not define a new registration API or replace existing registration validation.

Canonical synthetic fixtures live in `test/fixtures/study-template/v1`. Consent parser tests may
copy or load these fixtures when parser work begins; DT-3869 itself does not implement parsing or
UI behavior.

## File contract

- File extension: `.csv`.
- Maximum size: 5 MiB (5,242,880 bytes), including a UTF-8 BOM when present.
- Encoding: UTF-8. A UTF-8 BOM is accepted only at the beginning of the file.
- Dialect: RFC 4180-style comma-separated values. Double quotes enclose values; a literal quote is
  escaped as `""`. CRLF and LF record separators are accepted.
- One file represents exactly one study.
- The case-sensitive header is required exactly once and in this order:

```text
templateVersion,recordType,recordId,parentRecordId,field,value
```

- `templateVersion` is required on every data row and must be major version `1`. Mixed or
  unsupported versions are errors.
- Blank physical lines may be ignored. A zero-byte, BOM-only, header-only, or otherwise record-free
  file is invalid.
- Leading and trailing whitespace is significant in string values. Producers should not add
  whitespace around unquoted values.

## Record model

Each row assigns one `field` to one logical record.

| `recordType` | `recordId` | `parentRecordId` | Meaning |
| --- | --- | --- | --- |
| `study` | Must be `study` | Empty | One field on the single `StudyRegistrationRequest`. |
| `consentGroup` | Unique non-empty template ID | Must be `study` | One field on a `ConsentGroupRequest`; each ID becomes one `consentGroups[]` item. |
| `asset` | Unique non-empty template ID | Must be `study` | One supported non-file asset; `field` names the asset collection and `value` is a JSON object. |

`recordId` is template-only grouping metadata for study and consent-group records. For assets it
also becomes the client asset identifier (`modelId`, `workspaceId`, `publicationId`,
`presentationId`, `clinicalTrialId`, `fundingId`, or `ipId`). Numeric study and dataset IDs remain
server-owned.

Rows may appear in any order after the header. A `(recordType, recordId, field)` tuple may occur only
once; duplicate assignments are errors even if their values match. Unknown headers, record types,
fields, and asset properties are errors and are never silently ignored.

## Value encoding

| Kind | Encoding |
| --- | --- |
| String or enum | Exact wire value; enum matching is case-sensitive. Use normal CSV quoting for commas, quotes, or line breaks. |
| Boolean | Exactly lowercase `true` or `false`. |
| Integer | Base-10 digits with an optional leading minus sign; no decimal point or separator. Domain validation may reject negative values. |
| Date | ISO local date `YYYY-MM-DD`; calendar-invalid dates are rejected. |
| URI | Absolute `http` or `https` URI. |
| Array | Compact JSON array in one CSV cell, such as `["Genomic","Phenotypic"]`. CSV escaping still applies. |
| Object | Compact JSON object in one CSV cell, used only for supported asset payloads and `fileTypes` entries. |
| Empty value | An empty `value` cell means absent (`null`), not an empty string or empty array. Omit optional fields; empty required values fail validation. |

For example, `["Genomic","Phenotypic"]` is represented as this CSV cell:

```csv
"[""Genomic"",""Phenotypic""]"
```

## Study field mapping

Wire paths are relative to `StudyRegistrationRequest`. Conditional requirements reuse Consent's
existing `StudyRegistrationRequestValidator` rules.

| CSV `field` | Wire target | Type | Requirement / existing rule |
| --- | --- | --- | --- |
| `studyName` | `studyName` | String | Required and non-blank. |
| `studyType` | `studyType` | Enum | Optional; exact `StudyType` wire value. |
| `studyDescription` | `studyDescription` | String | Required and non-blank. |
| `dataTypes` | `dataTypes` | String array | Required and non-empty. |
| `phenotypeIndication` | `phenotypeIndication` | String | Optional. |
| `species` | `species` | String | Optional. |
| `piName` | `piName` | String | Required and non-blank. |
| `piEmail` | `piEmail` | String | Optional; must be a valid email when present. |
| `dataCustodianEmail` | `dataCustodianEmail` | String array | Optional; every non-empty item must be a valid email. |
| `publicVisibility` | `publicVisibility` | Boolean | Required. |
| `throughBioId` | `throughBioId` | String | Optional. |
| `nihAnvilUse` | `nihAnvilUse` | Enum | Required; exact `NihAnvilUse` wire value. |
| `submittingToAnvil` | `submittingToAnvil` | Boolean | Optional. |
| `dbGaPPhsID` | `dbGaPPhsID` | String | Required when `nihAnvilUse` states that an existing dbGaP PHS ID is available. |
| `dbGaPStudyRegistrationName` | `dbGaPStudyRegistrationName` | String | Optional. |
| `embargoReleaseDate` | `embargoReleaseDate` | Date | Optional; valid ISO local date when present. |
| `sequencingCenter` | `sequencingCenter` | String | Optional. |
| `piInstitution` | `piInstitution` | Integer | Required for NHGRI-funded or AnVIL-seeking `nihAnvilUse` choices; an existing DUOS institution ID. |
| `nihGrantContractNumber` | `nihGrantContractNumber` | String | Required for NHGRI-funded or AnVIL-seeking `nihAnvilUse` choices. |
| `nihICsSupportingStudy` | `nihICsSupportingStudy` | Enum array | Optional; exact NIH institute/center abbreviations. |
| `nihProgramOfficerName` | `nihProgramOfficerName` | String | Optional. |
| `nihInstitutionCenterSubmission` | `nihInstitutionCenterSubmission` | Enum | Optional; exact NIH institute/center abbreviation. |
| `nihGenomicProgramAdministratorName` | `nihGenomicProgramAdministratorName` | String | Optional. |
| `multiCenterStudy` | `multiCenterStudy` | Boolean | Optional. |
| `collaboratingSites` | `collaboratingSites` | String array | Optional. |
| `controlledAccessRequiredForGenomicSummaryResultsGSR` | Same name | Boolean | Optional. |
| `controlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation` | Same name | String | Required when controlled GSR access is `true`. |
| `alternativeDataSharingPlan` | `alternativeDataSharingPlan` | Boolean | Optional. |
| `alternativeDataSharingPlanReasons` | `alternativeDataSharingPlanReasons` | Enum array | Required and non-empty when an alternative plan is `true`. |
| `alternativeDataSharingPlanExplanation` | `alternativeDataSharingPlanExplanation` | String | Required when an alternative plan is `true`. |
| `alternativeDataSharingPlanDataSubmitted` | Same name | Enum | Optional; exact wire value. |
| `alternativeDataSharingPlanDataReleased` | Same name | Boolean | Optional. |
| `alternativeDataSharingPlanTargetDeliveryDate` | Same name | Date | Optional; valid ISO local date when present. |
| `alternativeDataSharingPlanTargetPublicReleaseDate` | Same name | Date | Optional; valid ISO local date when present. |
| `alternativeDataSharingPlanAccessManagement` | Same name | Enum | Optional; exact wire value. |

The following wire properties are deliberately not direct template fields:

| Wire property | Reason |
| --- | --- |
| `consentGroups` | Constructed from `consentGroup` records. |
| `assets` | Constructed from `asset` records. |
| `alternativeDataSharingPlanFileName` | File-backed and filename-only fields are unsupported. Add the actual file on the populated draft form. |
| `data` | Opaque client metadata is not part of the stable v1 contract. |
| `externalIdentifier`, `externalIdentifierType` | Integration-owned identifiers are outside this user-authored template. |

NIH institutional certification files are also excluded. They are not fields on the canonical wire
request and must be uploaded on the populated draft form.

## Consent-group field mapping

Wire paths are relative to one `consentGroups[]` item.

| CSV `field` | Wire target | Type | Requirement / existing rule |
| --- | --- | --- | --- |
| `consentGroupName` | `consentGroupName` | String | Required and non-blank; displayed as the dataset name. |
| `accessManagement` | `accessManagement` | Enum | Required by this template contract: `open`, `controlled`, or `external`. |
| `generalResearchUse` | `generalResearchUse` | Boolean | Primary data-use option. |
| `hmb` | `hmb` | Boolean | Primary data-use option. |
| `diseaseSpecificUse` | `diseaseSpecificUse` | String array | Primary data-use option; selected when non-empty. |
| `poa` | `poa` | Boolean | Primary data-use option. |
| `otherPrimary` | `otherPrimary` | String | Primary data-use option; selected when non-blank. |
| `nmds` | `nmds` | Boolean | Optional secondary restriction. |
| `gso` | `gso` | Boolean | Optional secondary restriction. |
| `pub` | `pub` | Boolean | Optional secondary restriction. |
| `col` | `col` | Boolean | Optional secondary restriction. |
| `irb` | `irb` | Boolean | Optional secondary restriction. |
| `gs` | `gs` | String | Optional geographic restriction. |
| `mor` | `mor` | Boolean | Optional publication-moratorium flag. |
| `morDate` | `morDate` | Date | Optional; valid ISO local date when present. |
| `npu` | `npu` | Boolean | Optional non-profit-use restriction. |
| `otherSecondary` | `otherSecondary` | String | Optional secondary restriction. |
| `dataAccessCommitteeId` | `dataAccessCommitteeId` | Integer | Required for `controlled`; an existing DUOS DAC ID. Not required for `open` or `external`. |
| `dataLocation` | `dataLocation` | Enum | Optional; exact `DataLocation` wire value. |
| `url` | `url` | URI | Optional absolute HTTP(S) data URL. |
| `requestLocation` | `requestLocation` | URI | Optional absolute HTTP(S) external-request URL. |
| `numberOfParticipants` | `numberOfParticipants` | Integer | Required. |
| `fileTypes` | `fileTypes` | Object array | Optional; each item has exact `fileType` and optional `functionalEquivalence`. These describe data formats, not uploads. |

Primary data-use rules are unchanged: `open` requires no primary data use; `controlled` and
`external` require exactly one of general research use, HMB, disease-specific use, POA, or other.
`datasetId` is server-assigned, and the opaque consent-group `data` property is unsupported.

## Non-file asset mapping

An asset record contains exactly one row. Its `field` is one collection name below and its `value`
is a JSON object using existing duos-ui property names. It maps to
`StudyRegistrationRequest.assets.<field>[]`.

| Asset `field` | `recordId` maps to | Required JSON properties | Optional JSON properties |
| --- | --- | --- | --- |
| `models` | `modelId` | `name`, `url`, `format`, `license`, `maintainer` (`name`, `email`) | `description`, `cloud`, `trainedOnDatasets`, `tags` |
| `workspaces` | `workspaceId` | `name`, `platform`, `url`, `description` | `cloud`, `tools`, `access`, `tags` |
| `publications` | `publicationId` | `title`, `publishedDate`, `authors`, `datasetCitation`, `citation`, `journal`, `doi` | `pubmedId`, `bibliographicCitation`, `url`, `access`, `tags` |
| `presentations` | `presentationId` | `title`, `date`, `citation` | `url`, `authors`, `datasetCitation`, `presenter`, `event`, `location`, `format`, `access`, `tags` |
| `clinicalTrials` | `clinicalTrialId` | `title`, `registry`, `identifier`, `status`, `sponsor`, `startDate`, `interventionType`, `description`, `phase`, `url` | `endDate`, `tags` |
| `funding` | `fundingId` | `funderName`, `funderProgram`, `grantNumber`, `projectTitle`, `url` | `startDate`, `endDate`, `tags` |
| `intellectualProperties` | `ipId` | `type`, `title`, `assignee`, `patentNumber`, `filingDate`, `status`, `url`, `contact` | `tags` |

Asset objects must not contain their ID property or `studyId`; the importer supplies the ID from
`recordId`, and draft/study processing supplies `studyId`. Biospecimens are excluded because the
current study form does not allow users to add them. No file-storage object or file-content asset is
supported.

## Invalid-input behavior

Validation collects independently actionable errors in deterministic order: file/structure errors,
then row conversion errors in file order, then existing DTO/domain violations in validator order.
Return at most 100 errors and report explicitly if additional errors were omitted.

File and structural errors stop validation before DTO construction because the record model is not
trustworthy. Once structure is valid, conversion and DTO/domain validation may both report errors.
A field with a conversion error is omitted from the DTO, but its derivative required or conditional
DTO violation is suppressed; the conversion error is the actionable error for that field. Independent
DTO/domain violations are still reported. This prevents duplicate or misleading errors while
preserving aggregation across otherwise independent fields.

| Condition | Behavior |
| --- | --- |
| Empty or record-free file | Reject; no draft is created. |
| File larger than 5 MiB | Reject before parsing; no draft is created. |
| Malformed CSV or invalid UTF-8 | Reject with location when known. |
| Missing, unknown, reordered, or duplicate header | Reject. |
| Missing, unsupported, or mixed version | Reject affected rows; only major version `1` is supported. |
| Unknown record type, field, asset collection, or asset property | Reject the row. |
| Duplicate `(recordType, recordId, field)` | Reject the later assignment. |
| Missing parent, multiple study records, or orphan record | Reject the affected record. |
| Empty required value or invalid scalar/JSON | Reject with row and column context. |
| Existing registration-rule violation | Reject with the existing validator message; row and column may be absent. |

Errors and general logs must not echo raw rows or sensitive free-text values.

## Canonical fixtures

Fixtures live under `test/fixtures/study-template/v1`:

- `valid/minimal-valid.csv`
- `valid/multi-consent-group-valid.csv`
- `invalid/empty-file.csv`
- `invalid/duplicate-header.csv`
- `invalid/duplicate-field.csv`
- `invalid/unknown-field.csv`
- `invalid/unsupported-version.csv`
- `invalid/field-values.csv`

Every invalid CSV has a sibling `.errors.json` file containing the expected structured errors. All
values are synthetic and contain no production study, participant, user, institution, or DAC data.

## Validation error contract

Expected CSV and registration errors are returned as a completed validation result, not as thrown
request failures:

```ts
interface TemplateValidationError {
  row?: number
  column?: string
  message: string
}

type TemplateValidationResponse =
  | { valid: false, errors: TemplateValidationError[] }
  | {
      valid: true
      errors: []
      draft: {
        id: string
        draftType: 'StudyDatasetSubmissionV1'
      }
    }
```

`row` is one-based and counts the CSV header as row 1. Parser and conversion errors include row and
column when known. Violations from the existing registration validator may contain only a message;
the UI must not infer locations by parsing that message.

Authentication, authorization, multipart, size-limit, network, and unexpected server failures are
request failures and must be rendered separately from `valid: false` results.

## Draft hydration boundary

On success, route with the exact returned draft UUID and require
`draftType === 'StudyDatasetSubmissionV1'`. The loaded document has the
`StudyRegistrationRequest` wire shape described by this contract. Hydration must:

- populate supported study fields, consent groups, and non-file assets;
- leave file upload controls empty;
- allow review and edits through the existing study registration form; and
- submit through the existing study-creation path.

The CSV contract's `recordId` values are template grouping keys. Consent converts asset record IDs
to the corresponding client asset ID. Numeric study and dataset IDs remain server-owned.

## Approval gate

Product and Consent API owners must approve the canonical contract before dependent parser and
endpoint work merges. Approval is tracked in DT-3869 and its pull requests, not in this consumer
summary.
