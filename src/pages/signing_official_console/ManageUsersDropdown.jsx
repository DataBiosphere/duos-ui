import React, { useState } from 'react';
import { Button } from '@mui/material';
import { DAA } from '../../libs/ajax/DAA';
import { Notifications } from '../../libs/utils';

export default function ManageUsersDropdown(props) {
  const [applyAll, setApplyAll] = useState(null);
  const {daas, refreshResearchers, setResearchers, moreData} = props;

  const handleApplyAllChange = (event) => {
    setApplyAll(event.target.checked);
  };

  const handleRemoveAllChange = (event) => {
    setApplyAll(!event.target.checked);
  };

  const addDaasToUser = async (daaList) => {
    try {
      await DAA.bulkAddDaasToUser(moreData.id, daaList);
      Notifications.showSuccess({text: `Approved access to request data from all DACs to user: ${moreData.name}`});
      refreshResearchers(setResearchers);
    } catch(error) {
      Notifications.showError({text: `Error approving access to request data from all DACs to user: ${moreData.name}`});
    }
  };

  const removeDaasFromUser = async (daaList) => {
    try {
      await DAA.bulkRemoveDaasFromUser(moreData.id, daaList);
      Notifications.showSuccess({text: `Removed approval of access to request data from all DACs from user: ${moreData.name}`});
      refreshResearchers(setResearchers);
    } catch(error) {
      Notifications.showError({text: `Error removing approval of access to request data from all DACs from user: ${moreData.name}`});
    }
  };

  const handleApplyAll = async () => {
    const daaList = { 'daaList': daas.map(daa => daa.daaId) };
    if (applyAll) {
      addDaasToUser(daaList);
    } else {
      removeDaasFromUser(daaList);
    }
  };

  return (
    <ul className="dropdown-menu" role="menu" style={{ display: 'block', padding: '20px', textTransform:'none'}}>
      <div id="link_signOut" style={{display:'flex', padding: '5px', textAlign: 'left'}}>
        <strong>Agreement Actions</strong>
      </div>
      <form>
        <li style={{paddingTop: '5px', paddingBottom: '5px'}}>
          <label style={{fontWeight: 'normal', whiteSpace: 'nowrap'}}>
            <input type="radio" name="users" value="apply" checked={applyAll === true} onChange={handleApplyAllChange}/>
            &nbsp;&nbsp;Apply all agreements to this user
          </label>
        </li>
        <li style={{paddingTop: '5px', paddingBottom: '5px'}}>
          <label style={{fontWeight: 'normal', whiteSpace: 'nowrap' }}>
            <input type="radio" name="users" value="remove" checked={applyAll === false} onChange={handleRemoveAllChange}/>
            &nbsp;&nbsp;Remove all agreements from this user
          </label>
        </li>
      </form>
      <li style={{paddingTop: '5px', paddingBottom: '5px'}}>
        <Button style={{
          fontSize: '15px',
          fontWeight: 'normal',
          fontFamily: 'Montserrat',
          border: '1px solid #0948B7',
          borderRadius: '5px',
          height: '40px',
          marginRight: '1em',
          cursor: 'pointer',
          color: '#0948B7',
          padding: '10px 20px',
          textTransform: 'none'
        }} onClick={() => handleApplyAll()}
        disabled={!applyAll && applyAll}>Apply</Button>
      </li>
    </ul>
  );
}