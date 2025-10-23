import React, { useState } from 'react'
import { FormField, FormValidators } from 'src/components/forms/forms'
import { ClinicalTrial } from 'src/types/model'
import { validationFailed } from 'src/utils/darFormUtils'
import { ValidationError } from 'src/pages/dar_application/FormValidationState'

const defaultClinicalTrial: ClinicalTrial = {
  clinicalTrialId: '',
  studyId: '',
  title: '',
  registry: '',
  identifier: '',
  status: '',
  sponsor: '',
  startDate: '',
  endDate: '',
  interventionType: '',
  description: '',
  phase: '',
  url: '',
  tags: [],
}

interface FormFieldChange {
  key: string
  value: string
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

const calcClinicalTrialErrors = (ct: ClinicalTrial): Validation => {
  const v: Validation = {}
  if (!ct.title?.trim()) v.title = makeError('Required')
  if (!ct.registry?.trim()) v.registry = makeError('Required')
  if (!ct.identifier?.trim()) v.identifier = makeError('Required')
  if (!ct.status?.trim()) v.status = makeError('Required')
  if (!ct.sponsor?.trim()) v.sponsor = makeError('Required')
  if (!ct.startDate?.trim()) v.startDate = makeError('Required')
  else if (!FormValidators.DATE.isValid(ct.startDate)) v.startDate = makeError('Invalid date')
  if (ct.endDate?.trim() && !FormValidators.DATE.isValid(ct.endDate)) v.endDate = makeError('Invalid date')
  if (!ct.interventionType?.trim()) v.interventionType = makeError('Required')
  if (!ct.phase?.trim()) v.phase = makeError('Required')
  if (!ct.url?.trim()) v.url = makeError('Required')
  return v
}

export default function ClinicalTrialAddEdit(props: ClinicalTrialAddEditProps): React.JSX.Element {
  const { id, clinicalTrial, clinicalTrials, closeAction, onClinicalTrialChange } = props
  const [newClinicalTrial, setNewClinicalTrial] = useState<ClinicalTrial>(clinicalTrial || defaultClinicalTrial)
  const [validation, setValidation] = useState<Validation>({})

  const onChange = ({ key, value }: FormFieldChange) => {
    const ctToSet: ClinicalTrial = {
      ...newClinicalTrial,
      [key]: key === 'tags'
        ? value.split(',').map(t => t.trim()).filter(t => t)
        : value,
    }
    setNewClinicalTrial(ctToSet)
    setValidation(calcClinicalTrialErrors(ctToSet))
  }

  const save = () => {
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
          <FormField id="title" title="Title" defaultValue={clinicalTrial?.title} placeholder="Title" validators={[FormValidators.REQUIRED]} onChange={onChange} validation={validation.title} />
          <FormField id="registry" title="Registry" defaultValue={clinicalTrial?.registry} placeholder="Registry" validators={[FormValidators.REQUIRED]} onChange={onChange} validation={validation.registry} />
          <FormField id="identifier" title="Identifier" defaultValue={clinicalTrial?.identifier} placeholder="Identifier" validators={[FormValidators.REQUIRED]} onChange={onChange} validation={validation.identifier} />
          <FormField id="status" title="Status" defaultValue={clinicalTrial?.status} placeholder="Status" validators={[FormValidators.REQUIRED]} onChange={onChange} validation={validation.status} />
          <FormField id="sponsor" title="Sponsor" defaultValue={clinicalTrial?.sponsor} placeholder="Sponsor" validators={[FormValidators.REQUIRED]} onChange={onChange} validation={validation.sponsor} />
          <FormField id="startDate" title="Start Date" defaultValue={clinicalTrial?.startDate} placeholder="YYYY-MM-DD" validators={[FormValidators.REQUIRED, FormValidators.DATE]} onChange={onChange} validation={validation.startDate} />
          <FormField id="endDate" title="End Date" defaultValue={clinicalTrial?.endDate} placeholder="YYYY-MM-DD" validators={[FormValidators.DATE]} onChange={onChange} validation={validation.endDate} />
          <FormField id="interventionType" title="Intervention Type" defaultValue={clinicalTrial?.interventionType} placeholder="Intervention Type" validators={[FormValidators.REQUIRED]} onChange={onChange} validation={validation.interventionType} />
          <FormField id="phase" title="Phase" defaultValue={clinicalTrial?.phase} placeholder="Phase" validators={[FormValidators.REQUIRED]} onChange={onChange} validation={validation.phase} />
          <FormField id="url" title="URL" defaultValue={clinicalTrial?.url} placeholder="URL" validators={[FormValidators.REQUIRED]} onChange={onChange} validation={validation.url} />
          <FormField id="description" title="Description" defaultValue={clinicalTrial?.description} placeholder="Description" onChange={onChange} />
          <FormField id="tags" title="Tags" defaultValue={clinicalTrial?.tags?.join(', ')} placeholder="Comma separated tags" onChange={onChange} />
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
          <button className="collaborator-form-cancel-button f-left btn" type="button" onClick={closeAction}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
