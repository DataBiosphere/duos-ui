import React, {useState} from 'react';
import {FormField, FormFieldTypes, FormValidators} from '../forms/forms';
import {Collaborator} from 'src/types/model';
import {ValidationError} from 'src/pages/dar_application/FormValidationState';
import {computeCollaboratorErrors, validationFailed} from 'src/utils/darFormUtils';
import {nihAccountLabel} from 'src/utils/ERACommonsUtils';
import ApproverStatus from 'src/pages/dar_application/collaborator/ApproverStatus';
import { Countries } from 'src/libs/ajax/Countries';

interface FormFieldChange {
    key: string;
    value: string;
}

interface CollaboratorAddEditProps {
    readonly id: number;
    collaborator: Collaborator;
    readonly collaboratorText: string;
    readonly collaborators: Collaborator[];
    readonly closeAction: () => void;
    readonly onCollaboratorChange: (collaborators: Collaborator[]) => void;
    readonly showApproverStatus?: boolean;
    readonly readOnly?: boolean;
    readonly countriesOfOperation: string[];
}

interface Validation {
    name?: ValidationError;
    eraCommonsId?: ValidationError;
    title?: ValidationError;
    email?: ValidationError;
    approverStatus?: ValidationError;
    countryOfOperation?: ValidationError;
}

export default function CollaboratorAddEdit(props: CollaboratorAddEditProps): React.JSX.Element {
    const { id, collaborator, collaboratorText, collaborators, closeAction, onCollaboratorChange, showApproverStatus = false, countriesOfOperation } = props;
    const [newCollaborator, setNewCollaborator] = useState<Collaborator>(collaborator);
    const [validation, setValidation] = useState<Validation>({});
    const accountLabel = nihAccountLabel();

    const readOnly = props.readOnly || false;

    const onChange = ({ key, value }: FormFieldChange) => {
        const setCollaborator = {
            ...newCollaborator,
            [key]: value
        } as Collaborator;
        setNewCollaborator(setCollaborator);
        setValidation(computeCollaboratorErrors({collaborator: setCollaborator, needsApproverStatus: showApproverStatus}));
    };

      const sharedProps = readOnly ? {
        disabled: readOnly,
      } : {
        validators: [FormValidators.REQUIRED],
        onChange,
        disabled: readOnly,
      }

    const header = collaborator?.name === undefined
      ? `New ${collaboratorText} Information`
      : `${!readOnly ? `Edit ` : `View` } ${collaborator.name} Information`;

    return (
        <div className='form-group row no-margin'>
            <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12 collaborator-form-card' key={`collaborator-item-id`}>
                <div className='row'>
                    <h2>{header}</h2>
                    <FormField
                        {...sharedProps}
                        id='name'
                        title={`${collaboratorText} Name`}
                        defaultValue={collaborator.name}
                        placeholder='Full Name'
                        validation={validation.name}
                    />
                    <FormField
                        {...sharedProps}
                        id='eraCommonsId'
                        title={`${collaboratorText} ${accountLabel} Account`}
                        defaultValue={collaborator.eraCommonsId}
                        placeholder={`${accountLabel} Account`}
                        validation={validation.eraCommonsId}
                    />
                    <FormField
                        {...sharedProps}
                        id='title'
                        title={`${collaboratorText} Title`}
                        defaultValue={collaborator.title}
                        placeholder='Title'
                        validation={validation.title}
                    />
                    <FormField
                        id='email'
                        title={`${collaboratorText} Email`}
                        defaultValue={collaborator.email}
                        placeholder='Email'
                        validators={!readOnly ? [FormValidators.REQUIRED, FormValidators.EMAIL] : []}
                        validation={validation.email}
                        disabled={readOnly}
                        {...(!readOnly ? { onChange } : {})}
                    />
                    <FormField
                        {...sharedProps}
                        id='countryOfOperation'
                        title={`${collaboratorText} Country of Operation`}
                        type={FormFieldTypes.SELECT}
                        optionsAreString={true}
                        selectOptions={countriesOfOperation}
                        defaultValue={collaborator.countryOfOperation}
                        placeholder='Country of Operation'
                        validation={validation.countryOfOperation}
                    />
                    {showApproverStatus && (
                    <ApproverStatus
                        index={id}
                        approverStatus={newCollaborator?.approverStatus}
                        validation={validation.approverStatus}
                        onChange={(!readOnly ? ({ key, value }: { key: string; value: any }) => onChange({ key, value }) : null)}/>
                    )}
                </div>
                <div className='row' style={{ marginTop: 20 }}>
                    {/* add/save button */}
                    {!readOnly && (
                    <button
                        className='collaborator-form-add-save-button f-left btn'
                        type='button'
                        onClick={() => {
                            if (id < 0) {
                                onCollaboratorChange([...collaborators, newCollaborator]);
                                setNewCollaborator({countryOfOperation: Countries.DEFAULT_COUNTRY} as Collaborator);
                            } else if (newCollaborator !== undefined) {
                                const collaboratorsCopy = [...collaborators];
                                collaboratorsCopy[id] = newCollaborator;
                                onCollaboratorChange(collaboratorsCopy);
                                setNewCollaborator({countryOfOperation: Countries.DEFAULT_COUNTRY} as Collaborator);
                            }
                            closeAction();
                        }}
                        disabled={validationFailed(computeCollaboratorErrors({collaborator: newCollaborator, needsApproverStatus: showApproverStatus}))}
                    >
                        {collaborator?.name === undefined ? 'Add' : 'Save'}
                    </button>
                    )}
                    {/* cancel/close button */}
                    <div
                        className='collaborator-form-cancel-button f-left btn'
                        role='button'
                        onClick={closeAction}
                    >
                        {readOnly ? 'Close' : 'Cancel'}
                    </div>
                </div>
            </div>
        </div>
    )
}
