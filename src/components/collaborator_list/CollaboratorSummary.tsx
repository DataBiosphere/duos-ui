import React, { useState } from 'react'
import CollaboratorDelete from './CollaboratorDelete'
import { Collaborator } from 'src/types/model'

interface CollaboratorSummaryProps {
  collaborator: Collaborator
  readonly columnsToShow: string[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly readOnly: boolean
  // Additional props for DAR application compatibility
  readonly index?: number
  readonly collaboratorKey?: string
}

export default function CollaboratorSummary(props: CollaboratorSummaryProps): React.JSX.Element {
  const { collaborator, columnsToShow, editAction, deleteAction, readOnly, index, collaboratorKey } = props

  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Generate summary ID for DAR application compatibility
  const summaryId = (typeof index === 'number' && collaboratorKey) ? `${index}_summary` : undefined
  const editButtonId = (typeof index === 'number' && collaboratorKey) ? `${index}_editCollaborator` : undefined
  const deleteButtonId = (typeof index === 'number' && collaboratorKey) ? `${index}_deleteMember` : undefined

  return (
    <div className="collaborator-summary-card" id={summaryId}>
      {/* data elements to show in the row summary */}
      {columnsToShow.map((column, colIndex) => {
        const columnContent = collaborator ? collaborator[column as keyof Collaborator] : []

        // Generate legacy field IDs for DAR compatibility mode
        let fieldId: string | undefined
        if (typeof index === 'number' && collaboratorKey) {
          const columnToIdMap: Record<string, string> = {
            name: `${index}_name`,
            title: `${index}_title`,
            email: `${index}_email`,
            eraCommonsId: `${index}_eraCommonsId`,
          }
          fieldId = columnToIdMap[column]
        }

        return columnContent && (
          <div key={'collaborator_summary_column_' + colIndex} style={{ flex: '1 1 100%', marginRight: '1.5rem' }}>
            <span id={fieldId}>
              {columnContent}
            </span>
          </div>
        )
      })}
      {/* action buttons */}
      <div className="collaborator-summary-edit-delete-buttons">
        {readOnly
          ? (
              <a
                style={{ marginLeft: 10, marginRight: 10 }}
                onClick={() => editAction()}
              >
                <span
                  className="glyphicon glyphicon-eye-open collaborator-view-icon"
                  aria-hidden="true"
                  data-tip="View collaborator"
                  data-for="tip_view"
                >
                </span>
                <span style={{ marginLeft: '1rem' }}></span>
              </a>
            )
          : (
              <>
                <a
                  id={editButtonId}
                  style={{ marginLeft: 10, marginRight: 10 }}
                  onClick={() => editAction()}
                >
                  <span
                    className="glyphicon glyphicon-pencil caret-margin collaborator-edit-icon"
                    aria-hidden="true"
                    data-tip="Edit dataset"
                    data-for="tip_edit"
                  >
                  </span>
                  <span style={{ marginLeft: '1rem' }}></span>
                </a>
                {/* delete button */}
                <a
                  id={deleteButtonId}
                  style={{ marginLeft: 10 }}
                  onClick={() => setShowDeleteModal(true)}
                >
                  <span
                    className="glyphicon glyphicon-trash collaborator-delete-icon"
                    aria-hidden="true"
                    data-tip="Delete dataset"
                    data-for="tip_delete"
                  >
                  </span>
                  <span style={{ marginLeft: '1rem' }}></span>
                </a>
              </>
            )}
      </div>
      {/* delete modal */}
      {!readOnly && (
        <CollaboratorDelete
          collaboratorName={collaborator?.name}
          showDelete={showDeleteModal}
          confirmAction={() => {
            deleteAction()
            setShowDeleteModal(false)
          }}
          closeAction={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  )
}
