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
  value: string | boolean
}

interface PresentationAddEditProps {
  readonly id: number
  readonly presentation?: Presentation
  readonly presentations: Presentation[]
  readonly closeAction: () => void
  readonly onPresentationChange: (presentations: Presentation[]) => void
  readonly readOnly?: boolean
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

const getHeaderTitle = (readOnly: boolean, presentation?: Presentation) => {
  if (readOnly) return presentation?.title
  if (!presentation) return 'New Presentation'
  return `Edit ${presentation.title}`
}

export default function PresentationAddEdit(props: PresentationAddEditProps): React.JSX.Element {
  const { id, presentation, presentations, closeAction, onPresentationChange, readOnly = false } = props

  const initialPresentation = presentation || defaultPresentation
  const [newPresentation, setNewPresentation] = useState<Presentation>(initialPresentation)
  const [validation, setValidation] = useState<Validation>({ presenter: {} })
  const [submitted, setSubmitted] = useState<boolean>(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [tagsInput, setTagsInput] = useState<string>((presentation?.tags ?? []).join(', '))

  const applyValidation = (draft: Presentation, full: boolean) => {
    const all = calcPresentationErrors(draft) as Validation
    if (full) {
      setValidation(all)
      return
    }
    const filtered: Validation = { presenter: {} }
    for (const [k, v] of Object.entries(all)) {
      if (k === 'presenter') {
        const presenterErrors = v as { name?: ValidationError, email?: ValidationError }
        if (touched.presenterName && presenterErrors.name) {
          filtered.presenter.name = presenterErrors.name
        }
        if (touched.presenterEmail && presenterErrors.email) {
          filtered.presenter.email = presenterErrors.email
        }
      }
      else if (touched[k]) {
        filtered[k as keyof Validation] = v
      }
    }
    setValidation(filtered)
  }

  const updatePresentation = (updated: Presentation) => {
    setNewPresentation(updated)
    if (submitted) applyValidation(updated, false)
  }

  const markTouched = (key: string) => {
    setTouched(prev => (prev[key] ? prev : { ...prev, [key]: true }))
  }

  const onChange = ({ key, value }: FormFieldChange) => {
    markTouched(key)
    let next: Presentation
    if (key === 'presenterName') {
      next = { ...newPresentation, presenter: { ...newPresentation.presenter, name: value as string } }
    }
    else if (key === 'presenterEmail') {
      next = { ...newPresentation, presenter: { ...newPresentation.presenter, email: value as string } }
    }
    else {
      next = { ...newPresentation, [key]: value }
    }
    updatePresentation(next)
  }

  const save = () => {
    setSubmitted(true)
    applyValidation(newPresentation, true)
    if (validationFailed(calcPresentationErrors(newPresentation))) return
    const current = { ...newPresentation, presentationId: newPresentation.presentationId || crypto.randomUUID?.() || Date.now().toString() }
    if (id < 0) {
      onPresentationChange([...presentations, current])
    }
    else {
      const copy = [...presentations]
      copy[id] = current
      onPresentationChange(copy)
    }
    closeAction()
  }

  const headerTitle = getHeaderTitle(readOnly, presentation)

  return (
    <div className="form-group row no-margin">
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 collaborator-form-card">
        <div className="row">
          <h2>{headerTitle}</h2>
          <FormField
            id="title"
            title="Presentation Title"
            defaultValue={newPresentation.title}
            placeholder="Title"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={(submitted || touched.title) ? validation.title : undefined}
            disabled={readOnly}
          />
          <FormField
            id="date"
            title="Presentation Date"
            defaultValue={newPresentation.date}
            placeholder="YYYY-MM-DD"
            validators={[FormValidators.REQUIRED, FormValidators.DATE]}
            onChange={onChange}
            validation={(submitted || touched.date) ? validation.date : undefined}
            disabled={readOnly}
          />
          <FormField
            id="url"
            title="Presentation URL"
            defaultValue={newPresentation.url}
            placeholder="https://..."
            validators={[FormValidators.REQUIRED, FormValidators.URL]}
            onChange={onChange}
            validation={(submitted || touched.url) ? validation.url : undefined}
            disabled={readOnly}
          />
          <FormField
            id="authors"
            title="Authors"
            defaultValue={newPresentation.authors}
            placeholder="Authors"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={(submitted || touched.authors) ? validation.authors : undefined}
            disabled={readOnly}
          />
          <FormField
            id="datasetCitation"
            title="Dataset Citation"
            defaultValue={newPresentation.datasetCitation}
            placeholder="Dataset Citation"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={(submitted || touched.datasetCitation) ? validation.datasetCitation : undefined}
            disabled={readOnly}
          />
          <FormField
            id="citation"
            type={FormFieldTypes.YESNORADIOGROUP}
            defaultValue={newPresentation.citation}
            title="Did you cite the dataset(s) used in this presentation?"
            orientation="horizontal"
            onChange={onChange}
            validation={(submitted || touched.citation) ? validation.citation : undefined}
            disabled={readOnly}
          />
          <FormField
            id="presenterName"
            title="Presenter Name"
            defaultValue={newPresentation.presenter?.name}
            placeholder="Name"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={(submitted || touched.presenterName) ? validation.presenter?.name : undefined}
            disabled={readOnly}
          />
          <FormField
            id="presenterEmail"
            title="Presenter Email"
            defaultValue={newPresentation.presenter?.email}
            placeholder="email@example.org"
            validators={[FormValidators.REQUIRED, FormValidators.EMAIL]}
            onChange={onChange}
            validation={(submitted || touched.presenterEmail) ? validation.presenter?.email : undefined}
            disabled={readOnly}
          />
          <FormField
            id="event"
            title="Event"
            defaultValue={newPresentation.event}
            placeholder="Event"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={(submitted || touched.event) ? validation.event : undefined}
            disabled={readOnly}
          />
          <FormField
            id="location"
            title="Location"
            defaultValue={newPresentation.location}
            placeholder="Location"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={(submitted || touched.location) ? validation.location : undefined}
            disabled={readOnly}
          />
          <FormField
            id="format"
            title="Format"
            defaultValue={newPresentation.format}
            placeholder="Format"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={(submitted || touched.format) ? validation.format : undefined}
            disabled={readOnly}
          />
          <FormField
            id="access"
            title="Access"
            defaultValue={newPresentation.access}
            placeholder="Access"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={(submitted || touched.access) ? validation.access : undefined}
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
            defaultValue={newPresentation?.tags}
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
              {presentation === undefined ? 'Add' : 'Save'}
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
