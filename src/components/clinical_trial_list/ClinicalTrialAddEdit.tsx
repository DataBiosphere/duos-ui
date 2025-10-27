import React, { useState } from 'react'
import { FormField, FormValidators, FormFieldTypes } from 'src/components/forms/forms'
import {
  ClinicalTrial,
  ClinicalTrialStatus,
  ClinicalTrialPhase,
  ClinicalTrialInterventionType,
} from 'src/types/model'
import { validationFailed } from 'src/utils/darFormUtils'
import { ValidationError } from 'src/pages/dar_application/FormValidationState'
import {
  clinicalTrialStatusSelectOptions,
  clinicalTrialPhaseSelectOptions,
  clinicalTrialInterventionSelectOptions,
} from 'src/utils/ClinicalTrialEnumUtils'
import { SelectEntry } from 'src/components/forms/SelectOptionInterface'

const defaultClinicalTrial: ClinicalTrial = {
  clinicalTrialId: '',
  studyId: '',
  title: '',
  registry: '',
  identifier: '',
  status: ClinicalTrialStatus.UNKNOWN,
  sponsor: '',
  startDate: '',
  endDate: '',
  interventionType: ClinicalTrialInterventionType.OTHER,
  description: '',
  phase: ClinicalTrialPhase.NA,
  url: '',
  tags: [],
}

interface FormFieldChange {
  key: string
  value: unknown
}

interface ClinicalTrialAddEditProps {
  readonly id: number
  readonly clinicalTrial?: ClinicalTrial
  readonly clinicalTrials: ClinicalTrial[]
  readonly closeAction: () => void
  readonly onClinicalTrialChange: (clinicalTrials: ClinicalTrial[]) => void
}

interface Validation {
  title?: ValidationError
  registry?: ValidationError
  identifier?: ValidationError
  status?: ValidationError
  sponsor?: ValidationError
  startDate?: ValidationError
  endDate?: ValidationError
  interventionType?: ValidationError
  phase?: ValidationError
  url?: ValidationError
}

const makeError = (message: string): ValidationError => ({ valid: true, failed: [message] })

const isFallback = (v: string) =>
  v === ClinicalTrialStatus.UNKNOWN
  || v === ClinicalTrialPhase.NA
  || v === ClinicalTrialInterventionType.OTHER

const calcClinicalTrialErrors = (ct: ClinicalTrial): Validation => {
  const v: Validation = {}
  if (!ct.title?.trim()) v.title = makeError('Required')
  if (!ct.registry?.trim()) v.registry = makeError('Required')
  if (!ct.identifier?.trim()) v.identifier = makeError('Required')
  if (isFallback(ct.status)) v.status = makeError('Select status')
  if (!ct.sponsor?.trim()) v.sponsor = makeError('Required')
  if (!ct.startDate?.trim()) v.startDate = makeError('Required')
  else if (!FormValidators.DATE.isValid(ct.startDate)) v.startDate = makeError('Invalid date')
  if (ct.endDate?.trim() && !FormValidators.DATE.isValid(ct.endDate)) v.endDate = makeError('Invalid date')
  if (isFallback(ct.interventionType)) v.interventionType = makeError('Select type')
  if (isFallback(ct.phase)) v.phase = makeError('Select phase')
  if (!ct.url?.trim()) v.url = makeError('Required')
  return v
}

const findSelectEntry = (options: SelectEntry[], key?: string) =>
  key ? options.find(o => o.key === key) || null : null

export default function ClinicalTrialAddEdit(props: ClinicalTrialAddEditProps): React.JSX.Element {
  const { id, clinicalTrial, clinicalTrials, closeAction, onClinicalTrialChange } = props
  const [newClinicalTrial, setNewClinicalTrial] = useState<ClinicalTrial>(clinicalTrial || defaultClinicalTrial)
  const [validation, setValidation] = useState<Validation>({})

  const onChange = ({ key, value }: FormFieldChange) => {
    let castValue: unknown = value
    if (key === 'status') {
      castValue = (value && typeof value === 'object' && (value as SelectEntry).key)
        ? (value as SelectEntry).key as ClinicalTrialStatus
        : value
    }
    else if (key === 'phase') {
      castValue = (value && typeof value === 'object' && (value as SelectEntry).key)
        ? (value as SelectEntry).key as ClinicalTrialPhase
        : value
    }
    else if (key === 'interventionType') {
      castValue = (value && typeof value === 'object' && (value as SelectEntry).key)
        ? (value as SelectEntry).key as ClinicalTrialInterventionType
        : value
    }
    else if (key === 'tags') {
      castValue = typeof value === 'string'
        ? value.split(',').map(t => t.trim()).filter(Boolean)
        : value
    }
    const ctToSet: ClinicalTrial = { ...newClinicalTrial, [key]: castValue as never }
    setNewClinicalTrial(ctToSet)
    setValidation(calcClinicalTrialErrors(ctToSet))
  }

  const save = () => {
    if (validationFailed(calcClinicalTrialErrors(newClinicalTrial))) return
    if (id < 0) {
      onClinicalTrialChange([...clinicalTrials, newClinicalTrial])
    }
    else {
      const copy = [...clinicalTrials]
      copy[id] = newClinicalTrial
      onClinicalTrialChange(copy)
    }
    closeAction()
  }

  return (
    <div className="form-group row no-margin">
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 collaborator-form-card">
        <div className="row">
          <h2>{clinicalTrial === undefined ? 'New Clinical Trial Information' : `Edit ${clinicalTrial.title} Information`}</h2>
          <FormField
            id="title"
            title="Title"
            defaultValue={clinicalTrial?.title}
            placeholder="Title"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.title}
          />
          <FormField
            id="registry"
            title="Registry"
            defaultValue={clinicalTrial?.registry}
            placeholder="Registry"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.registry}
          />
          <FormField
            id="identifier"
            title="Identifier"
            defaultValue={clinicalTrial?.identifier}
            placeholder="Identifier"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.identifier}
          />
          <FormField
            id="status"
            title="Status"
            type={FormFieldTypes.SELECT}
            selectOptions={clinicalTrialStatusSelectOptions}
            defaultValue={findSelectEntry(clinicalTrialStatusSelectOptions, clinicalTrial?.status)}
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.status}
            placeholder="Select status"
          />
          <FormField
            id="sponsor"
            title="Sponsor"
            defaultValue={clinicalTrial?.sponsor}
            placeholder="Sponsor"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.sponsor}
          />
          <FormField
            id="startDate"
            title="Start Date"
            defaultValue={clinicalTrial?.startDate}
            placeholder="YYYY-MM-DD"
            validators={[FormValidators.REQUIRED, FormValidators.DATE]}
            onChange={onChange}
            validation={validation.startDate}
          />
          <FormField
            id="endDate"
            title="End Date"
            defaultValue={clinicalTrial?.endDate}
            placeholder="YYYY-MM-DD"
            validators={[FormValidators.DATE]}
            onChange={onChange}
            validation={validation.endDate}
          />
          <FormField
            id="interventionType"
            title="Intervention Type"
            type={FormFieldTypes.SELECT}
            selectOptions={clinicalTrialInterventionSelectOptions}
            defaultValue={findSelectEntry(clinicalTrialInterventionSelectOptions, clinicalTrial?.interventionType)}
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.interventionType}
            placeholder="Select intervention type"
          />
          <FormField
            id="phase"
            title="Phase"
            type={FormFieldTypes.SELECT}
            selectOptions={clinicalTrialPhaseSelectOptions}
            defaultValue={findSelectEntry(clinicalTrialPhaseSelectOptions, clinicalTrial?.phase)}
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.phase}
            placeholder="Select phase"
          />
          <FormField
            id="url"
            title="URL"
            defaultValue={clinicalTrial?.url}
            placeholder="URL"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.url}
          />
          <FormField
            id="description"
            title="Description"
            defaultValue={clinicalTrial?.description}
            placeholder="Description"
            onChange={onChange}
          />
          <FormField
            id="tags"
            title="Tags"
            defaultValue={clinicalTrial?.tags?.join(', ')}
            placeholder="Comma separated tags"
            onChange={onChange}
          />
        </div>
        <div className="row" style={{ marginTop: 20 }}>
          <button
            className="collaborator-form-add-save-button f-left btn"
            type="button"
            onClick={save}
            disabled={validationFailed(calcClinicalTrialErrors(newClinicalTrial))}
          >
            {clinicalTrial === undefined ? 'Add' : 'Save'}
          </button>
          <button
            className="collaborator-form-cancel-button f-left btn"
            type="button"
            onClick={closeAction}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
