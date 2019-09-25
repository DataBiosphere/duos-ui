import _ from 'lodash';
import { Component } from 'react';
import { div, form, h, hh, input, label, textarea } from 'react-hyperscript-helpers';
import AsyncSelect from 'react-select/async';
import { DAC } from '../../libs/ajax';
import { Alert } from '../Alert';
import { BaseModal } from '../BaseModal';
import { DacUsers } from '../DacUsers';

export const CHAIR = "chair";
export const MEMBER = "member";

export const AddDacModal = hh(class AddDacModal extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isEditMode: this.props.isEditMode,
      dac: this.props.isEditMode ? this.props.dac : { dac: {}, chairpersons: [], members: [] },
      error: {
        show: false,
        title: '',
        msg: ['']
      },
      chairsSelectedOptions: [],
      chairIdsToAdd: [],
      chairIdsToRemove: [],
      membersSelectedOptions: [],
      memberIdsToAdd: [],
      memberIdsToRemove: [],
    };

    this.afterOpenHandler = this.afterOpenHandler.bind(this);
    this.OKHandler = this.OKHandler.bind(this);
    this.userSearch = this.userSearch.bind(this);
    this.onChairSearchChange = this.onChairSearchChange.bind(this);
    this.onMemberSearchChange = this.onMemberSearchChange.bind(this);
    this.removeDacMember = this.removeDacMember.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
  };

  async OKHandler() {
    let currentDac = this.state.dac;
    if (this.state.isEditMode) {
      await DAC.update(currentDac.dacId, currentDac.name, currentDac.description);
    } else {
      await DAC.create(currentDac.name, currentDac.description);
    }
    Promise.all(
      [
        _.map(this.state.chairIdsToAdd, (id) => {
          return DAC.addDacChair(currentDac.dacId, id);
        }),
        _.map(this.state.chairIdsToRemove, (id) => {
          return DAC.removeDacChair(currentDac.dacId, id);
        }),
        _.map(this.state.memberIdsToAdd, (id) => {
          return DAC.addDacMember(currentDac.dacId, id);
        }),
        _.map(this.state.memberIdsToRemove, (id) => {
          return DAC.removeDacMember(currentDac.dacId, id);
        })
      ]
    ).then(() => {
      this.props.onCloseRequest();
    });
  }

  afterOpenHandler() {
    this.props.onAfterOpen('addDac');
  }

  handleErrors(message) {
    this.setState(prev => {
      prev.error = {
        title: "Error",
        show: true,
        msg: message
      };
      return prev;
    });
  };

  userSearch(query, callback, type) {
    // These ids are the allowable selection options, e.g.,
    //    a selectable chair is any user, minus current chairs, plus any chairs that are slated for removal
    //    a selectable member is any user, minus current members, plus any members that are slated for removal
    const ignorableChairIds = _.pull(_.map(this.state.dac.chairpersons, 'dacUserId'), this.state.chairIdsToRemove);
    const ignorableMemberIds = _.pull(_.map(this.state.dac.members, 'dacUserId'), this.state.memberIdsToRemove);
    DAC.autocompleteUsers(query).then(
      items => {
        const filteredUsers = _.filter(items, item => {
          switch (type) {
            case CHAIR:
              return !ignorableChairIds.includes(item.dacUserId);
            case MEMBER:
              return !ignorableMemberIds.includes(item.dacUserId);
            default:
              return true;
          }
        });
        const options = filteredUsers.map(function(item) {
          return {
            key: item.dacUserId,
            value: item.dacUserId,
            label: item.displayName + ' (' + item.email + ')',
            item: item
          };
        });
        callback(options);
      },
      rejected => {
        console.error(rejected);
      });
  };

  onChairSearchChange(data) {
    this.setState(prev => {
      prev.chairIdsToAdd = _.map(data, 'item.dacUserId');
      prev.chairsSelectedOptions = data;
      return prev;
    });
  };

  onMemberSearchChange(data) {
    this.setState(prev => {
      prev.memberIdsToAdd = _.map(data, 'item.dacUserId');
      prev.membersSelectedOptions = data;
      return prev;
    });
  };

  handleChange(event) {
    const target = event.target;
    const value = target.value;
    const name = target.name;
    switch (name) {
      case 'name':
        this.setState(prev => {
          let newDac = Object.assign({}, prev.dac);
          newDac.name = value;
          prev.dac = newDac;
          return prev;
        });
        break;
      case 'description':
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

  removeDacMember(dacId, dacUserId, type) {
    switch (type) {
      case CHAIR:
        this.state.chairIdsToRemove.push(dacUserId);
        break;
      case MEMBER:
        this.state.memberIdsToRemove.push(dacUserId);
        break;
      default:
        break;
    }
  }

  async updateMembership(dacId) {
    await DAC.membership(dacId).then(
      membership => {
        console.log('updated membership: ' + JSON.stringify(membership));
        const updatedChairs = _.find(membership, { 'roles.name': 'Chairperson', 'dacId': dacId });
        const updatedMembers = _.find(membership, { 'roles.name': 'Member', 'dacId': dacId });
        this.setState(prev => {
          prev.dac.chairpersons = updatedChairs;
          prev.dac.members = updatedMembers;
          return prev;
        });
      },
      rejected => {
        console.error(rejected);
      }
    );
  }

  isValidJson = (obj, error) => {
  };

  render() {
    return (
      BaseModal({
          id: 'addDacModal',
          disableOkBtn: this.state.file === '' || this.state.disableOkBtn,
          showModal: this.props.showModal,
          onRequestClose: this.props.onCloseRequest,
          onAfterOpen: this.afterOpenHandler,
          imgSrc: this.state.isEditMode ? '/images/icon_edit_dac.png' : '/images/icon_add_dac.png',
          color: 'common',
          title: this.state.isEditMode ? 'Edit Data Access Committee' : 'Add Data Access Committee',
          description: this.state.isEditMode ? 'Edit a Data Access Committee' : 'Create a new Data Access Committee in the system',
          action: {
            label: this.state.isEditMode ? 'Save' : 'Add',
            handler: this.OKHandler
          }
        },
        [
          form({
            className: 'form-horizontal css-form',
            name: 'dacForm',
            noValidate: true,
            encType: 'multipart/form-data'
          }, [
            div({ className: 'form-group first-form-group' }, [
              label({
                id: 'lbl_dacName',
                className: 'col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color'
              }, ['DAC Name*']),
              div({ className: 'col-lg-9 col-md-9 col-sm-9 col-xs-8' }, [
                input({
                  id: 'txt_dacName',
                  type: 'text',
                  defaultValue: this.state.dac.name,
                  onChange: this.handleChange,
                  name: 'name',
                  className: 'form-control col-lg-12 vote-input',
                  required: true
                })
              ])
            ]),

            div({ className: 'form-group' }, [
              label({
                id: 'lbl_dacDescription',
                className: 'col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color'
              }, ['DAC Description']),
              div({ className: 'col-lg-9 col-md-9 col-sm-9 col-xs-8' }, [
                textarea({
                  id: 'txt_dacDescription',
                  defaultValue: this.state.dac.description,
                  onChange: this.handleChange,
                  name: 'description',
                  className: 'form-control col-lg-12 vote-input',
                  required: true
                })
              ])
            ]),

            div({
                style: { marginLeft: '6rem' },
                isRendered: (this.state.dac.chairpersons.length > 0 || this.state.dac.members.length > 0)
              },
              [
                div({ style: { fontWeight: '500' }, className: 'common-color' }, ['DAC Members']),
                DacUsers({
                  style: { marginLeft: '-1rem' },
                  dac: this.state.dac,
                  removeButton: true,
                  removeHandler: this.removeDacMember
                })
              ]
            ),

            div({ className: 'form-group' }, [
              label({
                id: 'lbl_dacChair',
                className: 'col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color'
              }, ['Add Chairperson(s)']),
              div({ className: 'col-lg-9 col-md-9 col-sm-9 col-xs-8' }, [
                h(AsyncSelect, {
                  id: 'sel_dacChair',
                  isDisabled: false,
                  isMulti: true,
                  loadOptions: (query, callback) => this.userSearch(query, callback, CHAIR),
                  onChange: (option) => this.onChairSearchChange(option),
                  value: this.state.chairsSelectedOptions,
                  classNamePrefix: 'select',
                  placeholder: 'Select a DUOS User...',
                  className: 'select-autocomplete'
                })
              ])
            ]),

            div({ className: 'form-group' }, [
              label({
                id: 'lbl_dacMember',
                className: 'col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color'
              }, ['Add Member(s)']),
              div({ className: 'col-lg-9 col-md-9 col-sm-9 col-xs-8' }, [
                h(AsyncSelect, {
                  id: 'sel_dacMember',
                  isDisabled: false,
                  isMulti: true,
                  loadOptions: (query, callback) => this.userSearch(query, callback, MEMBER),
                  onChange: (option) => this.onMemberSearchChange(option),
                  value: this.state.membersSelectedOptions,
                  classNamePrefix: 'select',
                  placeholder: 'Select a DUOS User...',
                  className: 'select-autocomplete'
                })
              ])
            ])
          ]),

          div({ isRendered: this.state.error.show }, [
            Alert({ id: 'modal', type: 'danger', title: this.state.error.title, description: this.state.error.msg })
          ])
        ])
    );
  }

});
