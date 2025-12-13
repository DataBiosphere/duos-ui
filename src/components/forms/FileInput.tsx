import React, { ChangeEvent, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmationDialog } from 'src/components/modals/ConfirmationDialog'
import { FormFieldTitle } from 'src/components/forms/forms'

export type FileInputProps = {
  description?: string
  defaultValue?: File
  id: string
  onAddFile: (file: File, id: string) => void
  onDeleteFile: (id: string) => void
  required?: boolean
  title: string
  disabled?: boolean
}

export const FileInput = (props: FileInputProps) => {
  const { id, title, description, onAddFile, onDeleteFile, defaultValue, required, disabled = false } = props
  const [file, setFile] = useState<File | undefined>(defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState<boolean>(false)

  const handleClose = () => {
    setOpen(false)
  }
  const handleDeleteClick = () => {
    setOpen(true)
  }

  const handleAddFile = (event: ChangeEvent<HTMLInputElement>, id: string) => {
    const file = event.currentTarget.files?.[0]
    if (file)
      onAddFile(file, id)
  }

  const handleDeleteFile = (id: string) => {
    setFile(undefined)
    onDeleteFile(id)
  }

  const deleteButton = (file === undefined)
    ? <div />
    : (
        <>
          <Link
            style={{ marginLeft: '15px' }}
            id={`${id}_delete`}
            className="glyphicon glyphicon-trash"
            onClick={() => handleDeleteClick()}
            to="#"
          />
          <ConfirmationDialog
            title="Delete Attachment"
            openState={open}
            close={handleClose}
            action={() => {
              setOpen(false)
              if (inputRef.current) {
                inputRef.current.value = ''
              }
              handleDeleteFile(id)
            }}
            description={`Are you sure you want to delete the file '${file.name}'?`}
          />
        </>
      )

  const handleUploadButtonClick = () => {
    inputRef.current?.click()
  }

  return (
    <div>
      <FormFieldTitle
        formId={id}
        title={title}
        description={description}
        required={required}
      />
      <input
        type="file"
        ref={inputRef}
        style={{ display: 'none' }}
        onChange={(event) => {
          setFile(event.currentTarget.files?.[0])
          handleAddFile(event, id)
        }}
        disabled={disabled}
      />
      <div style={{ display: 'inline', margin: 'auto' }}>
        <button
          className="button-complex-outlined-secondary"
          disabled={file != null}
          onClick={handleUploadButtonClick}
        >
          Add a file
          <span
            className="button-icon button-icon-file-upload"
            style={{ marginLeft: '8px' }}
          />
        </button>
        {file && (
          <span style={{ marginLeft: '15px' }}>
            {file.name}
            {' '}
            {deleteButton}
          </span>
        )}
      </div>
    </div>
  )
}
