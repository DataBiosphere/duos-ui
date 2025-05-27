import React, { useState } from 'react';
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms';
import { PublicationOrPresentation } from 'src/components/publications_list/PublicationOrPresentation';

interface FormFieldChange {
    key: string;
    value: string;
}

interface PublicationAddEditProps {
    readonly id: number;
    publication?: PublicationOrPresentation;
    readonly publicationText: string;
    readonly publications: PublicationOrPresentation[];
    readonly closeAction: () => void;
    readonly onPublicationChange: (publications: PublicationOrPresentation[]) => void;
}

export default function PublicationAddEdit(props: PublicationAddEditProps): React.JSX.Element {
    const { id, publication, publicationText, publications, closeAction, onPublicationChange } = props;

    const [newPublication, setNewPublication] = useState(publication);

    return (
        <div className='form-group row no-margin'>
            <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12 collaborator-form-card'>
                <div className='row'>
                    <h2>{publication === undefined ? `New ${publicationText} Information` : `Edit ${publication.title} Information`}</h2>
                    <FormField
                        id='title'
                        title={`${publicationText} Title`}
                        defaultValue={publication?.title}
                        placeholder='Title'
                        validators={[FormValidators.REQUIRED]}
                        onChange={({ key, value }: FormFieldChange) => {
                            const setPublication = {
                                ...newPublication,
                                [key]: value
                            } as PublicationOrPresentation;
                            setNewPublication(setPublication);
                        }}
                    />
                    <FormField
                        id='date'
                        title={`${publicationText} Date`}
                        defaultValue={publication?.date}
                        placeholder='Date'
                        validators={[FormValidators.REQUIRED, FormValidators.DATE]}
                        onChange={({ key, value }: FormFieldChange) => {
                            const setPublication = {
                                ...newPublication,
                                [key]: value
                            } as PublicationOrPresentation;
                            setNewPublication(setPublication);
                        }}
                    />
                    <FormField
                        id='authors'
                        title={`${publicationText} Authors`}
                        defaultValue={publication?.authors}
                        placeholder='Authors'
                        validators={[FormValidators.REQUIRED]}
                        onChange={({ key, value }: FormFieldChange) => {
                            const setPublication = {
                                ...newPublication,
                                [key]: value
                            } as PublicationOrPresentation;
                            setNewPublication(setPublication);
                        }}
                    />
                    {publicationText === 'Publication' ?
                        <>
                            <FormField
                                id='pubmed_id'
                                title={`${publicationText} PubMed ID`}
                                defaultValue={publication?.pubmed_id}
                                placeholder='PubMed ID'
                                validators={[FormValidators.REQUIRED]}
                                onChange={({ key, value }: FormFieldChange) => {
                                    const setPublication = {
                                        ...newPublication,
                                        [key]: value
                                    } as PublicationOrPresentation;
                                    setNewPublication(setPublication);
                                }}
                            />
                            <FormField
                                id='bibliographic_citation'
                                title={`${publicationText} Bibliographic Citation`}
                                defaultValue={publication?.bibliographic_citation}
                                placeholder='Date'
                                validators={[FormValidators.REQUIRED]}
                                onChange={({ key, value }: FormFieldChange) => {
                                    const setPublication = {
                                        ...newPublication,
                                        [key]: value
                                    } as PublicationOrPresentation;
                                    setNewPublication(setPublication);
                                }}
                            />
                        </> : // otherwise it's a presentation
                        <FormField
                            id='link'
                            title={`${publicationText} Link`}
                            defaultValue={publication?.link}
                            placeholder='Link'
                            validators={[FormValidators.REQUIRED]}
                            onChange={({ key, value }: FormFieldChange) => {
                                const setPublication = {
                                    ...newPublication,
                                    [key]: value
                                } as PublicationOrPresentation;
                                setNewPublication(setPublication);
                            }}
                        />
                    }
                    <FormField
                        id='dataset_citation'
                        title={`Dataset citation used in this publication`}
                        defaultValue={publication?.dataset_citation}
                        placeholder='Dataset Citation'
                        onChange={({ key, value }: FormFieldChange) => {
                            const setPublication = {
                                ...newPublication,
                                [key]: value
                            } as PublicationOrPresentation;
                            setNewPublication(setPublication);
                        }}
                    />
                    <FormField
                        id='did_cite'
                        type={FormFieldTypes.YESNORADIOGROUP}
                        title='Did you cite the dataset(s) used in this publication?'
                        orientation='horizontal'
                        onChange={({ key, value }: FormFieldChange) => {
                            const setPublication = {
                                ...newPublication,
                                [key]: value
                            } as PublicationOrPresentation;
                            setNewPublication(setPublication);
                        }}
                    />
                </div>
                <div className='row' style={{ marginTop: 20 }}>
                    {/* add/save button */}
                    <div
                        className='collaborator-form-add-save-button f-left btn'
                        role='button'
                        onClick={() => {
                            if (id < 0) {
                                onPublicationChange([...publications, newPublication]);
                                setNewPublication(undefined);
                            } else if (newPublication !== undefined) {
                                const publicationsCopy = [...publications];
                                publicationsCopy[id] = newPublication;
                                onPublicationChange(publicationsCopy);
                                setNewPublication(undefined);
                            }
                            closeAction();
                        }}
                    >
                        {publication === undefined ? 'Add' : 'Save'}
                    </div>
                    {/* cancel button */}
                    <div
                        className='collaborator-form-cancel-button f-left btn'
                        role='button'
                        onClick={closeAction}
                    >
                        Cancel
                    </div>
                </div>
            </div>
        </div>
    )
}
