import { Component } from 'react';
import { b, div, hh } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
// import { DataSet } from '../../libs/ajax'

const MODAL_ID = 'translatedDul';

export const TranslatedDulModal = hh(class TranslatedDulModal extends Component {

  constructor(props) {
    super(props);
    this.state = {
      rus: this.props.rus
    }
  };

  OKHandler = (e) => {
    this.props.onOKRequest(MODAL_ID);
  };

  closeHandler = (e) => {
    this.props.onCloseRequest(MODAL_ID);
  };

  render() {
    return (

      BaseModal({
        id: "translatedDulModal",
        showModal: this.props.showModal,
        onRequestClose: this.closeHandler,
        onAfterOpen: this.afterOpenHandler,
        color: "dataset",
        type: "informative",
        iconSize: 'none',
        title: "More information",
        description: 'Translated Use Restriction',
        action: { label: "Close", handler: this.OKHandler }
      },
        [
          div({ id: "txt_translatedRestrictions", className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 translated-restriction", dangerouslySetInnerHTML: {__html:this.props.useRestriction }}, []),
        ])
    );
  }
});
