import React, { useCallback, useEffect, useState } from 'react';
import { Support } from '../../libs/ajax/Support';
import { Storage } from '../../libs/storage';
import { Notifications, isEmailAddress } from '../../libs/utils';
import { PageSubHeading } from '../PageSubHeading';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import Dropzone from 'react-dropzone';
import Modal from 'react-modal';
import * as fp from 'lodash/fp';
import addHelpIcon from '../../images/icon_add_help.png';

try {
  Modal.setAppElement('#root');
} catch (error) {
  // trycatch for unit testing purposes, since #root may not always exist
  // when testing a component in isolation
}

const getInitialState = () => {
  return {
    name: Storage.userIsLogged() ?
      Storage.getCurrentUser().displayName :
      '',
    isLogged: Storage.userIsLogged(),
    type: 'question',
    subject: '',
    description: '',
    attachment: '',
    email: Storage.userIsLogged() ? Storage.getCurrentUser().email : '',
    first_name: Storage.userIsLogged() ? Storage.getCurrentUser().displayName.split(' ')[0] : '',
    height: Storage.userIsLogged() ? (window.innerHeight < 550 ? window.innerHeight : '550px') : (window.innerHeight < 700 ? window.innerHeight : '700px'),
    top: Storage.userIsLogged() ? '400px' : '1',
    valid: Storage.userIsLogged(),
    validAttachment: true
  };
};

export const SupportRequestModal = (props) => {
  const [modalState, setModalState] = useState(getInitialState);

  const closeHandler = () => {
    Notifications.showInformation({
      text: 'Support request canceled',
      layout: 'topRight',
      timeout: 1500,
    });

    setModalState({
      ...modalState,
      type: 'question',
      subject: '',
      description: '',
      attachment: '',
    });

    props.onCloseRequest('support');
  };

  const OKHandler = async () => {
    const attachmentToken = [];
    if (modalState.attachment !== '') {
      const results = [];
      for (let i = 0; i < modalState.attachment.length; i++) {
        try {
          results.push(Support.uploadAttachment(modalState.attachment[i]));
        } catch (e) {
          Notifications.showError({
            text: 'Unable to add attachment',
            layout: 'topRight',
          });
          setModalState({
            ...modalState,
            validAttachment: false
          });
          break;
        }
      }

      const allToken = await Promise.all(results);

      for (let t = 0; t < allToken.length; t++) {
        if (!fp.hasIn('token')(allToken[t])) {
          Notifications.showError({
            text: 'Unable to add attachment',
            layout: 'topRight',
          });
          setModalState({
            ...modalState,
            validAttachement: false
          });
        }
        if (modalState.validAttachment) {
          attachmentToken.push(allToken[t].token);
        }
      }
    }

    if (modalState.validAttachment) {
      const ticket = Support.createTicket(modalState.name, modalState.type, modalState.email,
        modalState.subject, modalState.description, attachmentToken, props.url);
      const response = await Support.createSupportRequest(ticket);
      if (response.status === 201) {
        Notifications.showSuccess({ text: 'Sent Successfully', layout: 'topRight', timeout: 1500 });
        setModalState({
          ...modalState,
          type: 'question',
          subject: '',
          description: '',
          attachment: ''
        });
        props.onOKRequest('support');
      } else {
        Notifications.showError({
          text: `ERROR ${response.status} : Unable To Send`,
          layout: 'topRight',
        });
      }
    }
  };

  const nameChangeHandler = (e) => {
    const nameText = e.target.value;
    setModalState({
      ...modalState,
      name: nameText
    });
  };

  const typeChangeHandler = (e) => {
    const typeText = e.target.value;
    setModalState({
      ...modalState,
      type: typeText
    });
  };

  const subjectChangeHandler = (e) => {
    const subjectText = e.target.value;
    setModalState({
      ...modalState,
      subject: subjectText
    });
  };

  const descriptionChangeHandler = (e) => {
    const descriptionText = e.target.value;
    setModalState({
      ...modalState,
      description: descriptionText
    });
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

  const emailChangeHandler = (e) => {
    let emailText = e.target.value;
    setModalState({
      ...modalState,
      email: emailText,
      valid: isEmailAddress(emailText)
    });
  };

  const handleResize = useCallback(() => {
    setModalState((prev) => {
      return {
        ...prev,
        height: Storage.userIsLogged() ? (window.innerHeight < 550 ? window.innerHeight : '550px') : (window.innerHeight < 700 ? window.innerHeight : '700px')
      };
    });
  },[]);

  useEffect(() => {
    // eslint-disable-line -- codacy says event listeners are dangerous
    window.addEventListener('resize', handleResize);

    return () => {
      // Cleanup listener on unmount
      window.removeEventListener('resize', handleResize);
    };
  },[handleResize]);

  const customStyles = {
    overlay: {
      position: 'fixed',
      top: modalState.top,
      left: '10',
      right: '0',
      bottom: '0',
      backgroundColor: 'static',
      width: '400px',
      height: modalState.height,
      padding: '0px 450px 700px 0px',
      zIndex: 10000
    },
    content: {
      position: 'fixed',
      top: '1',
      left: '1',
      right: '20px',
      bottom: '20px',
      width: '400px',
      height: modalState.height,
      background: 'rgb(255, 255, 255)',
      outline: 'none',
    },
  };

  const iconStyle = {
    verticalAlign: 'middle',
    height: 40,
    width: 30,
    paddingLeft: '1rem',
  };

  const disableOkBtn = modalState.name === '' || modalState.email === '' ||
    modalState.subject === '' || modalState.description === '' ||
    modalState.valid === false;
  const uploadIcon = <CloudUploadIcon fill={'#707986'} style={iconStyle} />;
  const closeIcon = <HighlightOffIcon fill={'#275c91'} style={iconStyle} />;

  return (
    <div>
      <Modal
        isOpen={props.showModal}
        onRequestClose={closeHandler}
        style={customStyles}
        contentLabel='Modal'
      >
        <div style={{ width: '100%', padding: '0 15px 5px 15px' }}>
          <button
            type='button'
            style={{ position: 'absolute', top: '20px', right: '20px' }}
            className='close'
            onClick={closeHandler}
          >
            <span className='glyphicon glyphicon-remove default-color' />
          </button>
          <PageSubHeading
            id='SupportRequestModal'
            imgSrc={addHelpIcon}
            color='common'
            title='Contact Us'
          />
        </div>
        <div style={{ width: '100%', padding: '10px 15px', outline: '0' }}>
          <div className='default-color' style={{ fontStyle: 'italic', fontSize: '13px' }}>
            <div>
                Having issues accessing data you were already approved to use?
              <div style={{ fontStyle: 'normal' }}>
                  Please contact the dataset&apos;s Data Custodian listed in the DUOS <a href='/datalibrary'>Data Library</a>.
              </div>
            </div>
          </div>
          <div className='default-color' style={{ fontStyle: 'italic', fontSize: '13px', marginTop:'10px' }}>
            <div>
                Want to ask the data access committee(s) about your requests&apos; expected turnaround time?
              <div style={{ fontStyle: 'normal' }}>
                  Please contact the dataset&apos;s Data Access Committee (DAC) listed in the DUOS <a href='/datalibrary'>Data Library</a>.
              </div>
            </div>
          </div>
          <form
            className = 'form-horizontal css-form'
            name = 'zendeskTicketForm'
            noValidate = {true}
            encType= 'multipart/form-data'
          >
            {!modalState.isLogged && (
              <div className='form-group first-form-group'>
                <label id='lbl_name' className='common-color'>Name *</label>
                <input
                  id='txt_name'
                  placeholder='What should we call you?'
                  value={modalState.name}
                  className='form-control col-lg-12'
                  onChange={nameChangeHandler}
                  required={true}
                />
              </div>
            )}

            <div className='form-group first-form-group'>
              <label id='lbl_type' className='common-color'>Type *</label>
              <select
                id='txt_question'
                className='col-lg-12 select-wrapper form-control'
                value={modalState.type}
                onChange={typeChangeHandler}
                required={true}
              >
                <option value='question'>Question</option>
                <option value='bug'>Bug</option>
                <option value='feature_request'>Feature Request</option>
              </select>
            </div>

            <div className='form-group first-form-group'>
              <label id='lbl_description' className='common-color'>How can we help you {modalState.first_name}? *</label>
              <input
                id='txt_subject'
                placeholder='Enter a subject'
                rows='5'
                className='form-control col-lg-12 vote-input'
                onChange={subjectChangeHandler}
                required={true}
              />
              <textarea
                id='txt_description'
                placeholder='Enter a description'
                rows='5'
                className='form-control col-lg-12 vote-input'
                onChange={descriptionChangeHandler}
                required={true}
              />
            </div>

            <div className='form-group first-form-group'>
              <label id='lbl_attachment' className='common-color'>Attachment</label>
              <Dropzone onDrop={(acceptedFiles) => attachmentChangeHandler(acceptedFiles)}>
                {({ isDragActive, openUploader, getRootProps, getInputProps }) => ( //eslint-disable-line no-unused-vars
                  <section style={{
                    backgroundColor: modalState.attachment.length !== 0 ? 'transparent' : (isDragActive ? '#6898c1' : '#ebecee'),
                    fontSize: 14,
                    lineHeight: '30px',
                    paddingLeft: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    border: modalState.attachment.length === 0 ? '1px dashed' : 'none',
                  }}>
                    <div {...getRootProps()}>
                      <input {...getInputProps()} />
                      <p>
                        {modalState.attachment.length === 0 ? 'Drag or Click to attach a files' :
                          modalState.attachment.length === 1 ? modalState.attachment[0].name :
                            `${modalState.attachment.length} files selected`}
                      </p>
                    </div>
                    {
                      modalState.attachment.length === 0 && (
                        <div>
                          {uploadIcon}
                        </div>
                      )
                    }
                    {
                      modalState.attachment.length === 0 && (
                        <button
                          style={{
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                          }}
                          onClick={attachmentCancel}
                        >
                          {closeIcon}
                        </button>
                      )
                    }
                  </section>
                )}
              </Dropzone>
            </div>

            {!modalState.isLogged && (
              <div className='form-group first-form-group'>
                <label id='lbl_email' className='common-color'>Contact email *</label>
                <input
                  id='txt_email'
                  className='form-control col-lg-12 vote-input'
                  placeholder='Enter a email'
                  value={modalState.email}
                  onChange={emailChangeHandler}
                  required={true}
                />
              </div>
            )}
          </form>
        </div>
        <div className='modal-footer'>
          <button
            id='btn_action'
            className='btn common-background'
            onClick={OKHandler}
            disabled={disableOkBtn}
          >
            Submit
          </button>
          <button
            id='btn_cancel'
            className='btn dismiss-background'
            onClick={closeHandler}
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
};
