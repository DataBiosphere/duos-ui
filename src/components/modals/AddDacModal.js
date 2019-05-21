import { Component } from 'react';
import { div, form, input, label, textarea, hh, h } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import { Alert } from '../Alert';
import AsyncSelect from 'react-select/lib/Async';


export const AddDacModal = hh(class AddDacModal extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isEditMode: false,
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
    if (this.props.isEditMode) {
      this.setState({
        isEditMode: this.props.isEditMode,
      });
    } else {
      this.setState({
      });
    }
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
        imgSrc: this.state.isEditMode ? "/images/icon_edit_dac.png" : "/images/icon_add_dac.png",
        color: "common",
        title: this.state.isEditMode ? "Edit Data Access Committee" : "Add Data Access Committee",
        description: this.state.isEditMode ? "Edit a Data Access Committee" : "Create a new Data Access Committee in the system",
        action: {
          label: this.state.isEditMode ? "Edit" : "Add",
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
                  h(AsyncSelect, {
                    id: "sel_dacChair",
                    // key: this.state.formData.datasets.value,
                    // isDisabled: this.state.formData.dar_code !== null,
                    isMulti: false,
                    // loadOptions: (query, callback) => this.searchDataSets(query, callback),
                    // onChange: (option) => this.onDatasetsChange(option),
                    // value: this.state.formData.datasets,
                    // noOptionsMessage: () => this.state.optionMessage,
                    // loadingMessage: () => this.state.optionMessage,
                    classNamePrefix: "select",
                    placeholder: "Select a DUOS User...",
                    className: 'select-autocomplete',
                  })
                ])
              ]),

              div({ className: "form-group" }, [
                label({
                  id: "lbl_dacMember",
                  className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color"
                }, ["DAC Member"]),
                div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8" }, [
                  h(AsyncSelect, {
                    id: "sel_dacMember",
                    // key: this.state.formData.datasets.value,
                    // isDisabled: this.state.formData.dar_code !== null,
                    isMulti: true,
                    // loadOptions: (query, callback) => this.searchDataSets(query, callback),
                    // onChange: (option) => this.onDatasetsChange(option),
                    // value: this.state.formData.datasets,
                    // noOptionsMessage: () => this.state.optionMessage,
                    // loadingMessage: () => this.state.optionMessage,
                    classNamePrefix: "select",
                    placeholder: "Select DUOS User(s)...",
                    className: 'select-autocomplete',
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
