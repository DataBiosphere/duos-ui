import React from 'react'
import ConsentGroupAddEdit from 'src/components/consent_group_list/ConsentGroupAddEdit'
import ConsentGroupSummary from 'src/components/consent_group_list/ConsentGroupSummary'
import { ConsentGroup2 } from 'src/pages/data_submission/consent_group/consentGroupUtils'
import StudyAssetRow from 'src/components/study_asset/StudyAssetRow'

interface ConsentGroupRowProps {
  readonly id: number
  readonly editMode: boolean
  readonly viewMode?: boolean
  readonly consentGroup: ConsentGroup2
  readonly consentGroups: ConsentGroup2[]
  readonly columnsToShow?: (keyof ConsentGroup2)[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly closeAction: () => void
  readonly viewAction?: () => void
  readonly onConsentGroupChange: (items: ConsentGroup2[]) => void
  readonly disabled: boolean
  readonly isEditingExistingStudy?: boolean
}

export default function ConsentGroupRow(props: ConsentGroupRowProps): React.JSX.Element {
  const {
    id,
    editMode,
    viewMode,
    consentGroup,
    consentGroups,
    columnsToShow,
    editAction,
    deleteAction,
    closeAction,
    viewAction,
    onConsentGroupChange,
    disabled,
    isEditingExistingStudy,
  } = props

  return (
    <StudyAssetRow
      id={id}
      editMode={editMode}
      viewMode={viewMode}
      asset={consentGroup}
      assets={consentGroups}
      columnsToShow={columnsToShow}
      editAction={editAction}
      deleteAction={deleteAction}
      closeAction={closeAction}
      viewAction={viewAction}
      onAssetsChange={onConsentGroupChange}
      disabled={disabled}
      AddEditComponent={ConsentGroupAddEdit}
      SummaryComponent={ConsentGroupSummary}
      addEditProps={{
        id,
        consentGroup,
        consentGroups,
        closeAction,
        onConsentGroupChange,
        isEditingExistingStudy,
      }}
      summaryProps={{
        consentGroup,
        columnsToShow,
        editAction,
        deleteAction,
        viewAction,
        disabled,
        isEditingExistingStudy,
      }}
    />
  )
}
