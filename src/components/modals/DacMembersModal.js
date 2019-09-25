import { Component } from 'react';
import { div, hh } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import { DacUsers } from '../DacUsers';


export const DacMembersModal = hh(class DacMembersModal extends Component {

  constructor(props) {
    super(props);
    this.state = {
      dac: this.props.dac
    };
  };

  render() {
    return (
      BaseModal({
          id: 'dacMembersModal',
          showModal: this.props.showModal,
          onRequestClose: this.props.onCloseRequest,
          color: 'common',
          type: 'informative',
          iconSize: 'none',
          title: 'DAC Members associated with DAC: ' + this.state.dac.name,
          action: { label: 'Close', handler: this.props.onCloseRequest }
        },
        [
          div({ style: { marginLeft: '2rem' } },
            [DacUsers({
              dac: this.state.dac,
              removeButton: false
            })]
          )
        ]
      )
    );
  }
});
