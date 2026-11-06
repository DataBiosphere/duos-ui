import { set, unset } from 'src/utils/NodashUtil'
import React, { useState } from 'react'
import { FormField, FormFieldTitle, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import { CloudProviders } from 'src/components/forms/CloudProviders'
import { ValidationError, makeError } from 'src/pages/dar_application/FormValidationState'
import { ConsentGroup2 } from 'src/pages/data_submission/consent_group/consentGroupUtils'
import DataUseTermsFields, { DataUseTerms, DataUseTermsValidation, dataUseTermsErrors } from 'src/components/forms/DataUseTermsFields'
import { DacPicker } from 'src/components/forms/DacPicker'
import { FileInput } from 'src/components/forms/FileInput'
import { DataSet } from 'src/libs/ajax/DataSet'
import { DataLocationType } from 'src/pages/data_submission/v2/v2-models'
import { DatasetDataKeys, StorageProfileMetadata } from 'src/libs/data-metadata'
import type { StudyInheritance } from 'src/pages/data_submission/v2/v2-common-functions'
import {
  DATASET_PUBLIC_VISIBILITY_HELP,
  TARGET_DELIVERY_DATE_HELP,
  TARGET_PUBLIC_RELEASE_DATE_HELP,
} from 'src/pages/data_submission/v2/releaseGuidance'
import { StorageProfiles } from 'src/components/consent_group_list/StorageProfiles'
import {
  StorageProfileValidation,
  fileTypesFromProfiles,
  storageProfileErrors,
  storageProfilesFor,
} from 'src/components/consent_group_list/storageProfileUtils'
import { normalizeDoi } from 'src/components/forms/formValidation'
import { PopulationFields } from 'src/pages/data_submission/v2/PopulationFields'
import { PopulationValidation, populationErrors } from 'src/pages/data_submission/v2/population'
import { isEmpty } from 'src/utils/NodashUtil'
import { TAGS_ENTRY_GUIDANCE } from 'src/components/forms/formGuidance'

const CONSENT_DOCUMENT_TITLE = 'Consent / Data Use Documentation'
const CONSENT_DOCUMENT_DESCRIPTION = 'Upload the document that establishes how this dataset may be used, '
  + 'for example an NIH Institutional Certification or an Institutional Data Use Letter.'

interface ConsentGroupAddEditProps {
  readonly id: number
  readonly consentGroup?: ConsentGroup2
  readonly consentGroups: ConsentGroup2[]
  readonly closeAction: () => void
  readonly onConsentGroupChange: (items: ConsentGroup2[]) => void
  readonly readOnly?: boolean
  /**
   * What this dataset takes from the study. A value shared across the study's assets is shown here
   * read-only; one that isn't must be entered here. Absent, everything reads as shared.
   */
  readonly inheritance?: StudyInheritance
}

interface Validation extends DataUseTermsValidation {
  consentGroupName?: ValidationError
  numberOfParticipants?: ValidationError
  dataAccessCommitteeId?: ValidationError
  doi?: ValidationError
  storageProfiles?: Record<number, StorageProfileValidation>
  population?: PopulationValidation
  targetDeliveryDate?: ValidationError
  targetPublicReleaseDate?: ValidationError
  publicVisibility?: ValidationError
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
  const {
    id, consentGroup, consentGroups, closeAction, onConsentGroupChange, readOnly = false,
    inheritance,
  } = props
  const {
    populationSameAcrossAssets = true, studyPopulation,
    targetDatesSameAcrossAssets = true, studyTargetDeliveryDate, studyTargetPublicReleaseDate,
    publicVisibilitySameAcrossAssets = true, studyPublicVisibility,
  } = inheritance ?? {}

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
    if (cg.data?.doi !== undefined && !FormValidators.DOI.isValid(cg.data.doi)) {
      v.doi = makeError(FormValidators.DOI.id)
    }
    const storage = storageProfileErrors(cg.data?.storageProfiles)
    if (!isEmpty(storage)) v.storageProfiles = storage
    if (!populationSameAcrossAssets) {
      const population = populationErrors(cg.data?.population)
      if (!isEmpty(population)) v.population = population
    }
    if (!targetDatesSameAcrossAssets) {
      if (!cg.data?.targetDeliveryDate) v.targetDeliveryDate = makeError('required')
      if (!cg.data?.targetPublicReleaseDate) v.targetPublicReleaseDate = makeError('required')
    }
    if (!publicVisibilitySameAcrossAssets && typeof cg.data?.publicVisibility !== 'boolean') {
      v.publicVisibility = makeError('required')
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
    if (value === undefined || value === '') {
      unset(next.data, key)
    }
    else {
      set(next.data, key, value)
    }
    setCurrent(next)
    setValidation(calcErrors(next))
  }

  const storageProfiles = storageProfilesFor(current?.data?.storageProfiles, current?.fileTypes)

  /** Consent's `fileTypes` are kept derived from the profiles, so the two never disagree. */
  const onStorageProfilesChange = (profiles: StorageProfileMetadata[]) => {
    const next = structuredClone(current)
    next.data = { ...next.data, storageProfiles: profiles }
    next.fileTypes = fileTypesFromProfiles(profiles)
    setCurrent(next)
    setValidation(calcErrors(next))
  }

  const save = () => {
    const validationErrors = calcErrors(current)
    setValidation(validationErrors)
    if (validationFailed(validationErrors)) return
    const toSave: ConsentGroup2 = structuredClone(current)
    // Normalized here, not as typed, so a pasted https://doi.org/ URL doesn't jump while it's entered.
    if (toSave.data?.doi) toSave.data.doi = normalizeDoi(toSave.data.doi)
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
          <div className="dsf-group" data-cy="dataset-details">
            <FormFieldTitle title="Dataset Details" disabled={readOnly} />
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
              id={DatasetDataKeys.DESCRIPTION}
              name={DatasetDataKeys.DESCRIPTION}
              title="Dataset Description"
              description="General annotations about this dataset"
              placeholder="Description"
              type={FormFieldTypes.TEXTAREA}
              rows={4}
              defaultValue={current?.data?.description}
              onChange={onDatasetDataChange}
              disabled={readOnly}
            />
            <FormField
              id={DatasetDataKeys.DATA_COLLECTION_CONTEXT}
              name={DatasetDataKeys.DATA_COLLECTION_CONTEXT}
              title="Data Collection Context"
              description="Describe how this dataset was collected, and any biases or nuances a requester should understand."
              placeholder="Data collection context"
              type={FormFieldTypes.TEXTAREA}
              rows={4}
              defaultValue={current?.data?.dataCollectionContext}
              onChange={onDatasetDataChange}
              disabled={readOnly}
            />
            <FormField
              id={DatasetDataKeys.DOI}
              name={DatasetDataKeys.DOI}
              title="DOI (Digital Object Identifier)"
              placeholder="e.g. 10.1000/xyz123"
              validators={[FormValidators.DOI]}
              validation={validation.doi}
              defaultValue={current?.data?.doi}
              onChange={onDatasetDataChange}
              disabled={readOnly}
            />
            <FormField
              id={DatasetDataKeys.TAGS}
              name={DatasetDataKeys.TAGS}
              title="Dataset Tags"
              description={TAGS_ENTRY_GUIDANCE}
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
          </div>

          <div className="dsf-group" data-cy="dataset-population">
            <FormFieldTitle
              title="Population"
              description={populationSameAcrossAssets
                ? 'Population is the same across all assets in this study, so these values come from the study and apply to this dataset.'
                : 'Describe the population of this dataset.'}
              disabled={readOnly}
            />
            <PopulationFields
              idPrefix="dataset-population-"
              population={populationSameAcrossAssets ? studyPopulation : current?.data?.population}
              onChange={value => onDatasetDataChange({ key: DatasetDataKeys.POPULATION, value })}
              validation={populationSameAcrossAssets ? {} : validation.population}
              disabled={readOnly || populationSameAcrossAssets}
            />
          </div>

          <div className="dsf-group" data-cy="dataset-release">
            <FormFieldTitle
              title="Target Release Dates"
              description={targetDatesSameAcrossAssets
                ? 'Set for all assets in this study.'
                : 'Set this dataset\'s target dates.'}
              disabled={readOnly}
            />
            <div className="flex flex-row" style={{ justifyContent: 'space-between' }}>
              <FormField
                style={{ width: '48%' }}
                id={DatasetDataKeys.TARGET_DELIVERY_DATE}
                name={DatasetDataKeys.TARGET_DELIVERY_DATE}
                title="Target Delivery Date"
                description={TARGET_DELIVERY_DATE_HELP}
                type={FormFieldTypes.CALENDAR}
                validators={targetDatesSameAcrossAssets ? [FormValidators.DATE] : [FormValidators.REQUIRED, FormValidators.DATE]}
                validation={validation.targetDeliveryDate}
                defaultValue={targetDatesSameAcrossAssets ? studyTargetDeliveryDate : current?.data?.targetDeliveryDate}
                onChange={onDatasetDataChange}
                disabled={readOnly || targetDatesSameAcrossAssets}
              />
              <FormField
                style={{ width: '48%' }}
                id={DatasetDataKeys.TARGET_PUBLIC_RELEASE_DATE}
                name={DatasetDataKeys.TARGET_PUBLIC_RELEASE_DATE}
                title="Target Public Release Date"
                description={TARGET_PUBLIC_RELEASE_DATE_HELP}
                type={FormFieldTypes.CALENDAR}
                validators={targetDatesSameAcrossAssets ? [FormValidators.DATE] : [FormValidators.REQUIRED, FormValidators.DATE]}
                validation={validation.targetPublicReleaseDate}
                defaultValue={targetDatesSameAcrossAssets ? studyTargetPublicReleaseDate : current?.data?.targetPublicReleaseDate}
                onChange={onDatasetDataChange}
                disabled={readOnly || targetDatesSameAcrossAssets}
              />
            </div>
          </div>

          <div className="dsf-group" data-cy="dataset-visibility">
            <FormFieldTitle
              title="Public Visibility"
              description={publicVisibilitySameAcrossAssets
                ? `${DATASET_PUBLIC_VISIBILITY_HELP} Set for all assets in this study.`
                : DATASET_PUBLIC_VISIBILITY_HELP}
              disabled={readOnly}
            />
            <FormField
              id={DatasetDataKeys.PUBLIC_VISIBILITY}
              name={DatasetDataKeys.PUBLIC_VISIBILITY}
              title="Public Visibility"
              hideTitle={true}
              type={FormFieldTypes.RADIOGROUP}
              orientation="horizontal"
              options={[
                { name: true, text: 'Visible and available for requests' },
                { name: false, text: 'Not visible' },
              ]}
              validators={publicVisibilitySameAcrossAssets ? [] : [FormValidators.REQUIRED]}
              validation={validation.publicVisibility}
              defaultValue={publicVisibilitySameAcrossAssets ? studyPublicVisibility : current?.data?.publicVisibility}
              onChange={onDatasetDataChange}
              disabled={readOnly || publicVisibilitySameAcrossAssets}
            />
          </div>

          <div className="dsf-group" data-cy="dataset-data-use">
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
          </div>

          <div className="dsf-group" data-cy="dataset-location">
            {/* location */}
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
              <FormFieldTitle
                title="Data Location"
                description="Please provide the location of your data resource for this consent group"
                disabled={readOnly}
              />
            </div>
            <div>
              <FormField
                id="dataLocation"
                name="dataLocation"
                type={FormFieldTypes.BUTTONGROUP}
                options={[
                  DataLocationType.AnVILWorkspace,
                  DataLocationType.TerraWorkspace,
                  DataLocationType.TDRLocation,
                  DataLocationType.NotDetermined,
                  DataLocationType.Other,
                ]}
                defaultValue={current?.dataLocation}
                onChange={({ key, value }: { key: string, value: string }) => {
                  // Deselected: Consent's dataLocation is an enum, so an empty string can't be sent.
                  if (!value) {
                    const next = structuredClone(current)
                    unset(next, key)
                    setCurrent(next)
                    setValidation(calcErrors(next))
                    setEditDataLocationUrl(true)
                  }
                  else if (value === 'Not Determined') {
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
              type={FormFieldTypes.BUTTONGROUP}
              allowCustom={true}
              isMulti={true}
              options={CloudProviders.VALUES.map(provider => provider.name)}
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
          </div>

          <StorageProfiles
            profiles={storageProfiles}
            onChange={onStorageProfilesChange}
            validation={validation.storageProfiles}
            disabled={readOnly}
          />
          <div className="dsf-group" data-cy="dataset-participants">
            <FormFieldTitle title="Participants & Documentation" disabled={readOnly} />
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
                description={CONSENT_DOCUMENT_DESCRIPTION}
                id="addedNIHInstitutionalCertificationFile"
                defaultValue={current.addedNIHInstitutionalCertificationFile}
                storedValue={current.nihInstitutionalCertificationFile}
                onAddFile={function (file: File, id: string): void {
                  onChange({ key: id, value: file })
                }}
                onDeleteFile={function (id: string): void {
                  onChange({ key: id, value: undefined })
                }}
                title={CONSENT_DOCUMENT_TITLE}
                disabled={readOnly}
                onClick={current.nihInstitutionalCertificationFile ? () => { DataSet.getNIHInstitutionalCertification(current.datasetId) } : undefined}
              />
            </div>
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
