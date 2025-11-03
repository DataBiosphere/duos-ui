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
  removeStudyPropertiesByKeys, setStudyPropertyByKey,
} from 'src/pages/data_submission/v2/v2-common-functions'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import {
  SelectInterfacePickerSelection,
  SelectOptionsInterfacePicker,
} from 'src/components/forms/SelectOptionsInterfacePicker'
import { InstitutionPicker } from 'src/components/forms/InstitutionPicker'
import { NIHInstitutesAndCenters } from 'src/components/forms/NIHInstitutesAndCenters'
import { cloneDeep } from 'lodash'

export interface NihAdministrativeInformationProps {
  study: Study
  setStudy: React.Dispatch<React.SetStateAction<Study>>
}

export const NihAdministrativeInformation = (props: NihAdministrativeInformationProps) => {
  const { setStudy, study } = props
  const [isRequired, setIsRequired] = useState(false)

  useEffect(() => {
    const nihAnvilUse = getStudyPropertyValueByKey(study, new NihAnvilUse().key) as string
    setIsRequired(NihAnvilUse.requiresNIHAdministrativeInformation(nihAnvilUse))
  }, [study])

  return (
    <>{isRequired && (
      <div className="data-submitter-section">
        <h2>NIH Administrative Information</h2>
        <InstitutionPicker
          initialInstitution={getStudyPropertyValueByKey(study, PiInstitution.key) as number}
          fieldId={PiInstitution.key}
          fieldTitle={PiInstitution.fieldTitle}
          onChange={function ({ value, isValid }: { value: unknown, isValid: boolean }): void {
            const myVal = value as number
            setStudyPropertyByKey(study, setStudy, { isValid: isValid }, new PiInstitution(myVal))
          }}
          isRequired={true}
        />
        {generateStudyPropertyFormTextField(study, setStudy, new NihGrantContractNumber(), [FormValidators.REQUIRED])}
        <SelectOptionsInterfacePicker
          fieldId={NihICsSupportingStudy.key}
          initialValue={getStudyPropertyValueByKey(study, NihICsSupportingStudy.key) as string[] ?? []}
          onChange={function ({ value, isValid }: { value: unknown, isValid: boolean }): void {
            if (Array.isArray(value)) {
              const myVal = value as SelectInterfacePickerSelection[]
              const myMap = myVal.map(entry => entry.key)
              setStudyPropertyByKey(study, setStudy, { isValid: isValid }, new NihICsSupportingStudy(myMap))
            }
            else if (value) {
              const myVal = value as SelectInterfacePickerSelection
              const keys = [] as string[]
              keys.push(myVal.key)
              setStudyPropertyByKey(study, setStudy, { isValid: isValid }, new NihICsSupportingStudy(keys))
            }
            else {
              setStudyPropertyByKey(study, setStudy, { isValid: isValid }, new NihICsSupportingStudy([]))
            }
          }}
          optionList={NIHInstitutesAndCenters.VALUES}
          fieldTitle={NihICsSupportingStudy.fieldTitle}
          fieldPlaceholder={NihICsSupportingStudy.fieldPlaceholderText}
          isMulti={true}
        />
        {generateStudyPropertyFormTextField(study, setStudy, new NihProgramOfficerName(), [FormValidators.REQUIRED])}
        <SelectOptionsInterfacePicker
          fieldId={NihInstitutionCenterSubmission.key}
          initialValue={getStudyPropertyValueByKey(study, NihInstitutionCenterSubmission.key) as string ?? null}
          onChange={function ({ value, isValid }: { value: unknown, isValid: boolean }): void {
            const myVal = value as SelectInterfacePickerSelection
            setStudyPropertyByKey(study, setStudy, { isValid: isValid }, new NihInstitutionCenterSubmission(myVal.key))
          }}
          optionList={NIHInstitutesAndCenters.VALUES}
          fieldTitle={NihInstitutionCenterSubmission.fieldTitle}
          fieldPlaceholder={NihInstitutionCenterSubmission.fieldPlaceholderText}
        />
        {generateStudyPropertyFormTextField(study, setStudy, new NihGenomicProgramAdministratorName())}
        {generateStudyPropertyYesNoField(study, setStudy, new MultiCenterStudy())}
        {getStudyPropertyValueByKey(study, MultiCenterStudy.key) === true && (
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
            defaultValue={getStudyPropertyValueByKey(study, CollaboratingSites.key)}
            onChange={(_key: string, value: string[], isValid: boolean) => setStudyPropertyByKey(study, setStudy, { isValid: isValid }, new CollaboratingSites(value))}
          />
        )}

        <FormField
          id={ControlledAccessRequiredForGenomicSummaryResultsGSR.key}
          title={ControlledAccessRequiredForGenomicSummaryResultsGSR.fieldTitle}
          type={FormFieldTypes.YESNORADIOGROUP}
          defaultValue={getStudyPropertyValueByKey(study, ControlledAccessRequiredForGenomicSummaryResultsGSR.key)}
          onChange={({ _key, value }: { _key: string, value: boolean }) => {
            setStudyPropertyByKey(study, setStudy, { isValid: true }, new ControlledAccessRequiredForGenomicSummaryResultsGSR(value))
            if (!value) {
              setStudy((val) => {
                const newVal = cloneDeep(val)
                removeStudyPropertiesByKeys(newVal, new Set([ControlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation.key]))
                return newVal
              })
            }
          }}
        />
        {getStudyPropertyValueByKey(study, ControlledAccessRequiredForGenomicSummaryResultsGSR.key) === true && generateStudyPropertyFormTextField(study, setStudy, new ControlledAccessRequiredForGenomicSummaryResultsGSRRequiredExplanation())}
      </div>
    )}
    </>
  )
}
