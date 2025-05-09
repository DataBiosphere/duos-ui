import React from 'react';
import { FormField, FormFieldTypes } from '../../components/forms/forms';
import { FormFieldChange, FormState } from './ProgressReportFormState';

interface DarCloseoutProps {
    readonly readOnly: boolean;
    formState: FormState;
    onFormChange: (newState: Partial<FormState>) => void;
}

export default function DarCloseout(props: DarCloseoutProps): React.JSX.Element {
    const { readOnly, formState, onFormChange } = props;
    const _ignore = readOnly;

    return (
        <div data-cy='dar-closeout'>
            <div className='progress-report-step-card'>
                <h2>Step 4: DAR Closeout</h2>

                <div className='progress-report-row'>
                    <div>
                        <h3>4.1 Closeouts</h3>
                        <p>
                            If you are ready to finish work on this project, please complete this DAR Closeout section.
                            <br /><br />
                            By completing this page, upon project close-out, the PI and all approved users agree to destroy all copies, versions, and derivations of the dataset(s) retrieved from NIH-designated controlled-access databases, on both local servers and hardware, and if cloud computing was used, delete the data and cloud images from cloud computing provider storage, virtual machines, databases, and random access archives, except as required by publication practices, institutional policies, or law to retain them.
                            <br /><br />
                            This close-out will be submitted to the Signing Official (SO) of the project for approval. The SO is required to confirm the data destruction and insure retained data is encrypted, properly stored, and deleted at the appropriate time to comply with data security policies. If approved by the SO, the request will be sent to the Data Access Committee (DAC) for final approval. The project will be closed out after DAC approval is completed.
                        </p>
                    </div>
                    <div style={{ marginTop: '20px' }}>
                        <h4>Reasons for Project Closeout</h4>
                        <FormField
                            id='closeoutCompleted'
                            type={FormFieldTypes.CHECKBOX}
                            toggleText='The Requestor has completed his/her project'
                            onChange={({ key, value }: FormFieldChange) => {
                                onFormChange({ [key]: value });
                            }}
                        />
                        <FormField
                            id='closeoutMoved'
                            type={FormFieldTypes.CHECKBOX}
                            toggleText='The Requestor has moved institutions (if the project will continue in a new institution or by a new PI, they must go through Project Transfer)'
                            onChange={({ key, value }: FormFieldChange) => {
                                onFormChange({ [key]: value });
                            }}
                        />
                        <FormField
                            id='closeoutTransferred'
                            type={FormFieldTypes.CHECKBOX}
                            toggleText='The project is being transferred to a new Requestor at the same institution'
                            onChange={({ key, value }: FormFieldChange) => {
                                onFormChange({ [key]: value });
                            }}
                        />
                        <FormField
                            id='closeoutSuperceded'
                            type={FormFieldTypes.CHECKBOX}
                            toggleText='The project is being superceded by a new project'
                            onChange={({ key, value }: FormFieldChange) => {
                                onFormChange({ [key]: value });
                            }}
                        />
                        <FormField
                            id='closeoutOther'
                            type={FormFieldTypes.CHECKBOX}
                            toggleText='Other'
                            onChange={({ key, value }: FormFieldChange) => {
                                onFormChange({ [key]: value });
                            }}
                        />
                        {formState.closeoutOther === true &&
                            <div style={{ marginTop: '20px' }}>
                                <FormField
                                    id='closeoutOtherContext'
                                    type={FormFieldTypes.TEXTAREA}
                                    placeholder='Please provide context for the other reason.'
                                    rows={6}
                                    maxLength={2200}
                                    onChange={({ key, value }: FormFieldChange) => {
                                        onFormChange({ [key]: value });
                                    }}
                                />
                            </div>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}
