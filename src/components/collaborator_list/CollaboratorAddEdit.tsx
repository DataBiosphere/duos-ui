import React, {useCallback, useEffect, useState} from 'react';
import { FormField, FormValidators } from '../forms/forms';
import {Collaborator} from "src/types/model";
import {ValidationError} from "src/pages/dar_application/FormValidationState";
import {computeCollaboratorErrors, validationFailed} from "src/utils/darFormUtils";
import {nihAccountLabel} from "src/utils/ERACommonsUtils";
import ApproverStatus from "src/pages/dar_application/collaborator/ApproverStatus";

interface FormFieldChange {
    key: string;
    value: string;
}

interface CollaboratorAddEditProps {
    readonly id: number;
    collaborator?: Collaborator;
    readonly collaboratorText: string;
    readonly collaborators: Collaborator[];
    readonly closeAction: () => void;
    readonly onCollaboratorChange: (collaborators: Collaborator[]) => void;
    readonly showApproverStatus?: boolean;
}

interface Validation {
    name?: ValidationError;
    eraCommonsId?: ValidationError;
    title?: ValidationError;
    email?: ValidationError;
    approverStatus?: ValidationError;
}
export default function CollaboratorAddEdit(props: CollaboratorAddEditProps): React.JSX.Element {
    const { id, collaborator, collaboratorText, collaborators, closeAction, onCollaboratorChange, showApproverStatus } = props;

    const [newCollaborator, setNewCollaborator] = useState(collaborator);
    const [validation, setValidation] = useState<Validation>({});
    const accountLabel = nihAccountLabel();

    useEffect(() => {
        setValidation(computeCollaboratorErrors({collaborator: newCollaborator, needsApproverStatus: showApproverStatus}));
    }, [newCollaborator, showApproverStatus]);

    const formValidationChange = useCallback(({ key, validator }) => {
        setValidation((formValidation) => {
            return {
                ...formValidation,
                [key]: validator
            };
        });
    }, []);

    return (
        <div className='form-group row no-margin'>
            <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12 collaborator-form-card' key={`collaborator-item-id`}>
                <div className='row'>
                    <h2>{collaborator === undefined ? `New ${collaboratorText} Information` : `Edit ${collaborator.name} Information`}</h2>
                    <FormField
                        id='name'
                        title={`${collaboratorText} Name`}
                        defaultValue={collaborator?.name}
                        placeholder='Full Name'
                        validators={[FormValidators.REQUIRED]}
                        onChange={({ key, value }: FormFieldChange) => {
                            const setCollaborator = {
                                ...newCollaborator,
                                [key]: value
                            } as Collaborator;
                            setNewCollaborator(setCollaborator);
                        }}
                        validation={validation.name}
                        onValidationChange={formValidationChange}
                    />
                    <FormField
                        id='eraCommonsId'
                        title={`${collaboratorText} ${accountLabel} Account`}
                        defaultValue={collaborator?.eraCommonsId}
                        placeholder={`${accountLabel} Account`}
                        validators={[FormValidators.REQUIRED]}
                        onChange={({ key, value }: FormFieldChange) => {
                            const setCollaborator = {
                                ...newCollaborator,
                                [key]: value
                            } as Collaborator;
                            setNewCollaborator(setCollaborator);
                        }}
                        validation={validation.eraCommonsId}
                        onValidationChange={formValidationChange}
                    />
                    <FormField
                        id='title'
                        title={`${collaboratorText} Title`}
                        defaultValue={collaborator?.title}
                        placeholder='Title'
                        validators={[FormValidators.REQUIRED]}
                        onChange={({ key, value }: FormFieldChange) => {
                            const setCollaborator = {
                                ...newCollaborator,
                                [key]: value
                            } as Collaborator;
                            setNewCollaborator(setCollaborator);
                        }}
                        validation={validation.title}
                        onValidationChange={formValidationChange}
                    />
                    <FormField
                        id='email'
                        title={`${collaboratorText} Email`}
                        defaultValue={collaborator?.email}
                        placeholder='Email'
                        validators={[FormValidators.REQUIRED, FormValidators.EMAIL]}
                        onChange={({ key, value }: FormFieldChange) => {
                            const setCollaborator = {
                                ...newCollaborator,
                                [key]: value
                            } as Collaborator;
                            setNewCollaborator(setCollaborator);
                        }}
                        validation={validation.email}
                        onValidationChange={formValidationChange}
                    />
                    {showApproverStatus && (
                    <ApproverStatus
                        index={id}
                        approverStatus={newCollaborator?.approverStatus}
                        validation={validation.approverStatus}
                        onValidationChange={formValidationChange}
                        onChange={({key, value}) => {
                            const setCollaborator = {
                                ...newCollaborator,
                                [key]: value
                            } as Collaborator;
                            setNewCollaborator(setCollaborator);
                        }}/>
                    )}
                </div>
                <div className='row' style={{ marginTop: 20 }}>
                    {/* add/save button */}
                    <button
                        className='collaborator-form-add-save-button f-left btn'
                        type='button'
                        onClick={() => {
                            if (id < 0) {
                                onCollaboratorChange([...collaborators, newCollaborator]);
                                setNewCollaborator(undefined);
                            } else if (newCollaborator !== undefined) {
                                const collaboratorsCopy = [...collaborators];
                                collaboratorsCopy[id] = newCollaborator;
                                onCollaboratorChange(collaboratorsCopy);
                                setNewCollaborator(undefined);
                            }
                            closeAction();
                        }}
                        disabled={validationFailed(validation)}
                    >
                        {collaborator === undefined ? 'Add' : 'Save'}
                    </button>
                    {/* cancel button */}
                    <div
                        className='collaborator-form-cancel-button f-left btn'
                        role='button'
                        onClick={closeAction}
                    >
                        Cancel
                    </div>
                </div>
            </div>
        </div>
    )
}
