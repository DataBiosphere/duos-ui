import React from 'react'
import AiModelAddEdit from 'src/components/ai_models_list/AiModelAddEdit'
import { AiModel } from 'src/types/model'
import AiModelSummary from 'src/components/ai_models_list/AiModelSummary'

interface AiModelRowProps {
  readonly id: number
  readonly editMode: boolean
  readonly aiModel: AiModel
  readonly aiModels: AiModel[]
  readonly columnsToShow: string[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly closeAction: () => void
  readonly onAiModelsChange: (models: AiModel[]) => void
  readonly disabled: boolean
}

export default function AiModelRow(props: AiModelRowProps): React.JSX.Element {
  const {
    id,
    editMode,
    aiModel,
    aiModels,
    columnsToShow,
    editAction,
    deleteAction,
    closeAction,
    onAiModelsChange,
    disabled,
  } = props

  return (
    <div>
      {editMode && (
        <AiModelAddEdit
          id={id}
          aiModel={aiModel}
          aiModels={aiModels}
          closeAction={closeAction}
          onAiModelsChange={onAiModelsChange}
        />
      )}
      {!editMode && (
        <AiModelSummary
          aiModel={aiModel}
          columnsToShow={columnsToShow}
          editAction={editAction}
          deleteAction={deleteAction}
          disabled={disabled}
        />
      )}
    </div>
  )
}
