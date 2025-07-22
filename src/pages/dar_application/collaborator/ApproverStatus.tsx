import {FormField, FormFieldTypes, FormValidators} from 'src/components/forms/forms';
import React from 'react';
import {ValidationError} from 'src/pages/dar_application/FormValidationState';

type ApproverStatusType = boolean | 'true' | 'false' |  undefined;

interface ApproverStatusProps {
    readonly index: number;
    readonly approverStatus: ApproverStatusType;
    readonly readOnly?: boolean;
    readonly validation?: ValidationError;
    readonly onValidationChange?: (params: {key: string, validator: ValidationError}) => void;
    readonly onChange: ((params: {key: string, value: ApproverStatusType}) => void) | null;
}
export default function ApproverStatus(props: ApproverStatusProps): React.JSX.Element {
    const {index, approverStatus, validation, onValidationChange, onChange} = props;

    const isYes = (approverStatus: ApproverStatusType) => {
        return (approverStatus === true ||  approverStatus === 'true')
    }

    const isNo = (approverStatus: ApproverStatusType) => {
        return (approverStatus === false || approverStatus === 'false')
    }

    const getApproverStatusValue = (approverStatus: ApproverStatusType) => {
        if (isYes(approverStatus)) return 'true';
        if (isNo(approverStatus)) return 'false';
        return undefined;
    }

    const calculateDefaultValue = () => {
        return getApproverStatusValue(approverStatus)
    }

    const localOnChange = ({key, value}: {key: string, value: ApproverStatusType}) => {
        const approverStatusType = getApproverStatusValue(value);
        if (onChange) {
            onChange({key: key, value: approverStatusType});
        }
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
                    {name: 'true', text: 'Yes'},
                    {name: 'false', text: 'No'}
                ]}
                disabled={props.readOnly}
                validators={[FormValidators.REQUIRED]}
                orientation='horizontal'
                defaultValue={calculateDefaultValue}
                validation={validation}
                onValidationChange={onValidationChange}
                onChange={localOnChange}
            />
            <p className='control-label rp-choice-questions' style={{fontSize: 14, marginTop: 5, marginBottom: 5}}>
                Please note: the terms of the Library Card Agreement are applicable to the Library Card Holder as well
                as
                their Internal Lab Staff.
            </p>
        </div>
    )
};
