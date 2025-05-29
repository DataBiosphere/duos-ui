import React, {useCallback, useEffect, useState} from 'react';
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms';
import { PublicationOrPresentation } from 'src/components/publications_list/PublicationOrPresentation';
import { ValidationError } from "src/pages/dar_application/FormValidationState";
import {validationFailed, calcPublicationOrPresentationErrors, isPublication} from "src/utils/darFormUtils";

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

interface Validation {
    title?: ValidationError;
    date?: ValidationError;
    authors?: ValidationError;
    pubmed_id?: ValidationError;
    bibliographic_citation?: ValidationError;
    link?: ValidationError;
}
export default function PublicationAddEdit(props: PublicationAddEditProps): React.JSX.Element {
    const { id, publication, publicationText, publications, closeAction, onPublicationChange } = props;

    const [newPublication, setNewPublication] = useState(publication);
    const [validation, setValidation] = useState<Validation>({});

    useEffect(() => {
        setValidation(calcPublicationOrPresentationErrors(newPublication, publicationText));
    }, [newPublication, publicationText]);

    const formValidationChange = useCallback(({ key, validator }) => {
        setValidation((formValidation) => {
            return {
                ...formValidation,
                [key]: validator
            };
        });
    }, []);

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
                        validation={validation.title}
                        onValidationChange={formValidationChange}
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
                        validation={validation.date}
                        onValidationChange={formValidationChange}
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
                        validation={validation.authors}
                        onValidationChange={formValidationChange}
                    />
                    {isPublication(publicationText) ?
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
                                validation={validation.pubmed_id}
                                onValidationChange={formValidationChange}
                            />
                            <FormField
                                id='bibliographic_citation'
                                title={`${publicationText} Bibliographic Citation`}
                                defaultValue={publication?.bibliographic_citation}
                                placeholder='Bibliographic Citation'
                                validators={[FormValidators.REQUIRED]}
                                onChange={({ key, value }: FormFieldChange) => {
                                    const setPublication = {
                                        ...newPublication,
                                        [key]: value
                                    } as PublicationOrPresentation;
                                    setNewPublication(setPublication);
                                }}
                                validation={validation.bibliographic_citation}
                                onValidationChange={formValidationChange}
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
                            validation={validation.link}
                            onValidationChange={formValidationChange}
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
                    <button
                        className='collaborator-form-add-save-button f-left btn'
                        type='button'
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
                        disabled={validationFailed(validation)}
                    >
                        {publication === undefined ? 'Add' : 'Save'}
                    </button>
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
