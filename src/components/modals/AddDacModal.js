import { Component } from 'react';
import { div, form, input, label, textarea, hh } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import { Alert } from '../Alert';


export const AddDacModal = hh(class AddDacModal extends Component {

  constructor(props) {
    super(props);
    this.state = {
      dac: {
        dacName: '',
        dacDescription: '',
        dacChair: '',
        dacMember: '',
      },
      error: {
        show: false,
        title: '',
        msg: ['']
      }
    };

    this.closeHandler = this.closeHandler.bind(this);
    this.afterOpenHandler = this.afterOpenHandler.bind(this);
    this.OKHandler = this.OKHandler.bind(this);
  }

  componentDidMount() {
  };

  async OKHandler() {
  }

  closeHandler() {
    this.props.onCloseRequest('addDac');
  }

  afterOpenHandler() {
    this.props.onAfterOpen('addDac');
  }

  handleErrors(message) {
  };

  handleChange = (changeEvent) => {
  };

  isValidJson = (obj, error) => {
  };

  render() {

    return (

      BaseModal({
        id: "addDacModal",
        disableOkBtn: this.state.file === '' || this.state.disableOkBtn,
        showModal: this.props.showModal,
        onRequestClose: this.closeHandler,
        onAfterOpen: this.afterOpenHandler,
        imgSrc: "/images/icon_add_dac.png",
        color: "common",
        title: "Add Data Access Committee",
        description: "Create a new Data Access Committee in the system",
        action: {
          label: "Add",
          handler: this.OKHandler
        }
      },
        [

          form({
            className: "form-horizontal css-form",
            name: "dacForm",
            noValidate: true,
            encType: "multipart/form-data"
          }, [
              div({ className: "form-group first-form-group" }, [
                label({
                  id: "lbl_dacName",
                  className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color"
                }, ["DAC Name*"]),
                div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8" }, [
                  input({
                    id: "txt_dacName",
                    type: "text",
                    value: this.state.dac.dacName,
                    onChange: this.handleChange,
                    name: "dacName",
                    className: "form-control col-lg-12 vote-input",
                    required: true,
                  })
                ])
              ]),

              div({ className: "form-group" }, [
                label({
                  id: "lbl_dacDescription",
                  className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color"
                }, ["DAC Description"]),
                div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8" }, [
                  textarea({
                    id: "txt_dacDescription",
                    value: this.state.dac.dacDescription,
                    onChange: this.handleChange,
                    name: "dacDescription",
                    className: "form-control col-lg-12 vote-input",
                    required: false
                  })
                ])
              ]),

              div({ className: "form-group" }, [
                label({
                  id: "lbl_dacChair",
                  className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color"
                }, ["DAC Chairperson*"]),
                div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8" }, [
                  input({
                    id: "sel_dacChair",
                    type: "text",
                    value: this.state.dac.dacChair,
                    onChange: this.handleChange,
                    name: "dacChair",
                    className: "form-control col-lg-12 vote-input",
                    placeholder: "Select a DUOS User...",
                    required: true,
                  })
                ])
              ]),

              div({ className: "form-group" }, [
                label({
                  id: "lbl_dacMember",
                  className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color"
                }, ["DAC Member"]),
                div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8" }, [
                  input({
                    id: "sel_dacMember",
                    type: "text",
                    value: this.state.dac.dacMember,
                    onChange: this.handleChange,
                    name: "dacMember",
                    className: "form-control col-lg-12 vote-input",
                    placeholder: "Select DUOS User(s)...",
                    required: false,
                  })
                ])
              ])
            ]),

          div({ isRendered: this.state.error.show }, [
            Alert({ id: "modal", type: "danger", title: this.state.error.title, description: this.state.error.msg })
          ])
        ])
    );
  }

});
