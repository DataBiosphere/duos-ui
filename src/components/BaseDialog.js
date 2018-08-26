

import { Component } from 'react';
import { button, div, h, h2, span, hh, a } from 'react-hyperscript-helpers';
import Modal from 'react-modal';
import './BaseDialog.css';


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
    top: '0',
    right: '0',
    bottom: '0',
    left: '0',
    width: '600px',
    margin: '12vh auto auto auto',
    border: '1px solid rgb(204, 204, 204)',
    background: 'rgb(255, 255, 255)',
    overflow: 'auto',
    borderRadius: '4px',
    outline: 'none',
    padding: '10px 20px 20px 20px',
  }
};

export const BaseDialog = hh(class BaseDialog extends Component {

  constructor() {
    super();

    this.state = {
      modalIsOpen: false
    };

    this.openModal = this.openModal.bind(this);
    this.afterOpenModal = this.afterOpenModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.ok = this.ok.bind(this);
    this.cancel = this.cancel.bind(this);
  }

  openModal() {
    this.setState({ modalIsOpen: true });
  }

  afterOpenModal() {
    // references are now sync'd and can be accessed.
    // this.subtitle.style.color = '#f00';
  }

  closeModal() {
    this.setState({ modalIsOpen: false });
  }

  ok() {

  }

  cancel() {

  }

  render() {

    return (
      div({}, [

        a({
          isRendered: this.props.linkType === "a-tag",
          className: this.props.modalBtnStyle,
          onClick: this.openModal
        }, [
            div({ isRendered: this.props.modalBtnIcon !== undefined, className: "all-icons " + this.props.modalBtnIcon }),
            span({}, [this.props.modalBtnText]),
          ]),

        button({
          isRendered: this.props.linkType === "button-tag",
          className: this.props.modalBtnStyle,
          onClick: this.openModal
        }, [
            div({ isRendered: this.props.modalBtnIcon !== undefined, className: "all-icons " + this.props.modalBtnIcon }),
            span({}, [this.props.modalBtnText]),
          ]),

        button({
          isRendered: this.props.linkType === "icon-tag",
          onClick: this.openModal
        }, [
            span({ className: "glyphicon caret-margin " + this.props.modalBtnIcon }),
          ]),

        h(Modal, {
          isOpen: this.state.modalIsOpen,
          onAfterOpen: this.afterOpenModal,
          onRequestClose: this.closeModal,
          style: customStyles,
          contentLabel: "Dialog"
        }, [

            div({ className: "dialog-header" }, [
              button({ type: "button", className: "dialog-close-btn close", onClick: this.closeModal }, [
                span({ className: "glyphicon glyphicon-remove default-color" }),
              ]),
              h2({ id: this.props.id, className: "dialog-title " + this.props.color + "-color" }, [this.props.title]),
            ]),

            div({ className: "dialog-content" }, [
              this.props.children
            ]),

            div({ className: "dialog-footer" }, [
              button({ id: "btn_cancel", className: "col-lg-3 col-lg-offset-3 col-md-3 col-md-offset-3 col-sm-4 col-sm-offset-2 col-xs-6 btn dismiss-background", onClick: this.closeModal }, ["No"]),
              button({ id: "btn_action", className: "col-lg-3 col-md-3 col-sm-4 col-xs-6 btn " + this.props.color + "-background", onClick: this.props.action.handler }, [this.props.action.label]),
            ]),

          ])
      ])
    );
  }
});
