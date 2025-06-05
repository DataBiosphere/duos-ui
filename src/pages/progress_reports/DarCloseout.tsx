import React from 'react';
import {FormField, FormFieldTypes, FormValidators} from 'src/components/forms/forms';
import {ValidFormState, FormState, FormStateKey} from 'src/pages/progress_reports/ProgressReportFormState';
import {DarErrors, ValidationError} from "src/pages/dar_application/FormValidationState";
import {FORM_TEXT_AREA_MAX_LENGTH} from "src/components/forms/formConstants";

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
                    <FormField
                        id={FormStateKey.CLOSEOUT_YES_NO}
                        type={FormFieldTypes.YESNORADIOGROUP}
                        title='5.1 Closeouts'
                        description={<span>Are you ready to finish work on this project?</span>}
                        orientation='horizontal'
                        onChange={({ key, value }: ValidFormState) => {
                            const newState = {[key]: value} as Partial<FormState>;
                            if (value === false) {
                                // If the user selects "No", clear out the closeout fields
                                newState[FormStateKey.CLOSEOUT_PROJECT_COMPLETED] = false;
                                newState[FormStateKey.CLOSEOUT_REQUESTOR_MOVED_INSTITUTION] = false;
                                newState[FormStateKey.CLOSEOUT_PROJECT_TRANSFERRED] = false;
                                newState[FormStateKey.CLOSEOUT_PROJECT_SUPERSEDED] = false;
                                newState[FormStateKey.CLOSEOUT_OTHER] = false;
                                newState[FormStateKey.CLOSEOUT_OTHER_TEXT] = '';
                            }
                            onFormChange(newState);
                        }}
                        defaultValue={formState.closeoutYesNo}
                        disabled={readOnly}
                        validation={validation?.closeoutYesNo}
                        onValidationChange={onValidationChange}
                    />
                    {formState.closeoutYesNo && (
                        <div>
                        <p>
                            By completing this page, upon project close-out, the PI and all approved users agree to destroy all copies, versions, and derivations of the dataset(s) retrieved from NIH-designated controlled-access databases, on both local servers and hardware, and if cloud computing was used, delete the data and cloud images from cloud computing provider storage, virtual machines, databases, and random access archives, except as required by publication practices, institutional policies, or law to retain them.
                        </p>

                        <div style={{ marginTop: '20px' }}>
                            <h4>Reasons for Project Closeout</h4>
                            <FormField
                                id={FormStateKey.CLOSEOUT_PROJECT_COMPLETED}
                                type={FormFieldTypes.CHECKBOX}
                                toggleText='The Requestor has completed his/her project'
                                disabled={readOnly}
                                onChange={({ key, value }: ValidFormState) => {
                                    onFormChange({ [key]: value } as Partial<FormState>);
                                }}
                                defaultValue={formState.closeoutProjectCompleted}
                                validation={validation?.closeoutProjectCompleted}
                            />
                            <FormField
                                id={FormStateKey.CLOSEOUT_REQUESTOR_MOVED_INSTITUTION}
                                type={FormFieldTypes.CHECKBOX}
                                toggleText='The Requestor has moved institutions (If the project will be continued in a new institution or by a new PI, they must go through Project Transfer)'
                                disabled={readOnly}
                                onChange={({ key, value }: ValidFormState) => {
                                    onFormChange({ [key]: value } as Partial<FormState>);
                                }}
                                defaultValue={formState.closeoutRequestorMovedInstitution}
                                validation={validation?.closeoutRequestorMovedInstitution}
                            />
                            <FormField
                                id={FormStateKey.CLOSEOUT_PROJECT_TRANSFERRED}
                                type={FormFieldTypes.CHECKBOX}
                                toggleText='The project is being transferred to a new Requestor at the same institution'
                                disabled={readOnly}
                                onChange={({ key, value }: ValidFormState) => {
                                    onFormChange({ [key]: value } as Partial<FormState>);
                                }}
                                defaultValue={formState.closeoutProjectTransferred}
                                validation={validation?.closeoutProjectTransferred}
                            />
                            <FormField
                                id={FormStateKey.CLOSEOUT_PROJECT_SUPERSEDED}
                                type={FormFieldTypes.CHECKBOX}
                                toggleText='The project is being superseded by a new project'
                                disabled={readOnly}
                                onChange={({ key, value }: ValidFormState) => {
                                    onFormChange({ [key]: value } as Partial<FormState>);
                                }}
                                defaultValue={formState.closeoutProjectSuperseded}
                                validation={validation?.closeoutProjectSuperseded}
                            />
                            <FormField
                                id={FormStateKey.CLOSEOUT_OTHER}
                                type={FormFieldTypes.CHECKBOX}
                                toggleText='Other'
                                disabled={readOnly}
                                onChange={({ key, value }: ValidFormState) => {
                                    onFormChange({ [key]: value } as Partial<FormState>);
                                }}
                                defaultValue={formState.closeoutOther}
                                validation={validation?.closeoutOther}
                            />
                            {formState.closeoutOther &&
                                <FormField
                                    id={FormStateKey.CLOSEOUT_OTHER_TEXT}
                                    type={FormFieldTypes.TEXTAREA}
                                    placeholder={'Please provide context for "other"'}
                                    defaultValue={formState.closeoutOtherText}
                                    description={''}
                                    rows={6}
                                    maxLength={FORM_TEXT_AREA_MAX_LENGTH}
                                    onChange={({ key, value }: ValidFormState) => {
                                        onFormChange({ [key]: value } as Partial<FormState>);
                                    }}
                                    validation={validation?.closeoutOtherText}
                                    validators={[FormValidators.REQUIRED]}
                                />
                            }
                        </div>
                    </div>
                )}
                </div>
            </div>
        </div>
    );
}
