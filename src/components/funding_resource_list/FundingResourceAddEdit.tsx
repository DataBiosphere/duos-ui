import React, { useState } from 'react'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import { FundingResource } from 'src/types/model'

interface FundingSourceAddEditProps {
  readonly id: number
  readonly funding?: FundingResource
  readonly fundingResources: FundingResource[]
  readonly closeAction: () => void
  readonly onFundingChange: (items: FundingResource[]) => void
}

interface Validation {
  funderName?: unknown
  funderProgram?: unknown
  grantNumber?: unknown
  projectTitle?: unknown
  startDate?: unknown
  endDate?: unknown
  url?: unknown
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

const calcErrors = (f: FundingResource): Validation => {
  const v: Validation = {}
  if (!f.funderName?.trim()) v.funderName = { error: 'Required' }
  if (!f.projectTitle?.trim()) v.projectTitle = { error: 'Required' }
  return v
}

const validationFailed = (v: Validation) => Object.values(v).some(e => !!e)

type FundingFieldValue = string | string[]

interface FormFieldChange {
  key: string
  value: FundingFieldValue
}

export const FundingResourceAddEdit: React.FC<FundingSourceAddEditProps> = ({
  id,
  funding,
  fundingResources,
  closeAction,
  onFundingChange,
}) => {
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

  return (
    <div className="form-group row no-margin">
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 collaborator-form-card">
        <div className="row">
          <h2>{funding === undefined ? 'New Funding Resource' : `Edit ${funding.funderName || 'Funding Resource'}`}</h2>
          <FormField
            id="funderName"
            title="Funder Name"
            defaultValue={funding?.funderName}
            placeholder="Funder"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.funderName}
          />
          <FormField
            id="funderProgram"
            title="Funder Program"
            defaultValue={funding?.funderProgram}
            placeholder="Funder Program"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.funderProgram}
          />
          <FormField
            id="grantNumber"
            title="Grant Number"
            defaultValue={funding?.grantNumber}
            placeholder="Grant Number"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.grantNumber}
          />
          <FormField
            id="projectTitle"
            title="Project Title"
            defaultValue={funding?.projectTitle}
            placeholder="Project Title"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.projectTitle}
          />
          <FormField
            id="startDate"
            title="Start Date"
            defaultValue={funding?.startDate}
            placeholder="YYYY-MM-DD"
            validators={[FormValidators.DATE]}
            onChange={onChange}
            validation={validation.startDate}
          />
          <FormField
            id="endDate"
            title="End Date"
            defaultValue={funding?.endDate}
            placeholder="YYYY-MM-DD"
            validators={[FormValidators.DATE]}
            onChange={onChange}
            validation={validation.endDate}
          />
          <FormField
            id="url"
            title="URL"
            defaultValue={funding?.url}
            placeholder="https://..."
            validators={[FormValidators.URL]}
            onChange={onChange}
            validation={validation.url}
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
          />
          <FormField
            id="citation"
            type={FormFieldTypes.TEXT}
            style={{ display: 'none' }}
            title=""
            onChange={() => {}}
          />
        </div>
        <div className="row" style={{ marginTop: 20 }}>
          <button
            className="collaborator-form-add-save-button f-left btn"
            type="button"
            onClick={save}
            disabled={validationFailed(calcErrors(current))}
          >
            {funding === undefined ? 'Add' : 'Save'}
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
