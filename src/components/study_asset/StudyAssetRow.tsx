import React from 'react'

export interface StudyAssetRowProps<T, AddEditProps, SummaryProps> {
  readonly id: number
  readonly editMode: boolean
  readonly viewMode?: boolean
  readonly asset: T
  readonly assets: T[]
  readonly columnsToShow?: (keyof T | string)[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly closeAction: () => void
  readonly viewAction?: () => void
  readonly onAssetsChange: (assets: T[]) => void
  readonly disabled: boolean
  readonly AddEditComponent: React.ComponentType<AddEditProps>
  readonly SummaryComponent: React.ComponentType<SummaryProps>
  readonly addEditProps: AddEditProps
  readonly summaryProps: SummaryProps
}

export default function StudyAssetRow<
  T,
  AddEditProps extends object = object,
  SummaryProps extends object = object,
>({
  id: _id,
  editMode,
  viewMode,
  asset: _asset,
  assets: _assets,
  columnsToShow: _columnsToShow,
  editAction: _editAction,
  deleteAction: _deleteAction,
  closeAction: _closeAction,
  viewAction: _viewAction,
  onAssetsChange: _onAssetsChange,
  disabled: _disabled,
  AddEditComponent,
  SummaryComponent,
  addEditProps,
  summaryProps,
}: StudyAssetRowProps<T, AddEditProps, SummaryProps>) {
  return (
    <div>
      {(editMode || viewMode) && (
        <AddEditComponent {...addEditProps} readOnly={viewMode} />
      )}
      {!editMode && !viewMode && (
        <SummaryComponent {...summaryProps} />
      )}
    </div>
  )
}
