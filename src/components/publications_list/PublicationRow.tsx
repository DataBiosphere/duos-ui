import React from 'react'
import PublicationAddEdit from './PublicationAddEdit'
import PublicationSummary from './PublicationSummary'
import { Publication } from 'src/types/model'
import StudyAssetRow from 'src/components/study_asset/StudyAssetRow'

interface PublicationRowProps {
  readonly id: number
  readonly editMode: boolean
  readonly viewMode?: boolean
  readonly publication: Publication
  readonly publications: Publication[]
  readonly columnsToShow?: (keyof Publication)[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly closeAction: () => void
  readonly viewAction?: () => void
  readonly onPublicationChange: (publications: Publication[]) => void
  readonly disabled: boolean
}

export default function PublicationRow(props: PublicationRowProps): React.JSX.Element {
  const {
    id,
    editMode,
    viewMode,
    publication,
    publications,
    columnsToShow,
    editAction,
    deleteAction,
    closeAction,
    viewAction,
    onPublicationChange,
    disabled,
  } = props

  return (
    <StudyAssetRow
      id={id}
      editMode={editMode}
      viewMode={viewMode}
      asset={publication}
      assets={publications}
      columnsToShow={columnsToShow}
      editAction={editAction}
      deleteAction={deleteAction}
      closeAction={closeAction}
      viewAction={viewAction}
      onAssetsChange={onPublicationChange}
      disabled={disabled}
      AddEditComponent={PublicationAddEdit}
      SummaryComponent={PublicationSummary}
      addEditProps={{
        id,
        publication,
        publications,
        closeAction,
        onPublicationChange,
      }}
      summaryProps={{
        publication,
        columnsToShow,
        editAction,
        deleteAction,
        viewAction,
        disabled,
      }}
    />
  )
}
