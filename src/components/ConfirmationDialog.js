import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { Alert } from './Alert';
import CloseIconComponent from '../components/CloseIconComponent';
import './ConfirmationDialog.css';

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

Modal.setAppElement('#root');

export const ConfirmationDialog = (props) => { 
  const [alertMessage, setLocalAlertMessage] = useState(undefined);
  const [alertTitle, setLocalAlertTitle] = useState(undefined);

  useEffect(() => {
    setLocalAlertMessage(props.alertMessage);
    setLocalAlertTitle(props.alertTitle);
  }, [props.alertMessage, props.alertTitle]);
  const { disableOkBtn = false, disableNoBtn = false } = props;

  return (
    <Modal
      isOpen={props.showModal}
      onAfterOpen={props.afterOpenModal}
      onRequestClose={props.onRequestClose}
      contentLabel="Modal"
      style={{
        ...customStyles,
        ...props.style
      }}
    >
      <div className="dialog-header">
        <CloseIconComponent closeFn={props.action.handler(false)} />
        <h2 id="lbl_dialogTitle" className={`dialog-title ${props.color}-color`}>{props.title}</h2>
      </div>

      <div id="lbl_dialogContent" className="dialog-content">
        {props.children}
        {alertTitle !== undefined && (
          <div className="dialog-alert">
            <Alert id="dialog" type="danger" title={alertTitle} description={alertMessage} />
          </div>
        )}
      </div>

      <div className="dialog-footer row no-margin">
        {
          props.type !== 'informative' && (
            <button
              data-value={false}
              id='btn_cancel'
              className={`col-lg-3 col-lg-offset-3 col-md-3 col-md-offset-3 col-sm-4 col-sm-offset-2 col-xs-6 btn dismiss-background ${props.type !== 'informative' ? '' : 'hidden'}`}
              onClick={props.action.handler(false)}
              disabled={disableNoBtn}
            >
             No
            </button>
          )
        }
        <button
          data-value={true}
          id='btn_action'
          className={`col-lg-3 col-md-3 col-sm-4 col-xs-6 btn ${props.color}-background ${props.type === 'informative' ? 'f-right' : ''}`}
          onClick={props.action.handler(true)}
          disabled={disableOkBtn}
        >
          {props.action.label}
        </button>
      </div>
    </Modal>
  );
};

