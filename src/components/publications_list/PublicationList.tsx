import React, { useState } from 'react';
import PublicationAddEdit from './PublicationAddEdit';
import PublicationRow from './PublicationRow';
import { PublicationOrPresentation } from './PublicationOrPresentation';
import {DarErrors, ValidationError} from "src/pages/dar_application/FormValidationState";

interface PublicationListProps {
    publications: PublicationOrPresentation[];
    readonly publicationText: string;
    readonly columnsToShow?: string[];
    readonly onPublicationChange: (publications: PublicationOrPresentation[]) => void;
    readonly disabled?: boolean;
    readonly validation?: DarErrors;
    readonly onValidationChange?: (validationState: { key: string, validation: ValidationError }) => void;
}

export default function PublicationList(props: PublicationListProps): React.JSX.Element {
    const { publications, publicationText, columnsToShow = [], onPublicationChange, disabled = false, validation, onValidationChange } = props;

    const [showAddEdit, setShowAddEdit] = useState(false);
    const [editState, setEditState] = useState(publications.map(() => false));

    const toggleEditState = (index: number) => {
        const editStateCopy = [...editState];
        editStateCopy[index] = !editStateCopy[index];
        setEditState(editStateCopy);
    }

    const handleDeletePublication = (index: number) => {
        const updatedPublications = publications.filter((_, i) => i !== index);
        onPublicationChange(updatedPublications);
    }

    return (
        <div className="publication-list-component">
            <div className="row no-margin">
                <button
                    id={`add-${publicationText}-btn`}
                    type="button"
                    className="button button-white"
                    style={{
                        marginTop: 25,
                        marginBottom: 5,
                        border: validation?.publications ? '1px solid red' : '1px solid #0948B7',
                        boxShadow: validation?.publications ? '0 0 5px red' : 'none',
                        ...(disabled ? { cursor: 'not-allowed' } : {}),
                    }}
                    onClick={() => !disabled && setShowAddEdit(true) }
                    disabled={disabled}
                >
                    Add {publicationText}
                </button>
                {showAddEdit && (
                    <PublicationAddEdit
                        id={-1}
                        publicationText={publicationText}
                        publications={publications}
                        closeAction={() => setShowAddEdit(false)}
                        onPublicationChange={onPublicationChange}
                    />
                )}
            </div>
            <div className="form-group row no-margin">
                {publications.map((publication: PublicationOrPresentation, index: number) => {
                    return <PublicationRow
                        key={index}
                        id={index}
                        editMode={editState[index]}
                        publication={publication}
                        publicationText={publicationText}
                        publications={publications}
                        columnsToShow={columnsToShow}
                        editAction={() => toggleEditState(index)}
                        deleteAction={() => { handleDeletePublication(index); }}
                        closeAction={() => { toggleEditState(index); setShowAddEdit(false); }}
                        onPublicationChange={onPublicationChange}
                        disabled={disabled}
                    />
                })}
            </div>
        </div>
    );
}
