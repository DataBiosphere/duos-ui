import React, { useState, useEffect } from 'react'
import AiModelAddEdit from 'src/components/ai_models_list/AiModelAddEdit'
import AiModelRow from 'src/components/ai_models_list/AiModelRow'
import { AiModel } from 'src/types/model'
import { DarErrors } from 'src/pages/dar_application/FormValidationState'

interface AiModelListProps {
  readonly aiModels: AiModel[]
  readonly columnsToShow?: string[]
  readonly onAiModelsChange: (models: AiModel[]) => void
  readonly disabled?: boolean
  readonly validation?: DarErrors
}

export default function AiModelList(props: AiModelListProps): React.JSX.Element {
  const {
    aiModels,
    columnsToShow = [],
    onAiModelsChange,
    disabled = false,
    validation,
  } = props

  const [showAddEdit, setShowAddEdit] = useState(false)
  const [editState, setEditState] = useState<boolean[]>(aiModels.map(() => false))

  useEffect(() => {
    // Sync edit state length with aiModels length
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

  const handleDeleteAiModel = (index: number) => {
    const updated = aiModels.filter((_, i) => i !== index)
    onAiModelsChange(updated)
  }

  const getValidationState = () => validation?.aiModels

  return (
    <div className="ai-model-list-component">
      <div className="row no-margin">
        <button
          id="add-ai-model-btn"
          type="button"
          className="button button-white"
          style={{
            marginTop: 25,
            marginBottom: 5,
            border: getValidationState() ? '1px solid red' : '1px solid #0948B7',
            boxShadow: getValidationState() ? '0 0 5px red' : 'none',
            ...(disabled ? { cursor: 'not-allowed' } : {}),
          }}
          onClick={() => !disabled && setShowAddEdit(true)}
          disabled={disabled}
        >
          Add AI Model
        </button>
        {showAddEdit && (
          <AiModelAddEdit
            id={-1}
            aiModel={undefined}
            aiModels={aiModels}
            closeAction={() => setShowAddEdit(false)}
            onAiModelsChange={onAiModelsChange}
          />
        )}
      </div>
      <div className="form-group row no-margin">
        {aiModels.map((model: AiModel, index: number) => (
          <AiModelRow
            key={index}
            id={index}
            editMode={editState[index]}
            aiModel={model}
            aiModels={aiModels}
            columnsToShow={columnsToShow}
            editAction={() => toggleEditState(index)}
            deleteAction={() => { handleDeleteAiModel(index) }}
            closeAction={() => {
              toggleEditState(index)
              setShowAddEdit(false)
            }}
            onAiModelsChange={onAiModelsChange}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  )
}
