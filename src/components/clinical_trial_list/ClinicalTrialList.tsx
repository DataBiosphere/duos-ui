import ClinicalTrialAddEdit from './ClinicalTrialAddEdit'
import ClinicalTrialRow from './ClinicalTrialRow'
import { ClinicalTrial } from 'src/types/model'
import { DarErrors } from 'src/pages/dar_application/FormValidationState'
import React from 'react'
import StudyAssetList from 'src/components/study_asset/StudyAssetList'

export default function ClinicalTrialList(props: {
  readonly clinicalTrials: ClinicalTrial[]
  readonly columnsToShow?: (keyof ClinicalTrial | 'dateRange')[]
  readonly onClinicalTrialChange: (clinicalTrials: ClinicalTrial[]) => void
  readonly disabled?: boolean
  readonly validation?: DarErrors
  readonly studyAssetWrapper?: (content: React.ReactNode, button: React.ReactNode) => React.ReactNode
}) {
  const normalized = props.clinicalTrials.map(ct => ({
    ...ct,
  }))

  return (
    <StudyAssetList<
      ClinicalTrial,
      DarErrors,
      React.ComponentProps<typeof ClinicalTrialAddEdit>,
      React.ComponentProps<typeof ClinicalTrialRow>
    >
      items={normalized}
      columnsToShow={props.columnsToShow ?? ['title', 'status', 'registry', 'phase', 'startDate', 'endDate', 'url']}
      onItemsChange={props.onClinicalTrialChange}
      disabled={props.disabled}
      validation={props.validation}
      AddEditComponent={ClinicalTrialAddEdit}
      RowComponent={ClinicalTrialRow}
      addButtonId="add-clinical-trial-btn"
      addButtonLabel="Add Clinical Trial"
      getValidationState={v => v?.clinicalTrials}
      studyAssetWrapper={props.studyAssetWrapper}
      getAddEditProps={(items, closeAction, onItemsChange) => ({
        id: -1,
        clinicalTrials: items,
        closeAction,
        onClinicalTrialChange: onItemsChange,
      })}
      getRowProps={baseProps => ({
        id: baseProps.index,
        editMode: baseProps.editMode,
        viewMode: baseProps.viewMode,
        clinicalTrial: baseProps.item,
        clinicalTrials: baseProps.items,
        viewAction: baseProps.viewAction,
        editAction: baseProps.editAction,
        deleteAction: baseProps.deleteAction,
        closeAction: baseProps.closeAction,
        onClinicalTrialChange: baseProps.onItemsChange,
        columnsToShow: baseProps.columnsToShow,
        disabled: baseProps.disabled,
      })}
      getItemKey={item => item.clinicalTrialId}
    />
  )
}
