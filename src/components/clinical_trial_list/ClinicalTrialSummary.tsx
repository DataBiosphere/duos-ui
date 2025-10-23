import React, { useState } from 'react'
import { DeletePresentationOrPublication } from 'src/components/presentation_publication_shared/DeletePresentationOrPublication'
import { ClinicalTrial } from 'src/types/model'
import { renderColumnContent } from 'src/utils/RenderUtils'

interface ClinicalTrialSummaryProps {
  clinicalTrial: ClinicalTrial
  readonly columnsToShow: string[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly disabled: boolean
}

export default function ClinicalTrialSummary(props: ClinicalTrialSummaryProps): React.JSX.Element {
  const { clinicalTrial, columnsToShow, editAction, deleteAction, disabled } = props
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const disabledStyle = { cursor: 'not-allowed', opacity: 0.5 }
  const buttonStyle = disabled ? disabledStyle : {}

  const customRenderers = {
    tags: (value: unknown) => Array.isArray(value) && value.length > 0 ? value.join(', ') : null,
    dateRange: () => (clinicalTrial.startDate || clinicalTrial.endDate)
      ? `${clinicalTrial.startDate || 'N/A'} → ${clinicalTrial.endDate || 'N/A'}`
      : null,
  }

  return (
    <div className="collaborator-summary-card">
      {columnsToShow.map((column, index) => {
        const contentSource = column === 'dateRange' ? 'dateRange' : column
        const rawValue = clinicalTrial[column as keyof ClinicalTrial]
        const columnContent = renderColumnContent(contentSource, rawValue, customRenderers)
        return columnContent && (
          <div key={'clinical_trial_summary_column_' + index} style={{ flex: '1 1 100%', marginRight: '1.5rem' }}>
            <span>{columnContent}</span>
          </div>
        )
      })}
      <div className="collaborator-summary-edit-delete-buttons">
        <a style={{ marginLeft: 10, marginRight: 10, ...buttonStyle }} onClick={() => !disabled && editAction()}>
          <span className="glyphicon glyphicon-pencil caret-margin collaborator-edit-icon" aria-hidden="true" />
          <span style={{ marginLeft: '1rem' }}></span>
        </a>
      </div>
      <a style={{ marginLeft: 10, ...buttonStyle }} onClick={() => !disabled && setShowDeleteModal(true)}>
        <span className="glyphicon glyphicon-trash presentation-delete-icon" aria-hidden="true" />
        <span style={{ marginLeft: '1rem' }}></span>
      </a>
      <DeletePresentationOrPublication
        name={clinicalTrial.title}
        objectName="clinical trial"
        showDelete={showDeleteModal}
        confirmAction={() => {
          deleteAction()
          setShowDeleteModal(false)
        }}
        closeAction={() => setShowDeleteModal(false)}
      />
    </div>
  )
}
