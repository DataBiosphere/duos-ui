import React, { useState } from 'react'
import PublicationAddEdit from './PublicationAddEdit'
import PublicationRow from './PublicationRow'
import { DarErrors } from 'src/pages/dar_application/FormValidationState'
import { Publication } from 'src/types/model'
import StudyAssetAddButton from 'src/pages/data_submission/v2/StudyAssetAddButton'

interface PublicationListProps {
  readonly publications: Publication[]
  readonly columnsToShow?: string[]
  readonly onPublicationChange: (publications: Publication[]) => void
  readonly disabled?: boolean
  readonly validation?: DarErrors
  readonly studyAssetWrapper?: (content: React.ReactNode, button: React.ReactNode) => React.ReactNode
}

export default function PublicationList(props: PublicationListProps): React.JSX.Element {
  const {
    publications,
    columnsToShow = [],
    onPublicationChange,
    disabled = false,
    validation,
    studyAssetWrapper,
  } = props

  const [showAddEdit, setShowAddEdit] = useState(false)
  const [editState, setEditState] = useState(publications.map(() => false))

  const toggleEditState = (index: number) => {
    const editStateCopy = [...editState]
    editStateCopy[index] = !editStateCopy[index]
    setEditState(editStateCopy)
  }

  const handleDeletePublication = (index: number) => {
    const updatedPublications = publications.filter((_, i) => i !== index)
    onPublicationChange(updatedPublications)
  }

  const getValidationState = () => validation?.publications

  const button = (
    <StudyAssetAddButton
      id="add-publication-btn"
      label="Add Publication"
      onClick={() => setShowAddEdit(true)}
      disabled={disabled}
      hasValidationError={!!getValidationState()}
    />
  )

  const content = (
    <div className="form-group row no-margin">
      {showAddEdit && (
        <PublicationAddEdit
          id={-1}
          publications={publications}
          closeAction={() => setShowAddEdit(false)}
          onPublicationChange={onPublicationChange}
        />
      )}
      {publications.map((publication: Publication, index: number) => (
        <PublicationRow
          key={index}
          id={index}
          editMode={editState[index]}
          publication={publication}
          publications={publications}
          columnsToShow={columnsToShow}
          editAction={() => toggleEditState(index)}
          deleteAction={() => { handleDeletePublication(index) }}
          closeAction={() => {
            toggleEditState(index)
            setShowAddEdit(false)
          }}
          onPublicationChange={onPublicationChange}
          disabled={disabled}
        />
      ))}
    </div>
  )

  if (studyAssetWrapper) {
    return <>{studyAssetWrapper(content, button)}</>
  }

  return (
    <div className="publication-list-component">
      <div className="row no-margin">
        {button}
      </div>
      {content}
    </div>
  )
}
