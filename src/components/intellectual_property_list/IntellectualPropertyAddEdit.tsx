import React, { useState } from 'react'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import { IntellectualProperty } from 'src/types/model'
import { ValidationError } from 'src/pages/dar_application/FormValidationState'

interface IntellectualPropertyAddEditProps {
  readonly id: number
  readonly intellectualProperty?: IntellectualProperty
  readonly intellectualProperties: IntellectualProperty[]
  readonly closeAction: () => void
  readonly onIntellectualPropertyChange: (items: IntellectualProperty[]) => void
  readonly readOnly?: boolean
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

const calcErrors = (intellectualProperty: IntellectualProperty): Validation => {
  const v: Validation = {}
  if (!intellectualProperty.type?.trim()) v.type = makeError('Required')
  if (!intellectualProperty.title?.trim()) v.title = makeError('Required')
  if (!intellectualProperty.assignee?.trim()) v.assignee = makeError('Required')
  if (!intellectualProperty.patentNumber?.trim()) v.patentNumber = makeError('Required')

  // Date validation
  if (!intellectualProperty.filingDate?.trim()) {
    v.filingDate = makeError('Required')
  }
  else if (!FormValidators.DATE.isValid(intellectualProperty.filingDate)) {
    v.filingDate = makeError('Invalid date format (YYYY-MM-DD)')
  }

  if (!intellectualProperty.status?.trim()) v.status = makeError('Required')

  // URL validation
  if (!intellectualProperty.url?.trim()) {
    v.url = makeError('Required')
  }
  else if (!FormValidators.URL.isValid(intellectualProperty.url)) {
    v.url = makeError('Invalid URL format')
  }

  if (!intellectualProperty.contact?.trim()) v.contact = makeError('Required')
  return v
}

type IpFieldValue = string | string[]

interface FormFieldChange {
  key: string
  value: IpFieldValue
}

export default function IntellectualPropertyAddEdit(props: IntellectualPropertyAddEditProps): React.JSX.Element {
  const { id, intellectualProperty, intellectualProperties, closeAction, onIntellectualPropertyChange, readOnly = false } = props

  const [current, setCurrent] = useState<IntellectualProperty>(intellectualProperty || defaultIp)
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
      onIntellectualPropertyChange([...intellectualProperties, toSave])
    }
    else {
      const copy = [...intellectualProperties]
      copy[id] = toSave
      onIntellectualPropertyChange(copy)
    }
    setCurrent(defaultIp)
    closeAction()
  }

  let headerTitle: string | undefined
  if (readOnly) {
    headerTitle = intellectualProperty?.title
  }
  else if (intellectualProperty === undefined) {
    headerTitle = 'New Intellectual Property'
  }
  else {
    headerTitle = `Edit ${intellectualProperty.title}`
  }

  return (
    <div className="form-group row no-margin">
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 collaborator-form-card">
        <div className="row">
          <h2>{headerTitle}</h2>
          <FormField
            id="type"
            title="Type"
            defaultValue={intellectualProperty?.type}
            placeholder="e.g., Patent, Trademark"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.type}
            disabled={readOnly}
          />
          <FormField
            id="title"
            title="Title"
            defaultValue={intellectualProperty?.title}
            placeholder="IP Title"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.title}
            disabled={readOnly}
          />
          <FormField
            id="assignee"
            title="Assignee"
            defaultValue={intellectualProperty?.assignee}
            placeholder="Assignee Name"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.assignee}
            disabled={readOnly}
          />
          <FormField
            id="patentNumber"
            title="Patent Number"
            defaultValue={intellectualProperty?.patentNumber}
            placeholder="Patent Number"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.patentNumber}
            disabled={readOnly}
          />
          <FormField
            id="filingDate"
            title="Filing Date"
            defaultValue={intellectualProperty?.filingDate}
            placeholder="YYYY-MM-DD"
            validators={[FormValidators.REQUIRED, FormValidators.DATE]}
            onChange={onChange}
            validation={validation.filingDate}
            disabled={readOnly}
          />
          <FormField
            id="status"
            title="Status"
            defaultValue={intellectualProperty?.status}
            placeholder="e.g., Pending, Granted"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.status}
            disabled={readOnly}
          />
          <FormField
            id="url"
            title="URL"
            defaultValue={intellectualProperty?.url}
            placeholder="https://..."
            validators={[FormValidators.REQUIRED, FormValidators.URL]}
            onChange={onChange}
            validation={validation.url}
            disabled={readOnly}
          />
          <FormField
            id="contact"
            title="Contact"
            defaultValue={intellectualProperty?.contact}
            placeholder="Contact Information"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.contact}
            disabled={readOnly}
          />
          <FormField
            id="tags"
            title="Tags (comma separated)"
            defaultValue={intellectualProperty?.tags?.join(', ')}
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
              {intellectualProperty === undefined ? 'Add' : 'Save'}
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
