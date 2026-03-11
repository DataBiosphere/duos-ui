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
import { unset } from 'lodash'
import { isValidDate } from 'src/pages/data_submission/v2/v2-common-functions'

const defaultClinicalTrial: ClinicalTrial = {
  clinicalTrialId: '',
  studyId: '',
  title: '',
  registry: '',
  identifier: '',
  status: ClinicalTrialStatus.UNKNOWN,
  sponsor: '',
  startDate: '',
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
  readonly readOnly?: boolean
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

const makeError = (message: string): ValidationError => ({ valid: false, failed: [message] })

const isFallback = (v: string) =>
  v === ClinicalTrialStatus.UNKNOWN
  || v === ClinicalTrialPhase.NA
  || v === ClinicalTrialInterventionType.OTHER

const calcClinicalTrialErrors = (ct: ClinicalTrial): Validation => {
  const v: Validation = {}
  if (!ct.title?.trim()) v.title = makeError('required')
  if (!ct.registry?.trim()) v.registry = makeError('required')
  if (!ct.identifier?.trim()) v.identifier = makeError('required')
  if (isFallback(ct.status)) v.status = makeError('required')
  if (!ct.sponsor?.trim()) v.sponsor = makeError('required')
  if (!isValidDate(ct.startDate)) v.startDate = makeError('date')
  if (ct.endDate?.trim() && !isValidDate(ct.endDate)) v.endDate = makeError('date')
  if (isFallback(ct.interventionType)) v.interventionType = makeError('required')
  if (isFallback(ct.phase)) v.phase = makeError('required')
  if (!ct.url?.trim()) v.url = makeError('required')
  return v
}

const findSelectEntry = (options: SelectEntry[], key?: string) =>
  key ? options.find(o => o.key === key) || null : null

const getHeaderTitle = (readOnly: boolean, clinicalTrial?: ClinicalTrial) => {
  if (readOnly) return clinicalTrial?.title
  if (!clinicalTrial) return 'New Clinical Trial'
  return `Edit ${clinicalTrial.title}`
}

export default function ClinicalTrialAddEdit(props: ClinicalTrialAddEditProps): React.JSX.Element {
  const { id, clinicalTrial, clinicalTrials, closeAction, onClinicalTrialChange, readOnly = false } = props
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
    const ctToSet: ClinicalTrial = { ...newClinicalTrial, [key]: castValue as never }
    setNewClinicalTrial(ctToSet)
    setValidation(calcClinicalTrialErrors(ctToSet))
  }

  const save = () => {
    const validationErrors = calcClinicalTrialErrors(newClinicalTrial)
    setValidation(validationErrors)
    if (validationFailed(validationErrors)) return
    const clinicalTrialToSave = {
      ...newClinicalTrial,
      clinicalTrialId: newClinicalTrial.clinicalTrialId || crypto.randomUUID?.() || Date.now().toString(),
    } as ClinicalTrial
    if (clinicalTrialToSave.endDate?.trim() === '') unset(clinicalTrialToSave, 'endDate')
    if (id < 0) {
      onClinicalTrialChange([...clinicalTrials, clinicalTrialToSave])
    }
    else {
      const copy = [...clinicalTrials]
      copy[id] = clinicalTrialToSave
      onClinicalTrialChange(copy)
    }
    closeAction()
  }

  const headerTitle = getHeaderTitle(readOnly, clinicalTrial)

  return (
    <div className="form-group row no-margin">
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 collaborator-form-card">
        <div className="row">
          <h2>{headerTitle}</h2>
          <FormField
            id="title"
            title="Title"
            defaultValue={clinicalTrial?.title}
            placeholder="Title"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.title}
            disabled={readOnly}
          />
          <FormField
            id="registry"
            title="Registry"
            defaultValue={clinicalTrial?.registry}
            placeholder="Registry"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.registry}
            disabled={readOnly}
          />
          <FormField
            id="identifier"
            title="Identifier"
            defaultValue={clinicalTrial?.identifier}
            placeholder="Identifier"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.identifier}
            disabled={readOnly}
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
            disabled={readOnly}
          />
          <FormField
            id="sponsor"
            title="Sponsor"
            defaultValue={clinicalTrial?.sponsor}
            placeholder="Sponsor"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.sponsor}
            disabled={readOnly}
          />
          <FormField
            id="startDate"
            title="Start Date"
            defaultValue={clinicalTrial?.startDate}
            placeholder="YYYY-MM-DD"
            validators={[FormValidators.REQUIRED, FormValidators.DATE]}
            onChange={onChange}
            validation={validation.startDate}
            disabled={readOnly}
          />
          <FormField
            id="endDate"
            title="End Date"
            defaultValue={clinicalTrial?.endDate}
            placeholder="YYYY-MM-DD"
            validators={[FormValidators.DATE]}
            onChange={onChange}
            validation={validation.endDate}
            disabled={readOnly}
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
            disabled={readOnly}
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
            disabled={readOnly}
          />
          <FormField
            id="url"
            title="URL"
            defaultValue={clinicalTrial?.url}
            placeholder="URL"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.url}
            disabled={readOnly}
          />
          <FormField
            id="description"
            title="Description"
            defaultValue={clinicalTrial?.description}
            placeholder="Description"
            onChange={onChange}
            disabled={readOnly}
          />
          <FormField
            id="tags"
            title="Tags"
            placeholder="Select or enter tags"
            type={FormFieldTypes.SELECT}
            isCreatable={true}
            isMulti={true}
            optionsAreString={true}
            selectOptions={[]}
            defaultValue={clinicalTrial?.tags}
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
              {clinicalTrial === undefined ? 'Add' : 'Save'}
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
