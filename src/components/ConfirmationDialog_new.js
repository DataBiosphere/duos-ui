import { mergeAll } from 'lodash/fp';
import { Component } from 'react';
import { button, div, h, h2, hh } from 'react-hyperscript-helpers';
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

export const ConfirmationDialog = hh(class ConfirmationDialog extends Component {

  constructor(props) {
    super(props);
    this.state = {
      alertMessage: undefined,
      alertTitle: undefined
    };
  }

  static getDerivedStateFromProps(nextProps) {
    return {
      alertMessage: nextProps.alertMessage,
      alertTitle: nextProps.alertTitle
    };
  }

  render() {
    const { disableOkBtn = false, disableNoBtn = false } = this.props;

    return (
      h(Modal, {
        isOpen: this.props.showModal,
        onAfterOpen: this.props.afterOpenModal,
        onRequestClose: this.props.onRequestClose,
        style: mergeAll([customStyles, this.props.style]),
        contentLabel: 'Modal'
      }, [
        div({ className: 'dialog-header' }, [
          h(CloseIconComponent, {closeFn: this.props.action.handler(false)}),
          h2({ id: 'lbl_dialogTitle', className: 'dialog-title ' }, [this.props.title]),
        ]),

        div({ id: 'lbl_dialogContent', className: 'dialog-content' }, [
          this.props.children,
          div({ isRendered: this.state.alertTitle !== undefined, className: 'dialog-alert' }, [
            Alert({ id: 'dialog', type: 'danger', title: this.state.alertTitle, description: this.state.alertMessage })
          ])
        ]),

        div({ className: 'dialog-footer row no-margin' }, [
          button({ 'data-value': false, isRendered: this.props.type !== 'informative', id: 'btn_cancel', className: 'col-lg-3 col-lg-offset-3 col-md-3 col-md-offset-3 col-sm-4 col-sm-offset-2 col-xs-6 btn dismiss-background', onClick: this.props.action.handler(false), disabled: disableNoBtn }, ['No']),
          button({ 'data-value': true, id: 'btn_action', className: 'col-lg-3 col-md-3 col-sm-4 col-xs-6 btn ' + (this.props.type === 'informative' ? 'f-right' : ''), onClick: this.props.action.handler(true), disabled: disableOkBtn }, [this.props.action.label]),
        ])
      ])
    );
  }
});
