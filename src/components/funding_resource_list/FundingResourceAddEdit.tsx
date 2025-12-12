import React, { useState } from 'react'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import { FundingResource } from 'src/types/model'
import { ValidationError } from 'src/pages/dar_application/FormValidationState'

interface FundingSourceAddEditProps {
  readonly id: number
  readonly funding?: FundingResource
  readonly fundingResources: FundingResource[]
  readonly closeAction: () => void
  readonly onFundingChange: (items: FundingResource[]) => void
  readonly readOnly?: boolean
}

interface Validation {
  funderName?: ValidationError
  funderProgram?: ValidationError
  grantNumber?: ValidationError
  projectTitle?: ValidationError
  startDate?: ValidationError
  endDate?: ValidationError
  url?: ValidationError
}

const defaultFunding: FundingResource = {
  fundingId: '',
  studyId: '',
  funderName: '',
  funderProgram: '',
  grantNumber: '',
  projectTitle: '',
  startDate: '',
  endDate: '',
  url: '',
  tags: [],
}

const makeError = (message: string): ValidationError => ({ valid: true, failed: [message] })

const calcErrors = (f: FundingResource): Validation => {
  const v: Validation = {}
  if (!f.funderName?.trim()) v.funderName = makeError('Required')
  if (!f.projectTitle?.trim()) v.projectTitle = makeError('Required')
  return v
}

const validationFailed = (v: Validation) => Object.values(v).some(e => !!e)

type FundingFieldValue = string | string[]

interface FormFieldChange {
  key: string
  value: FundingFieldValue
}

export default function FundingResourceAddEdit(props: FundingSourceAddEditProps): React.JSX.Element {
  const { id, funding, fundingResources, closeAction, onFundingChange, readOnly = false } = props

  const [current, setCurrent] = useState<FundingResource>(funding || defaultFunding)
  const [validation, setValidation] = useState<Validation>({})

  const onChange = ({ key, value }: FormFieldChange) => {
    const next = { ...current, [key]: value } as FundingResource
    setCurrent(next)
    setValidation(calcErrors(next))
  }

  const save = () => {
    if (validationFailed(calcErrors(current))) return
    const toSave: FundingResource = {
      ...current,
      fundingId: current.fundingId || crypto.randomUUID?.() || Date.now().toString(),
    }
    if (id < 0) {
      onFundingChange([...fundingResources, toSave])
    }
    else {
      const copy = [...fundingResources]
      copy[id] = toSave
      onFundingChange(copy)
    }
    setCurrent(defaultFunding)
    closeAction()
  }

  let headerTitle: string | undefined
  if (readOnly) {
    headerTitle = funding?.funderName
  }
  else if (!funding) {
    headerTitle = 'New Funding Resource'
  }
  else {
    headerTitle = `Edit ${funding.funderName}`
  }

  return (
    <div className="form-group row no-margin">
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 collaborator-form-card">
        <div className="row">
          <h2>{headerTitle}</h2>
          <FormField
            id="funderName"
            title="Funder Name"
            defaultValue={funding?.funderName}
            placeholder="Funder"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.funderName}
            disabled={readOnly}
          />
          <FormField
            id="funderProgram"
            title="Funder Program"
            defaultValue={funding?.funderProgram}
            placeholder="Funder Program"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.funderProgram}
            disabled={readOnly}
          />
          <FormField
            id="grantNumber"
            title="Grant Number"
            defaultValue={funding?.grantNumber}
            placeholder="Grant Number"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.grantNumber}
            disabled={readOnly}
          />
          <FormField
            id="projectTitle"
            title="Project Title"
            defaultValue={funding?.projectTitle}
            placeholder="Project Title"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.projectTitle}
            disabled={readOnly}
          />
          <FormField
            id="startDate"
            title="Start Date"
            defaultValue={funding?.startDate}
            placeholder="YYYY-MM-DD"
            validators={[FormValidators.DATE]}
            onChange={onChange}
            validation={validation.startDate}
            disabled={readOnly}
          />
          <FormField
            id="endDate"
            title="End Date"
            defaultValue={funding?.endDate}
            placeholder="YYYY-MM-DD"
            validators={[FormValidators.DATE]}
            onChange={onChange}
            validation={validation.endDate}
            disabled={readOnly}
          />
          <FormField
            id="url"
            title="URL"
            defaultValue={funding?.url}
            placeholder="https://..."
            validators={[FormValidators.URL]}
            onChange={onChange}
            validation={validation.url}
            disabled={readOnly}
          />
          <FormField
            id="tags"
            title="Tags (comma separated)"
            defaultValue={funding?.tags?.join(', ')}
            placeholder="tag1, tag2"
            onChange={({ value }: { value: string }) =>
              onChange({
                key: 'tags',
                value: value
                  .split(',')
                  .map(t => t.trim())
                  .filter(Boolean),
              })}
            disabled={readOnly}
          />
          <FormField
            id="citation"
            type={FormFieldTypes.TEXT}
            style={{ display: 'none' }}
            title=""
            onChange={() => {}}
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
              {funding === undefined ? 'Add' : 'Save'}
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
