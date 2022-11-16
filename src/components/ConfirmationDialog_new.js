import { mergeAll } from 'lodash/fp';
import { a, div, h, h2 } from 'react-hyperscript-helpers';
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

Modal.setAppElement('#root');

export const ConfirmationDialog = (props) => {

  const { disableOkBtn = false, disableNoBtn = false, alertMessage, alertTitle } = props;

  return (
    h(Modal, {
      isOpen: props.showModal,
      onAfterOpen: props.afterOpenModal,
      onRequestClose: props.onRequestClose,
      style: mergeAll([customStyles, props.style]),
      contentLabel: 'Modal'
    }, [
      div({ className: 'dialog-header' }, [
        h(CloseIconComponent, {closeFn: props.action.handler(false)}),
        h2({ id: 'lbl_dialogTitle', className: 'dialog-title ' }, [props.title]),
      ]),

      div({ id: 'lbl_dialogContent', className: 'dialog-content' }, [
        props.children,
        div({ isRendered: alertTitle !== undefined, className: 'dialog-alert' }, [
          Alert({ id: 'dialog', type: 'danger', title: alertTitle, description: alertMessage })
        ])
      ]),


      div({ className: 'flex flex-row', style: {
        justifyContent: 'flex-end',
        marginTop: '20px',
      }, }, [
        a({
          id: 'btn_save',
          className: 'button button-white',
          style: {
            marginRight: '2rem',
          },
          onClick: props.action.handler(false),
          disabled: disableNoBtn
        }, ['No']),
        a({
          id: 'btn_submit',
          className: 'button button-blue',
          onClick: props.action.handler(true),
          isabled: disableOkBtn
        }, [
          props.action.label
        ]),
      ])
    ])
  );
};
