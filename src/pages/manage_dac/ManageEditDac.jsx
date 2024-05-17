import * as ld from 'lodash';
import React, { useEffect, useState } from 'react';
import AsyncSelect from 'react-select/async';
import { DAC } from '../../libs/ajax/DAC';
import { Models } from '../../libs/models';
import { PromiseSerial } from '../../libs/utils';
import { Alert } from '../../components/Alert';
import { BaseModal } from '../../components/BaseModal';
import { DacUsers } from './DacUsers';
import { Notifications } from '../../libs/utils';
import editDACIcon from '../../images/icon_edit_dac.png';
import addDACIcon from '../../images/icon_add_dac.png';
import { Spinner } from '../../components/Spinner';

export const CHAIR = 'chair';
export const MEMBER = 'member';
const CHAIRPERSON = 'Chairperson';
const ADMIN = 'Admin';

export default function ManageEditDac(props) {
  const [state, setState] = useState({
    isEditMode: props.isEditMode,
    error: Models.error,
    dirtyFlag: false,
    dac: props.isEditMode ? props.dac : Models.dac,
    chairsSelectedOptions: [],
    chairIdsToAdd: [],
    chairIdsToRemove: [],
    membersSelectedOptions: [],
    memberIdsToAdd: [],
    memberIdsToRemove: [],
    searchInputChanged: false
  });
  const {dacId} = props.match.params;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        state.dac = await DAC.get(props.match.params.dacId);
        setState(prev => ({ ...prev, dac: state.dac }));
      }
      catch(e) {
        Notifications.showError({text: 'Error: Unable to retrieve current DAC from server'});
      }
    };
    fetchData();
    setIsLoading(false);
  }, [props.match.params]);

  const okHandler = async () => {
    let currentDac = state.dac;
    console.log(currentDac);
    if (state.dirtyFlag) {
        // TODO: removed the admin check .. not sure how to get the user role if not passed in as prop
        await DAC.update(currentDac.dacId, currentDac.name, currentDac.description, currentDac.email);

      // Order here is important. Since users cannot have multiple roles in the
      // same DAC, we have to make sure we remove users before re-adding any
      // back in a different role.
      // Chairs are a special case since we cannot remove all chairs from a DAC
      // so we handle that case first.
      const ops0 = state.chairIdsToAdd.map(id => () => DAC.removeDacMember(currentDac.dacId, id));
      const ops1 = state.memberIdsToRemove.map(id => () => DAC.removeDacMember(currentDac.dacId, id));
      const ops2 = state.chairIdsToAdd.map(id => () => DAC.addDacChair(currentDac.dacId, id));
      const ops3 = state.chairIdsToRemove.map(id => () => DAC.removeDacChair(currentDac.dacId, id));
      const ops4 = state.memberIdsToAdd.map(id => () => DAC.addDacMember(currentDac.dacId, id));
      const allOperations = ops0.concat(ops1, ops2, ops3, ops4);
      const responses = await PromiseSerial(allOperations);
      const errorCodes = ld.filter(responses, r => JSON.stringify(r) !== '200');
      if (!ld.isEmpty(errorCodes)) {
        handleErrors('There was an error saving DAC member information. Please verify that the DAC is correct by viewing the current members.');
      }
    } else {
      closeHandler();
    }
  };

  const closeHandler = () => {
    props.history.push('/manage_dac');
  };

  const handleErrors = (message) => {
    setState(prev => ({
      ...prev,
      error: {
        title: 'Error',
        show: true,
        msg: message
      }
    }));
  };

  const chairSearch = (query, callback) => {
    // A valid chair is any user:
    //    * minus current chairs
    //    * minus current members (you shouldn't be both a chair and a member)
    //    * minus any new members selected (you shouldn't be both a chair and a member)
    //    * plus any members that are slated for removal
    //    * plus any chairs that are slated for removal

    const invalidChairs = ld.difference(
      ld.union(
        ld.map(state.dac.chairpersons, 'userId'),
        ld.map(state.dac.members, 'userId'),
        state.memberIdsToAdd),
      state.memberIdsToRemove,
      state.chairIdsToRemove);
    userSearch(invalidChairs, query, callback);
  };

  const memberSearch = (query, callback) => {
    // A valid member is any user:
    //    * minus current members
    //    * minus current chairs (you shouldn't be both a chair and a member)
    //    * minus any new chairs selected (you shouldn't be both a chair and a member)
    //    * plus any members that are slated for removal
    //    * plus any chairs that are slated for removal

    const invalidMembers = ld.difference(
      ld.union(
        ld.map(state.dac.members, 'userId'),
        ld.map(state.dac.chairpersons, 'userId'),
        state.chairIdsToAdd),
      state.memberIdsToRemove,
      state.chairIdsToRemove);
    userSearch(invalidMembers, query, callback);
  };

  const userSearch = (invalidUserIds, query, callback) => {
    DAC.autocompleteUsers(query).then(
      items => {
        const filteredUsers = ld.filter(items, item => { return !invalidUserIds.includes(item.userId); });
        const options = filteredUsers.map(function (item) {
          return {
            key: item.userId,
            value: item.userId,
            label: item.displayName + ' (' + item.email + ')',
            item: item
          };
        });
        callback(options);
      },
      rejected => {
        handleErrors(rejected);
      });
  };

  const onChairSearchChange = (data) => {
    setState(prev => ({
      ...prev,
      chairIdsToAdd: ld.map(data, 'item.userId'),
      chairsSelectedOptions: data,
      dirtyFlag: true
    }));
  };

  const onMemberSearchChange = (data) => {
    setState(prev => ({
      ...prev,
      memberIdsToAdd: ld.map(data, 'item.userId'),
      membersSelectedOptions: data,
      dirtyFlag: true
    }));
  };

  const onSearchInputChanged = () => {
    setState(prev => ({
      ...prev,
      searchInputChanged: true
    }));
  };

  const onSearchMenuClosed = () => {
    setState(prev => ({
      ...prev,
      searchInputChanged: false
    }));
  };

  const handleChange = (event) => {
    const target = event.target;
    const value = target.value;
    const name = target.name;

    setState(prev => {
      let newDac = Object.assign({}, prev.dac);
      newDac[name] = value;
      console.log(newDac);
      return {
        ...prev,
        dac: newDac,
        dirtyFlag: true
      };
    });
  };

  const removeDacMember = (dacId, userId, role) => {
    switch (role) {
      case CHAIR:
        if (state.chairIdsToRemove.includes(userId)) {
          setState(prev => ({
            ...prev,
            chairIdsToRemove: ld.difference(prev.chairIdsToRemove, [userId]),
            dirtyFlag: true
          }));
        } else {
          setState(prev => ({
            ...prev,
            chairIdsToRemove: ld.union(prev.chairIdsToRemove, [userId]),
            dirtyFlag: true
          }));
        }
        break;
      case MEMBER:
        if (state.memberIdsToRemove.includes(userId)) {
          setState(prev => ({
            ...prev,
            memberIdsToRemove: ld.difference(prev.memberIdsToRemove, [userId]),
            dirtyFlag: true
          }));
        } else {
          setState(prev => ({
            ...prev,
            memberIdsToRemove: ld.union(prev.memberIdsToRemove, [userId]),
            dirtyFlag: true
          }));
        }
        break;
      default:
        break;
    }
  };

  return (
    isLoading ? 
    <Spinner/> :
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      <form className="form-horizontal css-form" name="dacForm" noValidate encType="multipart/form-data">
        <div className="form-group first-form-group">
          <label id="lbl_dacName" className="col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color">DAC Name</label>
          <div className="col-lg-9 col-md-9 col-sm-9 col-xs-8">
            <input
              id="txt_dacName"
              type="text"
              defaultValue={state.dac.name}
              onChange={handleChange}
              name="name"
              className="form-control col-lg-12 vote-input"
              required={true}
              disabled={props.userRole === CHAIRPERSON}
            />
          </div>
        </div>

        <div className="form-group">
          <label id="lbl_dacDescription" className="col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color">DAC Description</label>
          <div className="col-lg-9 col-md-9 col-sm-9 col-xs-8">
            <textarea
              id="txt_dacDescription"
              defaultValue={state.dac.description}
              onChange={handleChange}
              name="description"
              className="form-control col-lg-12 vote-input"
              required={true}
              disabled={props.userRole === CHAIRPERSON}
            />
          </div>
        </div>

        <div className="form-group first-form-group">
          <label id="lbl_dacEmail" className="col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color">DAC Email</label>
          <div className="col-lg-9 col-md-9 col-sm-9 col-xs-8">
            <input
              id="txt_dacEmail"
              type="text"
              defaultValue={state.dac.email}
              onChange={handleChange}
              name="email"
              className="form-control col-lg-12 vote-input"
              required={true}
              disabled={props.userRole === CHAIRPERSON}
            />
          </div>
        </div>
        {
          (state.dac.chairpersons.length > 0 || state.dac.members.length > 0) && <div className="form-group" >
            <label id="lbl_dacMembers" className="col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color">DAC Members</label>
            <div className="col-lg-9 col-md-9 col-sm-9 col-xs-8">
              <DacUsers
                dac={state.dac}
                removeButton={true}
                removeHandler={removeDacMember}
              />
            </div>
          </div>
        }

        <div className="form-group">
          <label id="lbl_dacChair" className="col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color">Add Chairperson(s)</label>
          <div className="col-lg-9 col-md-9 col-sm-9 col-xs-8">
            <AsyncSelect
              id="sel_dacChair"
              isDisabled={false}
              isMulti
              loadOptions={(query, callback) => chairSearch(query, callback)}
              onChange={(option) => onChairSearchChange(option)}
              onInputChange={() => onSearchInputChanged()}
              onMenuClose={() => onSearchMenuClosed()}
              noOptionsMessage={() => 'Select a DUOS User...'}
              value={state.chairsSelectedOptions}
              classNamePrefix="select"
              placeholder="Select a DUOS User..."
              className="select-autocomplete"
            />
          </div>
        </div>

        <div className="form-group">
          <label id="lbl_dacMember" className="col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label common-color">Add Member(s)</label>
          <div style={state.searchInputChanged ? { paddingBottom: '10rem' } : {}} className="col-lg-9 col-md-9 col-sm-9 col-xs-8">
            <AsyncSelect
              id="sel_dacMember"
              isDisabled={false}
              isMulti={true}
              loadOptions={(query, callback) => memberSearch(query, callback)}
              onChange={(option) => onMemberSearchChange(option)}
              onInputChange={() => onSearchInputChanged()}
              onMenuClose={() => onSearchMenuClosed()}
              noOptionsMessage={() => 'Select a DUOS User...'}
              value={state.membersSelectedOptions}
              classNamePrefix="select"
              placeholder="Select a DUOS User..."
              className="select-autocomplete"
            />
          </div>
        </div>
        <button onClick={okHandler}>Save</button>
        <button onClick={closeHandler}>Cancel</button>
      </form>
      {
        state.error.show && <div>
          <Alert id="modal" type="danger" title={state.error.title} description={this.state.error.msg} />
        </div>
      }
    </div>
  );
};