import React from 'react';
import CollaboratorAddEdit from './CollaboratorAddEdit';
import CollaboratorSummary from './CollaboratorSummary';
import CollaboratorForm from 'src/pages/dar_application/collaborator/CollaboratorRow';
import {Collaborator} from 'src/types/model';

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
}

export default function CollaboratorRow(props: CollaboratorRowProps): React.JSX.Element {
    const {
      id, editMode, readOnly, collaborator, collaboratorText, collaborators, columnsToShow, countriesOfOperation,
      editAction, deleteAction, closeAction, onCollaboratorChange
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
                    onCollaboratorChange={onCollaboratorChange}
                    countriesOfOperation={countriesOfOperation}
                />)}
            {!editMode &&
                <CollaboratorSummary
                    collaborator={collaborator}
                    columnsToShow={columnsToShow}
                    editAction={editAction}
                    deleteAction={deleteAction}
                    readOnly={readOnly}
                />}
        </div>
    );
}
