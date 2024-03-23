import React from 'react';
import Modal from 'react-modal';
import './BaseModal.css';
import { PageSubHeading } from './PageSubHeading';
import CloseIconComponent from './CloseIconComponent';

const customStyles = {
  overlay: {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    overflowY: 'auto',
  },

  content: {
    position: 'relative',
    top: '20%',
    maxHeight: '60%',
    margin: '0 auto',
    maxWidth: '60%',
    border: '1px solid rgb(204, 204, 204)',
    background: 'rgb(255, 255, 255)',
    overflow: 'auto',
    borderRadius: '4px',
    outline: 'none',
    padding: '10px 20px 20px 20px',
  }
};

Modal.setAppElement('#root');

export const BaseModal = (props) => {
  const { disableOkBtn = false } = props;
  return (
    <div>
      <Modal
        isOpen={props.showModal}
        onAfterOpen={props.afterOpen}
        onRequestClose={props.onRequestClose}
        style={customStyles}
        contentLabel='Modal'
      >
        <div className='modal-header'>
          <CloseIconComponent
            closeFn={props.onRequestClose}
          />
          <PageSubHeading
            id={props.id}
            imgSrc={props.imgSrc}
            color={props.color}
            iconSize={props.iconSize}
            title={props.title}
            description={props.description}
          />
        </div>
        <div className='modal-content'>
          {props.children}
        </div>

        <div className='modal-footer'>
          <button
            id='btn_action'
            className={`col-lg-3 col-md-3 col-sm-4 col-xs-6 btn ${props.color}-background`}
            onClick={props.action.handler}
            disabled={disableOkBtn}
          >
            {props.label}
          </button>
          {
            props.type !== 'informative' && (
              <button
                id='btn-cancel'
                className='col-lg-3 col-md-3 col-sm-4 col-xs-6 btn dismiss-background'
                onClick={props.onRequestClose}
              >
                Cancel
              </button>
            )
          }
        </div>
      </Modal>
    </div>
  );
};