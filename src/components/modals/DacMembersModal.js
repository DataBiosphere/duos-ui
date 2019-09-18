import { Component } from 'react';
import { hh, h4, ul, li } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';

const MODAL_ID = 'dacMembers';

const styles = {
  userList: {
    marginLeft: "2rem"
  }
};

export const DacMembersModal = hh(class DacMembersModal extends Component {

  constructor(props) {
    super(props);
    this.state = {
      dacDTO: this.props.dacDTO,
    };
  };

  OKHandler = (e) => {
    this.props.onOKRequest(MODAL_ID);
  };

  closeHandler = (e) => {
    this.props.onCloseRequest(MODAL_ID);
  };

  render() {
    // console.log("DAC");
    // console.log(JSON.stringify(this.state.dacDTO.dac));
    // console.log("Chairs");
    // console.log(JSON.stringify(this.state.dacDTO.chairpersons));
    // console.log("Members");
    // console.log(JSON.stringify(this.state.dacDTO.members));
    return (
      BaseModal({
          id: "dacMembersModal",
          showModal: this.props.showModal,
          onRequestClose: this.closeHandler,
          onAfterOpen: this.afterOpenHandler,
          color: "common",
          type: "informative",
          iconSize: 'none',
          title: "DAC Members associated with DAC: " + this.state.dacDTO.dac.name,
          action: { label: "Close", handler: this.OKHandler }
        },
        [
          h4("Chairpersons"),
          ul({ id: "txt_chairpersons", className: "row no-margin" },
            [this.state.dacDTO.chairpersons.map(u => li({style: styles.userList}, [u.displayName, " ", u.email]))]
          ),
          h4("Members"),
          ul({ id: "txt_members", className: "row no-margin" },
            [this.state.dacDTO.members.map(u => li({style: styles.userList}, [u.displayName, " ", u.email]))]
          )
        ])
    );
  }
});
