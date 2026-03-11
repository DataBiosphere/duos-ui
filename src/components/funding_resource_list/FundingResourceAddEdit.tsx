import React, { useState } from 'react'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import { FundingResource } from 'src/types/model'
import { ValidationError } from 'src/pages/dar_application/FormValidationState'
import { unset } from 'lodash'

interface FundingSourceAddEditProps {
  readonly id: number
  readonly fundingResource?: FundingResource
  readonly fundingResources: FundingResource[]
  readonly closeAction: () => void
  readonly onFundingResourcesChange: (items: FundingResource[]) => void
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

const makeError = (message: string): ValidationError => ({ valid: false, failed: [message] })

const calcErrors = (f: FundingResource): Validation => {
  const v: Validation = {}
  if (!f.funderName?.trim()) v.funderName = makeError('required')
  if (!f.funderProgram?.trim()) v.funderProgram = makeError('required')
  if (!f.grantNumber?.trim()) v.grantNumber = makeError('required')
  if (!f.projectTitle?.trim()) v.projectTitle = makeError('required')
  return v
}

const validationFailed = (v: Validation) => Object.values(v).some(e => !!e)

type FundingFieldValue = string | string[]

interface FormFieldChange {
  key: string
  value: FundingFieldValue
}

const getHeaderTitle = (readOnly: boolean, fundingResource?: FundingResource) => {
  if (readOnly) return fundingResource?.funderName
  if (!fundingResource) return 'New Funding Resource'
  return `Edit ${fundingResource.funderName}`
}

export default function FundingResourceAddEdit(props: FundingSourceAddEditProps): React.JSX.Element {
  const { id, fundingResource, fundingResources, closeAction, onFundingResourcesChange, readOnly = false } = props

  const [current, setCurrent] = useState<FundingResource>(fundingResource || defaultFunding)
  const [validation, setValidation] = useState<Validation>({})

  const onChange = ({ key, value }: FormFieldChange) => {
    const next = { ...current, [key]: value } as FundingResource
    setCurrent(next)
    setValidation(calcErrors(next))
  }

  const save = () => {
    const validationErrors = calcErrors(current)
    setValidation(validationErrors)
    if (validationFailed(validationErrors)) return
    const toSave: FundingResource = {
      ...current,
      fundingId: current.fundingId || crypto.randomUUID?.() || Date.now().toString(),
    }
    if (toSave.endDate?.trim() === '') unset(toSave, 'endDate')
    if (toSave.startDate?.trim() === '') unset(toSave, 'startDate')
    if (id < 0) {
      onFundingResourcesChange([...fundingResources, toSave])
    }
    else {
      const copy = [...fundingResources]
      copy[id] = toSave
      onFundingResourcesChange(copy)
    }
    setCurrent(defaultFunding)
    closeAction()
  }

  const headerTitle = getHeaderTitle(readOnly, fundingResource)

  return (
    <div className="form-group row no-margin">
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 collaborator-form-card">
        <div className="row">
          <h2>{headerTitle}</h2>
          <FormField
            id="funderName"
            title="Funder Name"
            defaultValue={fundingResource?.funderName}
            placeholder="Funder"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.funderName}
            disabled={readOnly}
          />
          <FormField
            id="funderProgram"
            title="Funder Program"
            defaultValue={fundingResource?.funderProgram}
            placeholder="Funder Program"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.funderProgram}
            disabled={readOnly}
          />
          <FormField
            id="grantNumber"
            title="Grant Number"
            defaultValue={fundingResource?.grantNumber}
            placeholder="Grant Number"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.grantNumber}
            disabled={readOnly}
          />
          <FormField
            id="projectTitle"
            title="Project Title"
            defaultValue={fundingResource?.projectTitle}
            placeholder="Project Title"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.projectTitle}
            disabled={readOnly}
          />
          <FormField
            id="startDate"
            title="Start Date"
            defaultValue={fundingResource?.startDate}
            placeholder="YYYY-MM-DD"
            validators={[FormValidators.DATE]}
            onChange={onChange}
            validation={validation.startDate}
            disabled={readOnly}
          />
          <FormField
            id="endDate"
            title="End Date"
            defaultValue={fundingResource?.endDate}
            placeholder="YYYY-MM-DD"
            validators={[FormValidators.DATE]}
            onChange={onChange}
            validation={validation.endDate}
            disabled={readOnly}
          />
          <FormField
            id="url"
            title="URL"
            defaultValue={fundingResource?.url}
            placeholder="https://..."
            validators={[FormValidators.URL]}
            onChange={onChange}
            validation={validation.url}
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
            defaultValue={fundingResource?.tags}
            onChange={onChange}
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
              {fundingResource === undefined ? 'Add' : 'Save'}
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
