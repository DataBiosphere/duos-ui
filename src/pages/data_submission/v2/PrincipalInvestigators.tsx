import React from 'react'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import { normalizeOrcid } from 'src/components/forms/formValidation'
import AddObjectButton from 'src/components/AddObjectButton'
import { PrincipalInvestigatorMetadata } from 'src/libs/data-metadata'
import { Study } from 'src/pages/data_submission/v2/v2-models'
import { getPrincipalInvestigators, updatePrincipalInvestigators } from 'src/pages/data_submission/v2/v2-common-functions'

export interface PrincipalInvestigatorsProps {
  study: Study
  setStudy: React.Dispatch<React.SetStateAction<Study>>
}

/** One row per PI, every field of a PI on that row; the first PI is the study's primary PI. */
export const PrincipalInvestigators = (props: PrincipalInvestigatorsProps) => {
  const { study, setStudy } = props
  const pis = getPrincipalInvestigators(study)

  const updatePi = (index: number, changes: Partial<PrincipalInvestigatorMetadata>) => {
    updatePrincipalInvestigators(setStudy, list => list.map((pi, i) => (i === index ? { ...pi, ...changes } : pi)))
  }

  return (
    <div className="dsf-group" data-cy="principal-investigators">
      <h3>Principal Investigators</h3>
      <p className="dsf-subtitle">The first PI listed is the study&apos;s primary PI and is shown as its contact.</p>
      {/* Column headers, shown once. Each row keeps its own labels for screen readers, hidden on screen. */}
      <div className="dsf-row dsf-person-row dsf-pi-row dsf-person-header" aria-hidden="true">
        <span className="control-label">First Name*</span>
        <span className="control-label">Last Name*</span>
        <span className="control-label">Email Address</span>
        <span className="control-label">ORCID iD</span>
        <span />
      </div>
      {pis.map((pi, index) => (
        // Rows have no identity of their own; each field re-syncs from its defaultValue when one is removed.
        // oxlint-disable-next-line react/no-array-index-key
        <div className="dsf-row dsf-person-row dsf-pi-row" key={index} data-cy={`pi-row-${index}`}>
          <FormField
            id={`pi-${index}-firstName`}
            title="First Name"
            placeholder="First name"
            validators={[FormValidators.REQUIRED]}
            defaultValue={pi.firstName ?? ''}
            onChange={({ value }: { value: string }) => updatePi(index, { firstName: value })}
          />
          <FormField
            id={`pi-${index}-lastName`}
            title="Last Name"
            placeholder="Last name"
            validators={[FormValidators.REQUIRED]}
            defaultValue={pi.lastName ?? ''}
            onChange={({ value }: { value: string }) => updatePi(index, { lastName: value })}
          />
          <FormField
            id={`pi-${index}-email`}
            title="Email Address"
            placeholder="Email address"
            validators={[FormValidators.EMAIL]}
            defaultValue={pi.email ?? ''}
            onChange={({ value }: { value: string }) => updatePi(index, { email: value || undefined })}
          />
          <FormField
            id={`pi-${index}-orcids`}
            title="ORCID iD"
            placeholder="0000-0002-1825-0097"
            type={FormFieldTypes.SELECT}
            validators={[FormValidators.ORCID]}
            selectOptions={[]}
            isCreatable={true}
            isMulti={true}
            optionsAreString={true}
            selectConfig={{
              components: {
                DropdownIndicator: null,
                Menu: () => null,
              },
            }}
            defaultValue={pi.orcids ?? []}
            onChange={({ value, isValid }: { value: string[], isValid: boolean }) => {
              if (!isValid) return
              const orcids = [...new Set((value ?? []).map(normalizeOrcid))]
              updatePi(index, { orcids: orcids.length ? orcids : undefined })
            }}
          />
          <div className="dsf-row-action">
            {pis.length > 1 && (
              <button
                type="button"
                className="dsf-icon-button"
                id={`pi-${index}-remove`}
                aria-label={`Remove PI ${index + 1}`}
                onClick={() => updatePrincipalInvestigators(setStudy, list => list.filter((_, i) => i !== index))}
              >
                <DeleteOutlinedIcon />
              </button>
            )}
          </div>
        </div>
      ))}
      <AddObjectButton
        id="add-pi-btn"
        label="Add PI"
        variant="inline"
        onClick={() => updatePrincipalInvestigators(setStudy, list => [...list, {}])}
      />
    </div>
  )
}
