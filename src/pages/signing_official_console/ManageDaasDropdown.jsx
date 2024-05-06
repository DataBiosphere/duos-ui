import React, { useState } from 'react';
import { Button } from '@mui/material';
import { DownloadLink } from '../../components/DownloadLink';
import { DAA } from '../../libs/ajax/DAA';
import { Notifications } from '../../libs/utils';

export default function ManageDaasDropdown(props) {
  const [applyAll, setApplyAll] = useState(false);
  const [removeAll, setRemoveAll] = useState(false);
  const {actionsTitle, download, moreData, researchers, refreshResearchers, setResearchers} = props;

  const handleApplyAllChange = (event) => {
    setApplyAll(event.target.checked);
    setRemoveAll(!event.target.checked);
  };

  const handleRemoveAllChange = (event) => {
    setRemoveAll(event.target.checked);
    setApplyAll(!event.target.checked);
  };

  const handleApplyAll = async () => {
    const userList = { 'users': researchers.map(researcher => researcher.userId) };
    if (applyAll) {
      try {
        await DAA.bulkAddUsersToDaa(moreData.id, userList);
        Notifications.showSuccess({text: `Approved all users access to request from: ${moreData.name}`});
        refreshResearchers(setResearchers);
      } catch(error) {
        Notifications.showError({text: `Error approving all users access to request from: ${moreData.name}`});
      }
    } else if (removeAll) {
      try {
        await DAA.bulkRemoveUsersFromDaa(moreData.id, userList);
        Notifications.showSuccess({text: `Removed all users' approval to request from: ${moreData.name}`});
        refreshResearchers(setResearchers);
      } catch(error) {
        Notifications.showError({text: `Error removing all users' approval to request from: ${moreData.name}`});
      }
    }
  };

  return (
    <ul className="dropdown-menu" role="menu" style={{ padding: '20px', textTransform:'none'}}>
      <th id="link_signOut" style={{display:'flex', padding: '5px', textAlign: 'left'}}>
        <strong>{actionsTitle}</strong>
      </th>
      <form>
        <li style={{paddingTop: '5px', paddingBottom: '5px'}}>
          <DownloadLink label={`Download agreement`} onDownload={() => {DAA.getDaaFileById(download.id, download.fileName);}}/>
        </li>
        <li style={{paddingTop: '5px', paddingBottom: '5px'}}>
          <label style={{fontWeight: 'normal', whiteSpace: 'nowrap'}}>
            <input type="radio" name="daa" value="apply" checked={applyAll} onChange={handleApplyAllChange}/>
            &nbsp;&nbsp;Apply agreement to all users
          </label>
        </li>
        <li style={{paddingTop: '5px', paddingBottom: '5px'}}>
          <label style={{fontWeight: 'normal', whiteSpace: 'nowrap' }}>
            <input type="radio" name="daa"  value="remove" checked={removeAll} onChange={handleRemoveAllChange}/>
            &nbsp;&nbsp;Remove agreement from all users
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
