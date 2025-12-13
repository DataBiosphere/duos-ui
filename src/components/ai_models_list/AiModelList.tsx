import React, { useState, useEffect } from 'react'
import AiModelAddEdit from 'src/components/ai_models_list/AiModelAddEdit'
import AiModelRow from 'src/components/ai_models_list/AiModelRow'
import { AiModel } from 'src/types/model'
import { DarErrors } from 'src/pages/dar_application/FormValidationState'
import AddObjectButton from 'src/components/AddObjectButton'

interface AiModelListProps {
  readonly aiModels: AiModel[]
  readonly columnsToShow?: (keyof AiModel)[]
  readonly onAiModelsChange: (models: AiModel[]) => void
  readonly disabled?: boolean
  readonly validation?: DarErrors
  readonly studyAssetWrapper?: (content: React.ReactNode, button: React.ReactNode) => React.ReactNode
}

export default function AiModelList(props: AiModelListProps): React.JSX.Element {
  const {
    aiModels,
    columnsToShow = ['name', 'url', 'format', 'license', 'maintainer'],
    onAiModelsChange,
    disabled = false,
    validation,
    studyAssetWrapper,
  } = props

  const [showAddEdit, setShowAddEdit] = useState(false)
  const [editState, setEditState] = useState<boolean[]>(aiModels.map(() => false))
  const [viewState, setViewState] = useState<boolean[]>(aiModels.map(() => false))

  useEffect(() => {
    if (editState.length !== aiModels.length) {
      setEditState(aiModels.map(() => false))
    }
  }, [aiModels, editState.length])

  const toggleEditState = (index: number) => {
    setEditState((es) => {
      const copy = [...es]
      copy[index] = !copy[index]
      return copy
    })
  }

  const toggleViewState = (index: number) => {
    const viewStateCopy = [...viewState]
    viewStateCopy[index] = !viewStateCopy[index]
    setViewState(viewStateCopy)
  }

  const handleDeleteAiModel = (index: number) => {
    const updated = aiModels.filter((_, i) => i !== index)
    onAiModelsChange(updated)
  }

  const getValidationState = () => validation?.aiModels

  const button = (
    <AddObjectButton
      id="add-ai-model-btn"
      label="Add Model"
      onClick={() => setShowAddEdit(true)}
      disabled={disabled}
      hasValidationError={!!getValidationState()}
    />
  )

  const content = (
    <div className="form-group row no-margin">
      {showAddEdit && (
        <AiModelAddEdit
          id={-1}
          aiModel={undefined}
          aiModels={aiModels}
          closeAction={() => setShowAddEdit(false)}
          onAiModelsChange={onAiModelsChange}
        />
      )}
      {aiModels.map((model: AiModel, index: number) => (
        <AiModelRow
          key={model.modelId || index}
          id={index}
          editMode={editState[index]}
          viewMode={viewState[index]}
          aiModel={model}
          aiModels={aiModels}
          columnsToShow={columnsToShow}
          editAction={() => toggleEditState(index)}
          deleteAction={() => { handleDeleteAiModel(index) }}
          closeAction={() => {
            if (editState[index]) {
              toggleEditState(index)
            }
            else if (viewState[index]) {
              toggleViewState(index)
            }
            setShowAddEdit(false)
          }}
          viewAction={() => toggleViewState(index)}
          onAiModelsChange={onAiModelsChange}
          disabled={disabled}
        />
      ))}
    </div>
  )

  if (studyAssetWrapper) {
    return <>{studyAssetWrapper(content, button)}</>
  }

  return (
    <div className="ai-model-list-component">
      <div className="row no-margin">
        {button}
      </div>
      {content}
    </div>
  )
}
