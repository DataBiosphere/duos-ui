import React, { useState } from 'react'
import { FormField, FormValidators } from 'src/components/forms/forms'
import { ValidationError } from 'src/pages/dar_application/FormValidationState'
import { validationFailed, calcPublicationErrors } from 'src/utils/darFormUtils'
import { Author, Publication } from 'src/types/model'

interface FormFieldChange {
  key: string
  value: string | boolean
}

interface PublicationAddEditProps {
  readonly id: number
  readonly publication?: Publication
  readonly publications: Publication[]
  readonly closeAction: () => void
  readonly onPublicationChange: (publications: Publication[]) => void
  readonly readOnly?: boolean
}

interface Validation {
  title?: ValidationError
  pubmedId?: ValidationError
  publishedDate?: ValidationError
  authors?: ValidationError
  bibliographicCitation?: ValidationError
  datasetCitation?: ValidationError
  journal?: ValidationError
  doi?: ValidationError
  url?: ValidationError
  access?: ValidationError
}

const defaultPublication: Publication = {
  title: '',
  publishedDate: '',
  authors: [],
  pubmedId: '',
  bibliographicCitation: '',
  datasetCitation: '',
  citation: false,
  publicationId: '',
  studyId: '',
  journal: '',
  doi: '',
  url: '',
  access: '',
  tags: [],
}

function getHeaderTitle(readOnly: boolean, publication?: Publication) {
  if (readOnly) return publication?.title
  if (!publication) return 'New Publication'
  return `Edit ${publication.title}`
}

function filterValidationByTouched(
  all: Validation,
  touched: Record<string, boolean>,
): Validation {
  const filtered: Validation = {}
  for (const [k, v] of Object.entries(all)) {
    if (touched[k]) filtered[k as keyof Validation] = v
  }
  return filtered
}

export default function PublicationAddEdit(props: PublicationAddEditProps): React.JSX.Element {
  const { id, publication, publications, closeAction, onPublicationChange, readOnly = false } = props
  const initialPublication = publication || defaultPublication

  const [newPublication, setNewPublication] = useState<Publication>({
    ...initialPublication,
    authors:
        Array.isArray(initialPublication.authors) && initialPublication.authors.length > 0
          ? initialPublication.authors
          : [{ name: '', orcId: '' }],
  })

  const [validation, setValidation] = useState<Validation>({})
  const [submitted, setSubmitted] = useState<boolean>(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [tagsInput, setTagsInput] = useState<string>((publication?.tags ?? []).join(', '))

  const applyValidation = (draft: Publication, full: boolean) => {
    const all = calcPublicationErrors(draft)
    if (full) {
      setValidation(all)
      return
    }
    setValidation(filterValidationByTouched(all, touched))
  }

  const updatePublication = (updated: Publication) => {
    setNewPublication(updated)
    if (submitted) applyValidation(updated, false)
  }

  const markTouched = (key: string) => {
    setTouched(prev => (prev[key] ? prev : { ...prev, [key]: true }))
  }

  const onChange = ({ key, value }: FormFieldChange) => {
    markTouched(key)
    if (key === 'tags') {
      const text = String(value)
      setTagsInput(text)
      updatePublication({
        ...newPublication,
        tags: text.split(',').map(t => t.trim()).filter(Boolean),
      })
    }
    else {
      updatePublication({ ...newPublication, [key]: value })
    }
  }

  const disableAddAuthor = newPublication.authors.some(a => a.name.trim() === '')

  const addAuthor = () => {
    if (disableAddAuthor) return
    markTouched('authors')
    updatePublication({
      ...newPublication,
      authors: [...newPublication.authors, { name: '', orcId: '' }],
    })
  }

  const removeAuthor = (index: number) => {
    markTouched('authors')
    const next = newPublication.authors.filter((_, i) => i !== index)
    updatePublication({
      ...newPublication,
      authors: next.length ? next : [{ name: '', orcId: '' }],
    })
  }

  const updateAuthorField = (index: number, field: keyof Author, value: string) => {
    markTouched('authors')
    const next = newPublication.authors.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    updatePublication({ ...newPublication, authors: next })
  }

  const save = () => {
    setSubmitted(true)
    applyValidation(newPublication, true)
    if (validationFailed(calcPublicationErrors(newPublication))) return
    if (id < 0) {
      onPublicationChange([...publications, newPublication])
    }
    else {
      const publicationsCopy = [...publications]
      publicationsCopy[id] = newPublication
      onPublicationChange(publicationsCopy)
    }
    closeAction()
  }

  const headerTitle = getHeaderTitle(readOnly, publication)

  return (
    <div className="form-group row no-margin">
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 collaborator-form-card">
        <div className="row">
          <h2>{headerTitle}</h2>
          <FormField
            id="title"
            title="Publication Title"
            defaultValue={newPublication.title}
            placeholder="Title"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={(submitted || touched.title) ? validation.title : undefined}
            disabled={readOnly}
          />

          <FormField
            id="publishedDate"
            title="Publication Date"
            defaultValue={newPublication.publishedDate}
            placeholder="YYYY-MM-DD"
            validators={[FormValidators.REQUIRED, FormValidators.DATE]}
            onChange={onChange}
            validation={(submitted || touched.publishedDate) ? validation.publishedDate : undefined}
            disabled={readOnly}
          />

          <div style={{ marginBottom: '1rem', width: '100%' }}>
            <fieldset style={{ fontWeight: 600, marginTop: '1rem' }} aria-label="Authors (Name + ORCID)">
              <legend style={{ fontSize: 16 }}>Authors (Name + ORCID)*</legend>
              {(submitted || touched.authors) && validation.authors && (
                <div className="error-message">
                  {(validation.authors.failed || []).includes('required')
                    ? 'At least one author with name and valid ORCID is required.'
                    : (validation.authors.failed || []).map(f => (
                        <div key={f}>{f}</div>
                      ))}
                </div>
              )}
              {newPublication.authors.map((a: Author, idx) => (
                <div
                  key={idx}
                  className="row"
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    marginTop: idx === 0 ? '0.5rem' : '0.75rem',
                    alignItems: 'flex-start',
                  }}
                >
                  <input
                    type="text"
                    className="form-control"
                    style={{ flex: 1 }}
                    value={a.name}
                    placeholder="Author Name"
                    onChange={e => updateAuthorField(idx, 'name', e.target.value)}
                    disabled={readOnly}
                  />
                  <input
                    type="text"
                    className="form-control"
                    style={{ flex: 1 }}
                    value={a.orcId}
                    placeholder="ORCID (0000-0000-0000-0000)"
                    onChange={e => updateAuthorField(idx, 'orcId', e.target.value)}
                    disabled={readOnly}
                  />
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => removeAuthor(idx)}
                    disabled={newPublication.authors.length === 1 || readOnly}
                    title={
                      newPublication.authors.length === 1
                        ? 'At least one author required'
                        : 'Remove author'
                    }
                  >
                    <span className="glyphicon glyphicon-minus" aria-hidden="true" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-primary"
                style={{ marginTop: '0.75rem', width: '100%' }}
                onClick={addAuthor}
                disabled={disableAddAuthor || readOnly}
                title={
                  disableAddAuthor
                    ? 'Fill all existing author name and valid ORCID first'
                    : 'Add another author'
                }
              >
                <span className="glyphicon glyphicon-plus" aria-hidden="true" /> Add Author
              </button>
            </fieldset>
          </div>

          <FormField
            id="pubmedId"
            title="PubMed ID"
            defaultValue={newPublication.pubmedId}
            placeholder="PubMed ID"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={(submitted || touched.pubmedId) ? validation.pubmedId : undefined}
            disabled={readOnly}
          />

          <FormField
            id="bibliographicCitation"
            title="Bibliographic Citation"
            defaultValue={newPublication.bibliographicCitation}
            placeholder="Citation"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={(submitted || touched.bibliographicCitation) ? validation.bibliographicCitation : undefined}
            disabled={readOnly}
          />

          <FormField
            id="datasetCitation"
            title="Dataset Citation"
            defaultValue={newPublication.datasetCitation}
            placeholder="Dataset Citation"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={(submitted || touched.datasetCitation) ? validation.datasetCitation : undefined}
            disabled={readOnly}
          />

          <FormField
            id="journal"
            title="Journal"
            defaultValue={newPublication.journal}
            placeholder="Journal"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={(submitted || touched.journal) ? validation.journal : undefined}
            disabled={readOnly}
          />

          <FormField
            id="doi"
            title="DOI"
            defaultValue={newPublication.doi}
            placeholder="DOI"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={(submitted || touched.doi) ? validation.doi : undefined}
            disabled={readOnly}
          />

          <FormField
            id="url"
            title="URL"
            defaultValue={newPublication.url}
            placeholder="https://example.org"
            validators={[FormValidators.REQUIRED, FormValidators.URL]}
            onChange={onChange}
            validation={(submitted || touched.url) ? validation.url : undefined}
            disabled={readOnly}
          />

          <FormField
            id="access"
            title="Access"
            defaultValue={newPublication.access}
            placeholder="Access"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={(submitted || touched.access) ? validation.access : undefined}
            disabled={readOnly}
          />

          <FormField
            id="tags"
            title="Tags (comma separated)"
            defaultValue={tagsInput}
            placeholder="tag1, tag2"
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
              {publication === undefined ? 'Add' : 'Save'}
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
