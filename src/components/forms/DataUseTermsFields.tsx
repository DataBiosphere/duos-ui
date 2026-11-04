import React, { useEffect, useState } from 'react'
import { isEmpty, isNil } from 'src/utils/NodashUtil'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import { findOntologyTerms, searchOntologyTerm } from 'src/libs/utils'
import { ValidationError } from 'src/pages/dar_application/FormValidationState'
import { AccessManagementType, selectedPrimaryGroup } from 'src/pages/data_submission/consent_group/consentGroupUtils'

/** Access management plus the primary and secondary data use terms, in the consent group's flat shape. */
export interface DataUseTerms {
  accessManagement?: AccessManagementType
  generalResearchUse?: boolean
  hmb?: boolean
  diseaseSpecificUse?: string[]
  poa?: boolean
  otherPrimary?: string
  nmds?: boolean
  gso?: boolean
  pub?: boolean
  col?: boolean
  irb?: boolean
  gs?: string
  mor?: boolean
  morDate?: string
  npu?: boolean
  otherSecondary?: string
}

export interface DataUseTermsValidation {
  accessManagement?: ValidationError
  primaryConsent?: ValidationError
  diseaseSpecificUse?: ValidationError
  otherPrimary?: ValidationError
  gs?: ValidationError
  mor?: ValidationError
  otherSecondary?: ValidationError
}

const makeError = (message: string): ValidationError => ({ valid: false, failed: [message] })

const PRIMARY_CLEARED: DataUseTerms = {
  generalResearchUse: false,
  hmb: false,
  diseaseSpecificUse: undefined,
  poa: false,
  otherPrimary: undefined,
}

// Open access uses no data use terms, so choosing it clears them all.
const DATA_USE_CLEARED: DataUseTerms = {
  ...PRIMARY_CLEARED,
  nmds: false,
  gso: false,
  pub: false,
  col: false,
  irb: false,
  gs: undefined,
  mor: false,
  morDate: undefined,
  npu: false,
  otherSecondary: undefined,
}

/** Errors in the terms: a missing access management or primary term, or a checked option without its text. */
export const dataUseTermsErrors = (terms: DataUseTerms): DataUseTermsValidation => {
  const v: DataUseTermsValidation = {}
  const primary = selectedPrimaryGroup(terms)
  if (!terms.accessManagement?.trim()) v.accessManagement = makeError('required')
  if (terms.accessManagement !== 'open' && !primary) v.primaryConsent = makeError('required')
  if (primary === 'diseaseSpecificUse' && isEmpty(terms.diseaseSpecificUse)) v.diseaseSpecificUse = makeError('required')
  if (primary === 'otherPrimary' && !terms.otherPrimary?.trim()) v.otherPrimary = makeError('required')
  if (!isNil(terms.gs) && !terms.gs.trim()) v.gs = makeError('required')
  if (terms.mor && !terms.morDate?.trim()) v.mor = makeError('required')
  if (!isNil(terms.otherSecondary) && !terms.otherSecondary.trim()) v.otherSecondary = makeError('required')
  return v
}

interface DataUseTermsFieldsProps {
  readonly terms: DataUseTerms
  /** Receives only the terms that changed. */
  readonly onChange: (changed: DataUseTerms) => void
  readonly validation: DataUseTermsValidation
  readonly readOnly?: boolean
  readonly accessDisabled?: boolean
}

export default function DataUseTermsFields(props: DataUseTermsFieldsProps): React.JSX.Element {
  const { terms, onChange, validation, readOnly = false, accessDisabled = false } = props
  const primary = selectedPrimaryGroup(terms)

  const [selectedDiseases, setSelectedDiseases] = useState<{ displayText: string, id: string }[]>([])
  const [initialDiseases] = useState(terms.diseaseSpecificUse)

  useEffect(() => {
    let mounted = true
    const loadOntologyTerms = async () => {
      if (!isEmpty(initialDiseases)) {
        try {
          const found = await findOntologyTerms(initialDiseases!)
          if (mounted && Array.isArray(found)) {
            setSelectedDiseases(found)
          }
        }
        catch (_e) {
          // ignore errors and leave selectedDiseases as empty array
        }
      }
    }
    void loadOntologyTerms()
    return () => {
      mounted = false
    }
  }, [initialDiseases])

  const onAccessTypeChange = ({ value }: { value: string }) => {
    const accessManagement = value as AccessManagementType
    // Only open access clears the terms; clearing on every change invalidated terms filled in first.
    if (accessManagement === 'open') {
      setSelectedDiseases([])
      onChange({ ...DATA_USE_CLEARED, accessManagement })
    }
    else {
      onChange({ accessManagement })
    }
  }

  const onPrimaryChange = (key: keyof DataUseTerms, value: boolean | string | string[]) => {
    if (key !== 'diseaseSpecificUse') {
      setSelectedDiseases([])
    }
    onChange({ ...PRIMARY_CLEARED, [key]: value })
  }

  const primaryRadio = (value: keyof DataUseTerms, toggleText: string, onSelect: () => void, extra: object = {}) => (
    <FormField
      type={FormFieldTypes.RADIOBUTTON}
      id={`primaryConsent_${value}`}
      name="primaryConsent"
      value={value}
      toggleText={toggleText}
      defaultValue={primary}
      onChange={onSelect}
      validation={validation.primaryConsent}
      disabled={readOnly}
      {...extra}
    />
  )

  const checkbox = (key: 'nmds' | 'gso' | 'pub' | 'col' | 'irb' | 'npu', toggleText: string, extra: object = {}) => (
    <FormField
      id={key}
      name={key}
      type={FormFieldTypes.CHECKBOX}
      toggleText={toggleText}
      defaultValue={terms[key]}
      onChange={({ value }: { value: boolean }) => onChange({ [key]: value })}
      disabled={readOnly}
      {...extra}
    />
  )

  // A checked option with text holds a string, empty until the text is entered.
  const textToggle = (key: 'gs' | 'otherSecondary', toggleText: string) => (
    <FormField
      id={key}
      name={key}
      type={FormFieldTypes.CHECKBOX}
      toggleText={toggleText}
      defaultValue={!isNil(terms[key])}
      onChange={({ value }: { value: boolean }) => onChange({ [key]: value ? '' : undefined })}
      disabled={readOnly}
    />
  )

  return (
    <>
      {/* controlled, open and external access */}
      <div>
        <FormField
          title="Data Access Management*"
          description="Select a data access management strategy"
          id="accessManagement_controlled"
          name="accessManagement"
          value="controlled"
          type={FormFieldTypes.RADIOBUTTON}
          toggleText="Controlled Access (managed by a DAC in DUOS)"
          defaultValue={terms.accessManagement}
          onChange={onAccessTypeChange}
          validation={validation.accessManagement}
          disabled={readOnly || accessDisabled}
        />

        <FormField
          id="accessManagement_open"
          name="accessManagement"
          value="open"
          type={FormFieldTypes.RADIOBUTTON}
          toggleText="Open Access (does not need DAC approval)"
          defaultValue={terms.accessManagement}
          onChange={onAccessTypeChange}
          validation={validation.accessManagement}
          disabled={readOnly || accessDisabled}
        />

        <FormField
          id="accessManagement_external"
          name="accessManagement"
          value="external"
          type={FormFieldTypes.RADIOBUTTON}
          toggleText="External Access (managed by a DAC external to DUOS)"
          defaultValue={terms.accessManagement}
          onChange={onAccessTypeChange}
          validation={validation.accessManagement}
          disabled={readOnly || accessDisabled}
        />
      </div>

      {/* primary */}
      {
        terms.accessManagement !== 'open' && (
          <div>
            {primaryRadio('generalResearchUse', 'General Research Use', () => onPrimaryChange('generalResearchUse', true), {
              title: 'Primary Data Use Terms*',
              description: 'Please select one of the following data use permissions for your dataset',
            })}
            {primaryRadio('hmb', 'Health/Medical/Biomedical Research Use', () => onPrimaryChange('hmb', true))}
            {primaryRadio('diseaseSpecificUse', 'Disease-Specific Research Use', () => onPrimaryChange('diseaseSpecificUse', selectedDiseases.map(disease => disease.id)))}
            {
              primary === 'diseaseSpecificUse' && (
                <div
                  style={{
                    marginBottom: '1.0rem',
                  }}
                >
                  <FormField
                    type={FormFieldTypes.SELECT}
                    isMulti={true}
                    isCreatable={true}
                    isAsync={true}
                    loadOptions={searchOntologyTerm}
                    id="diseaseSpecificUseText"
                    name="diseaseSpecificUse"
                    validators={[FormValidators.REQUIRED]}
                    placeholder="Please enter one or more diseases"
                    defaultValue={selectedDiseases}
                    onChange={({ value }: { value: [{ displayText: string, id: string }] }) => {
                      setSelectedDiseases(value)
                      onChange({ diseaseSpecificUse: value.map((v: { id: string }) => v.id) })
                    }}
                    validation={validation.diseaseSpecificUse}
                    disabled={readOnly}
                  />
                </div>
              )
            }
            {primaryRadio('poa', 'Populations, Origins, Ancestry Use', () => onPrimaryChange('poa', true))}
            {primaryRadio('otherPrimary', 'Other', () => onPrimaryChange('otherPrimary', terms.otherPrimary ?? ''))}
            {
              primary === 'otherPrimary' && (
                <FormField
                  id="otherPrimaryText"
                  name="otherPrimary"
                  validators={[FormValidators.REQUIRED]}
                  placeholder="Please specify"
                  defaultValue={terms.otherPrimary}
                  onChange={({ value }: { value: string }) => onChange({ otherPrimary: value })}
                  validation={validation.otherPrimary}
                  disabled={readOnly}
                />
              )
            }
          </div>
        )
      }

      {/* secondary */}
      {
        terms.accessManagement !== 'open' && (
          <div>
            {checkbox('nmds', 'No methods development or validation studies (NMDS)', {
              title: 'Secondary Data Use Terms',
              description: 'Select all applicable data use parameters',
            })}
            {checkbox('gso', 'Genetic studies only (GSO)')}
            {checkbox('pub', 'Publication Required (PUB)')}
            {checkbox('col', 'Collaboration Required (COL)')}
            {checkbox('irb', 'Ethics Approval Required (IRB)')}
            {textToggle('gs', 'Geographic Restriction (GS-)')}
            {
              !isNil(terms.gs) && (
                <FormField
                  id="gsText"
                  name="gs"
                  validators={[FormValidators.REQUIRED]}
                  placeholder="Specify Geographic Restriction"
                  defaultValue={terms.gs}
                  onChange={({ value }: { value: string }) => onChange({ gs: value })}
                  validation={validation.gs}
                  disabled={readOnly}
                />
              )
            }
            <FormField
              id="mor"
              name="mor"
              type={FormFieldTypes.CHECKBOX}
              toggleText="Publication Moratorium (MOR)"
              defaultValue={terms.mor}
              onChange={({ value }: { value: boolean }) => onChange(value ? { mor: true } : { mor: false, morDate: undefined })}
              disabled={readOnly}
            />
            {
              terms.mor && (
                <FormField
                  id="morText"
                  name="morDate"
                  type={FormFieldTypes.CALENDAR}
                  validators={[FormValidators.REQUIRED, FormValidators.DATE]}
                  defaultValue={terms.morDate}
                  onChange={({ value }: { value: string }) => onChange({ morDate: value })}
                  validation={validation.mor}
                  disabled={readOnly}
                />
              )
            }
            {checkbox('npu', 'Non-profit Use Only (NPU)')}
            {textToggle('otherSecondary', 'Other')}
            {
              !isNil(terms.otherSecondary) && (
                <FormField
                  id="otherSecondaryText"
                  name="otherSecondary"
                  validators={[FormValidators.REQUIRED]}
                  placeholder="Please specify"
                  defaultValue={terms.otherSecondary}
                  onChange={({ value }: { value: string }) => onChange({ otherSecondary: value })}
                  validation={validation.otherSecondary}
                  disabled={readOnly}
                />
              )
            }
          </div>
        )
      }
    </>
  )
}
