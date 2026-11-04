import React, { useEffect, useState } from 'react'
import { isEmpty, isNil } from 'src/utils/NodashUtil'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import { findOntologyTerms, searchOntologyTerm } from 'src/libs/utils'
import { ValidationError } from 'src/pages/dar_application/FormValidationState'
import { AccessManagementType, selectedPrimaryGroup } from 'src/pages/data_submission/consent_group/consentGroupUtils'
import { DataUse } from 'src/types/model'

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

const EDITOR_KEYS: (keyof DataUse)[] = [
  'generalUse', 'hmbResearch', 'diseaseRestrictions', 'populationOriginsAncestry', 'other', 'methodsResearch',
  'geneticStudiesOnly', 'publicationResults', 'collaboratorRequired', 'ethicsApprovalRequired',
  'geographicalRestrictions', 'publicationMoratorium', 'nonProfitUse', 'secondaryOther',
]

/** The data use the terms describe, or undefined when they set none. */
export const dataUseFromTerms = (terms: DataUseTerms): DataUse | undefined => {
  const dataUse: DataUse = {
    generalUse: terms.generalResearchUse || undefined,
    hmbResearch: terms.hmb || undefined,
    diseaseRestrictions: isEmpty(terms.diseaseSpecificUse) ? undefined : terms.diseaseSpecificUse,
    populationOriginsAncestry: terms.poa || undefined,
    other: terms.otherPrimary?.trim() || undefined,
    methodsResearch: terms.nmds ? false : undefined,
    geneticStudiesOnly: terms.gso || undefined,
    publicationResults: terms.pub || undefined,
    collaboratorRequired: terms.col || undefined,
    ethicsApprovalRequired: terms.irb || undefined,
    geographicalRestrictions: terms.gs?.trim() || undefined,
    publicationMoratorium: (terms.mor && terms.morDate?.trim()) || undefined,
    nonProfitUse: terms.npu || undefined,
    secondaryOther: terms.otherSecondary?.trim() || undefined,
  }
  const set = Object.fromEntries(Object.entries(dataUse).filter(([, value]) => value !== undefined))
  return isEmpty(set) ? undefined : set
}

/**
 * A data use with the fields the editor sets replaced by the terms'; any other field stays. A field
 * whose term is unchanged keeps its stored value, including values the editor can't show, such as
 * methodsResearch: true or nonProfitUse: false.
 */
export const applyTerms = (dataUse: DataUse | null | undefined, terms: DataUseTerms): DataUse | undefined => {
  const written: DataUse = dataUseFromTerms(terms) ?? {}
  const shown: DataUse = dataUseFromTerms(termsFromDataUse(dataUse)) ?? {}
  const merged: Record<string, unknown> = { ...dataUse }
  for (const key of EDITOR_KEYS) {
    const unchanged = JSON.stringify(written[key]) === JSON.stringify(shown[key])
    merged[key] = unchanged ? dataUse?.[key] : written[key]
  }
  const set = Object.fromEntries(Object.entries(merged).filter(([, value]) => value !== undefined))
  return isEmpty(set) ? undefined : set as DataUse
}

/** The editor's terms for a stored data use; the inverse of {@link dataUseFromTerms}. */
export const termsFromDataUse = (dataUse?: DataUse | null): DataUseTerms => ({
  generalResearchUse: dataUse?.generalUse,
  hmb: dataUse?.hmbResearch,
  diseaseSpecificUse: isEmpty(dataUse?.diseaseRestrictions) ? undefined : dataUse?.diseaseRestrictions,
  poa: dataUse?.populationOriginsAncestry,
  otherPrimary: dataUse?.other || undefined,
  nmds: dataUse?.methodsResearch === false || undefined,
  gso: dataUse?.geneticStudiesOnly,
  pub: dataUse?.publicationResults,
  col: dataUse?.collaboratorRequired,
  irb: dataUse?.ethicsApprovalRequired,
  gs: dataUse?.geographicalRestrictions || undefined,
  mor: !isEmpty(dataUse?.publicationMoratorium) || undefined,
  morDate: dataUse?.publicationMoratorium || undefined,
  npu: dataUse?.nonProfitUse,
  otherSecondary: dataUse?.secondaryOther || undefined,
})

/**
 * Errors in the terms: a checked option without its text, or a missing access management or
 * primary term. When the terms are optional, a primary term is needed only when a data use will be
 * sent, which by default is when any term is set.
 */
export const dataUseTermsErrors = (
  terms: DataUseTerms,
  required = true,
  sendsDataUse = dataUseFromTerms(terms) !== undefined,
): DataUseTermsValidation => {
  const v: DataUseTermsValidation = {}
  const primary = selectedPrimaryGroup(terms)
  const needsPrimary = required || sendsDataUse
  if (required && !terms.accessManagement?.trim()) v.accessManagement = makeError('required')
  if (needsPrimary && terms.accessManagement !== 'open' && !primary) v.primaryConsent = makeError('required')
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
  readonly required?: boolean
  /** What the terms describe, as the primary terms' description names it. */
  readonly subject?: string
  /** Receives the cleared terms in place of onChange, for a caller that also drops what it keeps beside them. */
  readonly onClear?: (cleared: DataUseTerms) => void
}

export default function DataUseTermsFields(props: DataUseTermsFieldsProps): React.JSX.Element {
  const { terms, onChange, validation, readOnly = false, accessDisabled = false, required = true, subject = 'dataset', onClear = onChange } = props
  const marker = required ? '*' : ''
  const primary = selectedPrimaryGroup(terms)

  const [selectedDiseases, setSelectedDiseases] = useState<{ displayText: string, id: string }[]>([])
  const [initialDiseases, setInitialDiseases] = useState(terms.diseaseSpecificUse)
  // The fields read their values only when they mount, so clearing remounts them.
  const [resetCount, setResetCount] = useState(0)

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

  // Dropping the initial diseases cancels their lookup, so a late result can't overwrite this choice.
  const chooseDiseases = (diseases: { displayText: string, id: string }[]) => {
    setInitialDiseases(undefined)
    setSelectedDiseases(diseases)
  }

  const onAccessTypeChange = ({ value }: { value: string }) => {
    const accessManagement = value as AccessManagementType
    // Only open access clears the terms; clearing on every change invalidated terms filled in first.
    if (accessManagement === 'open') {
      chooseDiseases([])
      onChange({ ...DATA_USE_CLEARED, accessManagement })
    }
    else {
      onChange({ accessManagement })
    }
  }

  const onPrimaryChange = (key: keyof DataUseTerms, value: boolean | string | string[]) => {
    if (key !== 'diseaseSpecificUse') {
      chooseDiseases([])
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

  const clear = () => {
    chooseDiseases([])
    setResetCount(count => count + 1)
    onClear({ ...DATA_USE_CLEARED, accessManagement: undefined })
  }

  return (
    <React.Fragment key={resetCount}>
      {/* controlled, open and external access */}
      <div>
        <FormField
          title={`Data Access Management${marker}`}
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
              title: `Primary Data Use Terms${marker}`,
              description: `Please select one of the following data use permissions for your ${subject}`,
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
                      chooseDiseases(value)
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
      {
        !required && !readOnly && (
          <button id="clearDataUseTerms" className="btn" type="button" onClick={clear}>
            Clear access management and data use
          </button>
        )
      }
    </React.Fragment>
  )
}
