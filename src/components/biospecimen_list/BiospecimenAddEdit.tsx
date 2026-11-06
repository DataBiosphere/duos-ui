import React, { useState } from 'react'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import { Validation as FieldValidation, isValidDate } from 'src/components/forms/formValidation'
import { makeError } from 'src/pages/dar_application/FormValidationState'
import {
  BioSpecimenPreservationMethod,
  BioSpecimenType,
  Biospecimen,
  PostMortemIntervalUnit,
  Sex,
} from 'src/types/model'

const specimenTypeLabels: Record<BioSpecimenType, string> = {
  [BioSpecimenType.BLOOD]: 'Blood',
  [BioSpecimenType.PLASMA]: 'Plasma',
  [BioSpecimenType.SERUM]: 'Serum',
  [BioSpecimenType.TISSUE]: 'Tissue',
  [BioSpecimenType.SALIVA]: 'Saliva',
  [BioSpecimenType.CSF]: 'Cerebrospinal Fluid (CSF)',
  [BioSpecimenType.PBMC]: 'Peripheral Blood Mononuclear Cells (PBMC)',
  [BioSpecimenType.TUMOR]: 'Tumor',
  [BioSpecimenType.NORMAL_ADJACENT]: 'Normal Adjacent Tissue',
}

const preservationMethodLabels: Record<BioSpecimenPreservationMethod, string> = {
  [BioSpecimenPreservationMethod.FFPE]: 'Formalin-Fixed Paraffin-Embedded (FFPE)',
  [BioSpecimenPreservationMethod.FRESH_FROZEN]: 'Fresh Frozen',
  [BioSpecimenPreservationMethod.CRYO_PRESERVED]: 'Cryopreserved',
  [BioSpecimenPreservationMethod.RNA_LATER]: 'RNAlater',
  [BioSpecimenPreservationMethod.FORMALIN_FIXED]: 'Formalin-Fixed',
}

const postMortemIntervalUnitLabels: Record<PostMortemIntervalUnit, string> = {
  [PostMortemIntervalUnit.MINUTES]: 'Minutes',
  [PostMortemIntervalUnit.HOURS]: 'Hours',
  [PostMortemIntervalUnit.DAYS]: 'Days',
  [PostMortemIntervalUnit.WEEKS]: 'Weeks',
}

const sexLabels: Record<Sex, string> = {
  [Sex.FEMALE]: 'Female',
  [Sex.MALE]: 'Male',
  [Sex.UNKNOWN]: 'Unknown',
  [Sex.NOT_REPORTED]: 'Not Reported',
}

// The selects show labels; the draft keeps the enum values they stand for.
const labelsByField: Partial<Record<keyof Draft, Record<string, string>>> = {
  specimenType: specimenTypeLabels,
  preservationMethod: preservationMethodLabels,
  postMortemIntervalUnit: postMortemIntervalUnitLabels,
  sex: sexLabels,
}

const valueForLabel = (labels: Record<string, string>, label: unknown) =>
  Object.keys(labels).find(value => labels[value] === label) ?? ''

// Every field as the inputs hold it; save turns the draft into a Biospecimen.
interface Draft {
  sampleId: string
  donorId: string
  specimenType: string
  preservationMethod: string
  preservationDetails: string
  dateOfCollection: string
  postMortemIntervalValue: string
  postMortemIntervalUnit: string
  sex: string
  age: string
  race: string
  countryOfOrigin: string
  extractedDiagnoses: string[]
  pathology: string
  organization: string
  sourceSite: string
  optionalDataUse: string
}

// Biospecimens added through the API may hold numbers where the type says string, so the draft coerces them.
const asText = (value: unknown) => (value === undefined || value === null ? '' : String(value))

// A single value stored where a list is expected becomes a one-item list.
const asTextList = (value: unknown): string[] =>
  (Array.isArray(value) ? value : [value]).map(asText).filter(Boolean)

// Inputs start from the coerced draft; an empty value leaves the input at its own default.
const seed = (value: string) => value || undefined

// A stored value a select does not list starts empty, so the form never saves back a value it cannot show.
const asOption = (labels: Record<string, string>, value: unknown) => {
  const text = asText(value)
  return Object.hasOwn(labels, text) ? text : ''
}

const toDraft = (b?: Biospecimen): Draft => ({
  sampleId: asText(b?.sampleId),
  donorId: asText(b?.donorId),
  specimenType: asOption(specimenTypeLabels, b?.specimenType),
  preservationMethod: asOption(preservationMethodLabels, b?.preservationMethod),
  preservationDetails: asText(b?.preservationDetails),
  dateOfCollection: asText(b?.dateOfCollection),
  postMortemIntervalValue: asText(b?.postMortemInterval?.value),
  postMortemIntervalUnit: asOption(postMortemIntervalUnitLabels, b?.postMortemInterval?.unit),
  sex: asOption(sexLabels, b?.sex),
  age: asText(b?.age),
  race: asText(b?.race),
  countryOfOrigin: asText(b?.countryOfOrigin),
  extractedDiagnoses: asTextList(b?.extractedDiagnoses),
  pathology: asText(b?.pathology),
  organization: asText(b?.organization),
  sourceSite: asText(b?.sourceSite),
  optionalDataUse: asText(b?.optionalDataUse),
})

const optionalTextFields = [
  'preservationDetails',
  'dateOfCollection',
  'race',
  'countryOfOrigin',
  'pathology',
  'sourceSite',
  'optionalDataUse',
] as const

const setOrDelete = <K extends keyof Biospecimen>(b: Biospecimen, key: K, value: Biospecimen[K] | undefined) => {
  if (value === undefined) delete b[key]
  else b[key] = value
}

// Spreading the original keeps its server-assigned biospecimenId; a new biospecimen goes out without one.
// A field cleared in the form is left out, so the saved biospecimen does not keep the old value.
const toBiospecimen = (draft: Draft, original?: Biospecimen): Biospecimen => {
  const result: Biospecimen = {
    ...original,
    studyId: original?.studyId ?? '',
    donorId: draft.donorId.trim(),
    specimenType: draft.specimenType as BioSpecimenType,
    preservationMethod: draft.preservationMethod as BioSpecimenPreservationMethod,
    organization: draft.organization.trim(),
  }
  // Consent keeps the stored sampleId when the field is absent, so clearing a saved one sends a blank.
  const sampleId = draft.sampleId.trim()
  setOrDelete(result, 'sampleId', sampleId || asText(original?.sampleId) ? sampleId : undefined)
  for (const key of optionalTextFields) {
    setOrDelete(result, key, draft[key].trim() || undefined)
  }
  const intervalValue = draft.postMortemIntervalValue.trim()
  setOrDelete(result, 'postMortemInterval', intervalValue
    ? { value: Number(intervalValue), unit: draft.postMortemIntervalUnit as PostMortemIntervalUnit }
    : undefined)
  setOrDelete(result, 'sex', (draft.sex || undefined) as Sex | undefined)
  setOrDelete(result, 'age', draft.age.trim() ? Number(draft.age) : undefined)
  const diagnoses = [...new Set(draft.extractedDiagnoses.map(d => d.trim()).filter(Boolean))]
  setOrDelete(result, 'extractedDiagnoses', diagnoses.length ? diagnoses : undefined)
  return result
}

type Validation = Partial<Record<keyof Draft, FieldValidation>>

const isNonNegativeNumber = (text: string) => {
  const n = Number(text)
  return text.trim() !== '' && Number.isFinite(n) && n >= 0
}

const numberError = (message: string): FieldValidation => ({ valid: false, failed: ['number'], messages: [message] })

// A date stored through the API in another format is left as it is until the submitter picks a new one.
const calcErrors = (d: Draft, original?: Biospecimen): Validation => {
  const v: Validation = {}
  if (!d.donorId.trim()) v.donorId = makeError('required')
  if (!d.specimenType) v.specimenType = makeError('required')
  if (!d.preservationMethod) v.preservationMethod = makeError('required')
  if (!d.organization.trim()) v.organization = makeError('required')
  const date = d.dateOfCollection.trim()
  if (date && date !== asText(original?.dateOfCollection).trim() && !isValidDate(date)) v.dateOfCollection = makeError('date')
  const intervalValue = d.postMortemIntervalValue.trim()
  if (intervalValue && !isNonNegativeNumber(intervalValue)) {
    v.postMortemIntervalValue = numberError('Please enter a number of 0 or more')
  }
  else if (!intervalValue && d.postMortemIntervalUnit) {
    v.postMortemIntervalValue = numberError('Please enter the interval for the selected unit')
  }
  if (intervalValue && !d.postMortemIntervalUnit) v.postMortemIntervalUnit = makeError('required')
  if (d.age.trim() && !isNonNegativeNumber(d.age)) v.age = numberError('Please enter an age of 0 or more')
  return v
}

const validationFailed = (v: Validation) => Object.values(v).some(e => !!e)

interface FormFieldChange {
  key: string
  value?: string | string[]
}

interface BiospecimenAddEditProps {
  readonly id: number
  readonly biospecimen?: Biospecimen
  readonly biospecimens: Biospecimen[]
  readonly closeAction: () => void
  readonly onBiospecimensChange: (biospecimens: Biospecimen[]) => void
  readonly readOnly?: boolean
  readonly countries?: string[]
}

const getHeaderTitle = (readOnly: boolean, biospecimen?: Biospecimen) => {
  if (!biospecimen) return 'New Biospecimen'
  const name = `Biospecimen from donor ${asText(biospecimen.donorId) || 'unknown'}`
  return readOnly ? name : `Edit ${name}`
}

export default function BiospecimenAddEdit(props: BiospecimenAddEditProps): React.JSX.Element {
  const { id, biospecimen, biospecimens, closeAction, onBiospecimensChange, readOnly = false, countries = [] } = props

  const [initial] = useState<Draft>(() => toDraft(biospecimen))
  const [draft, setDraft] = useState<Draft>(initial)
  const [validation, setValidation] = useState<Validation>({})

  const onChange = ({ key, value }: FormFieldChange) => {
    const field = key as keyof Draft
    const labels = labelsByField[field]
    const next = { ...draft, [field]: labels ? valueForLabel(labels, value) : value ?? (field === 'extractedDiagnoses' ? [] : '') }
    setDraft(next)
    setValidation(calcErrors(next, biospecimen))
  }

  const save = () => {
    const validationErrors = calcErrors(draft, biospecimen)
    setValidation(validationErrors)
    if (validationFailed(validationErrors)) return
    const toSave = toBiospecimen(draft, biospecimen)
    if (id < 0) {
      onBiospecimensChange([...biospecimens, toSave])
    }
    else {
      const copy = [...biospecimens]
      copy[id] = toSave
      onBiospecimensChange(copy)
    }
    closeAction()
  }

  const selectProps = (labels: Record<string, string>, value: string) => ({
    type: FormFieldTypes.SELECT,
    optionsAreString: true,
    selectOptions: Object.values(labels),
    defaultValue: labels[value],
    onChange,
    disabled: readOnly,
  })

  return (
    <div className="form-group row no-margin">
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 collaborator-form-card">
        <div className="row">
          <h2>{getHeaderTitle(readOnly, biospecimen)}</h2>
          <FormField
            id="sampleId"
            title="Sample ID"
            defaultValue={seed(initial.sampleId)}
            placeholder="Your identifier for this vial or sample"
            onChange={onChange}
            disabled={readOnly}
          />
          <FormField
            id="donorId"
            title="Donor ID"
            defaultValue={seed(initial.donorId)}
            placeholder="Identifier of the donor the specimen came from"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.donorId}
            disabled={readOnly}
          />
          <FormField
            id="specimenType"
            title="Specimen Type"
            placeholder="Select a specimen type"
            validators={[FormValidators.REQUIRED]}
            validation={validation.specimenType}
            {...selectProps(specimenTypeLabels, draft.specimenType)}
          />
          <FormField
            id="preservationMethod"
            title="Preservation Method"
            placeholder="Select a preservation method"
            validators={[FormValidators.REQUIRED]}
            validation={validation.preservationMethod}
            {...selectProps(preservationMethodLabels, draft.preservationMethod)}
          />
          <FormField
            id="preservationDetails"
            title="Preservation Details"
            defaultValue={seed(initial.preservationDetails)}
            placeholder="Additional detail about how the specimen was preserved"
            type={FormFieldTypes.TEXTAREA}
            onChange={onChange}
            disabled={readOnly}
          />
          <FormField
            id="dateOfCollection"
            title="Date of Collection"
            type={FormFieldTypes.CALENDAR}
            defaultValue={seed(initial.dateOfCollection)}
            validators={[FormValidators.DATE]}
            onChange={onChange}
            validation={validation.dateOfCollection}
            disabled={readOnly}
          />
          <FormField
            id="postMortemIntervalValue"
            title="Post-Mortem Interval"
            defaultValue={draft.postMortemIntervalValue}
            placeholder="Time between death and collection"
            onChange={onChange}
            validation={validation.postMortemIntervalValue}
            disabled={readOnly}
          />
          <FormField
            id="postMortemIntervalUnit"
            title="Post-Mortem Interval Unit"
            placeholder="Select a unit"
            validation={validation.postMortemIntervalUnit}
            {...selectProps(postMortemIntervalUnitLabels, draft.postMortemIntervalUnit)}
          />
          <FormField
            id="sex"
            title="Sex"
            placeholder="Select the donor's sex"
            {...selectProps(sexLabels, draft.sex)}
          />
          <FormField
            id="age"
            title="Age"
            defaultValue={draft.age}
            placeholder="Donor's age"
            onChange={onChange}
            validation={validation.age}
            disabled={readOnly}
          />
          <FormField
            id="race"
            title="Race"
            defaultValue={seed(initial.race)}
            placeholder="Donor's race"
            onChange={onChange}
            disabled={readOnly}
          />
          <FormField
            id="countryOfOrigin"
            title="Country of Origin"
            type={FormFieldTypes.SELECT}
            optionsAreString={true}
            selectOptions={countries}
            defaultValue={seed(initial.countryOfOrigin)}
            placeholder="Select the donor's country of origin"
            onChange={onChange}
            disabled={readOnly}
          />
          <FormField
            id="extractedDiagnoses"
            title="Extracted Diagnoses"
            type={FormFieldTypes.SELECT}
            isCreatable={true}
            isMulti={true}
            optionsAreString={true}
            selectOptions={[]}
            defaultValue={initial.extractedDiagnoses.length ? initial.extractedDiagnoses : undefined}
            placeholder="Enter diagnoses, e.g. Alzheimer's disease"
            onChange={onChange}
            disabled={readOnly}
          />
          <FormField
            id="pathology"
            title="Pathology"
            defaultValue={seed(initial.pathology)}
            placeholder="Pathology information for the specimen"
            type={FormFieldTypes.TEXTAREA}
            onChange={onChange}
            disabled={readOnly}
          />
          <FormField
            id="organization"
            title="Organization"
            defaultValue={seed(initial.organization)}
            placeholder="Institution, biobank or provider holding the specimen"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.organization}
            disabled={readOnly}
          />
          <FormField
            id="sourceSite"
            title="Source Site"
            defaultValue={seed(initial.sourceSite)}
            placeholder="Clinic, hospital or collection site"
            onChange={onChange}
            disabled={readOnly}
          />
          <FormField
            id="optionalDataUse"
            title="Data Use"
            defaultValue={seed(initial.optionalDataUse)}
            placeholder="Additional data use terms for this specimen"
            type={FormFieldTypes.TEXTAREA}
            onChange={onChange}
            disabled={readOnly}
          />
        </div>
        <div className="row" style={{ marginTop: 20 }}>
          {!readOnly && (
            <button
              className="collaborator-form-add-save-button f-left btn"
              type="button"
              onClick={save}
            >
              {biospecimen === undefined ? 'Add' : 'Save'}
            </button>
          )}
          <button
            className="collaborator-form-cancel-button f-left btn"
            type="button"
            onClick={closeAction}
          >
            {readOnly ? 'Close' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}
