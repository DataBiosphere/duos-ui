import React, { useState } from 'react';
import PublicationAddEdit from './PublicationAddEdit';
import PublicationRow from './PublicationRow';
import { Publication } from './Publication';

interface PublicationListProps {
    publications: Publication[];
    readonly publicationText: string;
    readonly columnsToShow?: string[];
    readonly onPublicationChange: (publications: Publication[]) => void;
    readonly disabled?: boolean;
}

export default function PublicationList(props: PublicationListProps): React.JSX.Element {
    const { publications, publicationText, columnsToShow = [], onPublicationChange, disabled = false } = props;

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
                {publications.map((publication: Publication, index: number) => {
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
