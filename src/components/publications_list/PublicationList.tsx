import React, { useState } from 'react';
import PublicationAddEdit from './PublicationAddEdit';
import PublicationRow from './PublicationRow';
import {DarErrors} from 'src/pages/dar_application/FormValidationState';
import {Publication} from 'src/types/model';

interface PublicationListProps {
    readonly publications: Publication[];
    readonly columnsToShow?: string[];
    readonly onPublicationChange: (publications: Publication[]) => void;
    readonly disabled?: boolean;
    readonly validation?: DarErrors;
}

export default function PublicationList(props: PublicationListProps): React.JSX.Element {
    const {
        publications,
        columnsToShow = [],
        onPublicationChange,
        disabled = false,
        validation
    } = props;

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

    const getValidationState = () => validation?.publications

    return (
        <div className="publication-list-component">
            <div className="row no-margin">
                <button
                    id={`add-publication-btn`}
                    type="button"
                    className="button button-white"
                    style={{
                        marginTop: 25,
                        marginBottom: 5,
                        border: getValidationState() ? '1px solid red' : '1px solid #0948B7',
                        boxShadow: getValidationState() ? '0 0 5px red' : 'none',
                        ...(disabled ? { cursor: 'not-allowed' } : {}),
                    }}
                    onClick={() => !disabled && setShowAddEdit(true) }
                    disabled={disabled}
                >
                    Add Publication
                </button>
                {showAddEdit && (
                    <PublicationAddEdit
                        id={-1}
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
