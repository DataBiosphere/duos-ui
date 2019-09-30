import { Component } from 'react';
import { div, hh } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import { DacUsers } from '../DacUsers';


export const DacMembersModal = hh(class DacMembersModal extends Component {

  render() {
    return (
      BaseModal({
          id: 'dacMembersModal',
          showModal: this.props.showModal,
          onRequestClose: this.props.onCloseRequest,
          color: 'common',
          type: 'informative',
          iconSize: 'none',
          title: 'DAC Members associated with DAC: ' + this.props.dac.name,
          action: { label: 'Close', handler: this.props.onCloseRequest }
        },
        [div({}, [DacUsers({ dac: this.props.dac, removeButton: false })])]
      )
    );
  }
});
