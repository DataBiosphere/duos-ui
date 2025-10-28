import React, { useState } from 'react'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import { ValidationError } from 'src/pages/dar_application/FormValidationState'
import { validationFailed, calcPresentationErrors } from 'src/utils/darFormUtils'
import { Presentation } from 'src/types/model'

const defaultPresentation: Presentation = {
  title: '',
  date: '',
  url: '',
  authors: '',
  datasetCitation: '',
  citation: false,
  presentationId: '',
  studyId: '',
  presenter: { name: '', email: '' },
  event: '',
  location: '',
  format: '',
  access: '',
  tags: [],
}

interface FormFieldChange {
  key: string
  value: string
}

interface PresentationAddEditProps {
  readonly id: number
  readonly presentation?: Presentation
  readonly presentations: Presentation[]
  readonly closeAction: () => void
  readonly onPresentationChange: (presentations: Presentation[]) => void
}

interface Validation {
  title?: ValidationError
  date?: ValidationError
  url?: ValidationError
  authors?: ValidationError
  datasetCitation?: ValidationError
  citation?: ValidationError
  presenter: { name?: ValidationError, email?: ValidationError }
  event?: ValidationError
  location?: ValidationError
  format?: ValidationError
  access?: ValidationError
}

export default function PresentationAddEdit(props: PresentationAddEditProps): React.JSX.Element {
  const { id, presentation, presentations, closeAction, onPresentationChange } = props

  const [newPresentation, setNewPresentation] = useState<Presentation>(presentation || defaultPresentation)
  const [validation, setValidation] = useState<Validation>(() => ({
    presenter: {},
  }))

  const applyValidation = (p: Presentation) => setValidation(calcPresentationErrors(p) as Validation)

  const onChange = ({ key, value }: FormFieldChange) => {
    let next: Presentation
    if (key === 'presenterName') {
      next = { ...newPresentation, presenter: { ...newPresentation.presenter, name: value } }
    }
    else if (key === 'presenterEmail') {
      next = { ...newPresentation, presenter: { ...newPresentation.presenter, email: value } }
    }
    else if (key === 'tags') {
      next = { ...newPresentation, tags: value.split(',').map(t => t.trim()).filter(Boolean) }
    }
    else {
      next = { ...newPresentation, [key]: value }
    }
    setNewPresentation(next)
    applyValidation(next)
  }

  const save = () => {
    const current = { ...newPresentation, presentationId: newPresentation.presentationId || crypto.randomUUID?.() || Date.now().toString() }
    if (validationFailed(calcPresentationErrors(current))) return
    if (id < 0) {
      onPresentationChange([...presentations, current])
    }
    else {
      const copy = [...presentations]
      copy[id] = current
      onPresentationChange(copy)
    }
    setNewPresentation(defaultPresentation)
    closeAction()
  }

  return (
    <div className="form-group row no-margin">
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 collaborator-form-card">
        <div className="row">
          <h2>{presentation === undefined ? 'New Presentation' : `Edit ${presentation.title}`}</h2>
          <FormField
            id="title"
            title="Presentation Title"
            defaultValue={presentation?.title}
            placeholder="Title"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.title}
          />
          <FormField
            id="date"
            title="Presentation Date"
            defaultValue={presentation?.date}
            placeholder="YYYY-MM-DD"
            validators={[FormValidators.REQUIRED, FormValidators.DATE]}
            onChange={onChange}
            validation={validation.date}
          />
          <FormField
            id="url"
            title="Presentation URL"
            defaultValue={presentation?.url}
            placeholder="https://..."
            validators={[FormValidators.REQUIRED, FormValidators.URL]}
            onChange={onChange}
            validation={validation.url}
          />
          <FormField
            id="authors"
            title="Authors"
            defaultValue={presentation?.authors}
            placeholder="Authors"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.authors}
          />
          <FormField
            id="datasetCitation"
            title="Dataset Citation"
            defaultValue={presentation?.datasetCitation}
            placeholder="Dataset Citation"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.datasetCitation}
          />
          <FormField
            id="citation"
            type={FormFieldTypes.YESNORADIOGROUP}
            defaultValue={presentation?.citation}
            title="Did you cite the dataset(s) used in this presentation?"
            orientation="horizontal"
            onChange={onChange}
            validation={validation.citation}
          />
          <FormField
            id="presenterName"
            title="Presenter Name"
            defaultValue={presentation?.presenter?.name}
            placeholder="Name"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.presenter?.name}
          />
          <FormField
            id="presenterEmail"
            title="Presenter Email"
            defaultValue={presentation?.presenter?.email}
            placeholder="email@example.org"
            validators={[FormValidators.REQUIRED, FormValidators.EMAIL]}
            onChange={onChange}
            validation={validation.presenter?.email}
          />
          <FormField
            id="event"
            title="Event"
            defaultValue={presentation?.event}
            placeholder="Event"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.event}
          />
          <FormField
            id="location"
            title="Location"
            defaultValue={presentation?.location}
            placeholder="Location"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.location}
          />
          <FormField
            id="format"
            title="Format"
            defaultValue={presentation?.format}
            placeholder="Format"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.format}
          />
          <FormField
            id="access"
            title="Access"
            defaultValue={presentation?.access}
            placeholder="Access"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.access}
          />
          <FormField
            id="tags"
            title="Tags (comma separated)"
            defaultValue={presentation?.tags?.join(', ')}
            placeholder="tag1, tag2"
            onChange={({ value }: { value: string }) => onChange({ key: 'tags', value })}
          />
          <FormField
            id="hidden"
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
            disabled={validationFailed(calcPresentationErrors(newPresentation))}
          >
            {presentation === undefined ? 'Add' : 'Save'}
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
