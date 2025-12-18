import { ValidationError } from 'src/pages/dar_application/FormValidationState'
import React, { useEffect, useState } from 'react'
import AddObjectButton from 'src/components/AddObjectButton'

interface StudyAssetListProps<
  T,
  V = never,
  AddEditProps extends object = object,
  RowProps extends object = object,
> {
  items: T[]
  columnsToShow?: (keyof T | string)[]
  onItemsChange: (items: T[]) => void
  disabled?: boolean
  validation?: V
  AddEditComponent: React.ComponentType<AddEditProps>
  RowComponent: React.ComponentType<RowProps>
  addButtonId: string
  addButtonLabel: string
  getValidationState: (validation?: V) => ValidationError | undefined
  studyAssetWrapper?: (content: React.ReactNode, button: React.ReactNode) => React.ReactNode
  getAddEditProps: (items: T[], closeAction: () => void, onItemsChange: (items: T[]) => void) => AddEditProps
  getRowProps: (baseProps: {
    item: T
    items: T[]
    index: number
    editMode: boolean
    viewMode: boolean
    viewAction: () => void
    editAction: () => void
    deleteAction: () => void
    closeAction: () => void
    onItemsChange: (items: T[]) => void
    columnsToShow: (keyof T)[]
    disabled: boolean
  }) => RowProps
}

export default function StudyAssetList<
  T,
  V = never,
  AddEditProps extends object = object,
  RowProps extends object = object,
>({
  items,
  columnsToShow = [],
  onItemsChange,
  disabled = false,
  validation,
  AddEditComponent,
  RowComponent,
  addButtonId,
  addButtonLabel,
  getValidationState,
  studyAssetWrapper,
  getAddEditProps,
  getRowProps,
}: StudyAssetListProps<T, V, AddEditProps, RowProps>): React.JSX.Element {
  const [showAddEdit, setShowAddEdit] = useState(false)
  const [editState, setEditState] = useState<boolean[]>(items.map(() => false))
  const [viewState, setViewState] = useState<boolean[]>(items.map(() => false))

  const filteredColumnsToShow = columnsToShow.filter((c): c is keyof T => typeof c === 'string') as (keyof T)[]

  useEffect(() => {
    if (editState.length !== items.length) {
      setEditState(items.map(() => false))
    }
  }, [items, editState.length])

  useEffect(() => {
    if (viewState.length !== items.length) {
      setViewState(items.map(() => false))
    }
  }, [items, viewState.length])

  const toggleEditState = (index: number) => {
    setEditState((es) => {
      const copy = [...es]
      copy[index] = !copy[index]
      return copy
    })
  }

  const toggleViewState = (index: number) => {
    setViewState((vs) => {
      const copy = [...vs]
      copy[index] = !copy[index]
      return copy
    })
  }

  const handleDelete = (index: number) => {
    const updated = items.filter((_, i) => i !== index)
    onItemsChange(updated)
  }

  const button = (
    <AddObjectButton
      id={addButtonId}
      label={addButtonLabel}
      onClick={() => setShowAddEdit(true)}
      disabled={disabled}
      hasValidationError={!!getValidationState(validation)}
    />
  )

  const content = (
    <div className="form-group row no-margin">
      {showAddEdit && (
        <AddEditComponent
          {...(getAddEditProps(items, () => setShowAddEdit(false), onItemsChange) as AddEditProps)}
        />
      )}
      {items.map((item, index) => {
        const baseProps = {
          item,
          items,
          index,
          editMode: editState[index],
          viewMode: viewState[index],
          viewAction: () => toggleViewState(index),
          editAction: () => toggleEditState(index),
          deleteAction: () => handleDelete(index),
          closeAction: () => {
            if (editState[index]) {
              toggleEditState(index)
            }
            else if (viewState[index]) {
              toggleViewState(index)
            }
          },
          onItemsChange,
          columnsToShow: filteredColumnsToShow,
          disabled,
        }

        return (
          <RowComponent
            key={index}
            {...(getRowProps(baseProps) as RowProps)}
          />
        )
      })}
    </div>
  )

  if (studyAssetWrapper) {
    return <>{studyAssetWrapper(content, button)}</>
  }

  return (
    <div className="editable-list-component">
      <div className="row no-margin">
        {button}
      </div>
      {content}
    </div>
  )
}
