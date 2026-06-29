import React, { useCallback, useState, useEffect } from 'react'
import { cloneDeep, find, isNil } from 'src/utils/NodashUtil'
import { FormFieldTypes, FormField, FormValidators } from 'src/components/forms/forms'
import { DataSet } from 'src/libs/ajax/DataSet'
import { DAR } from 'src/libs/ajax/DAR'
import { DAC } from 'src/libs/ajax/DAC'
import { Notifications } from 'src/libs/utils'
import { useNavigate } from 'react-router-dom'
import { Dataset, DataUse, DacObject, DatasetProperty, OntologyEntry } from 'src/types/model'

interface DatasetFormProperties {
  datasetName?: string
  dataType?: string
  species?: string
  phenotype?: string
  nrParticipants?: string
  description?: string
  url?: string
  dataDepositor?: string
  principalInvestigator?: string
}

interface NormalizedDataUse extends DataUse {
  hasDiseaseRestrictions?: boolean
  diseaseLabels?: string[]
  hasPrimaryOther?: boolean
  hasSecondaryOther?: boolean
}

interface DacFormData extends DacObject {
  dacs?: DacObject[]
}

interface DatasetFormData {
  datasetName?: string
  properties: DatasetFormProperties
  dataUse: NormalizedDataUse
  dac: DacFormData
}

export interface DatasetUpdateProps {
  dataset: Dataset
}

const dacOptions = (dacs: DacObject[] | undefined): { displayText: string, dacId: number | undefined }[] => {
  if (isNil(dacs)) {
    return []
  }
  return dacs.map(dac => ({ displayText: dac.name ?? '', dacId: dac.dacId }))
}

const asProperty = (propertyName: string, propertyValue: string | undefined): DatasetProperty => ({
  propertyName,
  propertyValue: propertyValue ?? '',
})

const getDiseaseLabels = async (ontologyIds: string[]): Promise<string[]> => {
  const results = await DAR.searchOntologyIdList(ontologyIds)
  return results.map((r: OntologyEntry) => r.label)
}

export const DatasetUpdate = ({ dataset }: DatasetUpdateProps): React.JSX.Element => {
  const navigate = useNavigate()

  const [formData, setFormData] = useState<DatasetFormData>({
    dac: {},
    dataUse: {},
    properties: {},
  })

  const searchOntologies = async (query: string, callback: (options: string[]) => void): Promise<void> => {
    const items = await DAR.getAutoCompleteOT(query)
    callback(items.map((item: OntologyEntry) => item.label))
  }

  const extract = useCallback((propertyName: string): string | undefined => {
    const property = find(dataset.properties, { propertyName })
    return property?.propertyValue
  }, [dataset])

  const normalizeDataUse = useCallback(async (dataUse: DataUse): Promise<NormalizedDataUse> => {
    const du: NormalizedDataUse = { ...dataUse }
    if (!isNil(dataUse.diseaseRestrictions)) {
      du.hasDiseaseRestrictions = true
      du.diseaseLabels = await getDiseaseLabels(dataUse.diseaseRestrictions)
    }
    if (!isNil(dataUse.other)) {
      du.hasPrimaryOther = true
    }
    if (!isNil(dataUse.secondaryOther)) {
      du.hasSecondaryOther = true
    }
    return du
  }, [])

  const updateProperty = useCallback((propertyName: keyof DatasetFormProperties, value: string | undefined): void => {
    setFormData((prev) => {
      const newFormData = cloneDeep(prev)
      newFormData.properties[propertyName] = value
      return newFormData
    })
  }, [])

  const submitForm = (event: React.MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault()
    event.stopPropagation()

    const formElement = (event.target as HTMLButtonElement).form
    const submitData = formElement ? new FormData(formElement) : new FormData()
    const nihFileData = submitData.get('nihInstitutionalCertificationFile')
    const consentGroups = [{ nihInstitutionalCertificationFile: nihFileData }]

    const newDataset = {
      name: formData.properties.datasetName,
      dacId: formData.dac.dacId,
      properties: [
        asProperty('Dataset Name', formData.properties.datasetName),
        asProperty('Data Type', formData.properties.dataType),
        asProperty('Species', formData.properties.species),
        asProperty('Phenotype/Indication', formData.properties.phenotype),
        asProperty('# of participants', formData.properties.nrParticipants),
        asProperty('Description', formData.properties.description),
        asProperty('URL', formData.properties.url),
        asProperty('Data Depositor', formData.properties.dataDepositor),
        asProperty('Principal Investigator(PI)', formData.properties.principalInvestigator),
      ],
    }

    const multiPartFormData = new FormData()
    multiPartFormData.append('dataset', JSON.stringify(newDataset))
    multiPartFormData.append('consentGroups', JSON.stringify(consentGroups))

    DataSet.updateDatasetV3(dataset.datasetId, multiPartFormData).then(
      () => {
        navigate('/datalibrary')
        Notifications.showSuccess({ text: 'Update submitted successfully!' })
      },
      () => {
        Notifications.showError({ text: 'Some errors occurred, the dataset was not updated.' })
      },
    )
  }

  const prefillFormData = useCallback(async (ds: Dataset): Promise<void> => {
    const dac = await DAC.get(ds.dacId)
    const dacs = await DAC.list()
    setFormData({
      datasetName: ds.datasetName,
      properties: {
        datasetName: extract('Dataset Name'),
        dataType: extract('Data Type'),
        species: extract('Species'),
        phenotype: extract('Phenotype/Indication'),
        nrParticipants: extract('# of participants'),
        description: extract('Description'),
        url: extract('url'),
        dataDepositor: extract('Data Depositor'),
        principalInvestigator: ds.study?.piName ?? extract('Principal Investigator(PI)'),
      },
      dataUse: await normalizeDataUse(ds.dataUse),
      dac: { ...dac, dacs },
    })
  }, [extract, normalizeDataUse])

  useEffect(() => {
    const init = async (): Promise<void> => {
      if (isNil(formData.datasetName)) {
        await prefillFormData(dataset)
      }
    }
    void init()
  }, [prefillFormData, dataset, formData])

  return (
    <div className="data-update-section">
      <h2>1. Dataset Information</h2>
      <FormField
        id="datasetName"
        title="Dataset Name"
        validators={[FormValidators.REQUIRED]}
        defaultValue={formData.properties.datasetName}
        onChange={({ value }: { value: unknown }) => updateProperty('datasetName', value as string | undefined)}
      />
      <FormField
        id="description"
        title="Dataset Description"
        validators={[FormValidators.REQUIRED]}
        defaultValue={formData.properties.description}
        onChange={({ value }: { value: unknown }) => updateProperty('description', value as string | undefined)}
      />
      <FormField
        id="dataDepositor"
        title="Data Custodian"
        validators={[FormValidators.REQUIRED]}
        defaultValue={formData.properties.dataDepositor}
        onChange={({ value }: { value: unknown }) => updateProperty('dataDepositor', value as string | undefined)}
      />
      <FormField
        id="principalInvestigator"
        title="Principal Investigator (PI)"
        validators={[FormValidators.REQUIRED]}
        defaultValue={formData.properties.principalInvestigator}
        onChange={({ value }: { value: unknown }) => updateProperty('principalInvestigator', value as string | undefined)}
      />
      <FormField
        id="url"
        title="Dataset Repository URL"
        validators={[FormValidators.REQUIRED]}
        defaultValue={formData.properties.url}
        onChange={({ value }: { value: unknown }) => updateProperty('url', value as string | undefined)}
      />
      <FormField
        id="dataType"
        title="Data Type"
        validators={[FormValidators.REQUIRED]}
        defaultValue={formData.properties.dataType}
        onChange={({ value }: { value: unknown }) => updateProperty('dataType', value as string | undefined)}
      />
      <FormField
        id="species"
        title="Species"
        validators={[FormValidators.REQUIRED]}
        defaultValue={formData.properties.species}
        onChange={({ value }: { value: unknown }) => updateProperty('species', value as string | undefined)}
      />
      <FormField
        id="phenotype"
        title="Phenotype/Indication"
        validators={[FormValidators.REQUIRED]}
        defaultValue={formData.properties.phenotype}
        onChange={({ value }: { value: unknown }) => updateProperty('phenotype', value as string | undefined)}
      />
      <FormField
        id="nrParticipants"
        title="# of Participants"
        type={FormFieldTypes.NUMBER}
        validators={[FormValidators.REQUIRED]}
        defaultValue={formData.properties.nrParticipants}
        onChange={({ value }: { value: unknown }) => updateProperty('nrParticipants', value as string | undefined)}
      />
      <FormField
        id="dac"
        title="Data Access Committee"
        validators={[FormValidators.REQUIRED]}
        type={FormFieldTypes.SELECT}
        selectOptions={dacOptions(formData.dac.dacs)}
        defaultValue={[
          { displayText: formData.dac.name, dacId: formData.dac.dacId },
        ]}
        disabled={true}
      />
      <h2>2. Data Use Terms</h2>
      {/* readonly primary */}
      <div>
        <FormField
          title="Primary Data Use Terms*"
          description="Please select one of the following data use permissions for your dataset"
          type={FormFieldTypes.RADIOBUTTON}
          id="generalUse"
          toggleText="General Research Use"
          value="generalUse"
          defaultValue={formData.dataUse.generalUse === true ? 'generalUse' : undefined}
          disabled={true}
        />
        <FormField
          type={FormFieldTypes.RADIOBUTTON}
          id="hmbResearch"
          toggleText="Health/Medical/Biomedical Research Use"
          value="hmbResearch"
          defaultValue={formData.dataUse.hmbResearch === true ? 'hmbResearch' : undefined}
          disabled={true}
        />
        <FormField
          type={FormFieldTypes.RADIOBUTTON}
          id="diseaseRestrictions"
          toggleText="Disease-Specific Research Use"
          value="diseaseRestrictions"
          defaultValue={Array.isArray(formData.dataUse.diseaseRestrictions) && formData.dataUse.diseaseRestrictions.length > 0 ? 'diseaseRestrictions' : undefined}
          disabled={true}
        />
        <div style={{ marginBottom: '1.0rem' }}>
          <FormField
            type={FormFieldTypes.SELECT}
            isMulti={true}
            isCreatable={true}
            optionsAreString={true}
            isAsync={true}
            id="diseaseRestrictionsText"
            validators={[FormValidators.REQUIRED]}
            placeholder="none"
            loadOptions={searchOntologies}
            defaultValue={formData.dataUse.diseaseLabels}
            disabled={true}
          />
        </div>
        <FormField
          type={FormFieldTypes.RADIOBUTTON}
          id="otherPrimary"
          toggleText="Other"
          value="otherPrimary"
          defaultValue={formData.dataUse.other ? 'otherPrimary' : undefined}
          disabled={true}
        />
        <FormField
          id="otherPrimaryText"
          validators={[FormValidators.REQUIRED]}
          placeholder="none"
          defaultValue={formData.dataUse.other}
          disabled={true}
        />
      </div>
      {/* secondary */}
      <div>
        <FormField
          title="Secondary Data Use Terms"
          description="Please select all applicable data use parameters."
          type={FormFieldTypes.CHECKBOX}
          id="methodsResearch"
          toggleText="No methods development or validation studies (NMDS)"
          defaultValue={formData.dataUse.methodsResearch === false}
          disabled={true}
        />
        <FormField
          type={FormFieldTypes.CHECKBOX}
          id="geneticStudiesOnly"
          toggleText="Genetic studies only (GSO)"
          defaultValue={formData.dataUse.geneticStudiesOnly === true}
          disabled={true}
        />
        <FormField
          type={FormFieldTypes.CHECKBOX}
          id="publicationResults"
          toggleText="Publication Required (PUB)"
          defaultValue={formData.dataUse.publicationResults === true}
          disabled={true}
        />
        <FormField
          type={FormFieldTypes.CHECKBOX}
          id="collaboratorRequired"
          toggleText="Collaboration Required (COL)"
          defaultValue={formData.dataUse.collaboratorRequired === true}
          disabled={true}
        />
        <FormField
          type={FormFieldTypes.CHECKBOX}
          id="ethicsApprovalRequired"
          name="ethicsApprovalRequired"
          toggleText="Ethics Approval Required (IRB)"
          defaultValue={formData.dataUse.ethicsApprovalRequired === true}
          disabled={true}
        />
        <FormField
          type={FormFieldTypes.CHECKBOX}
          id="geographicalRestrictions"
          toggleText="Geographic Restriction (GS-)"
          defaultValue={formData.dataUse.geographicalRestrictions === 'Yes'}
          disabled={true}
        />
        <FormField
          type={FormFieldTypes.CHECKBOX}
          id="publicationMoratorium"
          toggleText="Publication Moratorium (MOR)"
          defaultValue={formData.dataUse.publicationMoratorium === 'true'}
          disabled={true}
        />
        <FormField
          type={FormFieldTypes.CHECKBOX}
          id="nonProfitUse"
          toggleText="Non-profit Use Only (NPU)"
          defaultValue={formData.dataUse.nonProfitUse === true}
          disabled={true}
        />
        <FormField
          type={FormFieldTypes.CHECKBOX}
          id="otherSecondary"
          toggleText="Other"
          defaultValue={formData.dataUse.hasSecondaryOther}
          disabled={true}
        />
        <FormField
          id="otherSecondaryText"
          validators={[FormValidators.REQUIRED]}
          placeholder="Please specify"
          defaultValue={formData.dataUse.secondaryOther}
          disabled={true}
        />
      </div>
      <h2>3. NIH Certification</h2>
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-end', marginRight: '30px' }}>
        <FormField
          type={FormFieldTypes.FILE}
          title="NIH Institutional Certification"
          description="If an Institutional Certification for this dataset exists, please upload it here"
          id="nihInstitutionalCertificationFile"
          placeholder="default.txt"
        />
      </div>
      <div className="flex flex-row" style={{ justifyContent: 'flex-end', marginTop: '2rem', marginBottom: '2rem' }}>
        <button className="button button-white" type="submit" onClick={submitForm}>
          Submit
        </button>
      </div>
    </div>
  )
}

export default DatasetUpdate
