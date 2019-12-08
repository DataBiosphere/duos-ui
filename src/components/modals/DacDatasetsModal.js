import { Component } from 'react';
import { div, hh } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';


export const DacDatasetsModal = hh(class DacDatasetsModal extends Component {

  render() {
    return (BaseModal({
      id: 'dacDatasetsModal',
      showModal: this.props.showModal,
      onRequestClose: this.props.onCloseRequest,
      color: 'common',
      type: 'informative',
      iconSize: 'none',
      title: 'DAC Datasets associated with DAC: ' + this.props.dac.name,
      action: { label: 'Close', handler: this.props.onCloseRequest }
    },
      [div({}, [JSON.stringify(this.props.datasets)])]));
  }

});
