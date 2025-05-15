import React from 'react';
import { FormField, FormFieldTypes } from 'src/components/forms/forms';
import { FormFieldChange, FormState } from 'src/pages/progress_reports/ProgressReportFormState';

const titleStyle = { fontSize: '24px', fontWeight: 500, color: '#333333' };

interface DataManagementIncidentProps {
    readonly readOnly: boolean;
    formState: FormState;
    onFormChange: (newState: Partial<FormState>) => void;
}

export default function DataManagementIncident(props: DataManagementIncidentProps): React.JSX.Element {
    const { readOnly, formState, onFormChange } = props;

    return (
        <div data-cy='data-management-incident'>
            <div className='progress-report-step-card'>
                <h2>Step 3: Data Management Incident</h2>

                <div className='progress-report-row'>
                    <div>
                        <FormField
                            id='dmiYesNo'
                            type={FormFieldTypes.YESNORADIOGROUP}
                            title='3.1 Data Management Incident'
                            titleStyle={titleStyle}
                            description='Have there been any incidents related to mismanagement or misuse of data?'
                            orientation='horizontal'
                            onChange={({ key, value }: FormFieldChange) => {
                                if (value === false) {
                                    onFormChange({
                                        dmiCombination: false,
                                        dmiIdentification: false,
                                        dmiSharing: false,
                                        dmiSecurity: false,
                                        dmiAcknowledgement: false,
                                        dmiPublication: false,
                                        dmiFalsification: false,
                                        dmiOther: false
                                    });
                                }
                                onFormChange({ [key]: value });
                            }}
                            disabled={readOnly}
                        />
                    </div>
                    {formState.dmiYesNo === true &&
                        <>
                            <div style={{ marginTop: '20px' }}>
                                <div>Please select any of the following that describe the nature of this Data Management Incident:</div>
                                <FormField
                                    id='dmiCombination'
                                    type={FormFieldTypes.CHECKBOX}
                                    toggleText='Inappropriate combination or analysis of the requested datasets with unapproved datasets'
                                    onChange={({ key, value }: FormFieldChange) => {
                                        onFormChange({ [key]: value });
                                    }}
                                    disabled={readOnly}
                                />
                                <FormField
                                    id='dmiIdentification'
                                    type={FormFieldTypes.CHECKBOX}
                                    toggleText='Intentional or accidental identification of participants or generation of data which makes them easily identifiable'
                                    onChange={({ key, value }: FormFieldChange) => {
                                        onFormChange({ [key]: value });
                                    }}
                                    disabled={readOnly}
                                />
                                <FormField
                                    id='dmiSharing'
                                    type={FormFieldTypes.CHECKBOX}
                                    toggleText='Distribution of the data to an individual or institution beyond those specified in the approved Data Access Request (DAR)'
                                    onChange={({ key, value }: FormFieldChange) => {
                                        onFormChange({ [key]: value });
                                    }}
                                    disabled={readOnly}
                                />
                                <FormField
                                    id='dmiSecurity'
                                    type={FormFieldTypes.CHECKBOX}
                                    toggleText='Failure to adhere to NIH Security Best Practices for Controlled-Access Data'
                                    onChange={({ key, value }: FormFieldChange) => {
                                        onFormChange({ [key]: value });
                                    }}
                                    disabled={readOnly}
                                />
                                <FormField
                                    id='dmiAcknowledgement'
                                    type={FormFieldTypes.CHECKBOX}
                                    toggleText='Failure to acknowledge the investigator(s) who generated the data, the funding source, accession numbers of the dataset'
                                    onChange={({ key, value }: FormFieldChange) => {
                                        onFormChange({ [key]: value });
                                    }}
                                    disabled={readOnly}
                                />
                                <FormField
                                    id='dmiPublication'
                                    type={FormFieldTypes.CHECKBOX}
                                    toggleText='Analysis and/or publication of a study using the data for the research purpose other than the approved research use'
                                    onChange={({ key, value }: FormFieldChange) => {
                                        onFormChange({ [key]: value });
                                    }}
                                    disabled={readOnly}
                                />
                                <FormField
                                    id='dmiFalsification'
                                    type={FormFieldTypes.CHECKBOX}
                                    toggleText='Fabrication or falsification of data and/or results'
                                    onChange={({ key, value }: FormFieldChange) => {
                                        onFormChange({ [key]: value });
                                    }}
                                    disabled={readOnly}
                                />
                                <FormField
                                    id='dmiOther'
                                    type={FormFieldTypes.CHECKBOX}
                                    toggleText='Other: such as inadvertent data release or breach of security'
                                    onChange={({ key, value }: FormFieldChange) => {
                                        onFormChange({ [key]: value });
                                    }}
                                    disabled={readOnly}
                                />
                            </div>
                            <div style={{ marginTop: '20px' }}>
                                <FormField
                                    id='dmiDescription'
                                    type={FormFieldTypes.TEXTAREA}
                                    titleStyle={titleStyle}
                                    description='Please describe the incidents related to mismanagement or misuse of data below.'
                                    placeholder='Please limit your Data Management Incident to 2200 characters.'
                                    rows={6}
                                    maxLength={2200}
                                    onChange={({ key, value }: FormFieldChange) => {
                                        onFormChange({ [key]: value });
                                    }}
                                    disabled={readOnly}
                                />
                            </div>
                        </>
                    }
                </div>
            </div>
        </div>
    );
}
