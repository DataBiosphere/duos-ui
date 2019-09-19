import { Component } from 'react';
import { div, hh } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import { DacUsers } from '../DacUsers';


const MODAL_ID = 'dacMembers';

export const DacMembersModal = hh(class DacMembersModal extends Component {

  constructor(props) {
    super(props);
    this.state = {
      dac: this.props.dac
    };
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
          id: 'dacMembersModal',
          showModal: this.props.showModal,
          onRequestClose: this.closeHandler,
          onAfterOpen: this.afterOpenHandler,
          color: 'common',
          type: 'informative',
          iconSize: 'none',
          title: 'DAC Members associated with DAC: ' + this.state.dac.name,
          action: { label: 'Close', handler: this.OKHandler }
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
