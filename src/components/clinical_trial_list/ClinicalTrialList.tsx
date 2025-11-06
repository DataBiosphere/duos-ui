import React, { useState } from 'react'
import ClinicalTrialAddEdit from 'src/components/clinical_trial_list/ClinicalTrialAddEdit'
import ClinicalTrialRow from 'src/components/clinical_trial_list/ClinicalTrialRow'
import { ClinicalTrial } from 'src/types/model'
import { DarErrors } from 'src/pages/dar_application/FormValidationState'
import {
  parseLegacyStatus,
  parseLegacyPhase,
  parseLegacyInterventionType,
} from 'src/utils/ClinicalTrialEnumUtils'

interface ClinicalTrialListProps {
  readonly clinicalTrials: ClinicalTrial[]
  readonly columnsToShow?: string[]
  readonly onClinicalTrialChange: (clinicalTrials: ClinicalTrial[]) => void
  readonly disabled?: boolean
  readonly validation?: DarErrors
  readonly studyAssetWrapper?: (content: React.ReactNode, button: React.ReactNode) => React.ReactNode
}

export default function ClinicalTrialList(props: ClinicalTrialListProps): React.JSX.Element {
  const {
    clinicalTrials,
    columnsToShow = [],
    onClinicalTrialChange,
    disabled = false,
    validation,
    studyAssetWrapper,
  } = props

  const normalized = clinicalTrials.map(ct => ({
    ...ct,
    status: parseLegacyStatus(ct.status as unknown as string),
    phase: parseLegacyPhase(ct.phase as unknown as string),
    interventionType: parseLegacyInterventionType(ct.interventionType as unknown as string),
  }))

  const [showAddEdit, setShowAddEdit] = useState(false)
  const [editState, setEditState] = useState(normalized.map(() => false))

  const toggleEditState = (index: number) => {
    const copy = [...editState]
    copy[index] = !copy[index]
    setEditState(copy)
  }

  const handleDelete = (index: number) => {
    const updated = normalized.filter((_, i) => i !== index)
    onClinicalTrialChange(updated)
  }

  const getValidationState = () => validation?.clinicalTrials

  const button = (
    <button
      id="add-clinical-trial-btn"
      type="button"
      className="button button-white"
      style={{
        marginTop: 0,
        marginBottom: 5,
        border: getValidationState() ? '1px solid red' : '1px solid #0948B7',
        boxShadow: getValidationState() ? '0 0 5px red' : 'none',
        ...(disabled ? { cursor: 'not-allowed' } : {}),
      }}
      onClick={() => !disabled && setShowAddEdit(true)}
      disabled={disabled}
    >
      Add Clinical Trial
    </button>
  )

  const content = (
    <div className="form-group row no-margin">
      {showAddEdit && (
        <ClinicalTrialAddEdit
          id={-1}
          clinicalTrials={normalized}
          closeAction={() => setShowAddEdit(false)}
          onClinicalTrialChange={onClinicalTrialChange}
        />
      )}
      {normalized.map((clinicalTrial: ClinicalTrial, index: number) => (
        <ClinicalTrialRow
          key={clinicalTrial.clinicalTrialId || index}
          id={index}
          editMode={editState[index]}
          clinicalTrial={clinicalTrial}
          clinicalTrials={normalized}
          columnsToShow={columnsToShow}
          editAction={() => toggleEditState(index)}
          deleteAction={() => { handleDelete(index) }}
          closeAction={() => {
            toggleEditState(index)
            setShowAddEdit(false)
          }}
          onClinicalTrialChange={onClinicalTrialChange}
          disabled={disabled}
        />
      ))}
    </div>
  )

  if (studyAssetWrapper) {
    return <>{studyAssetWrapper(content, button)}</>
  }

  return (
    <div className="presentation-list-component">
      <div className="row no-margin">
        {button}
      </div>
      {content}
    </div>
  )
}
