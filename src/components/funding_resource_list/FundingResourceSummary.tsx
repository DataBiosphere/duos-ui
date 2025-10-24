import React, { useState } from 'react'
import { FundingResource } from 'src/types/model'
import { DeletePresentationOrPublication } from 'src/components/presentation_publication_shared/DeletePresentationOrPublication'
import { renderColumnContent } from 'src/utils/RenderUtils'

interface FundingResourceUrlProps {
  readonly url: string | undefined
}

const FundingResourceUrl: React.FC<FundingResourceUrlProps> = ({ url }) => {
  if (typeof url === 'string' && url) {
    return (
      <a href={url} target="_blank" rel="noreferrer">
        {url}
      </a>
    )
  }
  return <>—</>
}

interface FundingResourceSummaryProps {
  readonly funding: FundingResource
  readonly columnsToShow: string[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly disabled: boolean
}

export const FundingResourceSummary: React.FC<FundingResourceSummaryProps> = ({
  funding,
  columnsToShow,
  editAction,
  deleteAction,
  disabled,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const disabledStyle = {
    cursor: 'not-allowed',
    opacity: 0.5,
  }

  const buttonStyle = disabled ? disabledStyle : {}

  const customRenderers = {
    url: (value: unknown) => <FundingResourceUrl url={value as string | undefined} />,
    tags: (value: unknown) => {
      if (Array.isArray(value) && value.length > 0) {
        return value.join(', ')
      }
      return '—'
    },
  }

  return (
    <div className="collaborator-summary-card">
      {columnsToShow.map((column, index) => {
        const rawValue = funding[column as keyof FundingResource]
        const columnContent = renderColumnContent(column, rawValue as unknown, customRenderers)
        return columnContent && (
          <div key={'funding_summary_column_' + index} style={{ flex: '1 1 100%', marginRight: '1.5rem' }}>
            <span>{columnContent}</span>
          </div>
        )
      })}
      <div className="collaborator-summary-edit-delete-buttons">
        <button
          type="button"
          style={{ marginLeft: 10, marginRight: 10, ...buttonStyle }}
          onClick={() => !disabled && editAction()}
          disabled={disabled}
          aria-label="Edit funding resource"
        >
          <span
            className="glyphicon glyphicon-pencil caret-margin collaborator-edit-icon"
            aria-hidden="true"
            data-tip="Edit funding resource"
            data-for="tip_edit_funding"
          />
          <span style={{ marginLeft: '1rem' }} />
        </button>
      </div>
      <button
        type="button"
        style={{ marginLeft: 10, ...buttonStyle }}
        onClick={() => !disabled && setShowDeleteModal(true)}
        disabled={disabled}
        aria-label="Delete funding resource"
      >
        <span
          className="glyphicon glyphicon-trash presentation-delete-icon"
          aria-hidden="true"
          data-tip="Delete funding resource"
          data-for="tip_delete_funding"
        />
        <span style={{ marginLeft: '1rem' }} />
      </button>
      <DeletePresentationOrPublication
        name={funding.funderName || funding.projectTitle}
        objectName="funding resource"
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

export default FundingResourceSummary
