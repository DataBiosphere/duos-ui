import { cloneDeep, unset, set, isNil, isEmpty } from 'lodash'
import React, { useState } from 'react'
import { FormField, FormFieldTitle, FormFieldTypes, FormTable, FormValidators } from 'src/components/forms/forms'
import { searchOntologies } from 'src/libs/utils'
import { ValidationError } from 'src/pages/dar_application/FormValidationState'
import { ConsentGroup, ConsentGroup2, selectedPrimaryGroup } from 'src/pages/data_submission/consent_group/consentGroupUtils'
import { DacPicker } from '../forms/DacPicker'

interface ConsentGroupAddEditProps {
  readonly id: number
  readonly consentGroup?: ConsentGroup2
  readonly consentGroups: ConsentGroup2[]
  readonly closeAction: () => void
  readonly onConsentGroupChange: (items: ConsentGroup2[]) => void
}

interface Validation {
  name?: ValidationError
  platform?: ValidationError
  url?: ValidationError
  description?: ValidationError
  access?: ValidationError
}

const defaultConsentGroup: ConsentGroup2 = {
  consentGroupName: '',
  numberOfParticipants: 0,
  name: '',
  consentGroupId: '',
}

const makeError = (message: string): ValidationError => ({ valid: true, failed: [message] })

const calcErrors = (cg: ConsentGroup2): Validation => {
  const v: Validation = {}
  if (!cg.consentGroupName?.trim()) v.name = makeError('Required')
  if (!cg.accessManagement?.trim()) v.platform = makeError('Required')
  return v
}

const validationFailed = (v: Validation) => Object.values(v).some(e => !!e)

type ConsentGroupFieldValue = string | string[] | undefined | number

interface FormFieldChange {
  key: string
  value: ConsentGroupFieldValue
}

export const ConsentGroupAddEdit: React.FC<ConsentGroupAddEditProps> = ({
  id,
  consentGroup,
  consentGroups,
  closeAction,
  onConsentGroupChange,
}) => {
  const [current, setCurrent] = useState<ConsentGroup2>(consentGroup || defaultConsentGroup)
  const [validation, setValidation] = useState<Validation>({})

  const [showOtherSecondaryText, setShowOtherSecondaryText] = useState(!isNil(consentGroup?.otherSecondary))
  const [otherSecondaryText, setOtherSecondaryText] = useState(consentGroup?.otherSecondary)

  const [showGSText, setShowGSText] = useState(!isNil(consentGroup?.gs))
  const [gsText, setGSText] = useState(consentGroup?.gs || '')

  const [showOtherPrimaryText, setShowOtherPrimaryText] = useState(!isNil(consentGroup?.otherPrimary))
  const [otherPrimaryText, setOtherPrimaryText] = useState(consentGroup?.otherPrimary || '')

  const [showDiseaseSpecificUseSearchbar, setShowDiseaseSpecificUseSearchbar] = useState(!isEmpty(consentGroup?.diseaseSpecificUse))
  const [selectedDiseases, setSelectedDiseases] = useState(consentGroup?.diseaseSpecificUse || [])

  const [showMORText, setShowMORText] = useState(!isNil(consentGroup?.mor))
  const [morText, setMORText] = useState<string>(consentGroup?.morDate || '')

  const onPrimaryChange = ({ key, value }: { key: string, value: boolean | string | string[] }) => {
    setCurrent({
      ...consentGroup,
      generalResearchUse: false,
      hmb: false,
      diseaseSpecificUse: undefined,
      poa: false,
      otherPrimary: undefined,

      [key]: value,

    } as ConsentGroup2)

    setShowDiseaseSpecificUseSearchbar(key === 'diseaseSpecificUse')
    setShowOtherPrimaryText(key === 'otherPrimary')
  }

  const onChange = ({ key, value }: FormFieldChange) => {
    const next = { ...current, [key]: value } as ConsentGroup2
    setCurrent(next)
    setValidation(calcErrors(next))
  }

  const save = () => {
    if (validationFailed(calcErrors(current))) return
    const toSave: ConsentGroup2 = {
      ...current,
      consentGroupId: current.consentGroupId || crypto.randomUUID?.() || Date.now().toString(),
    }
    if (id < 0) {
      onConsentGroupChange([...consentGroups, toSave])
    }
    else {
      const copy = [...consentGroups]
      copy[id] = toSave
      onConsentGroupChange(copy)
    }
    setCurrent(defaultConsentGroup)
    closeAction()
  }

  return (
    <div className="form-group row no-margin">
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 collaborator-form-card">
        <div className="row">
          <h2>{consentGroup === undefined ? 'New Consent Group' : `Edit ${consentGroup.consentGroupName || 'Consent Group'}`}</h2>
          <FormField
            id="consentGroupName"
            title="Consent Group Name"
            placeholder="Enter a name for this consent group"
            validators={[FormValidators.REQUIRED]}
            defaultValue={consentGroup?.consentGroupName}
            onChange={onChange}
          />

          {/* controlled, open and external access */}
          <div>
            <FormField
              title="Data Access Management"
              description="Select a data access management strategy"
              id="accessManagement_controlled"
              name="accessManagement"
              value="controlled"
              type={FormFieldTypes.RADIOBUTTON}
              toggleText="Controlled Access (managed by a DAC in DUOS)"
              defaultValue={consentGroup?.accessManagement}
              onChange={({ key, value }: { key: string, value: boolean }) => {
                onPrimaryChange({ key, value })
              }}
            />

            <FormField
              id="accessManagement_open"
              name="accessManagement"
              value="open"
              type={FormFieldTypes.RADIOBUTTON}
              toggleText="Open Access (does not need DAC approval)"

              defaultValue={consentGroup?.accessManagement}
              onChange={({ key, value }: { key: string, value: boolean }) => {
                onPrimaryChange({ key, value })
              }}
            />

            <FormField
              id="accessManagement_external"
              name="accessManagement"
              value="external"
              type={FormFieldTypes.RADIOBUTTON}
              toggleText="External Access (managed by a DAC external to DUOS)"
              defaultValue={consentGroup?.accessManagement}
              onChange={({ key, value }: { key: string, value: boolean }) => {
                onPrimaryChange({ key, value })
              }}
            />
          </div>

          {/* primary */}
          {
            consentGroup?.accessManagement !== 'open' && (
              <div>
                <FormField
                  title="Primary Data Use Terms*"
                  description="Please select one of the following data use permissions for your dataset"
                  type={FormFieldTypes.RADIOBUTTON}
                  id="primaryConsent_generalResearchUse"
                  name="primaryConsent"
                  value="generalResearchUse"
                  toggleText="General Research Use"
                  defaultValue={selectedPrimaryGroup(consentGroup as ConsentGroup)}
                  onChange={({ value }: { value: string }) => {
                    onPrimaryChange({ key: value, value: true })
                  }}
                />

                <FormField
                  type={FormFieldTypes.RADIOBUTTON}
                  id="primaryConsent_hmb"
                  name="primaryConsent"
                  value="hmb"
                  toggleText="Health/Medical/Biomedical Research Use"
                  defaultValue={selectedPrimaryGroup(consentGroup as ConsentGroup)}
                  onChange={({ value }: { value: string }) => {
                    onPrimaryChange({ key: value, value: true })
                  }}

                />

                <FormField
                  type={FormFieldTypes.RADIOBUTTON}
                  id="primaryConsent_diseaseSpecificUse"
                  name="primaryConsent"
                  value="diseaseSpecificUse"
                  toggleText="Disease-Specific Research Use"
                  defaultValue={selectedPrimaryGroup(consentGroup as ConsentGroup)}
                  onChange={({ value }: { value: string }) => {
                    onPrimaryChange({
                      key: value,
                      value: selectedDiseases,
                    })
                  }}
                />
                {
                  showDiseaseSpecificUseSearchbar && (
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
                        loadOptions={searchOntologies}
                        id="diseaseSpecificUseText"
                        name="diseaseSpecificUse"
                        validators={[FormValidators.REQUIRED]}
                        placeholder="Please enter one or more diseases"
                        defaultValue={selectedDiseases}
                        onChange={({ key, value }: { key: string, value: [{ displayText: string, id: string }], isValid: boolean }) => {
                          const doids = value.map((v: { id: string }) => v.id)
                          setSelectedDiseases(value.map(val => val.displayText))
                          onChange({
                            key: key,
                            value: doids,
                          })
                        }}
                      />
                    </div>
                  )
                }
                <FormField
                  type={FormFieldTypes.RADIOBUTTON}
                  id="primaryConsent_poa"
                  name="primaryConsent"
                  value="poa"
                  toggleText="Populations, Origins, Ancestry Use"
                  defaultValue={selectedPrimaryGroup(consentGroup as ConsentGroup)}
                  onChange={({ value }: { value: string }) => {
                    onPrimaryChange({ key: value, value: true })
                  }}
                />

                <FormField
                  type={FormFieldTypes.RADIOBUTTON}
                  id="primaryConsent_otherPrimary"
                  name="primaryConsent"
                  value="otherPrimary"
                  toggleText="Other"
                  defaultValue={selectedPrimaryGroup(consentGroup as ConsentGroup)}
                  onChange={({ value }: { value: string }) => {
                    onPrimaryChange({ key: value, value: otherPrimaryText })
                  }}
                />
                {
                  showOtherPrimaryText && (
                    <FormField
                      id="otherPrimaryText"
                      name="otherPrimary"
                      validators={[FormValidators.REQUIRED]}
                      placeholder="Please specify"
                      defaultValue={otherPrimaryText}
                      onChange={({ key, value }: { key: string, value: string, isValid: boolean }) => {
                        setOtherPrimaryText(value)
                        onChange({ key: key, value: value })
                      }}
                    />
                  )
                }
              </div>
            )
          }

          {/* secondary */}
          {
            consentGroup?.accessManagement !== 'open' && (
              <div>
                <FormField
                  title="Secondary Data Use Terms"
                  description="Select all applicable data use parameters"
                  id="nmds"
                  name="nmds"
                  type={FormFieldTypes.CHECKBOX}
                  toggleText="No methods development or validation studies (NMDS)"
                  defaultValue={consentGroup?.nmds}
                  onChange={onChange}
                />

                <FormField
                  id="gso"
                  name="gso"
                  type={FormFieldTypes.CHECKBOX}
                  toggleText="Genetic studies only (GSO)"
                  defaultValue={consentGroup?.gso}
                  onChange={onChange}
                />

                <FormField
                  id="pub"
                  name="pub"
                  type={FormFieldTypes.CHECKBOX}
                  toggleText="Publication Required (PUB)"
                  defaultValue={consentGroup?.pub}
                  onChange={onChange}
                />

                <FormField
                  id="col"
                  name="col"
                  type={FormFieldTypes.CHECKBOX}
                  toggleText="Collaboration Required (COL)"
                  defaultValue={consentGroup?.col}
                  onChange={onChange}
                />

                <FormField
                  id="irb"
                  name="irb"
                  type={FormFieldTypes.CHECKBOX}
                  toggleText="Ethics Approval Required (IRB)"
                  defaultValue={consentGroup?.irb}
                  onChange={onChange}
                />

                <FormField
                  id="gs"
                  name="gs"
                  type={FormFieldTypes.CHECKBOX}
                  toggleText="Geographic Restriction (GS-)"
                  defaultValue={showGSText}
                  onChange={({ key, value }: { key: string, value: boolean }) => {
                    setShowGSText(value)

                    if (value) {
                      onChange({ key: key, value: gsText })
                    }
                    else {
                      onChange({ key: key, value: undefined })
                    }
                  }}
                />
                {
                  showGSText && (
                    <FormField
                      id="gsText"
                      name="gs"
                      validators={[FormValidators.REQUIRED]}
                      placeholder="Specify Geographic Restriction"
                      defaultValue={gsText || ''}
                      onChange={({ key, value }: { key: string, value: string, isValid: boolean }) => {
                        setGSText(value)
                        onChange({ key: key, value: value })
                      }}

                    />
                  )
                }
                <FormField
                  id="mor"
                  name="mor"
                  type={FormFieldTypes.CHECKBOX}
                  toggleText="Publication Moratorium (MOR)"
                  defaultValue={showMORText}
                  onChange={({ key, value }: { key: string, value: boolean }) => {
                    setShowMORText(value)
                    onChange({ key: key, value: (value ? morText : undefined) })
                  }}
                />
                {
                  showMORText && (
                    <FormField
                      id="morText"
                      name="mor"
                      validators={[FormValidators.REQUIRED, FormValidators.DATE]}
                      placeholder="Please specify date (YYYY-MM-DD)"
                      defaultValue={morText}
                      onChange={({ key, value }: { key: string, value: string }) => {
                        setMORText(value)
                        onChange({ key: key, value: value })
                      }}
                    />
                  )
                }

                <FormField
                  id="npu"
                  name="npu"
                  type={FormFieldTypes.CHECKBOX}
                  toggleText="Non-profit Use Only (NPU)"
                  defaultValue={consentGroup?.npu}
                  onChange={onChange}
                />

                <FormField
                  id="otherSecondary"
                  name="otherSecondary"
                  type={FormFieldTypes.CHECKBOX}
                  toggleText="Other"
                  defaultValue={showOtherSecondaryText}
                  onChange={({ key, value }: { key: string, value: boolean }) => {
                    setShowOtherSecondaryText(value)

                    if (value) {
                      onChange({ key: key, value: otherSecondaryText })
                    }
                    else {
                      onChange({ key: key, value: undefined })
                    }
                  }}
                />
                {
                  showOtherSecondaryText && (
                    <FormField
                      id="otherSecondaryText"
                      name="otherSecondary"
                      validators={[FormValidators.REQUIRED]}
                      placeholder="Please specify"
                      defaultValue={otherSecondaryText || ''}
                      onChange={({ key, value }: { key: string, value: string }) => {
                        setOtherSecondaryText(value)
                        onChange({ key: key, value: value })
                      }}
                    />
                  )
                }
              </div>
            )
          }

          {/* data access committee */}
          {
            consentGroup?.accessManagement === 'controlled' && (
              <DacPicker
                fieldId="dataAccessCommitteeId"
                fieldTitle="DataAccessCommittee (DAC)"
                initialDac={consentGroup?.dataAccessCommitteeId}
                isRequired={true}
                onChange={({ key, value }: { key: string, value: number, isValid: boolean }) => {
                  onChange({ key: key, value: value })
                }}
              />
            )
          }
        </div>

        {/* location */}
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
          <FormFieldTitle
            required={true}
            title="Data Location"
            description="Please provide the location of your data resource for this consent group"
          />
        </div>
        <div className="flex flex-row">
          <FormField
            style={{ width: '50%' }}
            id="dataLocation"
            name="dataLocation"
            type={FormFieldTypes.SELECT}
            selectOptions={[
              'AnVIL Workspace',
              'Terra Workspace',
              'TDR Location',
              'Not Determined',
            ]}
            placeholder="Data Location(s)"
            defaultValue={consentGroup?.dataLocation}
            onChange={({ key, value, isValid }: { key: string, value: string, isValid: boolean }) => {
              if (isValid) {
                setCurrent((val) => {
                  if (val) {
                    const newForm = cloneDeep(val)
                    if (value === 'Not Determined') {
                      unset(newForm, 'url')
                    }
                    return set(newForm, key, value)
                  }
                  return set({} as ConsentGroup2, key, value)
                })
              }
            }}
          />
          <FormField
            style={{ width: '50%', paddingLeft: '1.5%' }}
            id="url"
            name="url"
            validators={[FormValidators.URL]}
            disabled={consentGroup?.dataLocation === 'Not Determined'}
            placeholder="Enter a URL for your data location here"
            defaultValue={consentGroup?.dataLocation === 'Not Determined' ? '' : consentGroup?.url}
            onChange={onChange}
          />
        </div>

        <FormTable
          id="fileTypes"
          name="fileTypes"
          formFields={[
            {
              id: 'fileType',
              name: 'fileType',
              title: 'File Type',
              type: FormFieldTypes.SELECT,
              selectOptions: ['Arrays', 'Genome', 'Exome', 'Survey', 'Phenotype'],
            },
            {
              id: 'functionalEquivalence',
              name: 'functionalEquivalence',
              title: 'Functional Equivalence',
              placeholder: 'Type',
            },
          ]}
          defaultValue={consentGroup?.fileTypes}
          enableAddingRow={true}
          addRowLabel="Add New File Type"
          minLength={1}
          onChange={onChange}
        />
        <div style={{ width: '50%' }}>
          <FormField
            id="numberOfParticipants"
            name="numberOfParticipants"
            title="# of Participants"
            placeholder="Number"
            type={FormFieldTypes.NUMBER}
            validators={[FormValidators.REQUIRED]}
            defaultValue={consentGroup?.numberOfParticipants}
            onChange={onChange}
          />
        </div>
        <div className="row" style={{ marginTop: 20 }}>
          <button
            className="collaborator-form-add-save-button f-left btn"
            type="button"
            onClick={save}
            disabled={validationFailed(calcErrors(current))}
          >
            {consentGroup === undefined ? 'Add' : 'Save'}
          </button>
          <button
            className="collaborator-form-cancel-button f-left btn"
            type="button"
            onClick={closeAction}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
