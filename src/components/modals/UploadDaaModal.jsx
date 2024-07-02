import React, { useState } from 'react';
import { Styles } from '../../libs/theme';
import CloseIconComponent from '../CloseIconComponent';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import Dropzone from 'react-dropzone';
import Modal from 'react-modal';
import styles from '../../pages/manage_dac/ManageDac.module.css';

const getInitialState = () => {
  return {
    attachment: '',
    validAttachment: true
  };
};

export const UploadDaaModal = (props) => {
  const [modalState, setModalState] = useState(getInitialState);

  const okHandler = async () => {
    props.onAttachmentChange(modalState.attachment);
    props.onCloseRequest();
  };

  const closeHandler = () => {
    props.onCloseRequest();
  };

  const attachmentChangeHandler = (e) => {
    setModalState({
      ...modalState,
      attachment: e
    });
  };

  const attachmentCancel = () => {
    setModalState({
      ...modalState,
      attachment: ''
    });
  };

  const iconStyle = {
    verticalAlign: 'middle',
    height: 40,
    width: 30,
    paddingLeft: '1rem',
  };

  return (
    <Modal
      isOpen={props.showModal}
      onRequestClose={closeHandler}
      color='common'
      title='Upload a file'
      action={{
        label: 'Save',
        handler: okHandler
      }}
      style={{
        content: { ...Styles.MODAL.CONTENT },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }
      }}
    >
      <div style={Styles.MODAL.CONTENT}>
        <CloseIconComponent closeFn={closeHandler}/>
        <div style={Styles.MODAL.TITLE_HEADER}>
          Upload a file
        </div>
        <div style={{ borderBottom: '1px solid #1FB50' }} />
        <Dropzone onDrop={(acceptedFiles) => attachmentChangeHandler(acceptedFiles)} maxFiles={1} multiple={false}>
          {({ isDragActive, getRootProps, getInputProps }) => (
            <div className={styles['upload-daa-dropzone']} style={{
              backgroundColor: modalState.attachment.length !== 0 ? '#eef0f5' : (isDragActive ? '#6898c1' : '#eef0f5'),
              borderStyle: modalState.attachment.length === 0 ? 'dashed' : 'none',
              borderWidth: modalState.attachment.length === 0 ? '5px' : 'none',
            }}>
              {
                modalState.attachment.length === 0 && (
                  <div>
                    <UploadFileRoundedIcon style={{fill:'#4d72aa', scale: '5'}}/>
                  </div>
                )
              }
              <div {...getRootProps()}>
                <input {...getInputProps()} />
                <b style={{color: '#4d72aa'}}>
                  {modalState.attachment.length === 0 ? 'Drag and drop a PDF file to upload or click to browse files' : modalState.attachment[0].name}
                </b>
                {
                  modalState.attachment.length !== 0 && (
                    <button
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                      }}
                      onClick={attachmentCancel}
                    >
                      <HighlightOffIcon fill={'#275c91'} style={iconStyle} />
                    </button>
                  )
                }
              </div>
            </div>
          )}
        </Dropzone>
        {
          modalState.attachment.length !== 0 && (
            <strong style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '20px', fontSize: '1.6rem', textDecoration: 'underline'}}>Clicking Save will create this new Data Access Agreement and associate it with this DAC.</strong>
          )
        }
        <div className='inline-block' style={{paddingBottom: '20px', marginTop:'20px'}}>
          <button
            id='btn_save'
            onClick={okHandler}
            className='f-right btn-primary common-background'
          >
            Save
          </button>
          <div style={{ marginLeft: '100px' }}>
            <button
              id='btn_cancel'
              onClick={closeHandler}
              className='f-right btn-secondary'
            >
            Cancel
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
