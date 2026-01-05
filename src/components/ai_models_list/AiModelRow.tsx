import React from 'react'
import AiModelAddEdit from './AiModelAddEdit'
import AiModelSummary from './AiModelSummary'
import { AiModel } from 'src/types/model'
import StudyAssetRow from 'src/components/study_asset/StudyAssetRow'

interface AiModelRowProps {
  readonly id: number
  readonly editMode: boolean
  readonly viewMode?: boolean
  readonly aiModel: AiModel
  readonly aiModels: AiModel[]
  readonly columnsToShow?: (keyof AiModel)[]
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
    <StudyAssetRow
      id={id}
      editMode={editMode}
      viewMode={viewMode}
      asset={aiModel}
      assets={aiModels}
      columnsToShow={columnsToShow}
      editAction={editAction}
      deleteAction={deleteAction}
      closeAction={closeAction}
      viewAction={viewAction}
      onAssetsChange={onAiModelsChange}
      disabled={disabled}
      AddEditComponent={AiModelAddEdit}
      SummaryComponent={AiModelSummary}
      addEditProps={{
        id,
        aiModel,
        aiModels,
        closeAction,
        onAiModelsChange,
      }}
      summaryProps={{
        aiModel,
        columnsToShow,
        editAction,
        deleteAction,
        viewAction,
        disabled,
      }}
    />
  )
}
