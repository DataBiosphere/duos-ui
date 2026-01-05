import React from 'react'
import PresentationAddEdit from './PresentationAddEdit'
import PresentationSummary from './PresentationSummary'
import { Presentation } from 'src/types/model'
import StudyAssetRow from 'src/components/study_asset/StudyAssetRow'

interface PresentationRowProps {
  readonly id: number
  readonly editMode: boolean
  readonly viewMode?: boolean
  readonly presentation: Presentation
  readonly presentations: Presentation[]
  readonly columnsToShow?: (keyof Presentation)[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly closeAction: () => void
  readonly viewAction?: () => void
  readonly onPresentationChange: (presentations: Presentation[]) => void
  readonly disabled: boolean
}

export default function PresentationRow(props: PresentationRowProps): React.JSX.Element {
  const {
    id,
    editMode,
    viewMode,
    presentation,
    presentations,
    columnsToShow,
    editAction,
    deleteAction,
    closeAction,
    viewAction,
    onPresentationChange,
    disabled,
  } = props

  return (
    <StudyAssetRow
      id={id}
      editMode={editMode}
      viewMode={viewMode}
      asset={presentation}
      assets={presentations}
      columnsToShow={columnsToShow}
      editAction={editAction}
      deleteAction={deleteAction}
      closeAction={closeAction}
      viewAction={viewAction}
      onAssetsChange={onPresentationChange}
      disabled={disabled}
      AddEditComponent={PresentationAddEdit}
      SummaryComponent={PresentationSummary}
      addEditProps={{
        id,
        presentation,
        presentations,
        closeAction,
        onPresentationChange,
      }}
      summaryProps={{
        presentation,
        columnsToShow,
        editAction,
        deleteAction,
        viewAction,
        disabled,
      }}
    />
  )
}
