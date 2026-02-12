import React from 'react'
import BiospecimenAddEdit from './BiospecimenAddEdit'
import BiospecimenSummary from './BiospecimenSummary'
import { Biospecimen } from 'src/types/model'
import StudyAssetRow from 'src/components/study_asset/StudyAssetRow'

interface BiospecimenRowProps {
  readonly id: number
  readonly editMode: boolean
  readonly viewMode?: boolean
  readonly biospecimen: Biospecimen
  readonly biospecimens: Biospecimen[]
  readonly columnsToShow?: (keyof Biospecimen)[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly closeAction: () => void
  readonly viewAction?: () => void
  readonly onBiospecimensChange: (models: Biospecimen[]) => void
  readonly disabled: boolean
}

export default function BiospecimenRow(props: BiospecimenRowProps): React.JSX.Element {
  const {
    id,
    editMode,
    viewMode,
    biospecimen,
    biospecimens,
    columnsToShow,
    editAction,
    deleteAction,
    closeAction,
    viewAction,
    onBiospecimensChange,
    disabled,
  } = props

  return (
    <StudyAssetRow
      id={id}
      editMode={editMode}
      viewMode={viewMode}
      asset={biospecimen}
      assets={biospecimens}
      columnsToShow={columnsToShow}
      editAction={editAction}
      deleteAction={deleteAction}
      closeAction={closeAction}
      viewAction={viewAction}
      onAssetsChange={onBiospecimensChange}
      disabled={disabled}
      AddEditComponent={BiospecimenAddEdit}
      SummaryComponent={BiospecimenSummary}
      addEditProps={{
        id,
        biospecimen,
        biospecimens,
        closeAction,
        onBiospecimensChange,
      }}
      summaryProps={{
        biospecimen,
        columnsToShow,
        editAction,
        deleteAction,
        viewAction,
        disabled,
      }}
    />
  )
}
