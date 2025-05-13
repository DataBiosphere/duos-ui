import React, { useState } from 'react';
import CollaboratorDelete from './CollaboratorDelete';
import { FormField, FormValidators } from '../../../components/forms/forms';
import { FormFieldChange } from '../ProgressReportFormState';

interface CollaboratorAddEditProps {
    readonly id: number;
    collaborator?: Collaborator;
    readonly collaboratorText: string;
    readonly collaborators: Collaborator[];
    readonly closeAction: () => void;
    readonly onCollaboratorChange: (input: any) => void;
}

export default function CollaboratorAddEdit(props: CollaboratorAddEditProps): React.JSX.Element {
    const { id, collaborator, collaboratorText, collaborators, closeAction, onCollaboratorChange } = props;

    const [newCollaborator, setNewCollaborator] = useState(collaborator);

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
                    />
                    <FormField
                        id='institution'
                        title={`${collaboratorText} Institution`}
                        defaultValue={collaborator?.institution}
                        placeholder='Institution'
                        validators={[FormValidators.REQUIRED]}
                        onChange={({ key, value }: FormFieldChange) => {
                            const setCollaborator = {
                                ...newCollaborator,
                                [key]: value
                            } as Collaborator;
                            setNewCollaborator(setCollaborator);
                        }}
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
                    />
                </div>
                <div className='row' style={{ marginTop: 20 }}>
                    {/* add/save button */}
                    <div
                        className='collaborator-form-add-save-button f-left btn'
                        role='button'
                        onClick={() => {
                            if (id < 0) {
                                onCollaboratorChange([...collaborators, newCollaborator]);
                                setNewCollaborator(undefined);
                            } else if (newCollaborator !== undefined) {
                                let collaboratorsCopy = [...collaborators];
                                collaboratorsCopy[id] = newCollaborator;
                                onCollaboratorChange(collaboratorsCopy);
                                setNewCollaborator(undefined);
                            }
                            closeAction();
                        }}
                    >
                        {collaborator === undefined ? 'Add' : 'Save'}
                    </div>
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
