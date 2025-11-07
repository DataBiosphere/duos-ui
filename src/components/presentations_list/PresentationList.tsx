import React, { useState } from 'react'
import PresentationAddEdit from './PresentationAddEdit'
import PresentationRow from './PresentationRow'
import { DarErrors } from 'src/pages/dar_application/FormValidationState'
import { Presentation } from 'src/types/model'
import AddIcon from '@mui/icons-material/Add'

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
    columnsToShow = [],
    onPresentationChange,
    disabled = false,
    validation,
    studyAssetWrapper,
  } = props

  const [showAddEdit, setShowAddEdit] = useState(false)
  const [editState, setEditState] = useState(presentations.map(() => false))

  const toggleEditState = (index: number) => {
    const editStateCopy = [...editState]
    editStateCopy[index] = !editStateCopy[index]
    setEditState(editStateCopy)
  }

  const handleDeletePresentation = (index: number) => {
    const updatedPresentations = presentations.filter((_, i) => i !== index)
    onPresentationChange(updatedPresentations)
  }

  const getValidationState = () => validation?.presentations

  const button = (
    <button
      id="add-presentation-btn"
      type="button"
      className="button button-white"
      style={{
        display: 'flex',
        alignItems: 'center',
        marginTop: 0,
        marginBottom: 5,
        border: getValidationState() ? '1px solid red' : '1px solid #0948B7',
        boxShadow: getValidationState() ? '0 0 5px red' : 'none',
        ...(disabled ? { cursor: 'not-allowed' } : {}),
      }}
      onClick={() => !disabled && setShowAddEdit(true)}
      disabled={disabled}
    >
      <AddIcon fontSize="medium" />
      Add Presentation
    </button>
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
          presentation={presentation}
          presentations={presentations}
          columnsToShow={columnsToShow}
          editAction={() => toggleEditState(index)}
          deleteAction={() => { handleDeletePresentation(index) }}
          closeAction={() => {
            toggleEditState(index)
            setShowAddEdit(false)
          }}
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
