import { Component } from 'react';
import { div, form, input, label, span, hh, p } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import { DataSet } from '../../libs/ajax'

const MODAL_ID = 'extraInfo';

export const ExtraInfoModal = hh(class ExtraInfoModal extends Component {

  constructor(props) {
    super(props);
    this.state = {
      rus: this.props.rus
    }
  };

  OKHandler = (e) => {
    this.props.onOKRequest(MODAL_ID);
  }

  closeHandler = (e) => {
    this.props.onCloseRequest(MODAL_ID);
  }

  afterOpenHandler = (e) => {
    this.props.onAfterOpen(MODAL_ID);
  }
  

  render() {
    const { rus } = this.state;
    return (

      BaseModal({
        showModal: this.props.showModal,
        onRequestClose: this.closeHandler,
        onAfterOpen: this.afterOpenHandler,
        imgSrc: "/images/icon_dataset_add.png",
        color: "access",
        iconSize: 'large',
        title: "More information",
        description: 'Research use statement (RUS)',
        action: { label: "OK", handler: this.OKHandler }
      },
        [
          div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 admin-modal-content" }, [
            span({ className: "default-color" }, [
              rus
            ]),
          ]),
        ])
    );
  }
});
