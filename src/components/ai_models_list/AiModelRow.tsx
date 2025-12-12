import React from 'react'
import AiModelAddEdit from 'src/components/ai_models_list/AiModelAddEdit'
import AiModelSummary from 'src/components/ai_models_list/AiModelSummary'
import { AiModel } from 'src/types/model'

interface AiModelRowProps {
  readonly id: number
  readonly editMode: boolean
  readonly viewMode?: boolean
  readonly aiModel: AiModel
  readonly aiModels: AiModel[]
  readonly columnsToShow: string[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly closeAction: () => void
  readonly viewAction?: () => void
  readonly onAiModelsChange: (models: AiModel[]) => void
  readonly disabled: boolean
}

export default function AiModelRow(props: AiModelRowProps): React.JSX.Element {
  const {
    id,
    editMode,
    viewMode,
    aiModel,
    aiModels,
    columnsToShow,
    editAction,
    deleteAction,
    closeAction,
    viewAction,
    onAiModelsChange,
    disabled,
  } = props

  return (
    <div>
      {(editMode || viewMode) && (
        <AiModelAddEdit
          id={id}
          aiModel={aiModel}
          aiModels={aiModels}
          closeAction={closeAction}
          onAiModelsChange={onAiModelsChange}
          readOnly={viewMode}
        />
      )}
      {!editMode && !viewMode && (
        <AiModelSummary
          aiModel={aiModel}
          columnsToShow={columnsToShow}
          editAction={editAction}
          deleteAction={deleteAction}
          viewAction={viewAction}
          disabled={disabled}
        />
      )}
    </div>
  )
}
