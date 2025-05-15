import React from 'react';
import { Collaborator } from './Collaborator';
import CollaboratorAddEdit from './CollaboratorAddEdit';
import CollaboratorSummary from './CollaboratorSummary';

interface CollaboratorRowProps {
    readonly id: number;
    readonly editMode: boolean;
    collaborator: Collaborator;
    readonly collaboratorText: string;
    readonly collaborators: Collaborator[];
    readonly columnsToShow: string[];
    readonly editAction: () => void;
    readonly deleteAction: () => void;
    readonly closeAction: () => void;
    readonly onCollaboratorChange: (collaborators: Collaborator[]) => void;
    readonly disabled: boolean;
}

export default function CollaboratorRow(props: CollaboratorRowProps): React.JSX.Element {
    const { id, editMode, collaborator, collaboratorText, collaborators, columnsToShow, editAction, deleteAction, closeAction, onCollaboratorChange, disabled } = props;

    return (
        <div>
            {editMode && (
                <CollaboratorAddEdit
                    id={id}
                    collaborator={collaborator}
                    collaboratorText={collaboratorText}
                    collaborators={collaborators}
                    closeAction={closeAction}
                    onCollaboratorChange={onCollaboratorChange}
                />)}
            {!editMode && (
                <CollaboratorSummary
                    collaborator={collaborator}
                    columnsToShow={columnsToShow}
                    editAction={editAction}
                    deleteAction={deleteAction}
                    disabled={disabled}
                />)}
        </div>
    );
}
