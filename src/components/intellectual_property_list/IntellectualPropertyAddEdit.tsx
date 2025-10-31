import React, { useState } from 'react'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import { IntellectualProperty } from 'src/types/model'
import { ValidationError } from 'src/pages/dar_application/FormValidationState'

interface IntellectualPropertyAddEditProps {
  readonly id: number
  readonly ip?: IntellectualProperty
  readonly intellectualProperties: IntellectualProperty[]
  readonly closeAction: () => void
  readonly onIpChange: (items: IntellectualProperty[]) => void
}

interface Validation {
  type?: ValidationError
  title?: ValidationError
  assignee?: ValidationError
  patentNumber?: ValidationError
  filingDate?: ValidationError
  status?: ValidationError
  url?: ValidationError
  contact?: ValidationError
}

const defaultIp: IntellectualProperty = {
  ipId: '',
  studyId: '',
  type: '',
  title: '',
  assignee: '',
  patentNumber: '',
  filingDate: '',
  status: '',
  url: '',
  contact: '',
  tags: [],
}

const makeError = (message: string): ValidationError => ({ valid: true, failed: [message] })

const validationFailed = (v: Validation) => Object.values(v).some(e => !!e)

const calcErrors = (ip: IntellectualProperty): Validation => {
  const v: Validation = {}
  if (!ip.type?.trim()) v.type = makeError('Required')
  if (!ip.title?.trim()) v.title = makeError('Required')
  if (!ip.assignee?.trim()) v.assignee = makeError('Required')
  if (!ip.patentNumber?.trim()) v.patentNumber = makeError('Required')

  // Date validation
  if (!ip.filingDate?.trim()) {
    v.filingDate = makeError('Required')
  }
  else if (!FormValidators.DATE.isValid(ip.filingDate)) {
    v.filingDate = makeError('Invalid date format (YYYY-MM-DD)')
  }

  if (!ip.status?.trim()) v.status = makeError('Required')

  // URL validation
  if (!ip.url?.trim()) {
    v.url = makeError('Required')
  }
  else if (!FormValidators.URL.isValid(ip.url)) {
    v.url = makeError('Invalid URL format')
  }

  if (!ip.contact?.trim()) v.contact = makeError('Required')
  return v
}

type IpFieldValue = string | string[]

interface FormFieldChange {
  key: string
  value: IpFieldValue
}

export const IntellectualPropertyAddEdit: React.FC<IntellectualPropertyAddEditProps> = ({
  id,
  ip,
  intellectualProperties,
  closeAction,
  onIpChange,
}) => {
  const [current, setCurrent] = useState<IntellectualProperty>(ip || defaultIp)
  const [validation, setValidation] = useState<Validation>({})

  const onChange = ({ key, value }: FormFieldChange) => {
    const next = { ...current, [key]: value } as IntellectualProperty
    setCurrent(next)
    setValidation(calcErrors(next))
  }

  const save = () => {
    if (validationFailed(calcErrors(current))) return
    const toSave: IntellectualProperty = {
      ...current,
      ipId: current.ipId || crypto.randomUUID?.() || Date.now().toString(),
    }
    if (id < 0) {
      onIpChange([...intellectualProperties, toSave])
    }
    else {
      const copy = [...intellectualProperties]
      copy[id] = toSave
      onIpChange(copy)
    }
    setCurrent(defaultIp)
    closeAction()
  }

  return (
    <div className="form-group row no-margin">
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 collaborator-form-card">
        <div className="row">
          <h2>{ip === undefined ? 'New Intellectual Property' : `Edit ${ip.title || 'Intellectual Property'}`}</h2>
          <FormField
            id="type"
            title="Type"
            defaultValue={ip?.type}
            placeholder="e.g., Patent, Trademark"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.type}
          />
          <FormField
            id="title"
            title="Title"
            defaultValue={ip?.title}
            placeholder="IP Title"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.title}
          />
          <FormField
            id="assignee"
            title="Assignee"
            defaultValue={ip?.assignee}
            placeholder="Assignee Name"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.assignee}
          />
          <FormField
            id="patentNumber"
            title="Patent Number"
            defaultValue={ip?.patentNumber}
            placeholder="Patent Number"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.patentNumber}
          />
          <FormField
            id="filingDate"
            title="Filing Date"
            defaultValue={ip?.filingDate}
            placeholder="YYYY-MM-DD"
            validators={[FormValidators.REQUIRED, FormValidators.DATE]}
            onChange={onChange}
            validation={validation.filingDate}
          />
          <FormField
            id="status"
            title="Status"
            defaultValue={ip?.status}
            placeholder="e.g., Pending, Granted"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.status}
          />
          <FormField
            id="url"
            title="URL"
            defaultValue={ip?.url}
            placeholder="https://..."
            validators={[FormValidators.REQUIRED, FormValidators.URL]}
            onChange={onChange}
            validation={validation.url}
          />
          <FormField
            id="contact"
            title="Contact"
            defaultValue={ip?.contact}
            placeholder="Contact Information"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.contact}
          />
          <FormField
            id="tags"
            title="Tags (comma separated)"
            defaultValue={ip?.tags?.join(', ')}
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
            {ip === undefined ? 'Add' : 'Save'}
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

export default IntellectualPropertyAddEdit
