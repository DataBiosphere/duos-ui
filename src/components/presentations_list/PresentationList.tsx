import React, { useState } from 'react';
import PresentationAddEdit from './PresentationAddEdit';
import PresentationRow from './PresentationRow';
import {DarErrors} from 'src/pages/dar_application/FormValidationState';
import {Presentation} from 'src/types/model';

interface PresentationListProps {
    presentations: Presentation[];
    readonly columnsToShow?: string[];
    readonly onPresentationChange: (presentations: Presentation[]) => void;
    readonly disabled?: boolean;
    readonly validation?: DarErrors;
}

export default function PresentationList(props: PresentationListProps): React.JSX.Element {
    const {
        presentations,
        columnsToShow = [],
        onPresentationChange,
        disabled = false,
        validation
    } = props;

    const [showAddEdit, setShowAddEdit] = useState(false);
    const [editState, setEditState] = useState(presentations.map(() => false));

    const toggleEditState = (index: number) => {
        const editStateCopy = [...editState];
        editStateCopy[index] = !editStateCopy[index];
        setEditState(editStateCopy);
    }

    const handleDeletePresentation = (index: number) => {
        const updatedPresentations = presentations.filter((_, i) => i !== index);
        onPresentationChange(updatedPresentations);
    }

    const getValidationState = () => validation?.presentations;

    return (
        <div className="presentation-list-component">
            <div className="row no-margin">
                <button
                    id={`add-presentation-btn`}
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
                    Add Presentation
                </button>
                {showAddEdit && (
                    <PresentationAddEdit
                        id={-1}
                        presentations={presentations}
                        closeAction={() => setShowAddEdit(false)}
                        onPresentationChange={onPresentationChange}
                    />
                )}
            </div>
            <div className="form-group row no-margin">
                {presentations.map((presentation: Presentation, index: number) => {
                    return <PresentationRow
                        key={index}
                        id={index}
                        editMode={editState[index]}
                        presentation={presentation}
                        presentations={presentations}
                        columnsToShow={columnsToShow}
                        editAction={() => toggleEditState(index)}
                        deleteAction={() => { handleDeletePresentation(index); }}
                        closeAction={() => { toggleEditState(index); setShowAddEdit(false); }}
                        onPresentationChange={onPresentationChange}
                        disabled={disabled}
                    />
                })}
            </div>
        </div>
    );
}
