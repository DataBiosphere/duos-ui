import React, {useState} from 'react';
import {FormField, FormFieldTypes, FormValidators} from '../forms/forms';
import {Collaborator} from 'src/types/model';
import {ValidationError} from 'src/pages/dar_application/FormValidationState';
import {computeCollaboratorErrors, validationFailed} from 'src/utils/darFormUtils';
import {nihAccountLabel} from 'src/utils/ERACommonsUtils';
import ApproverStatus from 'src/pages/dar_application/collaborator/ApproverStatus';
import DeleteCollaboratorModal from 'src/pages/dar_application/collaborator/DeleteCollaboratorModal';
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
    readonly deleteAction: () => void;
    readonly onCollaboratorChange: (collaborators: Collaborator[]) => void;
    readonly showApproverStatus?: boolean;
    readonly readOnly?: boolean;
    readonly countriesOfOperation: string[];
    // Additional props for DAR application compatibility
    readonly validation?: any;
    readonly onCollaboratorValidationChange?: any;
    readonly collaboratorKey?: string;
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
    const { id, collaborator, collaboratorText, collaborators, closeAction, deleteAction, onCollaboratorChange, showApproverStatus = false, countriesOfOperation, validation: propsValidation, onCollaboratorValidationChange, collaboratorKey } = props;
    const [newCollaborator, setNewCollaborator] = useState<Collaborator>(collaborator);
    const [validation, setValidation] = useState<Validation>(propsValidation || {});
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const accountLabel = nihAccountLabel();

    const readOnly = props.readOnly || false;
    
    // Generate field ID prefix for DAR application compatibility only when collaboratorKey is provided
    const fieldIdPrefix = (collaboratorKey && id >= 0) ? `${id}_collaborator` : '';
    
    // Generate button ID for DAR application compatibility  
    const saveButtonId = collaboratorKey ? `collaborator-${collaboratorKey}-add-save` : undefined;

    const onChange = ({ key, value }: FormFieldChange) => {
        const setCollaborator = {
            ...newCollaborator,
            [key]: value
        } as Collaborator;
        setNewCollaborator(setCollaborator);
        const newValidation = computeCollaboratorErrors({collaborator: setCollaborator, needsApproverStatus: showApproverStatus});
        setValidation(newValidation);
        
        // Call DAR validation callback if provided
        if (onCollaboratorValidationChange) {
            onCollaboratorValidationChange({index: id, key, validation: newValidation[key as keyof Validation] || {}});
        }
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
      : `${!readOnly ? `Edit` : `View` } ${collaborator.name} Information`;

    return (
        <div className='form-group row no-margin'>
            <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12 collaborator-form-card' key={`collaborator-item-id`}>
                <div className='row'>
                    <h2>{header}</h2>
                    <FormField
                        {...sharedProps}
                        id={fieldIdPrefix ? `${fieldIdPrefix}Name` : 'name'}
                        name='name'
                        title={`${collaboratorText} Name`}
                        defaultValue={collaborator.name}
                        placeholder='Full Name'
                        validation={validation.name}
                    />
                    <FormField
                        {...sharedProps}
                        id={fieldIdPrefix ? `${fieldIdPrefix}EraCommonsId` : 'eraCommonsId'}
                        name='eraCommonsId'
                        title={`${collaboratorText} ${accountLabel} Account`}
                        defaultValue={collaborator.eraCommonsId}
                        placeholder={`${accountLabel} Account`}
                        validation={validation.eraCommonsId}
                    />
                    <FormField
                        {...sharedProps}
                        id={fieldIdPrefix ? `${fieldIdPrefix}Title` : 'title'}
                        name='title'
                        title={`${collaboratorText} Title`}
                        defaultValue={collaborator.title}
                        placeholder='Title'
                        validation={validation.title}
                    />
                    <FormField
                        id={fieldIdPrefix ? `${fieldIdPrefix}Email` : 'email'}
                        name='email'
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
                        id={fieldIdPrefix ? `${fieldIdPrefix}CountryOfOperation` : 'countryOfOperation'}
                        name='countryOfOperation'
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
                    {/* delete button for existing collaborators in DAR mode */}
                    {!readOnly && collaboratorKey && id >= 0 && collaborator?.name && (
                        <a
                            id={`${id}_deleteMember`}
                            onClick={() => setShowDeleteModal(true)}
                            style={{ verticalAlign: 'middle', lineHeight: '4rem', float: 'right' }}
                        >
                            <span
                                className='collaborator-delete-icon glyphicon glyphicon-trash'
                                aria-hidden='true'
                                data-tip='Delete dataset'
                                data-for='tip_delete'
                            />
                            <span style={{ marginLeft: '1rem', color: '#0948B7', verticalAlign: 'middle' }}>
                                Delete this entry
                            </span>
                        </a>
                    )}
                    {/* add/save button */}
                    {!readOnly && (
                    <button
                        id={saveButtonId}
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
                {/* Delete Modal */}
                {showDeleteModal && (
                    <DeleteCollaboratorModal
                        showDelete={showDeleteModal}
                        closeDelete={() => setShowDeleteModal(false)}
                        header='Delete Entry'
                        title={<div>Are you sure you want to delete <strong>{newCollaborator?.name}</strong>?</div>}
                        message={<div><i>This action is permanent and cannot be undone.</i></div>}
                        onConfirm={() => {
                            deleteAction();
                            setShowDeleteModal(false);
                            closeAction();
                        }}
                    />
                )}
            </div>
        </div>
    )
}
