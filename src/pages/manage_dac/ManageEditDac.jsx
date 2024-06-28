import * as ld from 'lodash';
import React, { useEffect, useState } from 'react';
import AsyncSelect from 'react-select/async';
import { DAC } from '../../libs/ajax/DAC';
// import { DAA } from '../../libs/ajax/DAA';
import { Models } from '../../libs/models';
import { PromiseSerial } from '../../libs/utils';
import { Alert } from '../../components/Alert';
import { Link } from 'react-router-dom';
import { DacUsers } from './DacUsers';
import { Notifications } from '../../libs/utils';
import editDACIcon from '../../images/dac_icon.svg';
import backArrowIcon from '../../images/back_arrow.svg';
import { Spinner } from '../../components/Spinner';
import { Styles } from '../../libs/theme';

export const CHAIR = 'chair';
export const MEMBER = 'member';
const CHAIRPERSON = 'Chairperson';
const ADMIN = 'Admin';

export default function ManageEditDac(props) {
  const [state, setState] = useState({
    error: Models.error,
    dirtyFlag: false,
    dac: Models.dac,
    chairsSelectedOptions: [],
    chairIdsToAdd: [],
    chairIdsToRemove: [],
    membersSelectedOptions: [],
    memberIdsToAdd: [],
    memberIdsToRemove: [],
    searchInputChanged: false
  });
  const [isLoading, setIsLoading] = useState(true);
  // const [newDaaId, setNewDaaId] = useState(null);
  // const [selectedDaa, setSelectedDaa] = useState(null);
  // const [createdDaa, setCreatedDaa] = useState(null);
  // const [uploadedDAAFile, setUploadedDaaFile] = useState(null);
  // const [daaFileData, setDaaFileData] = useState(null);
  // const [showUploadModal, setShowUploadModal] = useState(false);
  const [fetchedDac, setFetchedDac] = useState(null);
  const dacId = props.match.params.dacId; // the existence of this can add as a flag for edit mode?
  // const [matchingDaas, setMatchingDaas] = useState([]);
  const dacText = dacId === undefined ? 'Create a new Data Access Committee in the system' : 'Manage My Data Access Committee';

  // don't want to do this if add dac
  useEffect(() => {
    const fetchData = async () => {
      if (dacId !== undefined) {
        try {
          const fetchedDac = await DAC.get(dacId);
          setFetchedDac(fetchedDac);
          setState(prev => ({ ...prev, dac: fetchedDac }));
        }
        catch(e) {
          Notifications.showError({text: 'Error: Unable to retrieve current DAC from server'});
        }
      }
    };
    fetchData();
    setIsLoading(false);
  }, [dacId, setState]);

  const okHandler = async (event) => {
    event.preventDefault();

    let currentDac = state.dac;
    if (state.dirtyFlag) {
      if (props.location.state.userRole === ADMIN) {
        if (dacId !== undefined) {
          await DAC.update(currentDac.dacId, currentDac.name, currentDac.description, currentDac.email);
        } else {
          currentDac = await DAC.create(currentDac.name, currentDac.description, currentDac.email);
          // if (daaFileData !== null) {
          //   if (daaFileData === true) {
          //     if (daaFileData === null) {
          //       handleErrors('Please upload a DAA file before saving.');
          //       return;
          //     }
          //     // i don't think we need an extra step here because it will get handled in ops5 ?
          //     currentDac = await DAC.create(currentDac.name, currentDac.description, currentDac.email);
          //   } else {
          //     // need to create the link between the DAA and the DAC --> new endpoint!!
          //     currentDac = await DAC.create(currentDac.name, currentDac.description, currentDac.email);
          //   }
          // } else {
          //   handleErrors('You must select a Data Access Agreement to govern access to your DAC\'s datasets.');
          //   return;
          // }
        }

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
        const errorCodes = ld.filter(responses, r => JSON.stringify(r) !== '200' && JSON.stringify(r.status) !== '201');
        if (!ld.isEmpty(errorCodes)) {
          handleErrors('There was an error saving DAC information. Please verify that the DAC is correct by viewing the current information.');
        } else {
          closeHandler();
        }
      } else {
        closeHandler();
      }
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
      <div className='container container-wide'>
        <div className='row no-margin'>
          <div className="left-header-section" style={Styles.LEFT_HEADER_SECTION}>
            <Link
              id="link_manage_dac"
              to="/manage_dac"
              className="navbar-brand"
              style={{paddingRight: '16px'}}
            >
              <img id="back-arrow-icon" src={backArrowIcon} style={{...Styles.HEADER_IMG, width: '30px'}} />
            </Link>
            <div style={Styles.ICON_CONTAINER}>
              <img id="edit-dac-icon" src={editDACIcon} style={Styles.HEADER_IMG} />
            </div>
            <div style={Styles.HEADER_CONTAINER}>
              <div className='common-color' style={{ fontFamily: 'Montserrat', fontSize: '1.4rem', textDecoration:'underline' }}>{dacText}</div>
              <div style={{ fontFamily: 'Montserrat', fontWeight: 600, fontSize: '2.8rem' }}>{dacId === undefined ? 'Create DAC' : fetchedDac?.name}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <form className="form-horizontal css-form" name="dacForm" noValidate encType="multipart/form-data"  style={{ width: '83.33%', maxWidth: '1200px' }}>
              <div style={{ display: 'flex', marginBottom: '15px' }}>
                <label id="lbl_dacName" style={{ flexBasis: '33.33%', paddingRight: '15px' }} className="control-label common-color">DAC Name</label>
                <div style={{ flexBasis: '66.67%', paddingLeft: '15px' }}>
                  <input
                    id="txt_dacName"
                    type="text"
                    defaultValue={state.dac.name}
                    onChange={handleChange}
                    name="name"
                    className="form-control vote-input"
                    required={true}
                    disabled={props.location.state.userRole === CHAIRPERSON}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', marginBottom: '15px' }}>
                <label id="lbl_dacDescription" style={{ flexBasis: '33.33%', paddingRight: '15px' }} className="control-label common-color">DAC Description</label>
                <div style={{ flexBasis: '66.67%', paddingLeft: '15px' }}>
                  <textarea
                    id="txt_dacDescription"
                    defaultValue={state.dac.description}
                    onChange={handleChange}
                    name="description"
                    className="form-control vote-input"
                    required={true}
                    disabled={props.location.state.userRole === CHAIRPERSON}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', marginBottom: '15px' }}>
                <label id="lbl_dacEmail" style={{ flexBasis: '33.33%', paddingRight: '15px' }} className="control-label common-color">DAC Email</label>
                <div style={{ flexBasis: '66.67%', paddingLeft: '15px' }}>
                  <input
                    id="txt_dacEmail"
                    type="text"
                    defaultValue={state.dac.email}
                    onChange={handleChange}
                    name="email"
                    className="form-control vote-input"
                    required={true}
                    disabled={props.location.state.userRole === CHAIRPERSON}
                  />
                </div>
              </div>
              {
                (state.dac.chairpersons.length > 0 || state.dac.members.length > 0) && <div style={{ display: 'flex', marginBottom: '15px' }}>
                  <label id="lbl_dacMembers" style={{ flexBasis: '33.33%', paddingRight: '15px' }} className="control-label common-color">DAC Members</label>
                  <div style={{ flexBasis: '66.67%', paddingLeft: '15px' }}>
                    <DacUsers
                      dac={state.dac}
                      removeButton={true}
                      removeHandler={removeDacMember}
                    />
                  </div>
                </div>
              }

              <div style={{ display: 'flex', marginBottom: '15px' }}>
                <label id="lbl_dacChair" style={{ flexBasis: '33.33%', paddingRight: '15px' }} className="control-label common-color">Add Chairperson(s)</label>
                <div style={{ flexBasis: '66.67%', paddingLeft: '15px' }}>
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
              <div style={{ display: 'flex', marginBottom: '15px' }}>
                <label id="lbl_dacMember" style={{ flexBasis: '33.33%', paddingRight: '15px' }} className="control-label common-color">Add Member(s)</label>
                <div style={state.searchInputChanged ? { paddingBottom: '10rem', flexBasis: '66.67%', paddingLeft: '15px' } : {flexBasis: '66.67%', paddingLeft: '15px' }}>
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
              <div className='inline-block' style={{paddingBottom: '20px'}}>
                <button
                  id='btn_save'
                  onClick={okHandler}
                  className='f-left btn-primary common-background'
                >
                    Save
                </button>
                <div style={{ marginLeft: '40px' }}>
                  <button
                    id='btn_cancel'
                    onClick={closeHandler}
                    className='f-left btn-secondary'
                  >
                   Cancel
                  </button>
                </div>
              </div>
            </form>
            {
              state.error.show && <div>
                <Alert id="modal" type="danger" title={state.error.title} description={this.state.error.msg} />
              </div>
            }
          </div>
        </div>
      </div>
  );
}