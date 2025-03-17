import React, {ChangeEvent, useRef, useState} from 'react';
import loadingIndicator from '../../images/loading-indicator.svg';
import {Link} from 'react-router-dom';
import {ConfirmationDialog} from '../../components/modals/ConfirmationDialog';
import {FormFieldTitle} from '../../components/forms/forms';
import {FileStorageObject} from 'src/types/model';

export type DraftFileUploadProps = {
    description: string,
    draftId: string,
    defaultValue: FileStorageObject,
    id: string,
    onAddFile: (event: ChangeEvent<HTMLInputElement>, id: string) => Promise<void>,
    onDeleteFile: (draftId: string, fileId: number, id: string) => Promise<void>,
    required?: boolean,
    title: string
}

export const DraftFileUpload = (props: DraftFileUploadProps) => {
    const {id, draftId, title, description, onAddFile, onDeleteFile, defaultValue, required} = props;
    const inputRef = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState<boolean>(false);
    const spinnerRef = useRef<HTMLDivElement>(null);
    const handleClose = () => {
        setOpen(false);
    };
    const handleDeleteClick = () => {
        setOpen(true);
    };

    const handleAddFile = async (event: ChangeEvent<HTMLInputElement>, id: string) => {
        await onAddFile(event, id);
    };

    const handleDeleteFile = async () => {
        await onDeleteFile(draftId, defaultValue?.fileStorageObjectId, id);
    };

    const deleteButton = (defaultValue) ?
        <>
            <Link
                style={{marginLeft: '15px'}}
                id={`${defaultValue.fileStorageObjectId}_delete`}
                className={'glyphicon glyphicon-trash'}
                onClick={() => handleDeleteClick()}
                to={`#`}
            />
            <ConfirmationDialog
                title='Delete Attachment'
                openState={open}
                close={handleClose}
                action={() => {
                    setOpen(false);
                    toggleSpinnerRef(true);
                    handleDeleteFile().then(() => {
                        toggleSpinnerRef(false);
                        if (inputRef.current) {
                            inputRef.current.value = '';
                        }
                    });
                }}
                description={`Are you sure you want to delete the file '${defaultValue.fileName}'?`}
            />
        </> : <div/>;

    const handleUploadButtonClick = () => {
        inputRef.current?.click();
    };

    const toggleSpinnerRef = (visible: boolean) => {
        if (spinnerRef?.current) {
            if (visible) {
                spinnerRef.current.style.display = 'inline';
            } else {
                spinnerRef.current.style.display = 'none';
            }
        }
    };

    return <div>
        <FormFieldTitle
            formId={id}
            title={title}
            description={description}
            required={required}
        /><input type={'file'} ref={inputRef} style={{display: 'none'}} onChange={(event) => {
        toggleSpinnerRef(true);
        handleAddFile(event, id).then(() => {
            toggleSpinnerRef(false);
        });
    }}/>
        <div style={{display: 'inline', margin: 'auto'}}>
            <button className={'button-complex-outlined-secondary'} disabled={defaultValue != null}
                    onClick={handleUploadButtonClick}>Upload a file<span
                className={'button-icon button-icon-file-upload'} style={{marginLeft: '8px'}}/></button>
            {defaultValue && <span style={{marginLeft: '15px'}}>{defaultValue.fileName} {deleteButton}</span>}
            <div ref={spinnerRef} style={{display: 'none', textAlign: 'center', height: '44', width: '180'}}>
                <img src={loadingIndicator} alt={'Loading'}/>
            </div>
        </div>
    </div>;
};
