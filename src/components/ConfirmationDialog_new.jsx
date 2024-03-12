import React from 'react';
import Modal from 'react-modal';
import { Alert } from './Alert';
import CloseIconComponent from './CloseIconComponent';
import './ConfirmationDialog_new.css';

const customStyles = {
  overlay: {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },

  content: {
    position: 'relative',
    maxHeight: '300px',
    top: '30%',
    margin: '0 auto',
    maxWidth: '50%',
    background: 'rgb(255, 255, 255)',
    overflow: 'auto',
    outline: 'none',
    padding: '20px 20px 20px 20px',
  }
};

export const ConfirmationDialog = (props) => {

  const { disableOkBtn = false, disableNoBtn = false, alertMessage, alertTitle } = props;

  return (
    <Modal
      isOpen={props.showModal}
      onAfterOpen={props.afterOpenModal}
      onRequestClose={props.onRequestClose}
      style={{ ...customStyles, ...props.style }}
      contentLabel="Modal"
    >
      <div className="dialog-header">
        <CloseIconComponent closeFn={props.action.handler(false)} />
        <h2 id="lbl_dialogTitle" className="dialog-title">{props.title}</h2>
      </div>

      <div id="lbl_dialogContent" className="dialog-content">
        {props.children}
        {alertTitle !== undefined && (
          <div className="dialog-alert">
            <Alert id="dialog" type="danger" title={alertTitle} description={alertMessage} />
          </div>
        )}
      </div>

      <div className="flex flex-row" style={{ justifyContent: 'flex-end', marginTop: '20px' }}>
        <a
          id="btn_save"
          className="button button-white"
          style={{ marginRight: '2rem' }}
          onClick={props.action.handler(false)}
          disabled={disableNoBtn}
        >
          No
        </a>
        <a
          id="btn_submit"
          className="button button-blue"
          onClick={props.action.handler(true)}
          disabled={disableOkBtn}
        >
          {props.action.label}
        </a>
      </div>
    </Modal>
  );
};
