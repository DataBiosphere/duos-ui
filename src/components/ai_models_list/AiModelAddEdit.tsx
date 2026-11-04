import React, { useState } from 'react'
import { CloudProviders } from 'src/components/forms/CloudProviders'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import { ValidationError, makeError } from 'src/pages/dar_application/FormValidationState'
import { AiModel, Maintainer } from 'src/types/model'
import DataUseTermsFields, {
  DataUseTerms,
  DataUseTermsValidation,
  applyTerms,
  dataUseTermsErrors,
  termsFromDataUse,
} from 'src/components/forms/DataUseTermsFields'

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
  cloud: [],
  format: '',
  license: '',
  trainedOnDatasets: [],
  maintainer: defaultMaintainer,
  tags: [],
}

interface FormFieldChange {
  key: string
  value: string | string[]
}

interface AiModelAddEditProps {
  readonly id: number
  readonly aiModel?: AiModel
  readonly aiModels: AiModel[]
  readonly closeAction: () => void
  readonly onAiModelsChange: (models: AiModel[]) => void
  readonly readOnly?: boolean
}

interface Validation extends DataUseTermsValidation {
  name?: ValidationError
  url?: ValidationError
  format?: ValidationError
  license?: ValidationError
  maintainerName?: ValidationError
  maintainerEmail?: ValidationError
}

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

const calcErrors = (model: AiModel, terms: DataUseTerms): Validation => ({
  ...calcAiModelErrors(model),
  ...dataUseTermsErrors(terms, false, model.dataUse),
})

const getHeaderTitle = (readOnly: boolean, aiModel?: AiModel) => {
  if (readOnly) return aiModel?.name
  if (!aiModel) return 'New AI Model'
  return `Edit ${aiModel.name}`
}

export default function AiModelAddEdit(props: AiModelAddEditProps): React.JSX.Element {
  const { id, aiModel, aiModels, closeAction, onAiModelsChange, readOnly = false } = props

  const [newAiModel, setNewAiModel] = useState<AiModel>(aiModel || defaultAiModel)
  const [terms, setTerms] = useState<DataUseTerms>({
    accessManagement: aiModel?.accessManagement ?? undefined,
    ...termsFromDataUse(aiModel?.dataUse),
  })
  const [validation, setValidation] = useState<Validation>({})

  const onChange = ({ key, value }: FormFieldChange) => {
    let updated: AiModel = { ...newAiModel }
    const valueAsString = Array.isArray(value) ? value.join(',') : value

    if (key === 'trainedOnDatasets') {
      updated.trainedOnDatasets = valueAsString.split(',').map((s: string) => s.trim()).filter(Boolean)
    }
    else if (key === 'maintainerName') {
      updated.maintainer = { ...updated.maintainer, name: valueAsString }
    }
    else if (key === 'maintainerEmail') {
      updated.maintainer = { ...updated.maintainer, email: valueAsString }
    }
    else {
      // generic assignment
      updated = { ...updated, [key]: value }
    }

    setNewAiModel(updated)
    setValidation(calcErrors(updated, terms))
  }

  const onTermsChange = (changed: DataUseTerms) => {
    const next = { ...terms, ...changed }
    setTerms(next)
    setValidation(calcErrors(newAiModel, next))
  }

  // Clearing also drops the data use fields the editor does not show.
  const onTermsClear = (cleared: DataUseTerms) => {
    const model = { ...newAiModel, dataUse: undefined }
    setNewAiModel(model)
    setTerms(cleared)
    setValidation(calcErrors(model, cleared))
  }

  const save = () => {
    const validationErrors = calcErrors(newAiModel, terms)
    setValidation(validationErrors)
    if (validationFailed(validationErrors)) return
    const toSave: AiModel = {
      ...newAiModel,
      accessManagement: terms.accessManagement,
      dataUse: applyTerms(newAiModel.dataUse, terms),
    }
    if (id < 0) {
      onAiModelsChange([...aiModels, toSave])
    }
    else {
      const copy = [...aiModels]
      copy[id] = toSave
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
            id="cloud"
            title="Cloud"
            placeholder="Select or enter cloud environment"
            type={FormFieldTypes.SELECT}
            isCreatable={true}
            isMulti={true}
            optionsAreString={true}
            selectOptions={CloudProviders.VALUES.map(provider => provider.name)}
            defaultValue={aiModel?.cloud}
            onChange={onChange}
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
          <DataUseTermsFields
            terms={terms}
            onChange={onTermsChange}
            validation={validation}
            readOnly={readOnly}
            required={false}
            subject="model"
            onClear={onTermsClear}
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
