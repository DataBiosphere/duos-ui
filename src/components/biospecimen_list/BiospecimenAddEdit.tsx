import React, { useState } from 'react'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import { Validation as FieldValidation } from 'src/components/forms/formValidation'
import { makeError } from 'src/pages/dar_application/FormValidationState'
import { BioSpecimenPreservationMethod, BioSpecimenType, Biospecimen } from 'src/types/model'

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

// The selects show labels; the draft keeps the enum values they stand for.
const labelsByField: Partial<Record<keyof Draft, Record<string, string>>> = {
  specimenType: specimenTypeLabels,
  preservationMethod: preservationMethodLabels,
}

const valueForLabel = (labels: Record<string, string>, label: unknown) =>
  Object.keys(labels).find(value => labels[value] === label) ?? ''

// Every field as the inputs hold it; save turns the draft into a Biospecimen.
interface Draft {
  donorId: string
  specimenType: string
  preservationMethod: string
  organization: string
}

// Biospecimens added through the API may hold numbers where the type says string, so the draft coerces them.
const asText = (value: unknown) => (value === undefined || value === null ? '' : String(value))

// Inputs start from the coerced draft; an empty value leaves the input at its own default.
const seed = (value: string) => value || undefined

// A stored value a select does not list starts empty, so the form never saves back a value it cannot show.
const asOption = (labels: Record<string, string>, value: unknown) => {
  const text = asText(value)
  return Object.hasOwn(labels, text) ? text : ''
}

const toDraft = (b?: Biospecimen): Draft => ({
  donorId: asText(b?.donorId),
  specimenType: asOption(specimenTypeLabels, b?.specimenType),
  preservationMethod: asOption(preservationMethodLabels, b?.preservationMethod),
  organization: asText(b?.organization),
})

// Spreading the original keeps its server-assigned biospecimenId; a new biospecimen goes out without one.
const toBiospecimen = (draft: Draft, original?: Biospecimen): Biospecimen => ({
  ...original,
  studyId: original?.studyId ?? '',
  donorId: draft.donorId.trim(),
  specimenType: draft.specimenType as BioSpecimenType,
  preservationMethod: draft.preservationMethod as BioSpecimenPreservationMethod,
  organization: draft.organization.trim(),
})

type Validation = Partial<Record<keyof Draft, FieldValidation>>

const calcErrors = (d: Draft): Validation => {
  const v: Validation = {}
  if (!d.donorId.trim()) v.donorId = makeError('required')
  if (!d.specimenType) v.specimenType = makeError('required')
  if (!d.preservationMethod) v.preservationMethod = makeError('required')
  if (!d.organization.trim()) v.organization = makeError('required')
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
}

const getHeaderTitle = (readOnly: boolean, biospecimen?: Biospecimen) => {
  if (!biospecimen) return 'New Biospecimen'
  const name = `Biospecimen from donor ${asText(biospecimen.donorId) || 'unknown'}`
  return readOnly ? name : `Edit ${name}`
}

export default function BiospecimenAddEdit(props: BiospecimenAddEditProps): React.JSX.Element {
  const { id, biospecimen, biospecimens, closeAction, onBiospecimensChange, readOnly = false } = props

  const [initial] = useState<Draft>(() => toDraft(biospecimen))
  const [draft, setDraft] = useState<Draft>(initial)
  const [validation, setValidation] = useState<Validation>({})

  const onChange = ({ key, value }: FormFieldChange) => {
    const field = key as keyof Draft
    const labels = labelsByField[field]
    const next = { ...draft, [field]: labels ? valueForLabel(labels, value) : value ?? '' }
    setDraft(next)
    setValidation(calcErrors(next))
  }

  const save = () => {
    const validationErrors = calcErrors(draft)
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
            id="organization"
            title="Organization"
            defaultValue={seed(initial.organization)}
            placeholder="Institution, biobank or provider holding the specimen"
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
