import React, { useCallback, useMemo, useState } from 'react'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import { cloneDeep } from 'lodash/fp'
import { set } from 'lodash'
import { Styles } from 'src/libs/theme'
import { SecondaryDataUseTerms } from 'src/components/forms/SecondaryDataUseTerms'
import { DraftFileUpload } from 'src/components/forms/DraftFileUpload'
import { Link } from 'react-router-dom'
import { ConfirmationDialog } from 'src/components/modals/ConfirmationDialog'
import { Draft } from 'src/libs/ajax/Drafts'
import { DataLocationList } from 'src/components/forms/DataLocationList'
import {
  FileTypeAndFunctionalEquivalence,
  FileTypesWithFunctionalEquivalents,
} from 'src/components/forms/FileTypesWithFunctionalEquivalents'
import { FileStorageObject } from 'src/types/model'
import { asIdAndDisplayText } from 'src/components/forms/SelectOptionInterface'
import { DataLocationInfo } from 'src/components/forms/DataLocation'

export type FileField = {
  fieldId: string
  fieldDraftAttachment: FileStorageObject
}

export interface DatasetDetailsProps {
  idx: number
  dataset: DatasetDetails
  draftId: string
  onChange: (key: number, value: DatasetDetails) => void
  onDelete: (id: number) => void
}

export interface DatasetDetails {
  dataDictionary: FileStorageObject
  dataUseDocumentation: FileStorageObject
  datasetName: string
  controlledAccess: boolean | undefined
  secondaryDataUseTerms: string[]
  locations: DataLocationInfo[]
  fileTypesWithEquivalents: FileTypeAndFunctionalEquivalence[]
}

export const AdvancedFormDatasetDetails = (props: DatasetDetailsProps) => {
  const { idx, dataset, draftId, onChange, onDelete } = props
  const [isDatasetDeleteConfirmationVisible, setIsDatasetDeleteConfirmationVisible] = useState(false)
  const onDatasetChange = useCallback(({ key, value }: { key: string, value: unknown }) => {
    const newDataset = cloneDeep(dataset)
    set(newDataset, key, value)
    onChange(idx, newDataset)
  }, [idx, dataset, onChange])

  const fileFields = useMemo(() => {
    return new Set<FileField>().add({ fieldId: 'dataDictionary', fieldDraftAttachment: dataset.dataDictionary })
      .add({ fieldId: 'dataUseDocumentation', fieldDraftAttachment: dataset.dataUseDocumentation })
  }, [dataset.dataDictionary, dataset.dataUseDocumentation])

  const handleFileDelete = useCallback(async (draftId: string, fileId: number,
    id: string) => {
    const deleteResult = await Draft.deleteDraftAttachment(draftId, fileId)
    if (deleteResult === 200) {
      onDatasetChange({ key: id, value: null })
    }
  }, [onDatasetChange])

  const onDatasetDelete = async () => {
    for (const file of fileFields) {
      if (file.fieldDraftAttachment?.entityId && file.fieldDraftAttachment?.fileStorageObjectId) {
        await Draft.deleteDraftAttachment(draftId, file.fieldDraftAttachment.fileStorageObjectId)
      }
    }
    onDelete(idx)
    setIsDatasetDeleteConfirmationVisible(false)
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, id: string) => {
    if (event.target.files && event.target.files.length === 1) {
      const formData = new FormData()
      const filesToUpload = Array.from(event.target.files)
      for (const file of filesToUpload) {
        formData.set(file.name, file)
      }
      const uploadData = await Draft.uploadFilesToDraft(draftId, formData)
      const myUpload: FileStorageObject = uploadData[0]
      onDatasetChange({ key: id, value: myUpload })
    }
  }

  const handleDeleteDatasetClose = useCallback(() => setIsDatasetDeleteConfirmationVisible(false), [setIsDatasetDeleteConfirmationVisible])
  const handleDeleteDatasetClick = useCallback(() => setIsDatasetDeleteConfirmationVisible(true), [setIsDatasetDeleteConfirmationVisible])
  const deleteButton
    = (
      <>
        <Link
          style={{ marginLeft: '15px' }}
          id={`${idx}_delete`}
          className="glyphicon glyphicon-trash"
          onClick={() => handleDeleteDatasetClick()}
          to="#"
        />
        <ConfirmationDialog
          title="Delete Dataset"
          openState={isDatasetDeleteConfirmationVisible}
          close={handleDeleteDatasetClose}
          action={() => onDatasetDelete()}
          description={`Are you sure you want to delete this dataset${dataset?.datasetName ? ' ' + dataset.datasetName : ''}?`}
        />
      </>
    )

  return (
    <div style={Styles.REPEATING_SECTION}>
      <h4>Dataset {idx + 1} {deleteButton}</h4>
      <FormField
        id="datasetName"
        title="Dataset Name"
        validators={[FormValidators.REQUIRED]}
        onChange={onDatasetChange}
        defaultValue={dataset?.datasetName ? dataset.datasetName : ''}
      />
      <FormField
        id="accessManagement"
        title="Data Access Management"
        description="Select a data access management strategy"
        validators={[]}
        type={FormFieldTypes.RADIOGROUP}
        name="controlledAccess"
        options={[]}
        defaultValue={dataset?.controlledAccess}
        onChange={onDatasetChange}
      />
      <div style={{ paddingLeft: '20px' } as React.CSSProperties}>
        <FormField
          id="accessManagement1"
          description={<div style={Styles.SMALL_BOLD}>Controlled Access</div>}
          validators={[]}
          type={FormFieldTypes.RADIOGROUP}
          name="controlledAccess"
          options={[
            { name: 'dacInDUOS', text: 'Managed by a DAC in DUOS' },
            {
              name: 'dacOutsideDUOS',
              text: 'No, I do not want my dataset info to be visible and available for requests',
            },
          ]}
          defaultValue={dataset?.controlledAccess}
          onChange={onDatasetChange}
        />
        <FormField
          id="accessManagement2"
          description={<div style={Styles.SMALL_BOLD}>Open Access</div>}
          validators={[]}
          type={FormFieldTypes.RADIOGROUP}
          name="controlledAccess"
          options={[
            { name: 'openAccess', text: 'Yes, list info and links to my open access data in DUOS' },
          ]}
          defaultValue={dataset?.controlledAccess}
          onChange={onDatasetChange}
        />
        <FormField
          id="accessManagement3"
          description={<div style={Styles.SMALL_BOLD}>Data is not shareable</div>}
          validators={[]}
          type={FormFieldTypes.RADIOGROUP}
          name="controlledAccess"
          options={[
            { name: 'excludedFromPublicOnly', text: 'Excluded from public views' },
            { name: 'excludedFromPublicAndInstitutional', text: 'Excluded from public views and institutional views' },
          ]}
          defaultValue={dataset?.controlledAccess}
          onChange={onDatasetChange}
        />
      </div>
      <FormField
        id="primaryDataUseTerm"
        validators={[FormValidators.REQUIRED]}
        type={FormFieldTypes.RADIOGROUP}
        name="primaryDataUseTerm"
        title="Primary Data Use Terms"
        description="Please select one of the following data use permissions for your dataset"
        options={[
          { name: 'GRU', text: 'General Research Use' },
          { name: 'HMB', text: 'Health/Medical/Biomedical Research Use' },
          { name: 'DPRU', text: 'Disease-Specific Research Use' },
          { name: 'POAU', text: 'Populations, Origins, Ancestry Use' },
          { name: 'Other', text: 'Other' },
        ]}
        defaultValue={dataset?.controlledAccess}
        onChange={onDatasetChange}
      />
      <FormField
        id="secondaryDataUseTerms"
        isMulti={true}
        title="Secondary Data Use Terms"
        placeholder="Select all applicable data use parameters"
        type={FormFieldTypes.SELECT}
        selectOptions={asIdAndDisplayText(SecondaryDataUseTerms.VALUES)}
        defaultValue={dataset?.secondaryDataUseTerms ? dataset.secondaryDataUseTerms : null}
        onChange={onChange}
      />
      <DataLocationList
        locations={dataset?.locations || []}
        onChange={onDatasetChange}
      />
      <FileTypesWithFunctionalEquivalents
        id="fileTypesWithEquivalents"
        onChange={onDatasetChange}
        defaultValue={dataset?.fileTypesWithEquivalents}
      />
      <DraftFileUpload
        id="dataUseDocumentation"
        title="Upload Data Use documentation"
        description="If you would like to upload documentation of the data use terms derived from the consent form for this dataset, such as an NIH Institutional Certificatiom, or Data Use Letter, you may do so here"
        defaultValue={dataset?.dataUseDocumentation}
        draftId={draftId}
        onAddFile={handleFileChange}
        onDeleteFile={handleFileDelete}
      />
      <DraftFileUpload
        id="dataDictionary"
        title="Data Dictionary (optional)"
        description="You can upload a json/tsv file that explains/exemplifies the schema for your dataset"
        defaultValue={dataset?.dataDictionary}
        draftId={draftId}
        onAddFile={handleFileChange}
        onDeleteFile={handleFileDelete}
      />
    </div>
  )
}
