import React from 'react'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import { FormField, FormValidators } from 'src/components/forms/forms'
import AddObjectButton from 'src/components/AddObjectButton'
import { DataCustodianMetadata } from 'src/libs/data-metadata'
import { Study } from 'src/pages/data_submission/v2/v2-models'
import { getDataCustodians, updateDataCustodians } from 'src/pages/data_submission/v2/v2-common-functions'

export interface DataCustodiansProps {
  study: Study
  setStudy: React.Dispatch<React.SetStateAction<Study>>
}

/** One row per custodian, laid out like the PI rows: column titles once, a row per person. */
export const DataCustodians = (props: DataCustodiansProps) => {
  const { study, setStudy } = props
  const custodians = getDataCustodians(study)

  const updateCustodian = (index: number, changes: Partial<DataCustodianMetadata>) => {
    updateDataCustodians(setStudy, list => list.map((custodian, i) => (i === index ? { ...custodian, ...changes } : custodian)))
  }

  return (
    <div className="dsf-group" data-cy="data-custodians">
      <h3>Data Custodians</h3>
      <p className="dsf-subtitle">
        Data Custodian contacts will be displayed publicly in DUOS and may be contacted regarding data access questions or
        data quality issues. Please provide the appropriate institutional contact(s).
      </p>
      {/* Column headers, shown once. Each row keeps its own labels for screen readers, hidden on screen. */}
      <div className="dsf-row dsf-person-row dsf-custodian-row dsf-person-header" aria-hidden="true">
        <span className="control-label">First Name</span>
        <span className="control-label">Last Name</span>
        <span className="control-label">Email Address</span>
        <span />
      </div>
      {custodians.map((custodian, index) => (
        // Rows have no identity of their own; each field re-syncs from its defaultValue when one is removed.
        // oxlint-disable-next-line react/no-array-index-key
        <div className="dsf-row dsf-person-row dsf-custodian-row" key={index} data-cy={`custodian-row-${index}`}>
          <FormField
            id={`custodian-${index}-firstName`}
            title="First Name"
            placeholder="First name"
            defaultValue={custodian.firstName ?? ''}
            onChange={({ value }: { value: string }) => updateCustodian(index, { firstName: value || undefined })}
          />
          <FormField
            id={`custodian-${index}-lastName`}
            title="Last Name"
            placeholder="Last name"
            defaultValue={custodian.lastName ?? ''}
            onChange={({ value }: { value: string }) => updateCustodian(index, { lastName: value || undefined })}
          />
          <FormField
            id={`custodian-${index}-email`}
            title="Email Address"
            placeholder="Email address"
            validators={[FormValidators.EMAIL]}
            defaultValue={custodian.email ?? ''}
            onChange={({ value }: { value: string }) => updateCustodian(index, { email: value || undefined })}
          />
          <div className="dsf-row-action">
            {custodians.length > 1 && (
              <button
                type="button"
                className="dsf-icon-button"
                id={`custodian-${index}-remove`}
                aria-label={`Remove Data Custodian ${index + 1}`}
                onClick={() => updateDataCustodians(setStudy, list => list.filter((_, i) => i !== index))}
              >
                <DeleteOutlinedIcon />
              </button>
            )}
          </div>
        </div>
      ))}
      <AddObjectButton
        id="add-custodian-btn"
        label="Add Data Custodian"
        variant="inline"
        onClick={() => updateDataCustodians(setStudy, list => [...list, {}])}
      />
    </div>
  )
}
