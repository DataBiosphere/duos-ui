import React, { useState } from 'react'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import { ValidationError } from 'src/pages/dar_application/FormValidationState'
import { AiModel, Maintainer } from 'src/types/model'

const defaultMaintainer: Maintainer = {
  name: '',
  email: '',
}

const defaultAiModel: AiModel = {
  modelId: '',
  studyId: '',
  name: '',
  description: '',
  url: '',
  format: '',
  license: '',
  trainedOnDatasets: [],
  maintainer: defaultMaintainer,
  tags: [],
}

interface FormFieldChange {
  key: string
  value: string
}

interface AiModelAddEditProps {
  readonly id: number
  readonly aiModel?: AiModel
  readonly aiModels: AiModel[]
  readonly closeAction: () => void
  readonly onAiModelsChange: (models: AiModel[]) => void
  readonly readOnly?: boolean
}

interface Validation {
  name?: ValidationError
  url?: ValidationError
  format?: ValidationError
  license?: ValidationError
  maintainerName?: ValidationError
  maintainerEmail?: ValidationError
}

const makeError = (message: string): ValidationError => ({ valid: false, failed: [message] })

const validationFailed = (v: Validation) => Object.values(v).some(e => !!e)

const calcAiModelErrors = (model: AiModel): Validation => {
  const v: Validation = {}
  if (!model.name?.trim()) v.name = makeError('required')
  if (!model.url?.trim()) {
    v.url = makeError('required')
  }
  else if (!FormValidators.URL.isValid(model.url)) {
    v.url = makeError('uri')
  }
  if (!model.format?.trim()) v.format = makeError('required')
  if (!model.license?.trim()) v.license = makeError('required')
  if (!model.maintainer?.name?.trim()) v.maintainerName = makeError('required')
  if (!model.maintainer?.email?.trim()) v.maintainerEmail = makeError('required')
  return v
}

const getHeaderTitle = (readOnly: boolean, aiModel?: AiModel) => {
  if (readOnly) return aiModel?.name
  if (!aiModel) return 'New AI Model'
  return `Edit ${aiModel.name}`
}

export default function AiModelAddEdit(props: AiModelAddEditProps): React.JSX.Element {
  const { id, aiModel, aiModels, closeAction, onAiModelsChange, readOnly = false } = props

  const [newAiModel, setNewAiModel] = useState<AiModel>(aiModel || defaultAiModel)
  const [validation, setValidation] = useState<Validation>({})

  const onChange = ({ key, value }: FormFieldChange) => {
    let updated: AiModel = { ...newAiModel }

    if (key === 'trainedOnDatasets') {
      updated.trainedOnDatasets = value.split(',').map((s: string) => s.trim()).filter(Boolean)
    }
    else if (key === 'maintainerName') {
      updated.maintainer = { ...updated.maintainer, name: value }
    }
    else if (key === 'maintainerEmail') {
      updated.maintainer = { ...updated.maintainer, email: value }
    }
    else {
      // generic assignment
      updated = { ...updated, [key]: value }
    }

    setNewAiModel(updated)
    setValidation(calcAiModelErrors(updated))
  }

  const save = () => {
    const validationErrors = calcAiModelErrors(newAiModel)
    setValidation(validationErrors)
    if (validationFailed(validationErrors)) return
    if (id < 0) {
      onAiModelsChange([...aiModels, newAiModel])
    }
    else {
      const copy = [...aiModels]
      copy[id] = newAiModel
      onAiModelsChange(copy)
    }
    setNewAiModel(defaultAiModel)
    closeAction()
  }

  const headerTitle = getHeaderTitle(readOnly, aiModel)

  return (
    <div className="form-group row no-margin">
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 collaborator-form-card">
        <div className="row">
          <h2>{headerTitle}</h2>
          <FormField
            id="name"
            title="Model Name"
            defaultValue={aiModel?.name}
            placeholder="Name"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.name}
            disabled={readOnly}
          />
          <FormField
            id="description"
            title="Description"
            defaultValue={aiModel?.description}
            placeholder="Description"
            onChange={onChange}
            type={FormFieldTypes.TEXTAREA}
            disabled={readOnly}
          />
          <FormField
            id="url"
            title="Model URL"
            defaultValue={aiModel?.url}
            placeholder="URL"
            validators={[FormValidators.REQUIRED, FormValidators.URL]}
            onChange={onChange}
            validation={validation.url}
            disabled={readOnly}
          />
          <FormField
            id="format"
            title="Model Format"
            defaultValue={aiModel?.format}
            placeholder="Format (e.g. PyTorch, ONNX)"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.format}
            disabled={readOnly}
          />
          <FormField
            id="license"
            title="License"
            defaultValue={aiModel?.license}
            placeholder="License (e.g. MIT)"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.license}
            disabled={readOnly}
          />
          <FormField
            id="trainedOnDatasets"
            title="Trained On Datasets"
            defaultValue={aiModel?.trainedOnDatasets?.join(', ')}
            placeholder="Comma separated dataset identifiers"
            onChange={onChange}
            disabled={readOnly}
          />
          <FormField
            id="maintainerName"
            title="Maintainer Name"
            defaultValue={aiModel?.maintainer?.name}
            placeholder="Maintainer Name"
            validators={[FormValidators.REQUIRED]}
            onChange={onChange}
            validation={validation.maintainerName}
            disabled={readOnly}
          />
          <FormField
            id="maintainerEmail"
            title="Maintainer Email"
            defaultValue={aiModel?.maintainer?.email}
            placeholder="Maintainer Email"
            validators={[FormValidators.REQUIRED, FormValidators.EMAIL]}
            onChange={onChange}
            validation={validation.maintainerEmail}
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
            defaultValue={aiModel?.tags}
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
              {aiModel === undefined ? 'Add' : 'Save'}
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
