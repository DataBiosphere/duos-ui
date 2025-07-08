import React from 'react';
import CollaboratorAddEdit from './CollaboratorAddEdit';
import CollaboratorSummary from './CollaboratorSummary';
import {Collaborator} from 'src/types/model';
import {ValidationError} from 'src/pages/dar_application/FormValidationState';

interface CollaboratorRowProps {
    readonly id: number;
    readonly editMode: boolean;
    readonly readOnly: boolean;
    collaborator: Collaborator;
    readonly collaboratorText: string;
    readonly collaborators: Collaborator[];
    readonly columnsToShow: string[];
    readonly editAction: () => void;
    readonly deleteAction: () => void;
    readonly closeAction: () => void;
    readonly onCollaboratorChange: (collaborators: Collaborator[]) => void;
    readonly showApproverStatus?: boolean;
    readonly countriesOfOperation: string[];
    // Additional props for DAR application compatibility
    readonly validation?: Record<string, ValidationError>;
    readonly onCollaboratorValidationChange?: (params: {
        index: number;
        key?: string;
        validation: ValidationError;
    }) => void;
    readonly collaboratorKey?: string;
}

export default function CollaboratorRow(props: CollaboratorRowProps): React.JSX.Element {
    const {
      id, editMode, readOnly, collaborator, collaboratorText, collaborators, columnsToShow, countriesOfOperation,
      showApproverStatus, editAction, deleteAction, closeAction, onCollaboratorChange,
      validation, onCollaboratorValidationChange, collaboratorKey
    } = props;

    return (
        <div>
            {editMode && (
                <CollaboratorAddEdit
                    id={id}
                    collaborator={collaborator}
                    collaboratorText={collaboratorText}
                    collaborators={collaborators}
                    readOnly={readOnly}
                    closeAction={closeAction}
                    deleteAction={deleteAction}
                    onCollaboratorChange={onCollaboratorChange}
                    showApproverStatus={showApproverStatus}
                    countriesOfOperation={countriesOfOperation}
                    validation={validation}
                    onCollaboratorValidationChange={onCollaboratorValidationChange}
                    collaboratorKey={collaboratorKey}
                />)}
            {!editMode &&
                <CollaboratorSummary
                    collaborator={collaborator}
                    columnsToShow={columnsToShow}
                    editAction={editAction}
                    deleteAction={deleteAction}
                    readOnly={readOnly}
                    index={id}
                    collaboratorKey={collaboratorKey}
                />}
        </div>
    );
}
