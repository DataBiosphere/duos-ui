import { Component } from 'react';
import { hh, ul, li } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';

const MODAL_ID = 'dacDatasets';

export const DacDatasetsModal = hh(class DacDatasetsModal extends Component {

  constructor(props) {
    super(props);
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
        id: "dacDatasetsModal",
        showModal: this.props.showModal,
        onRequestClose: this.closeHandler,
        onAfterOpen: this.afterOpenHandler,
        color: "common",
        type: "informative",
        iconSize: 'none',
        //add DAC Name
        title: "Datasets linked with DAC: ",
        action: { label: "Close", handler: this.OKHandler }
      },
        [
          ul({ id: "txt_dacMembers", className: "row no-margin" }, [
            //replace with actual datasets, a line per dataset
            li({}, ["Dataset Name"]),
          ]),
        ])
    );
  }
});
