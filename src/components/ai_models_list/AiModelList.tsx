import AiModelAddEdit from './AiModelAddEdit'
import AiModelRow from './AiModelRow'
import { AiModel } from 'src/types/model'
import { DarErrors } from 'src/pages/dar_application/FormValidationState'
import React from 'react'
import StudyAssetList from 'src/components/study_asset/StudyAssetList'

export default function AiModelList(props: {
  readonly aiModels: AiModel[]
  readonly columnsToShow?: (keyof AiModel)[]
  readonly onAiModelsChange: (models: AiModel[]) => void
  readonly disabled?: boolean
  readonly validation?: DarErrors
  readonly studyAssetWrapper?: (content: React.ReactNode, button: React.ReactNode) => React.ReactNode
}) {
  return (
    <StudyAssetList<
      AiModel,
      DarErrors,
      React.ComponentProps<typeof AiModelAddEdit>,
      React.ComponentProps<typeof AiModelRow>
    >
      items={props.aiModels}
      columnsToShow={props.columnsToShow ?? ['name', 'url', 'format', 'license', 'maintainer']}
      onItemsChange={props.onAiModelsChange}
      disabled={props.disabled}
      validation={props.validation}
      AddEditComponent={AiModelAddEdit}
      RowComponent={AiModelRow}
      addButtonId="add-ai-model-btn"
      addButtonLabel="Add Model"
      getValidationState={v => v?.aiModels}
      studyAssetWrapper={props.studyAssetWrapper}
      getAddEditProps={(items, closeAction, onItemsChange) => ({
        id: -1,
        aiModels: items,
        closeAction,
        onAiModelsChange: onItemsChange,
      })}
      getRowProps={baseProps => ({
        id: baseProps.index,
        editMode: baseProps.editMode,
        viewMode: baseProps.viewMode,
        aiModel: baseProps.item,
        aiModels: baseProps.items,
        viewAction: baseProps.viewAction,
        editAction: baseProps.editAction,
        deleteAction: baseProps.deleteAction,
        closeAction: baseProps.closeAction,
        onAiModelsChange: baseProps.onItemsChange,
        columnsToShow: baseProps.columnsToShow,
        disabled: baseProps.disabled,
      })}
      getItemKey={item => item.modelId}
    />
  )
}
