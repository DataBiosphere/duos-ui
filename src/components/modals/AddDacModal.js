import _ from 'lodash';
import { Component } from 'react';
import { div, form, h, hh, input, label, textarea } from 'react-hyperscript-helpers';
import AsyncSelect from 'react-select/async';
import { DAC } from '../../libs/ajax';
import { Alert } from '../Alert';
import { BaseModal } from '../BaseModal';
import { DacUsers } from '../DacUsers';


export const CHAIR = 'chair';
export const MEMBER = 'member';

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
      memberIdsToRemove: []
    };

    this.OKHandler = this.OKHandler.bind(this);
    this.chairSearch = this.chairSearch.bind(this);
    this.memberSearch = this.memberSearch.bind(this);
    this.userSearch = this.userSearch.bind(this);
    this.onChairSearchChange = this.onChairSearchChange.bind(this);
    this.onMemberSearchChange = this.onMemberSearchChange.bind(this);
    this.removeDacMember = this.removeDacMember.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

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
          console.log("adding dac chair: " + id);
          return DAC.addDacChair(currentDac.dacId, id);
        }),
        _.map(this.state.chairIdsToRemove, (id) => {
          console.log("removing dac chair: " + id);
          return DAC.removeDacChair(currentDac.dacId, id);
        }),
        _.map(this.state.memberIdsToAdd, (id) => {
          console.log("adding dac member: " + id);
          return DAC.addDacMember(currentDac.dacId, id);
        }),
        _.map(this.state.memberIdsToRemove, (id) => {
          console.log("removing dac member: " + id);
          return DAC.removeDacMember(currentDac.dacId, id);
        })
      ]
    ).then(() => {
      this.props.onOKRequest();
    });
  }

  handleErrors(message) {
    this.setState(prev => {
      prev.error = {
        title: 'Error',
        show: true,
        msg: message
      };
      return prev;
    });
  };

  chairSearch(query, callback) {
    // A valid chair is any user:
    //    * minus current chairs
    //    * minus current members (you shouldn't be both a chair and a member)
    //    * minus any new members selected (you shouldn't be both a chair and a member)
    //    * plus any chairs that are slated for removal
    const invalidChairs = _.pull(
      _.union(
        _.map(this.state.dac.chairpersons, 'dacUserId'),
        _.map(this.state.dac.members, 'dacUserId'),
        this.state.memberIdsToAdd),
      this.state.chairIdsToRemove);
    this.userSearch(invalidChairs, query, callback);
  };

  memberSearch(query, callback) {
    // A valid member is any user:
    //    * minus current members
    //    * minus current chairs (you shouldn't be both a chair and a member)
    //    * minus any new chairs selected (you shouldn't be both a chair and a member)
    //    * plus any members that are slated for removal
    const invalidMembers = _.pull(
      _.union(
        _.map(this.state.dac.members, 'dacUserId'),
        _.map(this.state.dac.chairpersons, 'dacUserId'),
        this.state.chairIdsToAdd),
      this.state.memberIdsToRemove);
    this.userSearch(invalidMembers, query, callback);
  };

  userSearch(invalidUserIds, query, callback) {
    DAC.autocompleteUsers(query).then(
      items => {
        console.log("invalidUserIds: " + JSON.stringify(invalidUserIds));
        const filteredUsers = _.filter(items, item => { return !invalidUserIds.includes(item.dacUserId); });
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
  }

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
    console.log("calling remove dac member: " + dacUserId);
    console.log("calling remove dac member: " + type);
    switch (type) {
      case CHAIR:
        if (this.state.chairIdsToRemove.includes(dacUserId)) {
          // console.log("chairIdsToRemove includes: " + dacUserId);
          this.setState(prev => {
            prev.chairIdsToRemove = _.pull(prev.chairIdsToRemove, [dacUserId]);
            return prev;
          });
        } else {
          // console.log("chairIdsToRemove does not include: " + dacUserId);
          this.setState(prev => {
            prev.chairIdsToRemove = _.union(prev.chairIdsToRemove, [dacUserId]);
            return prev;
          });
        }
        break;
      case MEMBER:
        if (this.state.memberIdsToRemove.includes(dacUserId)) {
          // console.log("memberIdsToRemove includes: " + dacUserId);
          this.setState(prev => {
            prev.memberIdsToRemove = _.pull(prev.memberIdsToRemove, [dacUserId]);
            return prev;
          });
        } else {
          // console.log("memberIdsToRemove does not include: " + dacUserId);
          this.setState(prev => {
            prev.memberIdsToRemove = _.union(prev.memberIdsToRemove, [dacUserId]);
            return prev;
          });
        }
        break;
      default:
        break;
    }
  }

  async updateMembership(dacId) {
    await DAC.membership(dacId).then(
      membership => {
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

  render() {
    return (
      BaseModal({
          id: 'addDacModal',
          disableOkBtn: this.state.file === '' || this.state.disableOkBtn,
          showModal: this.props.showModal,
          onRequestClose: this.props.onCloseRequest,
          onAfterOpen: this.props.onAfterOpen,
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
                  loadOptions: (query, callback) => this.chairSearch(query, callback),
                  onChange: (option) => this.onChairSearchChange(option),
                  noOptionsMessage: () => 'Select a DUOS User...',
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
                  loadOptions: (query, callback) => this.memberSearch(query, callback),
                  onChange: (option) => this.onMemberSearchChange(option),
                  noOptionsMessage: () => 'Select a DUOS User...',
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
