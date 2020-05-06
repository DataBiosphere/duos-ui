import * as ld from 'lodash';
import { Component } from 'react';
import { div, form, h, hh, input, label, textarea } from 'react-hyperscript-helpers';
import AsyncSelect from 'react-select/async';
import { DAC } from '../../libs/ajax';
import { Models } from '../../libs/models';
import { serialPromises } from '../../libs/utils';
import { Alert } from '../../components/Alert';
import { BaseModal } from '../../components/BaseModal';
import { DacUsers } from './DacUsers';


export const CHAIR = 'chair';
export const MEMBER = 'member';

export const AddDacModal = hh(class AddDacModal extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isEditMode: this.props.isEditMode,
      error: Models.error,
      dirtyFlag: false,
      dac: this.props.isEditMode ? this.props.dac : Models.dac,
      chairsSelectedOptions: [],
      chairIdsToAdd: [],
      chairIdsToRemove: [],
      membersSelectedOptions: [],
      memberIdsToAdd: [],
      memberIdsToRemove: [],
      searchInputChanged: false,
    };
  }

  okHandler = async () => {
    let currentDac = this.state.dac;
    if (this.state.dirtyFlag) {
      if (this.state.isEditMode) {
        await DAC.update(currentDac.dacId, currentDac.name, currentDac.description);
      } else {
        currentDac = await DAC.create(currentDac.name, currentDac.description);
      }
      // Order here is important. Since users cannot have multiple roles in the
      // same DAC, we have to make sure we remove users before re-adding any
      // back in a different role.
      // Chairs are a special case since we cannot remove all chairs from a DAC
      // so we handle that case first.
      Promise.resolve(
        [
          // For each chair we're adding, we need to remove member status
          ld.map(this.state.chairIdsToAdd, (id) => {
            return DAC.removeDacMember(currentDac.dacId, id);
          }),
          // Then add them as a chair:
          ld.map(this.state.chairIdsToAdd, (id) => {
            return DAC.addDacChair(currentDac.dacId, id);
          }),
          ld.map(this.state.chairIdsToRemove, (id) => {
            return DAC.removeDacChair(currentDac.dacId, id);
          }),
          ld.map(this.state.memberIdsToRemove, (id) => {
            return DAC.removeDacMember(currentDac.dacId, id);
          }),
          ld.map(this.state.memberIdsToAdd, (id) => {
            return DAC.addDacMember(currentDac.dacId, id);
          }),
        ]
      ).then(() => {
        this.props.onOKRequest('addDac');
      }).catch((err) => {
        this.handleErrors(err);
      });
    } else {
      this.closeHandler();
    }
  };

  closeHandler = () => {
    this.props.onCloseRequest('addDac');
  };

  handleErrors= (message) =>{
    this.setState(prev => {
      prev.error = {
        title: 'Error',
        show: true,
        msg: message
      };
      return prev;
    });
  };

  chairSearch = (query, callback) => {
    // A valid chair is any user:
    //    * minus current chairs
    //    * minus current members (you shouldn't be both a chair and a member)
    //    * minus any new members selected (you shouldn't be both a chair and a member)
    //    * plus any members that are slated for removal
    //    * plus any chairs that are slated for removal
    const invalidChairs = ld.difference(
      ld.union(
        ld.map(this.state.dac.chairpersons, 'dacUserId'),
        ld.map(this.state.dac.members, 'dacUserId'),
        this.state.memberIdsToAdd),
      this.state.memberIdsToRemove,
      this.state.chairIdsToRemove);
    this.userSearch(invalidChairs, query, callback);
  };

  memberSearch = (query, callback) => {
    // A valid member is any user:
    //    * minus current members
    //    * minus current chairs (you shouldn't be both a chair and a member)
    //    * minus any new chairs selected (you shouldn't be both a chair and a member)
    //    * plus any members that are slated for removal
    //    * plus any chairs that are slated for removal
    const invalidMembers = ld.difference(
      ld.union(
        ld.map(this.state.dac.members, 'dacUserId'),
        ld.map(this.state.dac.chairpersons, 'dacUserId'),
        this.state.chairIdsToAdd),
      this.state.memberIdsToRemove,
      this.state.chairIdsToRemove);
    this.userSearch(invalidMembers, query, callback);
  };

  userSearch = (invalidUserIds, query, callback) => {
    DAC.autocompleteUsers(query).then(
      items => {
        const filteredUsers = ld.filter(items, item => { return !invalidUserIds.includes(item.dacUserId); });
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
        this.handleErrors(rejected);
      });
  };

  onChairSearchChange = (data) => {
    this.setState(prev => {
      prev.chairIdsToAdd = ld.map(data, 'item.dacUserId');
      prev.chairsSelectedOptions = data;
      prev.dirtyFlag = true;
      return prev;
    });
  };

  onMemberSearchChange = (data) => {
    this.setState(prev => {
      prev.memberIdsToAdd = ld.map(data, 'item.dacUserId');
      prev.membersSelectedOptions = data;
      prev.dirtyFlag = true;
      return prev;
    });
  };

  onSearchInputChanged = () => {
    this.setState(prev => {
      prev.searchInputChanged = true;
      return prev;
    });
  };

  onSearchMenuClosed = () => {
    this.setState(prev => {
      prev.searchInputChanged = false;
      return prev;
    });
  };

  handleChange = (event) => {
    const target = event.target;
    const value = target.value;
    const name = target.name;
    switch (name) {
      case 'name':
        this.setState(prev => {
          let newDac = Object.assign({}, prev.dac);
          newDac.name = value;
          prev.dac = newDac;
          prev.dirtyFlag = true;
          return prev;
        });
        break;
      case 'description':
        this.setState(prev => {
          let newDac = Object.assign({}, prev.dac);
          newDac.description = value;
          prev.dac = newDac;
          prev.dirtyFlag = true;
          return prev;
        });
        break;
      default:
        break;
    }
  };

  removeDacMember = (dacId, dacUserId, role) => {
    switch (role) {
      case CHAIR:
        if (this.state.chairIdsToRemove.includes(dacUserId)) {
          this.setState(prev => {
            prev.chairIdsToRemove = ld.difference(prev.chairIdsToRemove, [dacUserId]);
            prev.dirtyFlag = true;
            return prev;
          });
        } else {
          this.setState(prev => {
            prev.chairIdsToRemove = ld.union(prev.chairIdsToRemove, [dacUserId]);
            prev.dirtyFlag = true;
            return prev;
          });
        }
        break;
      case MEMBER:
        if (this.state.memberIdsToRemove.includes(dacUserId)) {
          this.setState(prev => {
            prev.memberIdsToRemove = ld.difference(prev.memberIdsToRemove, [dacUserId]);
            prev.dirtyFlag = true;
            return prev;
          });
        } else {
          this.setState(prev => {
            prev.memberIdsToRemove = ld.union(prev.memberIdsToRemove, [dacUserId]);
            prev.dirtyFlag = true;
            return prev;
          });
        }
        break;
      default:
        break;
    }
  };

  render() {
    return (
      BaseModal({
        id: 'addDacModal',
        showModal: this.props.showModal,
        onRequestClose: this.closeHandler,
        onAfterOpen: this.props.onAfterOpen,
        imgSrc: this.state.isEditMode ? '/images/icon_edit_dac.png' : '/images/icon_add_dac.png',
        color: 'common',
        title: this.state.isEditMode ? 'Edit Data Access Committee' : 'Add Data Access Committee',
        description: this.state.isEditMode ? 'Edit a Data Access Committee' : 'Create a new Data Access Committee in the system',
        disableOkBtn: !this.state.dirtyFlag,
        action: {
          label: this.state.isEditMode ? 'Save' : 'Add',
          handler: this.okHandler
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
            }, ['DAC Name']),
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
            isRendered: (this.state.dac.chairpersons.length > 0 || this.state.dac.members.length > 0),
            className: 'form-group'
          }, [
            label({
              id: 'lbl_dacMembers',
              className: 'col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color'
            }, ['DAC Members']),
            div({
              className: 'col-lg-9 col-md-9 col-sm-9 col-xs-8'
            }, [
              DacUsers({
                dac: this.state.dac,
                removeButton: true,
                removeHandler: this.removeDacMember
              })
            ])
          ]),

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
                onInputChange: () => this.onSearchInputChanged(),
                onMenuClose: () => this.onSearchMenuClosed(),
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
            div({
              // Necessary to minimize the select options scrolling off screen
              style: this.state.searchInputChanged ? { paddingBottom: '10rem' } : {},
              className: 'col-lg-9 col-md-9 col-sm-9 col-xs-8' }, [
              h(AsyncSelect, {
                id: 'sel_dacMember',
                isDisabled: false,
                isMulti: true,
                loadOptions: (query, callback) => this.memberSearch(query, callback),
                onChange: (option) => this.onMemberSearchChange(option),
                onInputChange: () => this.onSearchInputChanged(),
                onMenuClose: () => this.onSearchMenuClosed(),
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
