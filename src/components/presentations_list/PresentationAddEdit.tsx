import React, { useState } from 'react'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import { ValidationError } from 'src/pages/dar_application/FormValidationState'
import { validationFailed, calcPresentationErrors } from 'src/utils/darFormUtils'
import { Presentation } from 'src/types/model'

const defaultPresentation: Presentation = {
  title: '',
  date: '',
  authors: '',
  datasetCitation: '',
  citation: false,
  link: '',
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
  authors?: ValidationError
  bibliographicCitation?: ValidationError
  link?: ValidationError
}
export default function PresentationAddEdit(props: PresentationAddEditProps): React.JSX.Element {
  const { id, presentation, presentations, closeAction, onPresentationChange } = props

  const [newPresentation, setNewPresentation] = useState<Presentation>(presentation || defaultPresentation)
  const [validation, setValidation] = useState<Validation>({})

  const onChange = ({ key, value }: FormFieldChange) => {
    const presentationToSet: Presentation = { ...newPresentation, [key]: value }
    setNewPresentation(presentationToSet)
    setValidation(calcPresentationErrors(presentationToSet))
  }

  return (
    <div className="form-group row no-margin">
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 collaborator-form-card">
        <div className="row">
          <h2>{presentation === undefined ? `New Presentation Information` : `Edit ${presentation.title} Information`}</h2>
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
            placeholder="Date"
            validators={[FormValidators.REQUIRED, FormValidators.DATE]}
            onChange={onChange}
            validation={validation.date}
          />
          <FormField
            id="authors"
            title="Presentation Authors"
            defaultValue={presentation?.authors}
            placeholder="Authors"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.authors}
          />
          <FormField
            id="link"
            title="Presentation Link"
            defaultValue={presentation?.link}
            placeholder="Link"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.link}
          />
          <FormField
            id="dataset_citation"
            title="Dataset citation used in this presentation"
            defaultValue={presentation?.datasetCitation}
            placeholder="Dataset Citation"
            onChange={onChange}
          />
          <FormField
            id="did_cite"
            type={FormFieldTypes.YESNORADIOGROUP}
            title="Did you cite the dataset(s) used in this presentation?"
            orientation="horizontal"
            onChange={onChange}
          />
        </div>
        <div className="row" style={{ marginTop: 20 }}>
          {/* add/save button */}
          <button
            className="collaborator-form-add-save-button f-left btn"
            type="button"
            onClick={() => {
              if (id < 0 && newPresentation !== undefined) {
                onPresentationChange([...presentations, newPresentation])
                setNewPresentation(defaultPresentation)
              }
              else if (newPresentation !== undefined) {
                const presentationsCopy = [...presentations]
                presentationsCopy[id] = newPresentation
                onPresentationChange(presentationsCopy)
                setNewPresentation(defaultPresentation)
              }
              closeAction()
            }}
            disabled={validationFailed(calcPresentationErrors(newPresentation))}
          >
            {presentation === undefined ? 'Add' : 'Save'}
          </button>
          {/* cancel button */}
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
