import React, { useState } from 'react'
import { Styles } from 'src/libs/theme'
import CloseIconComponent from 'src/components/CloseIconComponent'
import Modal from 'react-modal'
import { DocumentUpload, type FileRef, Props as DocumentUploadProps } from 'src/components/forms/DocumentUpload'
import { EntityType, FileCategory } from 'src/libs/ajax/FileStorageObject'

interface UploadDaaModalProps {
  showModal: boolean
  dacId?: string
  isLiveUpload?: boolean
  isReadOnly?: boolean
  documentUploadApi?: DocumentUploadProps['api']
  onAttachmentChange: (files: File[]) => void
  onCloseRequest: () => void
}

export const UploadDaaModal: React.FC<UploadDaaModalProps> = (props) => {
  const [stagedFiles, setStagedFiles] = useState<FileRef[]>([])
  // Existing server files are represented as empty File objects.
  // Only newly uploaded files should be processed on Save.
  const uploadedFiles = stagedFiles.filter(fileRef => fileRef.file.size > 0)
  const hasAttachment = uploadedFiles.length > 0
  const dacId = props.dacId === undefined ? 'new' : props.dacId
  const isLiveUpload = props.isLiveUpload ?? true
  const isReadOnly = props.isReadOnly ?? false

  const okHandler = async (): Promise<void> => {
    if (!hasAttachment) {
      return
    }
    props.onAttachmentChange(uploadedFiles.map(f => f.file))
    props.onCloseRequest()
  }

  const closeHandler = (): void => {
    props.onCloseRequest()
  }

  const handleFilesReady = (files: FileRef[]): void => {
    setStagedFiles(files)
  }

  return (
    <Modal
      isOpen={props.showModal}
      onRequestClose={closeHandler}
      style={{
        content: { ...Styles.MODAL.CONTENT },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
      }}
    >
      <div style={{ ...Styles.MODAL.CONTENT, padding: '0' }}>
        <CloseIconComponent closeFn={closeHandler} />
        <div style={{ ...Styles.MODAL.TITLE_HEADER, marginBottom: '0' }}>
          Upload Documents
        </div>
        <div style={{ borderBottom: '1px solid #1FB50' }} />
        <DocumentUpload
          entity={EntityType.DAC}
          entityId={dacId}
          isLiveUpload={isLiveUpload}
          readOnly={isReadOnly}
          api={props.documentUploadApi}
          categories={[FileCategory.DATA_ACCESS_AGREEMENT]}
          onFilesReady={handleFilesReady}
          deletedDocumentsView="active"
        />
        {hasAttachment && (
          <strong style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '20px', fontSize: '1.6rem', textDecoration: 'underline' }}>
            Clicking Save will create this new Data Access Agreement and associate it with this DAC.
          </strong>
        )}
        <div className="inline-block" style={{ paddingBottom: '20px', marginTop: '20px' }}>
          <button
            id="btn_save"
            onClick={okHandler}
            className="f-right btn-primary common-background"
            type="button"
            disabled={!hasAttachment}
          >
            Save
          </button>
          <div style={{ marginLeft: '100px' }}>
            <button
              id="btn_cancel"
              onClick={closeHandler}
              className="f-right btn-secondary"
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
