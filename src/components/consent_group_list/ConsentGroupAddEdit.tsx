import { set, unset } from 'src/utils/NodashUtil'
import React, { useState } from 'react'
import { FormField, FormFieldTitle, FormFieldTypes, FormTable, FormValidators } from 'src/components/forms/forms'
import { CloudProviders } from 'src/components/forms/CloudProviders'
import { ValidationError, makeError } from 'src/pages/dar_application/FormValidationState'
import { ConsentGroup2 } from 'src/pages/data_submission/consent_group/consentGroupUtils'
import DataUseTermsFields, { DataUseTerms, DataUseTermsValidation, dataUseTermsErrors } from 'src/components/forms/DataUseTermsFields'
import { DacPicker } from 'src/components/forms/DacPicker'
import { FileInput } from 'src/components/forms/FileInput'
import { DataSet } from 'src/libs/ajax/DataSet'
import { DataLocationType } from 'src/pages/data_submission/v2/v2-models'
import { DatasetDataKeys } from 'src/libs/data-metadata'

interface ConsentGroupAddEditProps {
  readonly id: number
  readonly consentGroup?: ConsentGroup2
  readonly consentGroups: ConsentGroup2[]
  readonly closeAction: () => void
  readonly onConsentGroupChange: (items: ConsentGroup2[]) => void
  readonly readOnly?: boolean
}

interface Validation extends DataUseTermsValidation {
  consentGroupName?: ValidationError
  numberOfParticipants?: ValidationError
  dataAccessCommitteeId?: ValidationError
}

const defaultConsentGroup: ConsentGroup2 = {
  consentGroupName: '',
  numberOfParticipants: 0,
  name: '',
  consentGroupId: '',
}

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

  const disableAccessAdjustment = consentGroup?.datasetId !== undefined && current.accessManagement === 'controlled'
  const [editDataLocationUrl, setEditDataLocationUrl] = useState(consentGroup?.dataLocation !== 'Not Determined')

  const onTermsChange = (changed: DataUseTerms) => {
    const next: ConsentGroup2 = { ...structuredClone(current), ...changed }
    if (next.accessManagement !== current.accessManagement && next.accessManagement !== 'controlled') {
      next.dataAccessCommitteeId = undefined
    }
    setCurrent(next)
    setValidation(calcErrors(next))
  }

  const calcErrors = (cg: ConsentGroup2): Validation => {
    const v: Validation = {}
    if (!cg.consentGroupName?.trim()) v.consentGroupName = makeError('required')
    if (!cg.numberOfParticipants || cg.numberOfParticipants <= 0) v.numberOfParticipants = makeError('greaterThanZero')
    if (cg.accessManagement === 'controlled' && !cg.dataAccessCommitteeId) {
      v.dataAccessCommitteeId = makeError('required')
    }
    Object.assign(v, dataUseTermsErrors(cg))
    return v
  }

  const onChange = ({ key, value }: FormFieldChange) => {
    const next = structuredClone(current)
    set(next, key, value)
    setCurrent(next)
    setValidation(calcErrors(next))
  }

  const onDatasetDataChange = ({ key, value }: { key: string, value: unknown }) => {
    const next = structuredClone(current)
    next.data ??= {}
    set(next.data, key, value)
    setCurrent(next)
  }

  const save = () => {
    const validationErrors = calcErrors(current)
    setValidation(validationErrors)
    if (validationFailed(validationErrors)) return
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
          <FormField
            id={DatasetDataKeys.TAGS}
            name={DatasetDataKeys.TAGS}
            title="Tags"
            placeholder="Add tags to help others find your dataset (e.g. disease area, assay type, etc.)"
            type={FormFieldTypes.SELECT}
            isCreatable={true}
            isMulti={true}
            optionsAreString={true}
            onChange={onDatasetDataChange}
            disabled={readOnly}
            defaultValue={current?.data?.[DatasetDataKeys.TAGS] || []}
            selectOptions={(current?.data?.[DatasetDataKeys.TAGS] as string[]) || []}
            selectConfig={{
              components: {
                DropdownIndicator: null,
                Menu: () => null,
              },
            }}
          />

          <DataUseTermsFields
            terms={current}
            onChange={onTermsChange}
            validation={validation}
            readOnly={readOnly}
            accessDisabled={disableAccessAdjustment}
          />

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

          {/* location */}
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
            <FormFieldTitle
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
                DataLocationType.AnVILWorkspace,
                DataLocationType.TerraWorkspace,
                DataLocationType.TDRLocation,
                DataLocationType.NotDetermined,
                DataLocationType.Other,
              ]}
              placeholder="Data Location(s)"
              defaultValue={current?.dataLocation}
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

          <FormField
            id={DatasetDataKeys.CLOUD}
            name={DatasetDataKeys.CLOUD}
            title="Cloud"
            placeholder="Select or enter cloud environment"
            type={FormFieldTypes.SELECT}
            isCreatable={true}
            isMulti={true}
            optionsAreString={true}
            selectOptions={CloudProviders.VALUES.map(provider => provider.name)}
            defaultValue={current?.data?.[DatasetDataKeys.CLOUD]}
            onChange={onDatasetDataChange}
            disabled={readOnly}
          />

          <FormField
            id="requestLocation"
            name="requestLocation"
            title="Request Location"
            description="URL of an external location where data access requests should be submitted (e.g. a DAC website or data access request form)"
            placeholder="https://..."
            validators={[FormValidators.URL]}
            defaultValue={consentGroup?.requestLocation}
            onChange={onChange}
            disabled={readOnly}
          />

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
    </div>
  )
}
