import React from 'react';
import { PublicationOrPresentation } from './PublicationOrPresentation';
import PublicationAddEdit from './PublicationAddEdit';
import PublicationSummary from './PublicationSummary';

interface PublicationRowProps {
    readonly id: number;
    readonly editMode: boolean;
    publication: PublicationOrPresentation;
    readonly publicationText: string;
    readonly publications: PublicationOrPresentation[];
    readonly columnsToShow: string[];
    readonly editAction: () => void;
    readonly deleteAction: () => void;
    readonly closeAction: () => void;
    readonly onPublicationChange: (publications: PublicationOrPresentation[]) => void;
    readonly disabled: boolean;
}

export default function PublicationRow(props: PublicationRowProps): React.JSX.Element {
    const { id, editMode, publication, publicationText, publications, columnsToShow, editAction, deleteAction, closeAction, onPublicationChange, disabled } = props;

    return (
        <div>
            {editMode && (
                <PublicationAddEdit
                    id={id}
                    publication={publication}
                    publicationText={publicationText}
                    publications={publications}
                    closeAction={closeAction}
                    onPublicationChange={onPublicationChange}
                />)}
            {!editMode && (
                <PublicationSummary
                    publication={publication}
                    columnsToShow={columnsToShow}
                    editAction={editAction}
                    deleteAction={deleteAction}
                    disabled={disabled}
                />)}
        </div>
    );
}
