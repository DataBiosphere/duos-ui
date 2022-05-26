import { Component } from 'react';
import { button, div, h, hh } from 'react-hyperscript-helpers';
import Modal from 'react-modal';
import './BaseModal.css';
import { PageSubHeading } from '../components/PageSubHeading';
import CloseIconComponent from '../components/CloseIconComponent';

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

export const BaseModal = hh(class BaseModal extends Component {

  render() {

    const { disableOkBtn = false } = this.props;

    return (
      div({}, [
        h(Modal, {
          isOpen: this.props.showModal,
          onAfterOpen: this.props.afterOpen,
          onRequestClose: this.props.onRequestClose,
          style: customStyles,
          contentLabel: 'Modal'
        }, [
          div({ className: 'modal-header' }, [
            h(CloseIconComponent, {closeFn: this.props.onRequestClose}),
            PageSubHeading({ id: this.props.id, imgSrc: this.props.imgSrc, color: this.props.color, iconSize: this.props.iconSize, title: this.props.title, description: this.props.description }),
          ]),

          div({ className: 'modal-content' }, [
            this.props.children
          ]),

          div({ className: 'modal-footer' }, [
            button({ id: 'btn_action', className: 'col-lg-3 col-md-3 col-sm-4 col-xs-6 btn ' + this.props.color + '-background',
              onClick: this.props.action.handler, disabled: disableOkBtn }, [this.props.action.label]),
            button({ isRendered: this.props.type !== 'informative', id: 'btn_cancel', className: 'col-lg-3 col-md-3 col-sm-4 col-xs-6 btn dismiss-background', onClick: this.props.onRequestClose }, ['Cancel']),
          ]),
        ])
      ])
    );
  }
});
