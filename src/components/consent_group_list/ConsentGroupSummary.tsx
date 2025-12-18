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
  const { consentGroup, isEditingExistingStudy = false } = props

  const customRenderers = {
    url: (value: unknown) =>
      typeof value === 'string' && value
        ? <a href={value} target="_blank" rel="noreferrer">{value}</a>
        : '—',
  }

  return (
    <StudyAssetSummary
      asset={consentGroup}
      columnsToShow={props.columnsToShow}
      customRenderers={customRenderers}
      name={consentGroup.consentGroupName}
      objectName="consentGroup"
      editAction={props.editAction}
      deleteAction={props.deleteAction}
      viewAction={props.viewAction}
      disabled={props.disabled}
      disableDelete={isEditingExistingStudy}
    />
  )
}
