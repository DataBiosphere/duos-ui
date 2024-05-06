import React, { useState } from 'react';
import { Button } from '@mui/material';
import { DAA } from '../../libs/ajax/DAA';
import { Notifications } from '../../libs/utils';

export default function ManageUsersDropdown(props) {
  const [applyAll, setApplyAll] = useState(false);
  const [removeAll, setRemoveAll] = useState(false);
  const {daas, refreshResearchers, setResearchers, moreData} = props;

  const handleApplyAllChange = (event) => {
    setApplyAll(event.target.checked);
    setRemoveAll(!event.target.checked);
  };

  const handleRemoveAllChange = (event) => {
    setRemoveAll(event.target.checked);
    setApplyAll(!event.target.checked);
  };

  const handleApplyAll = async () => {
    const daaList = { 'daaList': daas.map(daa => daa.daaId) };
    if (applyAll) {
      try {
        await DAA.bulkAddDaasToUser(moreData.id, daaList);
        Notifications.showSuccess({text: `Approved access to request data from all DACs to user: ${moreData.name}`});
        refreshResearchers(setResearchers);
      } catch(error) {
        Notifications.showError({text: `Error approving access to request data from all DACs to user: ${moreData.name}`});
      }
    } else if (removeAll) {
      try {
        await DAA.bulkRemoveDaasFromUser(moreData.id, daaList);
        Notifications.showSuccess({text: `Removed approval of access to request data from all DACs from user: ${moreData.name}`});
        refreshResearchers(setResearchers);
      } catch(error) {
        Notifications.showError({text: `Error removing approval of access to request data from all DACs from user: ${moreData.name}`});
      }
    }
  };

  return (
    <ul className="dropdown-menu" role="menu" style={{ padding: '20px', textTransform:'none'}}>
      <th id="link_signOut" style={{display:'flex', padding: '5px', textAlign: 'left'}}>
        <strong>Agreement Actions</strong>
      </th>
      <form>
        <li style={{paddingTop: '5px', paddingBottom: '5px'}}>
          <label style={{fontWeight: 'normal', whiteSpace: 'nowrap'}}>
            <input type="radio" name="users" value="apply" checked={applyAll} onChange={handleApplyAllChange}/>
            &nbsp;&nbsp;Apply all agreements to this user
          </label>
        </li>
        <li style={{paddingTop: '5px', paddingBottom: '5px'}}>
          <label style={{fontWeight: 'normal', whiteSpace: 'nowrap' }}>
            <input type="radio" name="users" value="remove" checked={removeAll} onChange={handleRemoveAllChange}/>
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
        }} onClick={() => handleApplyAll()}>Apply</Button>
      </li>
    </ul>
  );
}