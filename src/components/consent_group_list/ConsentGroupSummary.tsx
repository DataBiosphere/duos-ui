import React from 'react'
import { ConsentGroup2 } from 'src/pages/data_submission/consent_group/consentGroupUtils'
import StudyAssetSummary from 'src/components/study_asset/StudyAssetSummary'

interface ConsentGroupSummaryProps {
  readonly consentGroup: ConsentGroup2
  readonly columnsToShow?: (keyof ConsentGroup2)[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly viewAction?: () => void
  readonly disabled?: boolean
  readonly isEditingExistingStudy?: boolean
}

export default function ConsentGroupSummary(props: ConsentGroupSummaryProps): React.JSX.Element {
  const { consentGroup, columnsToShow, editAction, deleteAction, viewAction, disabled, isEditingExistingStudy = false } = props

  return (
    <StudyAssetSummary
      asset={consentGroup}
      columnsToShow={columnsToShow}
      name={consentGroup.consentGroupName}
      objectName="consent group"
      editAction={editAction}
      deleteAction={deleteAction}
      viewAction={viewAction}
      disabled={disabled}
      disableDelete={isEditingExistingStudy}
    />
  )
}
