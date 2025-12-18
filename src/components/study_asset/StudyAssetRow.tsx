import React from 'react'

export interface StudyAssetRowProps<T, AddEditProps, SummaryProps> {
  id: number
  editMode: boolean
  viewMode?: boolean
  asset: T
  assets: T[]
  columnsToShow?: (keyof T | string)[]
  editAction: () => void
  deleteAction: () => void
  closeAction: () => void
  viewAction?: () => void
  onAssetsChange: (assets: T[]) => void
  disabled: boolean
  AddEditComponent: React.ComponentType<AddEditProps>
  SummaryComponent: React.ComponentType<SummaryProps>
  addEditProps: AddEditProps
  summaryProps: SummaryProps
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
