import React, { useState } from 'react';
import CollaboratorDelete from './CollaboratorDelete';
import {Collaborator} from 'src/types/model';

interface CollaboratorSummaryProps {
    collaborator: Collaborator;
    readonly columnsToShow: string[];
    readonly editAction: () => void;
    readonly deleteAction: () => void;
    readonly readOnly: boolean;
}

export default function CollaboratorSummary(props: CollaboratorSummaryProps): React.JSX.Element {
    const { collaborator, columnsToShow, editAction, deleteAction, readOnly } = props;

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const disabledStyle = {
        cursor: 'not-allowed',
        opacity: 0.5
    };

    const deleteButtonStyle = readOnly ? disabledStyle : {};

    return (
        <div className='collaborator-summary-card'>
            {/* data elements to show in the row summary */}
            {columnsToShow.map((column, index) => {
                const columnContent = collaborator ? collaborator[column as keyof Collaborator] : [];
                return columnContent && (
                    <div key={'collaborator_summary_column_' + index} style={{ flex: '1 1 100%', marginRight: '1.5rem' }}>
                        <span>
                            {columnContent}
                        </span>
                    </div>
                );
            })}
            {/* edit button */}
            <div className='collaborator-summary-edit-delete-buttons'>
                <a
                    style={{ marginLeft: 10, marginRight: 10 }}
                    onClick={() => editAction()}
                >
                    <span
                        className='glyphicon glyphicon-pencil caret-margin collaborator-edit-icon'
                        aria-hidden='true'
                        data-tip='Edit dataset'
                        data-for='tip_edit'
                    ></span>
                    <span style={{ marginLeft: '1rem' }}></span>
                </a>
            </div>
            {/* delete button */}
            <a
                style={{ marginLeft: 10, ...deleteButtonStyle }}
                onClick={() => !readOnly && setShowDeleteModal(true) }
            >
                <span
                    className='glyphicon glyphicon-trash collaborator-delete-icon'
                    aria-hidden='true'
                    data-tip='Delete dataset'
                    data-for='tip_delete'
                ></span>
                <span style={{ marginLeft: '1rem' }}></span>
            </a>
            {/* delete modal */}
            <CollaboratorDelete
                collaboratorName={collaborator?.name}
                showDelete={showDeleteModal}
                confirmAction={() => { deleteAction(); setShowDeleteModal(false); }}
                closeAction={() => setShowDeleteModal(false)}
            />
        </div>
    );
}
