import React, { useMemo } from 'react'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import { Storage } from 'src/libs/storage'
import dayjs from 'dayjs'
import InstitutionSelector from 'src/components/forms/InstitutionSelector'
import { NIHInstitutesAndCenters } from 'src/components/forms/NIHInstitutesAndCenters'
import { StudyType } from 'src/components/forms/StudyType'
import { asIdAndDisplayText } from 'src/components/forms/SelectOptionInterface'
import { NHGRIFunding } from 'src/pages/data_submission_v2/step_one/NHGRIFunding'
import { AdvancedFormStep1, AdvancedFormStep2 } from '../AdvancedDataSubmissionForm'

export interface AdvancedFormCommonStudyInformationProps {
  step1: AdvancedFormStep1 | undefined
  step2: AdvancedFormStep2 | undefined
  onChange: ({ key, value }: {
    key: string
    value: unknown
  }) => void
}

export interface StudyTypeInfo {
  key: string
  displayText: string
}

export interface StudyInformation {
  piName: string | undefined
  studyName: string | undefined
  studyType: StudyTypeInfo | undefined
  studyDescription: string | undefined
  studyURL: string | undefined
  publicationDOI: string[] | undefined
  studyConsortiaURL: string | undefined
  dataTypes: string[] | undefined
  phenotypeIndication: string | undefined
  species: string | undefined
  dataCustodianEmail: string[] | undefined
  alternativeDataSharingPlanTargetDeliveryDate: string | undefined | null
  alternativeDataSharingPlanTargetPublicReleaseDate: string | undefined
  publicVisibility: boolean | undefined
  dbGaPphsId: string | undefined
  dbGaPStudyRegistrationName: string | undefined
  embargoReleaseDate: string | undefined | null
  sequencingCenter: string | undefined
  NIHGrantNumber: string | undefined
  piInstitution: number | undefined // <-confirm
  NIHGrantOrContractNumber: string | undefined
  NIHCentersSupportingStudy: string[] | undefined
  NIHProgramOfficerName: string | undefined
  NIHCenterForSubmission: string | undefined
  collaboratingSites: string[] | undefined
  isControlledAccessRequiredForGSR: boolean | undefined
  NIHGenomicProgramAdministratorName: string | undefined
  isMultiCenterStudy: boolean | undefined
  isRequestingAlternateDataSharingPlan: boolean | undefined
}

export const AdvancedFormCommonStudyInformation = (props: AdvancedFormCommonStudyInformationProps) => {
  const { step1, step2, onChange } = props
  const user = Storage.getCurrentUser()
  const principalInvestigatorQuestion = (
    <FormField
      id="step2.studyInfo.piName"
      title="Principal Investigator Name"
      placeholder="Principal Investigator Name"
      defaultValue={step2?.studyInfo?.piName ? step2?.studyInfo?.piName : user.displayName}
      validators={[FormValidators.REQUIRED]}
      onChange={onChange}
    />
  )

  const nihChoices = useMemo(() => {
    return asIdAndDisplayText(NIHInstitutesAndCenters.VALUES)
  }, [])
  const studyTypeChoices = useMemo(() => {
    return asIdAndDisplayText(StudyType.VALUES)
  }, [])

  return (
    <div>
      <div className="data-submitter-section">
        <h2>Study Information</h2>
        <FormField
          id="step2.studyInfo.studyName"
          title="Study Name"
          validators={[FormValidators.REQUIRED]}
          onChange={onChange}
          defaultValue={step2?.studyInfo?.studyName}
        />
        <FormField
          id="step2.studyInfo.studyType"
          title="Study Type"
          type={FormFieldTypes.SELECT}
          selectOptions={studyTypeChoices}
          isCreatable={true}
          defaultValue={step2?.studyInfo?.studyType ?? step2?.studyInfo?.studyType}
          onChange={onChange}
        />
        <FormField
          type={FormFieldTypes.TEXTAREA}
          rows={6}
          id="step2.studyInfo.studyDescription"
          title="Study Description"
          placeholder="Description"
          defaultValue={step2?.studyInfo?.studyDescription}
          validators={[FormValidators.REQUIRED]}
          onChange={onChange}
        />
        <FormField
          id="step2.studyInfo.studyURL"
          title="Study URL"
          placeholder="Enter a URL if applicable"
          onChange={onChange}
          defaultValue={step2?.studyInfo?.studyURL}
        />
        <FormField
          id="step2.studyInfo.publicationDOI"
          title="Publications"
          placeholder="Please insert your DOI here"
          validators={[]}
          type={FormFieldTypes.SELECT}
          isCreatable={true}
          isMulti={true}
          optionsAreString={true}
          selectOptions={[
          ]}
          defaultValue={step2?.studyInfo?.publicationDOI ?? null}
          onChange={onChange}
        />
        <FormField
          id="step2.studyInfo.studyConsortiaURL"
          title="Consortia URL"
          placeholder="Enter a URL if applicable"
          onChange={onChange}
          defaultValue={step2?.studyInfo?.studyConsortiaURL}
        />
        <FormField
          id="step2.studyInfo.dataTypes"
          title="Data Types"
          placeholder="Type"
          validators={[FormValidators.REQUIRED]}
          type={FormFieldTypes.SELECT}
          isCreatable={true}
          isMulti={true}
          optionsAreString={true}
          selectOptions={[
            'CITE-seq',
            'Hybrid Capture',
            'RNA-Seq',
            'scRNA-Seq',
            'Spatial Transcriptomics',
            'snRNA-Seq',
            'Whole Genome (WGS)',
            'Whole Exome (WES)',
          ]}
          defaultValue={step2?.studyInfo?.dataTypes ?? null}
          onChange={onChange}
        />
        <FormField
          id="step2.studyInfo.phenotypeIndication"
          title="Phenotype/Indication Studied"
          defaultValue={step2?.studyInfo?.phenotypeIndication}
          onChange={onChange}
        />
        <FormField
          id="step2.studyInfo.species"
          title="Species"
          defaultValue={step2?.studyInfo?.species}
          onChange={onChange}
        />
        {(step1?.registeringStudyAtBroad) && principalInvestigatorQuestion}
        <FormField
          id="step2.studyInfo.dataCustodianEmail"
          title="Data Custodian Email"
          description="Insert the email for any individual with the authority to add/remove users access to this study&apos;s datasets."
          type={FormFieldTypes.SELECT}
          validators={[FormValidators.EMAIL]}
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
          placeholder="Add one or more emails"
          defaultValue={step2?.studyInfo?.dataCustodianEmail}
          onChange={onChange}
        />
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
          <FormField
            id="step2.studyInfo.alternativeDataSharingPlanTargetDeliveryDate"
            type={FormFieldTypes.CALENDAR}
            title="Target Data Delivery Date"
            defaultValue={step2?.studyInfo?.alternativeDataSharingPlanTargetDeliveryDate
              ? dayjs(step2?.studyInfo?.alternativeDataSharingPlanTargetDeliveryDate)
              : null}
            validators={[FormValidators.DATEJS]}
            onChange={onChange}
          />
          <FormField
            id="step2.studyInfo.alternativeDataSharingPlanTargetPublicReleaseDate"
            type={FormFieldTypes.CALENDAR}
            title="Target Public Release Date"
            defaultValue={step2?.studyInfo?.alternativeDataSharingPlanTargetPublicReleaseDate
              ? dayjs(step2?.studyInfo?.alternativeDataSharingPlanTargetPublicReleaseDate)
              : null}
            validators={[FormValidators.DATEJS]}
            onChange={onChange}
          />
        </div>
        <FormField
          id="step2.studyInfo.publicVisibility"
          title="Public Visibility"
          validators={[FormValidators.REQUIRED]}
          type={FormFieldTypes.RADIOGROUP}
          description="Please select one of the following data use permissions for your dataset"
          name="publicVisibility"
          options={[
            { name: true, text: 'Yes, I want my dataset info to be visible and available for requests' },
            { name: false, text: 'No, I do not want my dataset info to be visible and available for requests' },
          ]}
          defaultValue={step2?.studyInfo?.publicVisibility}
          onChange={onChange}
        />
        {(step1?.registeringStudyAtNIH
          && step1?.NHGRIFunding != NHGRIFunding.NO_NHGRI_NO_ANVIL) && (
          <>
            {(step1?.registeringStudyAtNIH && step1?.NHGRIFunding === NHGRIFunding.NHGRI_WITH_PHS_ID)
              && (
                <>
                  <FormField
                    id="step2.studyInfo.dbGaPphsId"
                    title="dbGaP phs ID"
                    placeholder="First Name/Last Name"
                    onChange={onChange}
                    defaultValue={step2?.studyInfo?.dbGaPphsId}
                    validators={[FormValidators.REQUIRED]}
                  />
                  <FormField
                    id="step2.studyInfo.dbGaPStudyRegistrationName"
                    title="dbGaP Study Registration Name"
                    placeholder="Name"
                    onChange={onChange}
                    defaultValue={step2?.studyInfo?.dbGaPStudyRegistrationName}
                    validators={[FormValidators.REQUIRED]}
                  />
                  <FormField
                    id="step2.studyInfo.embargoReleaseDate"
                    type={FormFieldTypes.CALENDAR}
                    title="Embargo Release Date"
                    defaultValue={step2?.studyInfo?.embargoReleaseDate
                      ? dayjs(step2?.studyInfo?.embargoReleaseDate)
                      : null}
                    validators={[FormValidators.DATEJS]}
                    onChange={onChange}
                  />
                  <FormField
                    id="step2.studyInfo.sequencingCenter"
                    title="Sequencing Center"
                    placeholder="Name"
                    onChange={onChange}
                    defaultValue={step2?.studyInfo?.sequencingCenter}
                  />
                </>
              )}
            {principalInvestigatorQuestion}
            <InstitutionSelector
              id="step2.studyInfo.piInstitution"
              title="Principal Investigator Institution"
              field={step2?.studyInfo?.piInstitution}
              validators={[FormValidators.REQUIRED]}
              onChange={onChange}
            />
            <FormField
              id="step2.studyInfo.NIHGrantOrContractNumber"
              title="NIH Grant or Contract Number"
              placeholder="NIH Grant or Contract Number..."
              onChange={onChange}
              defaultValue={step2?.studyInfo?.NIHGrantOrContractNumber}
              validators={[FormValidators.REQUIRED]}
            />
            <FormField
              id="step2.studyInfo.NIHCentersSupportingStudy"
              title="NIH ICs Supporting the Study"
              placeholder="Institute/Center Name"
              type={FormFieldTypes.SELECT}
              selectOptions={nihChoices}
              isMulti={true}
              defaultValue={step2?.studyInfo?.NIHCentersSupportingStudy}
              onChange={onChange}
            />
            <FormField
              id="step2.studyInfo.NIHProgramOfficerName"
              title="NIH Program Officer Name"
              placeholder="Officer Name"
              onChange={onChange}
              defaultValue={step2?.studyInfo?.NIHProgramOfficerName}
              validators={[]}
            />
            <FormField
              id="step2.studyInfo.NIHCenterForSubmission"
              title="NIH Institute/Center for Submission"
              placeholder="Institute/Center Name"
              type={FormFieldTypes.SELECT}
              selectOptions={nihChoices}
              isMulti={false}
              selectConfig={{}}
              defaultValue={step2?.studyInfo?.NIHCenterForSubmission}
              onChange={onChange}
            />
            <FormField
              id="step2.studyInfo.NIHGenomicProgramAdministratorName"
              title="NIH Genomic Program Administrator Name"
              placeholder="NIH Genomic Program Administrator Name"
              onChange={onChange}
              defaultValue={step2?.studyInfo?.NIHGenomicProgramAdministratorName}
              validators={[]}
            />
            <FormField
              id="step2.studyInfo.isMultiCenterStudy"
              title="Is this a multi-center study?"
              type={FormFieldTypes.YESNORADIOGROUP}
              orientation="vertical"
              defaultValue={step2?.studyInfo?.isMultiCenterStudy}
              onChange={onChange}
            />
            {(step1?.registeringStudyAtNIH
              && (step1?.NHGRIFunding === NHGRIFunding.NHGRI_WITH_PHS_ID
                || step1?.NHGRIFunding === NHGRIFunding.NHGRI_WITHOUT_PHS_ID
                || step1?.NHGRIFunding === NHGRIFunding.NO_NHGRI_PUBLISH_TO_ANVIL))
              && (
                <FormField
                  id="step2.studyInfo.collaboratingSites"
                  title="What are the collaborating sites?"
                  type={FormFieldTypes.SELECT}
                  placeholder="List site and hit enter here..."
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
                  defaultValue={step2?.studyInfo?.collaboratingSites}
                  onChange={onChange}
                />
              )}
            <FormField
              id="step2.studyInfo.isControlledAccessRequiredForGSR"
              title="Is the controlled access required for genomic summary results (GSR)?"
              type={FormFieldTypes.YESNORADIOGROUP}
              orientation="vertical"
              defaultValue={step2?.studyInfo?.isControlledAccessRequiredForGSR}
              onChange={onChange}
            />
            <FormField
              id="step2.studyInfo.controlledAccessReason"
              title="If yes, explain why controlled access is needed for GSR"
              placeholder="If yes, explain why controlled access is needed for GSR"
              onChange={onChange}
              defaultValue={step2?.studyInfo?.NIHGenomicProgramAdministratorName}
              validators={[FormValidators.REQUIRED]}
              disabled={step2?.studyInfo?.isControlledAccessRequiredForGSR}
            />
            <FormField
              id="step2.studyInfo.isRequestingAlternateDataSharingPlan"
              title="NIH Data Management & Sharing Policy Details"
              description={<div>Are you requesting an Alternative Data Sharing Plan (<a target="_blank" rel="noreferrer" href="https://www.google.com">info</a>) for samples that cannot be shared through a public repository or database?</div>}
              type={FormFieldTypes.YESNORADIOGROUP}
              orientation="vertical"
              defaultValue={step2?.studyInfo?.isRequestingAlternateDataSharingPlan}
              onChange={onChange}
            />
          </>
        )}
      </div>
    </div>
  )
}
export default AdvancedFormCommonStudyInformation
