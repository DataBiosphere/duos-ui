import React, { useState } from 'react'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import { ValidationError } from 'src/pages/dar_application/FormValidationState'
import { validationFailed, calcPublicationErrors } from 'src/utils/darFormUtils'
import { Publication } from 'src/types/model'

const defaultPublication: Publication = {
  title: '',
  date: '',
  authors: '',
  pubmedId: '',
  bibliographicCitation: '',
  datasetCitation: '',
  citation: false,
}

interface FormFieldChange {
  key: string
  value: string
}

interface PublicationAddEditProps {
  readonly id: number
  readonly publication?: Publication
  readonly publications: Publication[]
  readonly closeAction: () => void
  readonly onPublicationChange: (publications: Publication[]) => void
}

interface Validation {
  title?: ValidationError
  date?: ValidationError
  authors?: ValidationError
  pubmedId?: ValidationError
  bibliographicCitation?: ValidationError
}
export default function PublicationAddEdit(props: PublicationAddEditProps): React.JSX.Element {
  const { id, publication, publications, closeAction, onPublicationChange } = props

  const [newPublication, setNewPublication] = useState<Publication>(publication || defaultPublication)
  const [validation, setValidation] = useState<Validation>({})

  const onChange = ({ key, value }: FormFieldChange) => {
    const publicationToSet: Publication = { ...newPublication, [key]: value }
    setNewPublication(publicationToSet)
    setValidation(calcPublicationErrors(publicationToSet))
  }

  return (
    <div className="form-group row no-margin">
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 collaborator-form-card">
        <div className="row">
          <h2>{publication === undefined ? `New Publication Information` : `Edit ${publication.title} Information`}</h2>
          <FormField
            id="title"
            title="Publication Title"
            defaultValue={publication?.title}
            placeholder="Title"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.title}
          />
          <FormField
            id="date"
            title="Publication Date"
            defaultValue={publication?.date}
            placeholder="Date"
            validators={[FormValidators.REQUIRED, FormValidators.DATE]}
            onChange={onChange}
            validation={validation.date}
          />
          <FormField
            id="authors"
            title="Publication Authors"
            defaultValue={publication?.authors}
            placeholder="Authors"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.authors}
          />
          <FormField
            id="pubmedId"
            title="Publication PubMed ID"
            defaultValue={publication?.pubmedId}
            placeholder="PubMed ID"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.pubmedId}
          />
          <FormField
            id="bibliographicCitation"
            title="Publication Bibliographic Citation"
            defaultValue={publication?.bibliographicCitation}
            placeholder="Bibliographic Citation"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.bibliographicCitation}
          />
          <FormField
            id="datasetCitation"
            title="Dataset citation used in this publication"
            defaultValue={publication?.datasetCitation}
            placeholder="Dataset Citation"
            onChange={onChange}
          />
          <FormField
            id="citation"
            type={FormFieldTypes.YESNORADIOGROUP}
            defaultValue={publication?.citation}
            title="Did you cite the dataset(s) used in this publication?"
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
              if (id < 0 && newPublication !== undefined) {
                onPublicationChange([...publications, newPublication])
                setNewPublication(defaultPublication)
              }
              else if (newPublication !== undefined) {
                const publicationsCopy = [...publications]
                publicationsCopy[id] = newPublication
                onPublicationChange(publicationsCopy)
                setNewPublication(defaultPublication)
              }
              closeAction()
            }}
            disabled={validationFailed(calcPublicationErrors(newPublication))}
          >
            {publication === undefined ? 'Add' : 'Save'}
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
