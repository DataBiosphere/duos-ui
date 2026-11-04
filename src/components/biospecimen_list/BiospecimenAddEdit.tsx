import React, { useEffect, useState } from 'react'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import { Validation as FieldValidation } from 'src/components/forms/formValidation'
import { ValidationError, makeError } from 'src/pages/dar_application/FormValidationState'
import { Countries } from 'src/libs/ajax/Countries'
import {
  Biospecimen,
  BioSpecimenPreservationMethod,
  BioSpecimenType,
  PostMortemIntervalUnit,
  Sex,
} from 'src/types/model'

interface BiospecimenAddEditProps {
  readonly id: number
  readonly biospecimen?: Biospecimen
  readonly biospecimens: Biospecimen[]
  readonly closeAction: () => void
  readonly onBiospecimensChange: (biospecimens: Biospecimen[]) => void
  readonly readOnly?: boolean
}

interface Validation {
  donorId?: ValidationError
  specimenType?: ValidationError
  preservationMethod?: ValidationError
  organization?: ValidationError
  dateOfCollection?: ValidationError
  age?: FieldValidation
  postMortemIntervalValue?: FieldValidation
  postMortemIntervalUnit?: ValidationError
}

// Number fields are edited as text so that clearing one leaves it empty rather than zero.
interface NumberInputs {
  age: string
  postMortemIntervalValue: string
}

interface SelectOption {
  key: string
  displayText: string
}

interface FormFieldChange {
  key: string
  value: string | string[] | SelectOption | null
}

const numberInput = { ...FormFieldTypes.TEXT, inputType: 'number' }

// Matches the labels in the Data Library biospecimens tab, e.g. FRESH_FROZEN -> Fresh Frozen.
const enumLabel = (value: string) =>
  value.toLowerCase().replaceAll('_', ' ').replaceAll(/\b\w/g, c => c.toUpperCase())

const enumOptions = (values: string[]): SelectOption[] =>
  values.map(value => ({ key: value, displayText: enumLabel(value) }))

// Returns the shared option object: FormField resets a field whenever its defaultValue changes identity.
const optionFor = (options: SelectOption[], value?: string): SelectOption | undefined =>
  options.find(option => option.key === value)

const specimenTypeOptions = enumOptions(Object.values(BioSpecimenType))
const preservationMethodOptions = enumOptions(Object.values(BioSpecimenPreservationMethod))
const postMortemIntervalUnitOptions = enumOptions(Object.values(PostMortemIntervalUnit))
const sexOptions = enumOptions(Object.values(Sex))

// The required enums start empty: the form asks for them before it saves.
const defaultBiospecimen = {
  studyId: '',
  donorId: '',
  specimenType: '',
  preservationMethod: '',
  organization: '',
} as unknown as Biospecimen

const numberInputsFrom = (biospecimen?: Biospecimen): NumberInputs => ({
  age: biospecimen?.age?.toString() ?? '',
  postMortemIntervalValue: biospecimen?.postMortemInterval?.value?.toString() ?? '',
})

const notANonNegativeNumber = (input: string) => {
  const parsed = Number(input)
  return !Number.isFinite(parsed) || parsed < 0
}

const numberError: FieldValidation = { valid: false, failed: ['number'], messages: ['Please enter a number of zero or more'] }

const calcErrors = (b: Biospecimen, numbers: NumberInputs, unit?: PostMortemIntervalUnit): Validation => {
  const v: Validation = {}
  if (!b.donorId?.trim()) v.donorId = makeError('required')
  if (!b.specimenType) v.specimenType = makeError('required')
  if (!b.preservationMethod) v.preservationMethod = makeError('required')
  if (!b.organization?.trim()) v.organization = makeError('required')
  if (b.dateOfCollection && !FormValidators.DATE.isValid(b.dateOfCollection)) v.dateOfCollection = makeError('date')
  if (numbers.age.trim() && notANonNegativeNumber(numbers.age)) v.age = numberError
  const intervalValue = numbers.postMortemIntervalValue.trim()
  if (intervalValue && notANonNegativeNumber(intervalValue)) v.postMortemIntervalValue = numberError
  // An interval needs both its length and its unit.
  if (intervalValue && !unit) v.postMortemIntervalUnit = makeError('required')
  if (!intervalValue && unit) v.postMortemIntervalValue = makeError('required')
  return v
}

const validationFailed = (v: Validation) => Object.values(v).some(e => !!e)

const blankToUndefined = (value?: string) => (value?.trim() ? value : undefined)

const getHeaderTitle = (readOnly: boolean, biospecimen?: Biospecimen) => {
  if (!biospecimen) return 'New Biospecimen'
  const name = biospecimen.sampleId || biospecimen.donorId
  return readOnly ? name : `Edit ${name}`
}

export default function BiospecimenAddEdit(props: BiospecimenAddEditProps): React.JSX.Element {
  const { id, biospecimen, biospecimens, closeAction, onBiospecimensChange, readOnly = false } = props

  const [current, setCurrent] = useState<Biospecimen>(biospecimen || defaultBiospecimen)
  const [numbers, setNumbers] = useState<NumberInputs>(numberInputsFrom(biospecimen))
  const [unit, setUnit] = useState<PostMortemIntervalUnit | undefined>(biospecimen?.postMortemInterval?.unit)
  const [validation, setValidation] = useState<Validation>({})
  const [countries, setCountries] = useState<string[]>([])

  useEffect(() => {
    Countries.getCountries()
      .then(setCountries)
      // Without the list the field only offers the stored country.
      .catch(() => setCountries([]))
  }, [])

  const onChange = ({ key, value }: FormFieldChange) => {
    // Enum selects return the chosen option, or null once cleared.
    const selected = value !== null && typeof value === 'object' && !Array.isArray(value) ? value.key : value
    let nextCurrent = current
    let nextNumbers = numbers
    let nextUnit = unit
    if (key === 'age' || key === 'postMortemIntervalValue') {
      nextNumbers = { ...numbers, [key]: (selected as string) ?? '' }
      setNumbers(nextNumbers)
    }
    else if (key === 'postMortemIntervalUnit') {
      nextUnit = (selected as PostMortemIntervalUnit | null) ?? undefined
      setUnit(nextUnit)
    }
    else {
      nextCurrent = { ...current, [key]: selected ?? undefined }
      setCurrent(nextCurrent)
    }
    setValidation(calcErrors(nextCurrent, nextNumbers, nextUnit))
  }

  const save = () => {
    const validationErrors = calcErrors(current, numbers, unit)
    setValidation(validationErrors)
    if (validationFailed(validationErrors)) return
    const intervalValue = numbers.postMortemIntervalValue.trim()
    // An edited biospecimen keeps the biospecimenId it was loaded with; a new one is sent without one.
    // sampleId is sent as typed: Consent keeps the stored value when it is omitted, and clears it when blank.
    const toSave: Biospecimen = {
      ...current,
      preservationDetails: blankToUndefined(current.preservationDetails),
      dateOfCollection: blankToUndefined(current.dateOfCollection),
      age: numbers.age.trim() ? Number(numbers.age) : undefined,
      postMortemInterval: intervalValue && unit ? { value: Number(intervalValue), unit } : undefined,
      race: blankToUndefined(current.race),
      countryOfOrigin: blankToUndefined(current.countryOfOrigin),
      pathology: blankToUndefined(current.pathology),
      sourceSite: blankToUndefined(current.sourceSite),
      optionalDataUse: blankToUndefined(current.optionalDataUse),
    }
    if (id < 0) {
      onBiospecimensChange([...biospecimens, toSave])
    }
    else {
      const copy = [...biospecimens]
      copy[id] = toSave
      onBiospecimensChange(copy)
    }
    setCurrent(defaultBiospecimen)
    closeAction()
  }

  const headerTitle = getHeaderTitle(readOnly, biospecimen)

  return (
    <div className="form-group row no-margin" data-cy="biospecimen-add-edit">
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 collaborator-form-card">
        <div className="row">
          <h2>{headerTitle}</h2>
          <p>Each entry is one vial or sample.</p>
          <FormField
            id="sampleId"
            title="Biospecimen ID"
            description="Your own identifier for this vial or sample"
            defaultValue={biospecimen?.sampleId}
            placeholder="Biospecimen ID"
            onChange={onChange}
            disabled={readOnly}
          />
          <FormField
            id="donorId"
            title="Donor ID"
            defaultValue={biospecimen?.donorId}
            placeholder="Donor ID"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.donorId}
            disabled={readOnly}
          />
          <FormField
            id="specimenType"
            title="Specimen Type"
            type={FormFieldTypes.SELECT}
            selectOptions={specimenTypeOptions}
            optionsAreString={false}
            placeholder="Select a specimen type"
            defaultValue={optionFor(specimenTypeOptions, biospecimen?.specimenType)}
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.specimenType}
            disabled={readOnly}
          />
          <FormField
            id="preservationMethod"
            title="Preservation Method"
            type={FormFieldTypes.SELECT}
            selectOptions={preservationMethodOptions}
            optionsAreString={false}
            placeholder="Select a preservation method"
            defaultValue={optionFor(preservationMethodOptions, biospecimen?.preservationMethod)}
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.preservationMethod}
            disabled={readOnly}
          />
          <FormField
            id="preservationDetails"
            title="Preservation Details"
            defaultValue={biospecimen?.preservationDetails}
            placeholder="Preservation Details"
            onChange={onChange}
            disabled={readOnly}
          />
          <FormField
            id="dateOfCollection"
            title="Date of Collection"
            type={FormFieldTypes.CALENDAR}
            defaultValue={biospecimen?.dateOfCollection}
            validators={[FormValidators.DATE]}
            onChange={onChange}
            validation={validation.dateOfCollection}
            disabled={readOnly}
          />
          <FormField
            id="postMortemIntervalValue"
            title="Post-Mortem Interval"
            type={numberInput}
            defaultValue={numbers.postMortemIntervalValue}
            placeholder="Interval length"
            onChange={onChange}
            validation={validation.postMortemIntervalValue}
            disabled={readOnly}
          />
          <FormField
            id="postMortemIntervalUnit"
            title="Post-Mortem Interval Unit"
            type={FormFieldTypes.SELECT}
            selectOptions={postMortemIntervalUnitOptions}
            optionsAreString={false}
            placeholder="Select a unit"
            defaultValue={optionFor(postMortemIntervalUnitOptions, biospecimen?.postMortemInterval?.unit)}
            onChange={onChange}
            validation={validation.postMortemIntervalUnit}
            disabled={readOnly}
          />
          <FormField
            id="sex"
            title="Sex"
            type={FormFieldTypes.SELECT}
            selectOptions={sexOptions}
            optionsAreString={false}
            placeholder="Select a sex"
            defaultValue={optionFor(sexOptions, biospecimen?.sex)}
            onChange={onChange}
            disabled={readOnly}
          />
          <FormField
            id="age"
            title="Age"
            type={numberInput}
            defaultValue={numbers.age}
            placeholder="Age"
            onChange={onChange}
            validation={validation.age}
            disabled={readOnly}
          />
          <FormField
            id="race"
            title="Race"
            defaultValue={biospecimen?.race}
            placeholder="Race"
            onChange={onChange}
            disabled={readOnly}
          />
          <FormField
            id="countryOfOrigin"
            title="Country of Origin"
            type={FormFieldTypes.SELECT}
            selectOptions={countries}
            optionsAreString={true}
            placeholder="Select a country"
            defaultValue={biospecimen?.countryOfOrigin}
            onChange={onChange}
            disabled={readOnly}
          />
          <FormField
            id="extractedDiagnoses"
            title="Extracted Diagnoses"
            placeholder="Enter diagnoses"
            type={FormFieldTypes.SELECT}
            isCreatable={true}
            isMulti={true}
            optionsAreString={true}
            selectOptions={[]}
            defaultValue={biospecimen?.extractedDiagnoses}
            onChange={onChange}
            disabled={readOnly}
          />
          <FormField
            id="pathology"
            title="Pathology"
            defaultValue={biospecimen?.pathology}
            placeholder="Pathology"
            onChange={onChange}
            disabled={readOnly}
          />
          <FormField
            id="organization"
            title="Organization"
            description="The institution, biobank or provider holding the biospecimen"
            defaultValue={biospecimen?.organization}
            placeholder="Organization"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.organization}
            disabled={readOnly}
          />
          <FormField
            id="sourceSite"
            title="Source Site"
            description="The clinic, hospital or site the biospecimen was collected at"
            defaultValue={biospecimen?.sourceSite}
            placeholder="Source Site"
            onChange={onChange}
            disabled={readOnly}
          />
          <FormField
            id="optionalDataUse"
            title="Data Use"
            defaultValue={biospecimen?.optionalDataUse}
            placeholder="Any data use terms for this biospecimen"
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
