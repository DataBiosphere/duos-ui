import React, { useState } from 'react'
import ClinicalTrialAddEdit from 'src/components/clinical_trial_list/ClinicalTrialAddEdit'
import ClinicalTrialRow from 'src/components/clinical_trial_list/ClinicalTrialRow'
import { ClinicalTrial } from 'src/types/model'
import { DarErrors } from 'src/pages/dar_application/FormValidationState'

interface ClinicalTrialListProps {
  readonly clinicalTrials: ClinicalTrial[]
  readonly columnsToShow?: string[]
  readonly onClinicalTrialChange: (clinicalTrials: ClinicalTrial[]) => void
  readonly disabled?: boolean
  readonly validation?: DarErrors
}

export default function ClinicalTrialList(props: ClinicalTrialListProps): React.JSX.Element {
  const {
    clinicalTrials,
    columnsToShow = [],
    onClinicalTrialChange,
    disabled = false,
    validation,
  } = props

  const [showAddEdit, setShowAddEdit] = useState(false)
  const [editState, setEditState] = useState(clinicalTrials.map(() => false))

  const toggleEditState = (index: number) => {
    const copy = [...editState]
    copy[index] = !copy[index]
    setEditState(copy)
  }

  const handleDelete = (index: number) => {
    const updated = clinicalTrials.filter((_, i) => i !== index)
    onClinicalTrialChange(updated)
  }

  const getValidationState = () => validation?.clinicalTrials

  return (
    <div className="presentation-list-component">
      <div className="row no-margin">
        <button
          id="add-clinical-trial-btn"
          type="button"
          className="button button-white"
          style={{
            marginTop: 25,
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
        {showAddEdit && (
          <ClinicalTrialAddEdit
            id={-1}
            clinicalTrials={clinicalTrials}
            closeAction={() => setShowAddEdit(false)}
            onClinicalTrialChange={onClinicalTrialChange}
          />
        )}
      </div>
      <div className="form-group row no-margin">
        {clinicalTrials.map((clinicalTrial: ClinicalTrial, index: number) => (
          <ClinicalTrialRow
            key={clinicalTrial.clinicalTrialId}
            id={index}
            editMode={editState[index]}
            clinicalTrial={clinicalTrial}
            clinicalTrials={clinicalTrials}
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
    </div>
  )
}
