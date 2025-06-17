import React from 'react';
import CollaboratorAddEdit from './CollaboratorAddEdit';
import CollaboratorSummary from './CollaboratorSummary';
import {Collaborator} from 'src/types/model';

interface CollaboratorRowProps {
    readonly id: number;
    readonly editMode: boolean;
    collaborator: Collaborator | undefined;
    readonly collaboratorText: string;
    readonly collaborators: Collaborator[];
    readonly columnsToShow: string[];
    readonly editAction: () => void;
    readonly deleteAction: () => void;
    readonly closeAction: () => void;
    readonly onCollaboratorChange: (collaborators: Collaborator[]) => void;
    readonly countriesOfOperation: string[];
    readonly disabled: boolean;
}

export default function CollaboratorRow(props: CollaboratorRowProps): React.JSX.Element {
    const { id, editMode, collaborator, collaboratorText, collaborators, columnsToShow, countriesOfOperation, editAction, deleteAction, closeAction, onCollaboratorChange, disabled } = props;

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
                    countriesOfOperation={countriesOfOperation}
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
