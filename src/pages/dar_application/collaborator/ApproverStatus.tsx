import {FormField, FormFieldTypes, FormValidators} from "src/components/forms/forms";
import React from "react";
import {ValidationError} from "src/pages/dar_application/FormValidationState";

type ApproverStatusType = boolean | 'yes' | 'no' | undefined;

interface ApproverStatusProps {
    readonly index: number;
    readonly approverStatus: ApproverStatusType;
    readonly validation?: ValidationError;
    readonly onValidationChange?: (params: {key: string, validator: ValidationError}) => void;
    readonly onChange: ((params: {key: string, value: ApproverStatusType}) => void) | null;
}
export default function ApproverStatus(props: ApproverStatusProps): React.JSX.Element {
    const {index, approverStatus, validation, onValidationChange, onChange} = props;
    const calculateDefaultValue = () => {
        if (approverStatus === true || approverStatus === 'yes') {
            return 'yes';
        }
        if (approverStatus === false || approverStatus === 'no') {
            return 'no';
        }
        return undefined;
    }

    return (
        <div className='row' style={{marginTop: 25}}>
            <FormField
                id={`${index}_collaboratorApproval`}
                type={FormFieldTypes.RADIOGROUP}
                name='approverStatus'
                description={`Are you requesting permission for this member of the Internal Lab Staff to be given
                Designated Download/Approval' status? This indication should be limited to individuals who
                the PI designates to download data and/or share the requested data with other Internal Lab Staff
                (ie., staff members and trainees under the direct supervision of the PI).`}
                options={[
                    {name: 'yes', text: 'Yes'},
                    {name: 'no', text: 'No'}
                ]}
                validators={[FormValidators.REQUIRED]}
                orientation='horizontal'
                defaultValue={calculateDefaultValue}
                validation={validation}
                onValidationChange={onValidationChange}
                onChange={onChange}
            />
            <p className='control-label rp-choice-questions' style={{fontSize: 14, marginTop: 5, marginBottom: 5}}>
                Please note: the terms of the Library Card Agreement are applicable to the Library Card Holder as well
                as
                their Internal Lab Staff.
            </p>
        </div>
    )
};
