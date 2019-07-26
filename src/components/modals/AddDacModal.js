import { Component } from 'react';
import { div, form, h, hh, input, label, textarea } from 'react-hyperscript-helpers';
import AsyncSelect from 'react-select/lib/Async';
import { Alert } from '../Alert';
import { BaseModal } from '../BaseModal';
import { DAC } from '../../libs/ajax';

export const AddDacModal = hh(class AddDacModal extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isEditMode: this.props.isEditMode,
      dac: this.props.isEditMode ? this.props.dac : {},
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
    let currentDac = this.state.dac;
    let newDac = {};
    if (this.state.isEditMode) {
      newDac = await DAC.update(currentDac.dacId, currentDac.name, currentDac.description);
    } else {
      newDac = await DAC.create(currentDac.name, currentDac.description);
    }
    this.setState(prev => {
      prev.dac = newDac;
      return prev;
    });
    this.closeHandler();
  }

  closeHandler() {
    this.props.onCloseRequest('addDac');
  }

  afterOpenHandler() {
    this.props.onAfterOpen('addDac');
  }

  handleErrors(message) {
  };

  handleChange = (event) => {
    const target = event.target;
    const value = target.value;
    const name = target.name;
    switch (name) {
      case "name":
        this.setState(prev => {
          let newDac = Object.assign({}, prev.dac);
          newDac.name = value;
          prev.dac = newDac;
          return prev;
        });
        break;
      case "description":
        this.setState(prev => {
          let newDac = Object.assign({}, prev.dac);
          newDac.description = value;
          prev.dac = newDac;
          return prev;
        });
        break;
      default:
        break;
    }
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
                    defaultValue: this.state.dac.name,
                    onChange: this.handleChange,
                    name: "name",
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
                    defaultValue: this.state.dac.description,
                    onChange: this.handleChange,
                    name: "description",
                    className: "form-control col-lg-12 vote-input",
                    required: true
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
