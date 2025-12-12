import React from 'react'
import { ConsentGroupAddEdit } from 'src/components/consent_group_list/ConsentGroupAddEdit'
import { ConsentGroupSummary } from 'src/components/consent_group_list/ConsentGroupSummary'
import { ConsentGroup2 } from 'src/pages/data_submission/consent_group/consentGroupUtils'

interface ConsentGroupRowProps {
  readonly id: number
  readonly editMode: boolean
  readonly consentGroup: ConsentGroup2
  readonly consentGroups: ConsentGroup2[]
  readonly columnsToShow: string[]
  readonly editAction: () => void
  readonly deleteAction: () => void
  readonly closeAction: () => void
  readonly onConsentGroupChange: (items: ConsentGroup2[]) => void
  readonly disabled: boolean
  readonly isEditingExistingStudy?: boolean
}

export default function ConsentGroupRow(props: ConsentGroupRowProps): React.JSX.Element {
  const {
    id,
    editMode,
    consentGroup,
    consentGroups,
    columnsToShow,
    editAction,
    deleteAction,
    closeAction,
    onConsentGroupChange,
    disabled,
    isEditingExistingStudy,
  } = props

  return (
    <div>
      {editMode && (
        <ConsentGroupAddEdit
          id={id}
          consentGroup={consentGroup}
          consentGroups={consentGroups}
          closeAction={closeAction}
          onConsentGroupChange={onConsentGroupChange}
          isEditingExistingStudy={isEditingExistingStudy}
        />
      )}
      {!editMode && (
        <ConsentGroupSummary
          consentGroup={consentGroup}
          columnsToShow={columnsToShow}
          editAction={editAction}
          deleteAction={deleteAction}
          disabled={disabled}
          isEditingExistingStudy={isEditingExistingStudy}
        />
      )}
    </div>
  )
}
