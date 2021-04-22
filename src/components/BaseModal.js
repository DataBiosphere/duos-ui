import { Component } from 'react';
import { button, div, h, span, hh } from 'react-hyperscript-helpers';
import Modal from 'react-modal';
import './BaseModal.css';
import { PageSubHeading } from '../components/PageSubHeading';
import {Styles} from '../libs/theme';

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
          style: Styles.MODAL.CONTENT,
          contentLabel: "Modal"
        }, [
          div({ className: "modal-header" }, [
            button({ type: "button", className: "modal-close-btn close", onClick: this.props.onRequestClose }, [
              span({ className: "glyphicon glyphicon-remove default-color" }),
            ]),
            PageSubHeading({ id: this.props.id, imgSrc: this.props.imgSrc, color: this.props.color, iconSize: this.props.iconSize, title: this.props.title, description: this.props.description }),
          ]),

          div({ className: "modal-content" }, [
            this.props.children
          ]),

          div({ className: "modal-footer" }, [
            // disabled: "consentForm.$invalid || disableButton",
            button({ id: "btn_action", className: "col-lg-3 col-md-3 col-sm-4 col-xs-6 btn " + this.props.color + "-background",
              onClick: this.props.action.handler, disabled: disableOkBtn }, [this.props.action.label]),
            button({ isRendered: this.props.type !== "informative", id: "btn_cancel", className: "col-lg-3 col-md-3 col-sm-4 col-xs-6 btn dismiss-background", onClick: this.props.onRequestClose }, ["Cancel"]),
          ]),
        ])
      ])
    );
  }
});
