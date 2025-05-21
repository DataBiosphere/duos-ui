import React from 'react';
import { FORM_TEXT_AREA_MAX_LENGTH } from 'src/components/forms/formConstants';
import { FormField, FormFieldTypes } from 'src/components/forms/forms';
import { FormFieldChange, FormState } from 'src/pages/progress_reports/ProgressReportFormState';
import {DarErrors, ValidationError} from "src/pages/dar_application/FormValidationState";

interface DarCloseoutProps {
    readonly readOnly: boolean;
    formState: FormState;
    onFormChange: (newState: Partial<FormState>) => void;
    onValidationChange?: (validationState: { key: string, validation: ValidationError }) => void;
    validation?: DarErrors;
}

export default function DarCloseout(props: DarCloseoutProps): React.JSX.Element {
    const { readOnly, formState, onFormChange, onValidationChange, validation } = props;

    return (
        <div data-cy='dar-closeout'>
            <div className='progress-report-step-card'>
                <h2>Step 5: DAR Closeout</h2>

                <div className='progress-report-row'>
                    <div>
                        <h3>5.1 Closeouts</h3>
                        <p>
                            If you are ready to finish work on this project, please complete this DAR Closeout section.
                            <br /><br />
                            By completing this page, upon project close-out, the PI and all approved users agree to destroy all copies, versions, and derivations of the dataset(s) retrieved from NIH-designated controlled-access databases, on both local servers and hardware, and if cloud computing was used, delete the data and cloud images from cloud computing provider storage, virtual machines, databases, and random access archives, except as required by publication practices, institutional policies, or law to retain them.
                        </p>
                    </div>
                    <div style={{ marginTop: '20px' }}>
                        <h4>Reasons for Project Closeout</h4>
                        <FormField
                            id='closeoutCompleted'
                            type={FormFieldTypes.CHECKBOX}
                            toggleText='The Requestor has completed the project'
                            onChange={({ key, value }: FormFieldChange) => {
                                onFormChange({ [key]: value });
                            }}
                            disabled={readOnly}
                            validation={validation?.closeoutCompleted}
                            onValidationChange={onValidationChange}
                        />
                        <FormField
                            id='closeoutMoved'
                            type={FormFieldTypes.CHECKBOX}
                            toggleText='The Requestor has moved institutions (if the project will continue in a new institution or by a new PI, they must go through Project Transfer)'
                            onChange={({ key, value }: FormFieldChange) => {
                                onFormChange({ [key]: value });
                            }}
                            disabled={readOnly}
                            validation={validation?.closeoutMoved}
                            onValidationChange={onValidationChange}
                        />
                        <FormField
                            id='closeoutTransferred'
                            type={FormFieldTypes.CHECKBOX}
                            toggleText='The project is being transferred to a new Requestor at the same institution'
                            onChange={({ key, value }: FormFieldChange) => {
                                onFormChange({ [key]: value });
                            }}
                            disabled={readOnly}
                            validation={validation?.closeoutTransferred}
                            onValidationChange={onValidationChange}
                        />
                        <FormField
                            id='closeoutSuperceded'
                            type={FormFieldTypes.CHECKBOX}
                            toggleText='The project is being superceded by a new project'
                            onChange={({ key, value }: FormFieldChange) => {
                                onFormChange({ [key]: value });
                            }}
                            disabled={readOnly}
                            validation={validation?.closeoutSuperceded}
                            onValidationChange={onValidationChange}
                        />
                        <FormField
                            id='closeoutOther'
                            type={FormFieldTypes.CHECKBOX}
                            toggleText='Other'
                            onChange={({ key, value }: FormFieldChange) => {
                                onFormChange({ [key]: value });
                            }}
                            disabled={readOnly}
                            validation={validation?.closeoutOther}
                            onValidationChange={onValidationChange}
                        />
                        {formState.closeoutOther === true &&
                            <div style={{ marginTop: '20px' }}>
                                <FormField
                                    id='closeoutOtherContext'
                                    type={FormFieldTypes.TEXTAREA}
                                    placeholder='Please provide context for the other reason.'
                                    rows={6}
                                    maxLength={FORM_TEXT_AREA_MAX_LENGTH}
                                    onChange={({ key, value }: FormFieldChange) => {
                                        onFormChange({ [key]: value });
                                    }}
                                    disabled={readOnly}
                                    validation={validation?.closeoutOtherContext}
                                    onValidationChange={onValidationChange}
                                />
                            </div>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}
