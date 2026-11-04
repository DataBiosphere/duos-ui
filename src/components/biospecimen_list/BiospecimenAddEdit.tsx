import React, { useState } from 'react'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import { ValidationError, makeError } from 'src/pages/dar_application/FormValidationState'
import {
  Biospecimen,
  BioSpecimenPreservationMethod,
  BioSpecimenType,
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
}

interface SelectOption {
  key: string
  displayText: string
}

interface FormFieldChange {
  key: string
  value: string | string[] | SelectOption | null
}

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

// The required enums start empty: the form asks for them before it saves.
const defaultBiospecimen = {
  studyId: '',
  donorId: '',
  specimenType: '',
  preservationMethod: '',
  organization: '',
} as unknown as Biospecimen

const calcErrors = (b: Biospecimen): Validation => {
  const v: Validation = {}
  if (!b.donorId?.trim()) v.donorId = makeError('required')
  if (!b.specimenType) v.specimenType = makeError('required')
  if (!b.preservationMethod) v.preservationMethod = makeError('required')
  if (!b.organization?.trim()) v.organization = makeError('required')
  return v
}

const validationFailed = (v: Validation) => Object.values(v).some(e => !!e)

const getHeaderTitle = (readOnly: boolean, biospecimen?: Biospecimen) => {
  if (!biospecimen) return 'New Biospecimen'
  const name = biospecimen.sampleId || biospecimen.donorId
  return readOnly ? name : `Edit ${name}`
}

export default function BiospecimenAddEdit(props: BiospecimenAddEditProps): React.JSX.Element {
  const { id, biospecimen, biospecimens, closeAction, onBiospecimensChange, readOnly = false } = props

  const [current, setCurrent] = useState<Biospecimen>(biospecimen || defaultBiospecimen)
  const [validation, setValidation] = useState<Validation>({})

  const onChange = ({ key, value }: FormFieldChange) => {
    // Enum selects return the chosen option, or null once cleared.
    const selected = value !== null && typeof value === 'object' && !Array.isArray(value) ? value.key : value
    const nextCurrent = { ...current, [key]: selected ?? undefined }
    setCurrent(nextCurrent)
    setValidation(calcErrors(nextCurrent))
  }

  const save = () => {
    const validationErrors = calcErrors(current)
    setValidation(validationErrors)
    if (validationFailed(validationErrors)) return
    // An edited biospecimen keeps the biospecimenId it was loaded with; a new one is sent without one.
    const toSave: Biospecimen = { ...current }
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
