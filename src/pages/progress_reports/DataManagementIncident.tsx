import React from 'react';
import { FORM_TEXT_AREA_MAX_LENGTH } from 'src/components/forms/formConstants';
import { FormField, FormFieldTypes } from 'src/components/forms/forms';
import {ValidFormState, FormState, FormStateKey} from 'src/pages/progress_reports/ProgressReportFormState';
import {DarErrors, ValidationError} from "src/pages/dar_application/FormValidationState";

interface DataManagementIncidentProps {
    readonly readOnly: boolean;
    formState: FormState;
    onFormChange: (newState: Partial<FormState>) => void;
    onValidationChange?: (validationState: { key: string; validation: ValidationError }) => void;
    validation?: DarErrors;
}

export default function DataManagementIncident(props: DataManagementIncidentProps): React.JSX.Element {
    const { readOnly, formState, onFormChange, onValidationChange, validation } = props;

    return (
        <div data-cy='data-management-incident'>
            <div className='progress-report-step-card'>
                <h2>Step 4: Data Management Incident</h2>

                <div className='progress-report-row'>
                    <div>
                        <FormField
                            id={FormStateKey.DMI_YES_NO}
                            type={FormFieldTypes.YESNORADIOGROUP}
                            title='4.1 Data Management Incident'
                            description='Have there been any incidents related to mismanagement or misuse of data?'
                            orientation='horizontal'
                            defaultValue={formState.dmiYesNo}
                            onChange={({ key, value }: ValidFormState) => {
                                const newState = { [key]: value } as Partial<FormState>;
                                if (value === false) {
                                    newState[FormStateKey.DMI_COMBINATION] = false;
                                    newState[FormStateKey.DMI_IDENTIFICATION] = false;
                                    newState[FormStateKey.DMI_SHARING] = false;
                                    newState[FormStateKey.DMI_SECURITY] = false;
                                    newState[FormStateKey.DMI_ACKNOWLEDGEMENT] = false;
                                    newState[FormStateKey.DMI_PUBLICATION] = false;
                                    newState[FormStateKey.DMI_FALSIFICATION] = false;
                                    newState[FormStateKey.DMI_OTHER] = false;
                                }
                                onFormChange(newState);
                            }}
                            disabled={readOnly}
                            validation={validation?.dmiYesNo}
                            onValidationChange={onValidationChange}
                        />
                    </div>
                    {formState.dmiYesNo &&
                        <>
                            <div style={{ marginTop: '20px' }}>
                                <div>Please select any of the following that describe the nature of this Data Management Incident:</div>
                                <FormField
                                    id={FormStateKey.DMI_COMBINATION}
                                    type={FormFieldTypes.CHECKBOX}
                                    toggleText='Inappropriate combination or analysis of the requested datasets with unapproved datasets'
                                    defaultValue={formState.dmiCombination}
                                    onChange={({ key, value }: ValidFormState) => {
                                        onFormChange({ [key]: value }  as Partial<FormState>);
                                    }}
                                    disabled={readOnly}
                                    validation={validation?.dmiCombination}
                                    onValidationChange={onValidationChange}
                                />
                                <FormField
                                    id={FormStateKey.DMI_IDENTIFICATION}
                                    type={FormFieldTypes.CHECKBOX}
                                    toggleText='Intentional or accidental identification of participants or generation of data which makes them easily identifiable'
                                    defaultValue={formState.dmiIdentification}
                                    onChange={({ key, value }: ValidFormState) => {
                                        onFormChange({ [key]: value } as Partial<FormState>);
                                    }}
                                    disabled={readOnly}
                                    validation={validation?.dmiIdentification}
                                    onValidationChange={onValidationChange}
                                />
                                <FormField
                                    id={FormStateKey.DMI_SHARING}
                                    type={FormFieldTypes.CHECKBOX}
                                    toggleText='Distribution of the data to an individual or institution beyond those specified in the approved Data Access Request (DAR)'
                                    defaultValue={formState.dmiSharing}
                                    onChange={({ key, value }: ValidFormState) => {
                                        onFormChange({ [key]: value }  as Partial<FormState>);
                                    }}
                                    disabled={readOnly}
                                    validation={validation?.dmiSharing}
                                    onValidationChange={onValidationChange}
                                />
                                <FormField
                                    id={FormStateKey.DMI_SECURITY}
                                    type={FormFieldTypes.CHECKBOX}
                                    toggleText='Failure to adhere to NIH Security Best Practices for Controlled-Access Data'
                                    defaultValue={formState.dmiSecurity}
                                    onChange={({ key, value }: ValidFormState) => {
                                        onFormChange({ [key]: value } as Partial<FormState>);
                                    }}
                                    disabled={readOnly}
                                    validation={validation?.dmiSecurity}
                                    onValidationChange={onValidationChange}
                                />
                                <FormField
                                    id={FormStateKey.DMI_ACKNOWLEDGEMENT}
                                    type={FormFieldTypes.CHECKBOX}
                                    toggleText='Failure to acknowledge the investigator(s) who generated the data, the funding source, accession numbers of the dataset'
                                    defaultValue={formState.dmiAcknowledgement}
                                    onChange={({ key, value }: ValidFormState) => {
                                        onFormChange({ [key]: value } as Partial<FormState>);
                                    }}
                                    disabled={readOnly}
                                    validation={validation?.dmiAcknowledgement}
                                    onValidationChange={onValidationChange}
                                />
                                <FormField
                                    id={FormStateKey.DMI_PUBLICATION}
                                    type={FormFieldTypes.CHECKBOX}
                                    toggleText='Analysis and/or publication of a study using the data for the research purpose other than the approved research use'
                                    defaultValue={formState.dmiPublication}
                                    onChange={({ key, value }: ValidFormState) => {
                                        onFormChange({ [key]: value } as Partial<FormState>);
                                    }}
                                    disabled={readOnly}
                                    validation={validation?.dmiPublication}
                                    onValidationChange={onValidationChange}
                                />
                                <FormField
                                    id={FormStateKey.DMI_FALSIFICATION}
                                    type={FormFieldTypes.CHECKBOX}
                                    toggleText='Fabrication or falsification of data and/or results'
                                    defaultValue={formState.dmiFalsification}
                                    onChange={({ key, value }: ValidFormState) => {
                                        onFormChange({ [key]: value } as Partial<FormState>);
                                    }}
                                    disabled={readOnly}
                                    validation={validation?.dmiFalsification}
                                    onValidationChange={onValidationChange}
                                />
                                <FormField
                                    id={FormStateKey.DMI_OTHER}
                                    type={FormFieldTypes.CHECKBOX}
                                    toggleText='Other: such as inadvertent data release or breach of security'
                                    defaultValue={formState.dmiOther}
                                    onChange={({ key, value }: ValidFormState) => {
                                        onFormChange({ [key]: value } as Partial<FormState>);
                                    }}
                                    disabled={readOnly}
                                    validation={validation?.dmiOther}
                                    onValidationChange={onValidationChange}
                                />
                            </div>
                            <div style={{ marginTop: '20px' }}>
                                <FormField
                                    id={FormStateKey.DMI_DESCRIPTION}
                                    type={FormFieldTypes.TEXTAREA}
                                    description='Please describe the incidents related to mismanagement or misuse of data below.'
                                    placeholder={`Please limit your Data Management Incident to ${FORM_TEXT_AREA_MAX_LENGTH} characters.`}
                                    rows={6}
                                    maxLength={FORM_TEXT_AREA_MAX_LENGTH}
                                    defaultValue={formState.dmiDescription}
                                    onChange={({ key, value }: ValidFormState) => {
                                        onFormChange({ [key]: value } as Partial<FormState>);
                                    }}
                                    disabled={readOnly}
                                    validation={validation?.dmiDescription}
                                    onValidationChange={onValidationChange}
                                />
                            </div>
                        </>
                    }
                </div>
            </div>
        </div>
    );
}
