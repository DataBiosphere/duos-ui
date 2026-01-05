import { isNil, isEmpty, set, unset } from 'lodash'
import React, { useState, useEffect } from 'react'
import { FormField, FormFieldTitle, FormFieldTypes, FormTable, FormValidators } from 'src/components/forms/forms'
import { findOntologyTerms, searchOntologyTerm } from 'src/libs/utils'
import { ValidationError } from 'src/pages/dar_application/FormValidationState'
import { AccessManagementType, ConsentGroup, ConsentGroup2, selectedPrimaryGroup } from 'src/pages/data_submission/consent_group/consentGroupUtils'
import { DacPicker } from 'src/components/forms/DacPicker'
import { FileInput } from 'src/components/forms/FileInput'
import { DataSet } from 'src/libs/ajax/DataSet'

interface ConsentGroupAddEditProps {
  readonly id: number
  readonly consentGroup?: ConsentGroup2
  readonly consentGroups: ConsentGroup2[]
  readonly closeAction: () => void
  readonly onConsentGroupChange: (items: ConsentGroup2[]) => void
  readonly readOnly?: boolean
}

interface Validation {
  consentGroupName?: ValidationError
  accessManagement?: ValidationError
  numberOfParticipants?: ValidationError
  dataAccessCommitteeId?: ValidationError
  dataLocation?: ValidationError
  primaryConsent?: ValidationError
  gs?: ValidationError
  mor?: ValidationError
  otherSecondary?: ValidationError
  otherPrimary?: ValidationError
  diseaseSpecificUse?: ValidationError
}

const defaultConsentGroup: ConsentGroup2 = {
  consentGroupName: '',
  numberOfParticipants: 0,
  name: '',
  consentGroupId: '',
}

const makeError = (message: string): ValidationError => ({ valid: true, failed: [message] })

const validationFailed = (v: Validation) => Object.values(v).some(e => !!e)

type ConsentGroupFieldValue = string | string[] | undefined | number | File | boolean

interface FormFieldChange {
  key: string
  value: ConsentGroupFieldValue
}

const getHeaderTitle = (readOnly: boolean, consentGroup?: ConsentGroup2) => {
  if (readOnly) return consentGroup?.consentGroupName
  if (!consentGroup) return 'New Dataset'
  return `Edit ${consentGroup.consentGroupName}`
}

export default function ConsentGroupAddEdit(props: ConsentGroupAddEditProps): React.JSX.Element {
  const { id, consentGroup, consentGroups, closeAction, onConsentGroupChange, readOnly = false } = props

  const [current, setCurrent] = useState<ConsentGroup2>(consentGroup || defaultConsentGroup)
  const [validation, setValidation] = useState<Validation>({})

  const [showOtherSecondaryText, setShowOtherSecondaryText] = useState(!isNil(consentGroup?.otherSecondary))
  const [otherSecondaryText, setOtherSecondaryText] = useState(consentGroup?.otherSecondary)

  const [showGSText, setShowGSText] = useState(!isNil(consentGroup?.gs))
  const [gsText, setGSText] = useState(consentGroup?.gs || undefined)

  const [showOtherPrimaryText, setShowOtherPrimaryText] = useState(!isNil(consentGroup?.otherPrimary))
  const [otherPrimaryText, setOtherPrimaryText] = useState(consentGroup?.otherPrimary || undefined)

  const [showDiseaseSpecificUseSearchbar, setShowDiseaseSpecificUseSearchbar] = useState(!isEmpty(consentGroup?.diseaseSpecificUse))
  const [selectedDiseases, setSelectedDiseases] = useState<{ displayText: string, id: string }[]>([])

  useEffect(() => {
    let mounted = true
    const loadOntologyTerms = async () => {
      if (!isEmpty(consentGroup?.diseaseSpecificUse)) {
        try {
          const terms = await findOntologyTerms(consentGroup!.diseaseSpecificUse)
          if (mounted && Array.isArray(terms)) {
            setSelectedDiseases(terms)
          }
        }
        catch (_e) {
          // ignore errors and leave selectedDiseases as empty array
        }
      }
    }
    loadOntologyTerms()
    return () => {
      mounted = false
    }
  }, [consentGroup?.diseaseSpecificUse])

  const [showMORText, setShowMORText] = useState(consentGroup?.mor)
  const [morText, setMORText] = useState(consentGroup?.morDate || undefined)
  const disableAccessAdjustment = consentGroup?.datasetId !== undefined && current.accessManagement === 'controlled'
  const [editDataLocationUrl, setEditDataLocationUrl] = useState(consentGroup?.dataLocation !== 'Not Determined')

  const onAccessTypeChange = ({ _key, value }: { _key: string, value: string }) => {
    const clearedFields = {} as ConsentGroup2
    clearedFields.consentGroupName = current.consentGroupName
    clearedFields.accessManagement = value as AccessManagementType
    clearedFields.numberOfParticipants = current.numberOfParticipants
    clearedFields.dataLocation = current.dataLocation
    clearedFields.url = current.url
    setCurrent(
      clearedFields)
    setShowOtherSecondaryText(false)
    setShowGSText(false)
    setShowOtherPrimaryText(false)
    setShowMORText(false)

    if (value === 'open') {
      setOtherPrimaryText(undefined)
      setShowOtherPrimaryText(false)
      setSelectedDiseases([])
      setShowDiseaseSpecificUseSearchbar(false)
      setShowMORText(false)
    }
    setValidation(calcErrors(current))
  }

  const onPrimaryChange = ({ key, value }: { key: string, value: boolean | string | string[] | { displayText: string, id: string }[] }) => {
    const next = structuredClone(current) as ConsentGroup2
    next.generalResearchUse = false
    next.hmb = false
    next.diseaseSpecificUse = undefined
    next.poa = false
    next.otherPrimary = undefined
    set(next, key, value)
    setCurrent(next)

    setShowDiseaseSpecificUseSearchbar(key === 'diseaseSpecificUse')
    setShowOtherPrimaryText(key === 'otherPrimary')
    if (!current.otherPrimary) {
      setOtherPrimaryText(undefined)
    }
    if (!current.diseaseSpecificUse) {
      setSelectedDiseases([])
    }
    setShowDiseaseSpecificUseSearchbar(key === 'diseaseSpecificUse')
    setShowOtherPrimaryText(key === 'otherPrimary')

    setValidation(calcErrors(current))
  }

  const calcErrors = (cg: ConsentGroup2): Validation => {
    const v: Validation = {}
    if (!cg.consentGroupName?.trim()) v.consentGroupName = makeError('Required')
    if (!cg.accessManagement?.trim()) v.accessManagement = makeError('Required')
    if (!cg.numberOfParticipants || cg.numberOfParticipants <= 0) v.numberOfParticipants = makeError('Must be greater than zero')
    if (cg.accessManagement === 'controlled' && !cg.dataAccessCommitteeId) {
      v.dataAccessCommitteeId = makeError('Required')
    }
    if (cg.accessManagement !== 'open' && !selectedPrimaryGroup(cg as ConsentGroup)) {
      v.primaryConsent = makeError('Required')
    }
    if (showDiseaseSpecificUseSearchbar && (isNil(cg.diseaseSpecificUse) || cg.diseaseSpecificUse.length === 0)) {
      v.diseaseSpecificUse = makeError('Required')
    }
    if (showOtherPrimaryText && (!cg.otherPrimary?.trim())) {
      v.otherPrimary = makeError('Required')
    }
    if (!cg.dataLocation?.trim()) v.dataLocation = makeError('Required')
    if (showGSText && (!cg.gs?.trim())) {
      v.gs = makeError('Required')
    }
    if (showMORText && (!cg.morDate?.trim())) {
      v.mor = makeError('Required')
    }
    if (showOtherSecondaryText && (!cg.otherSecondary?.trim())) {
      v.otherSecondary = makeError('Required')
    }
    return v
  }

  const onChange = ({ key, value }: FormFieldChange) => {
    const next = structuredClone(current)
    set(next, key, value)
    setCurrent(next)
    setValidation(calcErrors(next))
  }

  const save = () => {
    if (validationFailed(calcErrors(current))) return
    const toSave: ConsentGroup2 = structuredClone(current)
    toSave.consentGroupId = current.consentGroupId || crypto.randomUUID?.() || Date.now().toString()
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

  const headerTitle = getHeaderTitle(readOnly, consentGroup)

  return (
    <div className="form-group row no-margin">
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 collaborator-form-card">
        <div className="row">
          <h2>{headerTitle}</h2>
          <FormField
            id="consentGroupName"
            title="Dataset Name"
            placeholder="Enter a name for this dataset"
            validators={[FormValidators.REQUIRED]}
            defaultValue={current?.consentGroupName}
            onChange={onChange}
            validation={validation.consentGroupName}
            disabled={readOnly}
          />

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
              defaultValue={current?.accessManagement}
              onChange={onAccessTypeChange}
              validation={validation.accessManagement}
              disabled={readOnly || disableAccessAdjustment}
            />

            <FormField
              id="accessManagement_open"
              name="accessManagement"
              value="open"
              type={FormFieldTypes.RADIOBUTTON}
              toggleText="Open Access (does not need DAC approval)"
              defaultValue={current?.accessManagement}
              onChange={onAccessTypeChange}
              validation={validation.accessManagement}
              disabled={readOnly || disableAccessAdjustment}
            />

            <FormField
              id="accessManagement_external"
              name="accessManagement"
              value="external"
              type={FormFieldTypes.RADIOBUTTON}
              toggleText="External Access (managed by a DAC external to DUOS)"
              defaultValue={current?.accessManagement}
              onChange={onAccessTypeChange}
              validation={validation.accessManagement}
              disabled={readOnly || disableAccessAdjustment}
            />
          </div>

          {/* primary */}
          {
            current?.accessManagement !== 'open' && (
              <div>
                <FormField
                  title="Primary Data Use Terms*"
                  description="Please select one of the following data use permissions for your dataset"
                  type={FormFieldTypes.RADIOBUTTON}
                  id="primaryConsent_generalResearchUse"
                  name="primaryConsent"
                  value="generalResearchUse"
                  toggleText="General Research Use"
                  defaultValue={selectedPrimaryGroup(current as ConsentGroup)}
                  onChange={({ value }: { value: string }) => {
                    onPrimaryChange({ key: value, value: true })
                  }}
                  validation={validation.primaryConsent}
                  disabled={readOnly}
                />

                <FormField
                  type={FormFieldTypes.RADIOBUTTON}
                  id="primaryConsent_hmb"
                  name="primaryConsent"
                  value="hmb"
                  toggleText="Health/Medical/Biomedical Research Use"
                  defaultValue={selectedPrimaryGroup(current as ConsentGroup)}
                  onChange={({ value }: { value: string }) => {
                    onPrimaryChange({ key: value, value: true })
                  }}
                  validation={validation.primaryConsent}
                  disabled={readOnly}
                />

                <FormField
                  type={FormFieldTypes.RADIOBUTTON}
                  id="primaryConsent_diseaseSpecificUse"
                  name="primaryConsent"
                  value="diseaseSpecificUse"
                  toggleText="Disease-Specific Research Use"
                  defaultValue={selectedPrimaryGroup(current as ConsentGroup)}
                  onChange={({ value }: { value: string }) => {
                    onPrimaryChange({
                      key: value,
                      value: selectedDiseases,
                    })
                  }}
                  validation={validation.primaryConsent}
                  disabled={readOnly}
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
                        loadOptions={searchOntologyTerm}
                        id="diseaseSpecificUseText"
                        name="diseaseSpecificUse"
                        validators={[FormValidators.REQUIRED]}
                        placeholder="Please enter one or more diseases"
                        defaultValue={selectedDiseases}
                        onChange={({ key, value }: { key: string, value: [{ displayText: string, id: string }], isValid: boolean }) => {
                          const doids = value.map((v: { id: string }) => v.id)

                          setSelectedDiseases(value)
                          onChange({
                            key: key,
                            value: doids,
                          })
                        }}
                        validation={validation.diseaseSpecificUse}
                        disabled={readOnly}
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
                  defaultValue={selectedPrimaryGroup(current as ConsentGroup)}
                  onChange={({ value }: { value: string }) => {
                    onPrimaryChange({ key: value, value: true })
                  }}
                  disabled={readOnly}
                />

                <FormField
                  type={FormFieldTypes.RADIOBUTTON}
                  id="primaryConsent_otherPrimary"
                  name="primaryConsent"
                  value="otherPrimary"
                  toggleText="Other"
                  defaultValue={selectedPrimaryGroup(current as ConsentGroup)}
                  onChange={({ value }: { value: string }) => {
                    onPrimaryChange({ key: value, value: value })
                  }}
                  disabled={readOnly}
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
            current?.accessManagement !== 'open' && (
              <div>
                <FormField
                  title="Secondary Data Use Terms"
                  description="Select all applicable data use parameters"
                  id="nmds"
                  name="nmds"
                  type={FormFieldTypes.CHECKBOX}
                  toggleText="No methods development or validation studies (NMDS)"
                  defaultValue={current?.nmds}
                  onChange={onChange}
                  disabled={readOnly}
                />

                <FormField
                  id="gso"
                  name="gso"
                  type={FormFieldTypes.CHECKBOX}
                  toggleText="Genetic studies only (GSO)"
                  defaultValue={current?.gso}
                  onChange={onChange}
                  disabled={readOnly}
                />

                <FormField
                  id="pub"
                  name="pub"
                  type={FormFieldTypes.CHECKBOX}
                  toggleText="Publication Required (PUB)"
                  defaultValue={current?.pub}
                  onChange={onChange}
                  disabled={readOnly}
                />

                <FormField
                  id="col"
                  name="col"
                  type={FormFieldTypes.CHECKBOX}
                  toggleText="Collaboration Required (COL)"
                  defaultValue={current?.col}
                  onChange={onChange}
                  disabled={readOnly}
                />

                <FormField
                  id="irb"
                  name="irb"
                  type={FormFieldTypes.CHECKBOX}
                  toggleText="Ethics Approval Required (IRB)"
                  defaultValue={current?.irb}
                  onChange={onChange}
                  disabled={readOnly}
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
                      setGSText(undefined)
                    }
                  }}
                  disabled={readOnly}
                />
                {
                  showGSText && (
                    <FormField
                      id="gsText"
                      name="gs"
                      validators={[FormValidators.REQUIRED]}
                      placeholder="Specify Geographic Restriction"
                      defaultValue={current?.gs}
                      onChange={({ key, value }: { key: string, value: string, isValid: boolean }) => {
                        setGSText(value)
                        onChange({ key: key, value: value })
                      }}
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
                  defaultValue={showMORText}
                  onChange={({ key, value }: { key: string, value: boolean }) => {
                    setShowMORText(value)
                    onChange({ key: key, value: value })
                    if (!value) {
                      setMORText(undefined)
                    }
                  }}
                  disabled={readOnly}
                />
                {
                  showMORText && (
                    <FormField
                      id="morText"
                      name="morDate"
                      validators={[FormValidators.REQUIRED, FormValidators.DATE]}
                      placeholder="Please specify date (YYYY-MM-DD)"
                      defaultValue={morText}
                      onChange={({ key, value }: { key: string, value: string }) => {
                        onChange({ key: key, value: value })
                      }}
                      validation={validation.mor}
                      disabled={readOnly}
                    />
                  )
                }

                <FormField
                  id="npu"
                  name="npu"
                  type={FormFieldTypes.CHECKBOX}
                  toggleText="Non-profit Use Only (NPU)"
                  defaultValue={current?.npu}
                  onChange={onChange}
                  disabled={readOnly}
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
                      setOtherSecondaryText(undefined)
                    }
                  }}
                  disabled={readOnly}
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
                      validation={validation.otherSecondary}
                      disabled={readOnly}
                    />
                  )
                }
              </div>
            )
          }

          {/* data access committee */}
          {
            current?.accessManagement === 'controlled' && (
              <DacPicker
                fieldId="dataAccessCommitteeId"
                fieldTitle="Data Access Committee (DAC)"
                initialDac={current?.dataAccessCommitteeId}
                isRequired={true}
                onChange={({ key, value }: { key: string, value: number, isValid: boolean }) => {
                  onChange({ key: key, value: value })
                }}
                disabled={readOnly || (current?.datasetId !== undefined)}
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
            disabled={readOnly}
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
            defaultValue={current?.dataLocation}
            validation={validation.dataLocation}
            onChange={({ key, value }: { key: string, value: string }) => {
              if (value === 'Not Determined') {
                const next = structuredClone(current)
                set(next, key, 'Not Determined')
                unset(next, 'url')
                setCurrent(next)
                setValidation(calcErrors(next))
                setEditDataLocationUrl(false)
              }
              else {
                onChange({ key, value })
                setEditDataLocationUrl(true)
              }
            }}
            disabled={readOnly}
          />
          <FormField
            style={{ width: '50%', paddingLeft: '1.5%' }}
            id="url"
            name="url"
            validators={[FormValidators.URL]}
            disabled={!editDataLocationUrl || readOnly}
            placeholder="Enter a URL for your data location here"
            defaultValue={current?.dataLocation === 'Not Determined' ? undefined : consentGroup?.url}
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
              disabled: readOnly,
            },
            {
              id: 'functionalEquivalence',
              name: 'functionalEquivalence',
              title: 'Functional Equivalence',
              placeholder: 'Type',
              disabled: readOnly,
            },
          ]}
          defaultValue={current?.fileTypes}
          enableAddingRow={!readOnly}
          addRowLabel="Add New File Type"
          minLength={1}
          onChange={onChange}
          disabled={readOnly}
        />
        <div style={{ width: '50%' }}>
          <FormField
            id="numberOfParticipants"
            name="numberOfParticipants"
            title="# of Participants"
            placeholder="Number"
            type={FormFieldTypes.NUMBER}
            validators={[FormValidators.REQUIRED]}
            defaultValue={current?.numberOfParticipants}
            onChange={onChange}
            validation={validation.numberOfParticipants}
            disabled={readOnly}
          />
        </div>
        <div className="row" style={{ marginTop: 20 }}>
          <FileInput
            description="If an Institutional Certification for this consent group exists, please upload it here"
            id="addedNIHInstitutionalCertificationFile"
            defaultValue={current.addedNIHInstitutionalCertificationFile}
            storedValue={current.nihInstitutionalCertificationFile}
            onAddFile={function (file: File, id: string): void {
              onChange({ key: id, value: file })
            }}
            onDeleteFile={function (id: string): void {
              onChange({ key: id, value: undefined })
            }}
            title="NIH Institutional Certification"
            disabled={readOnly}
            onClick={current.nihInstitutionalCertificationFile ? () => { DataSet.getNIHInstitutionalCertification(current.datasetId) } : undefined}
          />
        </div>
        <div className="row" style={{ marginTop: 20 }}>
          {!readOnly && (
            <button
              className="collaborator-form-add-save-button f-left btn"
              type="button"
              onClick={save}
            >
              {consentGroup === undefined ? 'Add' : 'Save'}
            </button>
          )}
          <button
            className="collaborator-form-cancel-button f-left btn"
            type="button"
            onClick={closeAction}
          >
            {readOnly ? 'Close' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}
