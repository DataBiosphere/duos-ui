import React from 'react';
import {FormFieldTypes, FormTable} from './forms';

export type FileTypeAndFunctionalEquivalence = {
    type: string,
    value: string
}
export type FileTypesWithFunctionalEquivalentsProps = {
    id: string,
    onChange: ({key, value} :{key: string, value: never}) => void,
    defaultValue: Array<FileTypeAndFunctionalEquivalence>
}

export const FileTypesWithFunctionalEquivalents = (props: FileTypesWithFunctionalEquivalentsProps) => {
    const {id, onChange, defaultValue} = props;
    return (<FormTable
        id={id}
        formFields={[
            {
                id: id + '_fileType',
                name: 'fileType',
                title: 'File Type',
                type: FormFieldTypes.SELECT,
                selectOptions: ['Arrays', 'Genome', 'Exome', 'Survey', 'Phenotype'],
            },
            {
                id: id + '_functionalEquivalence',
                name: 'functionalEquivalence',
                title: 'Functional Equivalence',
                placeholder: 'Type',
            }
        ]}
        defaultValue={defaultValue}
        enableAddingRow={true}
        addRowLabel='Add File'
        minLength={1}
        onChange={onChange}
        styleProps={{enableAddingRowStyle:{ display: 'flex', width: '100%', justifyContent: 'flex-start', marginTop: 10 },
            addingRowButtonClassName:'button-complex-outlined-secondary',
            addRowButtonIconClassName:'button-icon button-icon-circle-plus-outline',
            removeRowButtonIconClassName:'button-icon button-icon-close'
            }}
    />);
}
