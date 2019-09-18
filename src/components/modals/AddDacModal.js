import { Component } from 'react';
import { div, form, h, hh, h4, ul, li, input, label, textarea } from 'react-hyperscript-helpers';
import AsyncSelect from 'react-select/lib/Async';
import { Alert } from '../Alert';
import { BaseModal } from '../BaseModal';
import { DAC } from '../../libs/ajax';
import _ from 'lodash';

export const AddDacModal = hh(class AddDacModal extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isEditMode: this.props.isEditMode,
      dacDTO: this.props.isEditMode ? this.props.dacDTO : { dac: {}, chairpersons: [], members: [] },
      error: {
        show: false,
        title: '',
        msg: ['']
      },
      chairsToAdd: [],
      chairsSelectedOptions: [],
      membersToAdd: [],
      membersSelectedOptions: [],
    };

    this.closeHandler = this.closeHandler.bind(this);
    this.afterOpenHandler = this.afterOpenHandler.bind(this);
    this.OKHandler = this.OKHandler.bind(this);
    this.userSearch = this.userSearch.bind(this);
    this.onChairSearchChange = this.onChairSearchChange.bind(this);
    this.onMemberSearchChange = this.onMemberSearchChange.bind(this);
  }

  componentDidMount() {
  };

  async OKHandler() {
    let currentDac = this.state.dacDTO.dac;
    let newDac = {};
    if (this.state.isEditMode) {
      newDac = await DAC.update(currentDac.dacId, currentDac.name, currentDac.description);
    } else {
      newDac = await DAC.create(currentDac.name, currentDac.description);
    }
    this.state.chairsToAdd.map(function(chair) {
      const newChairResponse = DAC.addDacChair(currentDac.dacId, chair.dacUserId);
      console.log("Added chair: " + newChairResponse);
      return newChairResponse;
    });
    this.state.membersToAdd.map(function(member) {
      const newMemberResponse = DAC.addDacMember(currentDac.dacId, member.dacUserId);
      console.log("Added member: " + newMemberResponse);
      return newMemberResponse;
    });
    this.setState(prev => {
      prev.dacDTO.dac = newDac;
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

  userSearch = (query, callback) => {
    DAC.autocompleteUsers(query).then(
      items => {
        console.log("Items from search: " + JSON.stringify(items));
        const options = items.map(function(item) {
          return {
            key: item.dacUserId,
            value: item.dacUserId,
            label: item.displayName + " (" + item.email + ")",
            item: item
          };
        });
        callback(options);
      },
      rejected => {
        console.error(rejected);
      });
  };

  onChairSearchChange = (data) => {
    this.setState(prev => {
      prev.chairsToAdd = _.map(data, 'item');
      prev.chairsSelectedOptions = data;
      console.log("Chairs to add: " + JSON.stringify(prev.chairsToAdd));
      return prev;
    });
  };

  onMemberSearchChange = (data) => {
    this.setState(prev => {
      prev.membersToAdd = _.map(data, 'item');
      prev.membersSelectedOptions = data;
      console.log("Members to add: " + JSON.stringify(prev.membersToAdd));
      return prev;
    });
  };

  handleChange = (event) => {
    const target = event.target;
    const value = target.value;
    const name = target.name;
    switch (name) {
      case "name":
        this.setState(prev => {
          let newDac = Object.assign({}, prev.dacDTO.dac);
          newDac.name = value;
          prev.dacDTO.dac = newDac;
          return prev;
        });
        break;
      case "description":
        this.setState(prev => {
          let newDac = Object.assign({}, prev.dacDTO.dac);
          newDac.description = value;
          prev.dacDTO.dac = newDac;
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

    let dac = this.state.dacDTO.dac;
    let chairpersons = this.state.dacDTO.chairpersons;
    let members = this.state.dacDTO.members;

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
                  defaultValue: dac.name,
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
                  defaultValue: dac.description,
                  onChange: this.handleChange,
                  name: "description",
                  className: "form-control col-lg-12 vote-input",
                  required: true
                })
              ])
            ]),

            div({}, [
              div({isRendered: chairpersons.length > 0 },
                h4(["Chairpersons"]),
                ul({ id: "txt_chairpersons", className: "row no-margin" },
                  [chairpersons.map(u => li({key: u.email}, [u.displayName, " ", u.email]))])
              ),
              div({isRendered: (members.length > 0) },
                h4(["Members"]),
                ul({ id: "txt_members", className: "row no-margin" },
                  [members.map(u => li({key: u.email}, [u.displayName, " ", u.email]))])
              )]
            ),

            div({ className: "form-group" }, [
              label({
                id: "lbl_dacChair",
                className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color"
              }, ["Add Chairperson(s)"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8" }, [
                h(AsyncSelect, {
                  id: "sel_dacChair",
                  isDisabled: false,
                  isMulti: true,
                  loadOptions: (query, callback) => this.userSearch(query, callback),
                  onChange: (option) => this.onChairSearchChange(option),
                  value: this.state.chairsSelectedOptions,
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
              }, ["Add Member(s)"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8" }, [
                h(AsyncSelect, {
                  id: "sel_dacMember",
                  isDisabled: false,
                  isMulti: true,
                  loadOptions: (query, callback) => this.userSearch(query, callback),
                  onChange: (option) => this.onMemberSearchChange(option),
                  value: this.state.membersSelectedOptions,
                  classNamePrefix: "select",
                  placeholder: "Select a DUOS User...",
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
