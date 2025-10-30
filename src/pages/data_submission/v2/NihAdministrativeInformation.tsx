import React, { useEffect, useState } from 'react'
import {
  CollaboratingSites,
  ControlledAccessRequiredForGenomicSummaryResultsGSR,
  ControlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation,
  MultiCenterStudy,
  NihAnvilUse,
  NihGenomicProgramAdministratorName,
  NihGrantContractNumber,
  NihICsSupportingStudy,
  NihInstitutionCenterSubmission,
  NihProgramOfficerName,
  PiInstitution,
  Study,
} from 'src/pages/data_submission/v2/v2-models'
import {
  generateStudyPropertyFormTextField, generateStudyPropertyYesNoField,
  getStudyPropertyValueByKey,
  MasterChangeHandler, setStudyPropertyByKey,
} from 'src/pages/data_submission/v2/v2-common-functions'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import {
  SelectInterfacePickerSelection,
  SelectOptionsInterfacePicker,
} from 'src/components/forms/SelectOptionsInterfacePicker'
import { InstitutionPicker } from 'src/components/forms/InstitutionPicker'
import { NIHInstitutesAndCenters } from 'src/components/forms/NIHInstitutesAndCenters'

export interface NihAdministrativeInformationProps {
  formData: Study
  onChange: MasterChangeHandler
}

export const NihAdministrativeInformation = (props: NihAdministrativeInformationProps) => {
  const { onChange, formData } = props
  const [isRequired, setIsRequired] = useState(false)

  useEffect(() => {
    const nihAnvilUse = getStudyPropertyValueByKey(formData, new NihAnvilUse().key) as string
    setIsRequired(NihAnvilUse.requiresNIHAdministrativeInformation(nihAnvilUse))
  }, [formData])

  return (
    <>{isRequired && (
      <div className="data-submitter-section">
        <h2>NIH Administrative Information</h2>
        <InstitutionPicker
          initialInstitution={getStudyPropertyValueByKey(formData, PiInstitution.key) as number}
          fieldId={PiInstitution.key}
          fieldTitle={PiInstitution.fieldTitle}
          onChange={function ({ value, isValid }: { value: unknown, isValid: boolean }): void {
            const myVal = value as number
            setStudyPropertyByKey(formData, onChange, { isValid: isValid }, new PiInstitution(myVal))
          }}
          isRequired={true}
        />
        {generateStudyPropertyFormTextField(formData, onChange, new NihGrantContractNumber(), [FormValidators.REQUIRED])}
        <SelectOptionsInterfacePicker
          fieldId={NihICsSupportingStudy.key}
          initialValue={getStudyPropertyValueByKey(formData, NihICsSupportingStudy.key) as string[] ?? []}
          onChange={function ({ value, isValid }: { value: unknown, isValid: boolean }): void {
            if (Array.isArray(value)) {
              const myVal = value as SelectInterfacePickerSelection[]
              const myMap = myVal.map(entry => entry.key)
              setStudyPropertyByKey(formData, onChange, { isValid: isValid }, new NihICsSupportingStudy(myMap))
            }
            else if (value) {
              const myVal = value as SelectInterfacePickerSelection
              const keys = [] as string[]
              keys.push(myVal.key)
              setStudyPropertyByKey(formData, onChange, { isValid: isValid }, new NihICsSupportingStudy(keys))
            }
            else {
              setStudyPropertyByKey(formData, onChange, { isValid: isValid }, new NihICsSupportingStudy([]))
            }
          }}
          optionList={NIHInstitutesAndCenters.VALUES}
          fieldTitle={NihICsSupportingStudy.fieldTitle}
          fieldPlaceholder={NihICsSupportingStudy.fieldPlaceholderText}
          isMulti={true}
        />
        {generateStudyPropertyFormTextField(formData, onChange, new NihProgramOfficerName(), [FormValidators.REQUIRED])}
        <SelectOptionsInterfacePicker
          fieldId={NihInstitutionCenterSubmission.key}
          initialValue={getStudyPropertyValueByKey(formData, NihInstitutionCenterSubmission.key) as string ?? null}
          onChange={function ({ value, isValid }: { value: unknown, isValid: boolean }): void {
            const myVal = value as SelectInterfacePickerSelection
            setStudyPropertyByKey(formData, onChange, { isValid: isValid }, new NihInstitutionCenterSubmission(myVal.key))
          }}
          optionList={NIHInstitutesAndCenters.VALUES}
          fieldTitle={NihInstitutionCenterSubmission.fieldTitle}
          fieldPlaceholder={NihInstitutionCenterSubmission.fieldPlaceholderText}
        />
        {generateStudyPropertyFormTextField(formData, onChange, new NihGenomicProgramAdministratorName())}
        {generateStudyPropertyYesNoField(formData, onChange, new MultiCenterStudy())}
        {getStudyPropertyValueByKey(formData, MultiCenterStudy.key) === true && (
          <FormField
            id={CollaboratingSites.key}
            title="What are the collaborating sites?"
            type={FormFieldTypes.SELECT}
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
            placeholder="List site and hit enter here..."
            defaultValue={getStudyPropertyValueByKey(formData, CollaboratingSites.key)}
            onChange={(_key: string, value: string[], isValid: boolean) => setStudyPropertyByKey(formData, onChange, { isValid: isValid }, new CollaboratingSites(value))}
          />
        )}
        {generateStudyPropertyYesNoField(formData, onChange, new ControlledAccessRequiredForGenomicSummaryResultsGSR())}
        {getStudyPropertyValueByKey(formData, ControlledAccessRequiredForGenomicSummaryResultsGSR.key) === true && generateStudyPropertyFormTextField(formData, onChange, new ControlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation())}
      </div>
    )}
    </>
  )
}
