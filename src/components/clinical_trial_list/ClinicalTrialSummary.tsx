import React, { useState } from 'react'
import { DeletePresentationOrPublication } from 'src/components/presentation_publication_shared/DeletePresentationOrPublication'
import { ClinicalTrial } from 'src/types/model'
import { renderColumnContent } from 'src/utils/RenderUtils'
import {
  statusToDisplay,
  phaseToDisplay,
  interventionTypeToDisplay,
} from 'src/utils/ClinicalTrialEnumUtils'

interface ClinicalTrialSummaryProps {
  readonly clinicalTrial: ClinicalTrial
  readonly columnsToShow?: (keyof ClinicalTrial | 'dateRange')[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly viewAction?: () => void
  readonly disabled?: boolean
}

export default function ClinicalTrialSummary(props: ClinicalTrialSummaryProps): React.JSX.Element {
  const { clinicalTrial, columnsToShow, editAction, deleteAction, viewAction, disabled = false } = props

  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const disabledStyle = { cursor: 'not-allowed', opacity: 0.5 }
  const buttonStyle = disabled ? disabledStyle : {}

  const customRenderers = {
    tags: (value: unknown) => Array.isArray(value) && value.length > 0 ? value.join(', ') : null,
    dateRange: () => (clinicalTrial.startDate || clinicalTrial.endDate)
      ? `${clinicalTrial.startDate || 'N/A'} → ${clinicalTrial.endDate || 'N/A'}`
      : null,
    status: () => statusToDisplay(clinicalTrial.status),
    phase: () => phaseToDisplay(clinicalTrial.phase),
    interventionType: () => interventionTypeToDisplay(clinicalTrial.interventionType),
    url: (value: unknown) => {
      if (typeof value === 'string' && value) {
        return (
          <a href={value} target="_blank" rel="noreferrer">
            {value}
          </a>
        )
      }
      return '—'
    },
  }

  return (
    <div className="collaborator-summary-card">
      {columnsToShow?.map((column, index) => {
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
        {/* view button */}
        <button
          type="button"
          style={{ marginLeft: 10 }}
          onClick={() => viewAction?.()}
          aria-label="View clinical trial"
        >
          <span
            className="glyphicon glyphicon-eye-open caret-margin collaborator-view-icon"
            aria-hidden="true"
            data-tip="View clinical trial"
            data-for="tip_view"
          >
          </span>
          <span style={{ marginLeft: '1rem' }}></span>
        </button>
        {/* edit button */}
        <button
          type="button"
          style={{ marginLeft: 10, ...buttonStyle }}
          onClick={() => !disabled && editAction()}
          disabled={disabled}
          aria-label="Edit clinical trial"
        >
          <span className="glyphicon glyphicon-pencil caret-margin collaborator-edit-icon" aria-hidden="true" />
          <span style={{ marginLeft: '1rem' }}></span>
        </button>
        {/* delete button */}
        <button
          type="button"
          style={{ marginLeft: 10, ...buttonStyle }}
          onClick={() => !disabled && setShowDeleteModal(true)}
          disabled={disabled}
          aria-label="Delete clinical trial"
        >
          <span
            className="glyphicon glyphicon-trash caret-margin collaborator-delete-icon"
            aria-hidden="true"
            data-tip="Delete clinical trial"
            data-for="tip_delete_clinical_trial"
          />
          <span style={{ marginLeft: '1rem' }}></span>
        </button>
      </div>
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
