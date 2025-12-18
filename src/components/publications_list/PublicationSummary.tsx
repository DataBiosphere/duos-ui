import React from 'react'
import { Publication } from 'src/types/model'
import StudyAssetSummary from 'src/components/study_asset/StudyAssetSummary'

interface PublicationSummaryProps {
  readonly publication: Publication
  readonly columnsToShow?: (keyof Publication)[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly viewAction?: () => void
  readonly disabled?: boolean
}

export default function PublicationSummary(props: PublicationSummaryProps): React.JSX.Element {
  const { publication, columnsToShow, editAction, deleteAction, viewAction, disabled } = props

  return (
    <StudyAssetSummary
      asset={publication}
      columnsToShow={columnsToShow}
      name={publication.title}
      objectName="publication"
      editAction={editAction}
      deleteAction={deleteAction}
      viewAction={viewAction}
      disabled={disabled}
    />
  )
}
