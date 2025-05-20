import React from 'react';
import { FormField, FormFieldTypes } from 'src/components/forms/forms';
import {FormFieldChange, FormState, FormStateKey} from 'src/pages/progress_reports/ProgressReportFormState';
import {CloseOutSupplement} from "src/types/model";
import {getFormStateItem} from "src/pages/progress_reports/ProgressReportUtils";

interface DarCloseoutProps {
    readonly readOnly: boolean;
    formState: FormState;
    onFormChange: (newState: Partial<FormState>) => void;
}

export default function DarCloseout(props: DarCloseoutProps): React.JSX.Element {
    const { readOnly, formState, onFormChange } = props;

    return (
        <div data-cy='dar-closeout'>
            <div className='progress-report-step-card'>
                <h2>Step 5: DAR Closeout</h2>

                <div className='progress-report-row'>
                    <FormField
                        id={FormStateKey.CLOSEOUT_YES_NO}
                        type={FormFieldTypes.YESNORADIOGROUP}
                        title='5.1 Closeouts'
                        description={<span>Are you ready to finish work on this project?</span>}
                        orientation='horizontal'
                        onChange={({ key, value }: FormFieldChange) => {
                            onFormChange({ [key]: value });
                        }}
                        disabled={readOnly}
                    />
                    {getFormStateItem(formState, FormStateKey.DMI_YES_NO) === true && (
                        <div>
                        <p>
                            By completing this page, upon project close-out, the PI and all approved users agree to destroy all copies, versions, and derivations of the dataset(s) retrieved from NIH-designated controlled-access databases, on both local servers and hardware, and if cloud computing was used, delete the data and cloud images from cloud computing provider storage, virtual machines, databases, and random access archives, except as required by publication practices, institutional policies, or law to retain them.
                        </p>

                        <div style={{ marginTop: '20px' }}>
                            <h4>Reasons for Project Closeout</h4>
                            <FormField
                                id={FormStateKey.CLOSEOUT_SUPPLEMENT}
                                type={FormFieldTypes.RADIOGROUP}
                                orientation="vertical"
                                options={[
                                    { text: 'The Requestor has completed his/her project', name: CloseOutSupplement.PROJECT_COMPLETED },
                                    { text: 'The Requestor has moved institutions (If the project will be continued in a new institution or by a new PI, they must  go through Project Transfer)', name: CloseOutSupplement.REQUESTOR_MOVED_INSTITUTION },
                                    { text: 'The project is being transferred to a new Requestor at the same institution', name: CloseOutSupplement.PROJECT_TRANSFERRED },
                                    { text: 'The project is being superseded by a new project', name: CloseOutSupplement.PROJECT_SUPERSEDED }
                                ]}
                                disabled={readOnly}
                                defaultValue={getFormStateItem(formState, FormStateKey.CLOSEOUT_SUPPLEMENT)}
                                onChange={({ _key, value }: FormFieldChange) => {
                                    onFormChange({ [FormStateKey.CLOSEOUT_SUPPLEMENT]: value });
                                }}
                            />
                        </div>
                    </div>
                )}
                </div>
            </div>
        </div>
    );
}
