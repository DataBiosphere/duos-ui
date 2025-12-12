import React, { useState } from 'react'
import PresentationAddEdit from './PresentationAddEdit'
import PresentationRow from './PresentationRow'
import { DarErrors } from 'src/pages/dar_application/FormValidationState'
import { Presentation } from 'src/types/model'
import AddObjectButton from 'src/components/AddObjectButton'

interface PresentationListProps {
  readonly presentations: Presentation[]
  readonly columnsToShow?: string[]
  readonly onPresentationChange: (presentations: Presentation[]) => void
  readonly disabled?: boolean
  readonly validation?: DarErrors
  readonly studyAssetWrapper?: (content: React.ReactNode, button: React.ReactNode) => React.ReactNode
}

export default function PresentationList(props: PresentationListProps): React.JSX.Element {
  const {
    presentations,
    columnsToShow = ['title', 'date', 'event', 'location', 'url', 'format', 'access'],
    onPresentationChange,
    disabled = false,
    validation,
    studyAssetWrapper,
  } = props

  const [showAddEdit, setShowAddEdit] = useState(false)
  const [editState, setEditState] = useState(presentations.map(() => false))
  const [viewState, setViewState] = useState(presentations.map(() => false))

  const toggleEditState = (index: number) => {
    const editStateCopy = [...editState]
    editStateCopy[index] = !editStateCopy[index]
    setEditState(editStateCopy)
  }

  const toggleViewState = (index: number) => {
    const viewStateCopy = [...viewState]
    viewStateCopy[index] = !viewStateCopy[index]
    setViewState(viewStateCopy)
  }

  const handleDeletePresentation = (index: number) => {
    const updatedPresentations = presentations.filter((_, i) => i !== index)
    onPresentationChange(updatedPresentations)
  }

  const getValidationState = () => validation?.presentations

  const button = (
    <AddObjectButton
      id="add-presentation-btn"
      label="Add Presentation"
      onClick={() => setShowAddEdit(true)}
      disabled={disabled}
      hasValidationError={!!getValidationState()}
    />
  )

  const content = (
    <div className="form-group row no-margin">
      {showAddEdit && (
        <PresentationAddEdit
          id={-1}
          presentations={presentations}
          closeAction={() => setShowAddEdit(false)}
          onPresentationChange={onPresentationChange}
        />
      )}
      {presentations.map((presentation: Presentation, index: number) => (
        <PresentationRow
          key={index}
          id={index}
          editMode={editState[index]}
          viewMode={viewState[index]}
          presentation={presentation}
          presentations={presentations}
          columnsToShow={columnsToShow}
          editAction={() => toggleEditState(index)}
          deleteAction={() => { handleDeletePresentation(index) }}
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
          onPresentationChange={onPresentationChange}
          disabled={disabled}
        />
      ))}
    </div>
  )

  if (studyAssetWrapper) {
    return <>{studyAssetWrapper(content, button)}</>
  }

  return (
    <div className="presentation-list-component">
      <div className="row no-margin">
        {button}
      </div>
      {content}
    </div>
  )
}
