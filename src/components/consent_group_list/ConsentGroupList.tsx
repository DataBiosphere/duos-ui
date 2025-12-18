import React from 'react'
import { DarErrors } from 'src/pages/dar_application/FormValidationState'
import { ConsentGroup2 } from 'src/pages/data_submission/consent_group/consentGroupUtils'
import ConsentGroupAddEdit from 'src/components/consent_group_list/ConsentGroupAddEdit'
import ConsentGroupRow from 'src/components/consent_group_list/ConsentGroupRow'
import StudyAssetList from 'src/components/study_asset/StudyAssetList'

interface ConsentGroupListProps {
  readonly consentGroups: ConsentGroup2[]
  readonly columnsToShow?: (keyof ConsentGroup2)[]
  readonly onConsentGroupChange: (items: ConsentGroup2[]) => void
  readonly disabled?: boolean
  readonly validation?: DarErrors
  readonly studyAssetWrapper?: (content: React.ReactNode, button: React.ReactNode) => React.ReactNode
  readonly isEditingExistingStudy?: boolean
}

export default function ConsentGroupList(props: ConsentGroupListProps): React.JSX.Element {
  return (
    <StudyAssetList<
      ConsentGroup2,
      DarErrors,
      React.ComponentProps<typeof ConsentGroupAddEdit>,
      React.ComponentProps<typeof ConsentGroupRow>
    >
      items={props.consentGroups}
      columnsToShow={props.columnsToShow ?? ['consentGroupName', 'accessManagement', 'dataLocation', 'numberOfParticipants', 'url', 'generalResearchUse']}
      onItemsChange={props.onConsentGroupChange}
      disabled={props.disabled}
      validation={props.validation}
      AddEditComponent={ConsentGroupAddEdit}
      RowComponent={ConsentGroupRow}
      addButtonId="add-consent-group-btn"
      addButtonLabel="Add Dataset"
      getValidationState={v => v?.consentGroups}
      studyAssetWrapper={props.studyAssetWrapper}
      getAddEditProps={(items, closeAction, onItemsChange) => ({
        id: -1,
        consentGroups: items,
        closeAction,
        onConsentGroupChange: onItemsChange,
        isEditingExistingStudy: props.isEditingExistingStudy,
      })}
      getRowProps={baseProps => ({
        id: baseProps.index,
        editMode: baseProps.editMode,
        viewMode: baseProps.viewMode,
        consentGroup: baseProps.item,
        consentGroups: baseProps.items,
        viewAction: baseProps.viewAction,
        editAction: baseProps.editAction,
        deleteAction: baseProps.deleteAction,
        closeAction: baseProps.closeAction,
        onConsentGroupChange: baseProps.onItemsChange,
        columnsToShow: baseProps.columnsToShow,
        disabled: baseProps.disabled,
        isEditingExistingStudy: props.isEditingExistingStudy,
      })}
    />
  )
}
