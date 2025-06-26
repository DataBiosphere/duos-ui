import React, { useState } from 'react';
import CollaboratorAddEdit from './CollaboratorAddEdit';
import CollaboratorRow from './CollaboratorRow';
import {Collaborator} from 'src/types/model';
import {Countries} from 'src/libs/ajax/Countries';

interface CollaboratorListProps {
    collaborators: Collaborator[];
    readonly collaboratorText: string;
    readonly columnsToShow?: string[];
    readonly onCollaboratorChange: (collaborators: Collaborator[]) => void;
    readonly readOnly?: boolean;
    readonly showApproverStatus?: boolean;
    readonly countriesOfOperation: string[];
}

export default function CollaboratorList(props: CollaboratorListProps): React.JSX.Element {
    const {
      collaborators,
      collaboratorText,
      columnsToShow = [],
      onCollaboratorChange,
      readOnly = false,
      showApproverStatus = false,
      countriesOfOperation
    } = props;

    const [showAddEdit, setShowAddEdit] = useState(false);
    const [editState, setEditState] = useState(collaborators.map(() => false));

    const toggleEditState = (index: number) => {
        const editStateCopy = [...editState];
        editStateCopy[index] = !editStateCopy[index];
        setEditState(editStateCopy);
    }

    const handleDeleteCollaborator = (index: number) => {
        const updatedCollaborators = collaborators.filter((_, i) => i !== index);
        onCollaboratorChange(updatedCollaborators);
    }

    return (
        <div className="collaborator-list-component">
            <div className="row no-margin">
                {!readOnly && (
                    <button
                        id={`add-${collaboratorText}-btn`}
                        type="button"
                        className="button button-white"
                        style={{
                            marginTop: 25,
                            marginBottom: 5,
                        }}
                        onClick={() => setShowAddEdit(true) }
                    >
                        Add {collaboratorText}
                    </button>
                )}
                {showAddEdit && (
                    <CollaboratorAddEdit
                        id={-1}
                        collaboratorText={collaboratorText}
                        collaborators={collaborators}
                        collaborator={{countryOfOperation: Countries.DEFAULT_COUNTRY} as Collaborator}
                        closeAction={() => setShowAddEdit(false)}
                        onCollaboratorChange={onCollaboratorChange}
                        showApproverStatus={showApproverStatus}
                        countriesOfOperation={countriesOfOperation}
                    />
                )}
            </div>
            <div className="form-group row no-margin">
                {collaborators.map((collaborator: Collaborator, index: number) => {
                    return <CollaboratorRow
                        key={index}
                        id={index}
                        editMode={editState[index]}
                        readOnly={readOnly}
                        collaborator={collaborator}
                        collaboratorText={collaboratorText}
                        collaborators={collaborators}
                        columnsToShow={columnsToShow}
                        countriesOfOperation={countriesOfOperation}
                        showApproverStatus={showApproverStatus}
                        editAction={() => toggleEditState(index)}
                        deleteAction={() => { handleDeleteCollaborator(index); }}
                        closeAction={() => { toggleEditState(index); setShowAddEdit(false); }}
                        onCollaboratorChange={onCollaboratorChange}
                    />
                })}
            </div>
        </div>
    );
}
