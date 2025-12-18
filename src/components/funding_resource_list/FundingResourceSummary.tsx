import React from 'react'
import { FundingResource } from 'src/types/model'
import StudyAssetSummary from 'src/components/study_asset/StudyAssetSummary'

interface FundingResourceSummaryProps {
  readonly fundingResource: FundingResource
  readonly columnsToShow?: (keyof FundingResource)[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly viewAction?: () => void
  readonly disabled?: boolean
}

export default function FundingResourceSummary(props: FundingResourceSummaryProps): React.JSX.Element {
  const { fundingResource } = props

  const customRenderers = {
    url: (value: unknown) => {
      const url = typeof value === 'string' ? value : ''
      return url
        ? <a href={url} target="_blank" rel="noreferrer">{url}</a>
        : '—'
    },
    tags: (value: unknown) => Array.isArray(value) && value.length > 0 ? value.join(', ') : '—',
  }

  return (
    <StudyAssetSummary
      asset={fundingResource}
      columnsToShow={props.columnsToShow}
      customRenderers={customRenderers}
      name={fundingResource.funderName || fundingResource.projectTitle}
      objectName="funding resource"
      editAction={props.editAction}
      deleteAction={props.deleteAction}
      viewAction={props.viewAction}
      disabled={props.disabled}
    />
  )
}
