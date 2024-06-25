import React, { useState } from 'react';
import { Button } from '@mui/material';
import { DownloadLink } from '../../components/DownloadLink';
import { DAA } from '../../libs/ajax/DAA';
import { Notifications } from '../../libs/utils';

export default function ManageDaasDropdown(props) {
  const [applyAll, setApplyAll] = useState(null);
  const {actionsTitle, download, moreData, researchers, refreshResearchers, setResearchers} = props;

  const handleApplyAllChange = (event) => {
    setApplyAll(event.target.checked);
  };

  const handleRemoveAllChange = (event) => {
    setApplyAll(!event.target.checked);
  };

  const addUsersToDaa = async (userList) => {
    try {
      await DAA.bulkAddUsersToDaa(moreData.id, userList);
      Notifications.showSuccess({text: `Approved all users access to request from: ${moreData.name}`});
      refreshResearchers(setResearchers);
    } catch(error) {
      Notifications.showError({text: `Error approving all users access to request from: ${moreData.name}`});
    }
  };

  const removeUsersFromDaa = async (userList) => {
    try {
      await DAA.bulkRemoveUsersFromDaa(moreData.id, userList);
      Notifications.showSuccess({text: `Removed all users' approval to request from: ${moreData.name}`});
      refreshResearchers(setResearchers);
    } catch(error) {
      Notifications.showError({text: `Error removing all users' approval to request from: ${moreData.name}`});
    }
  };

  const handleApplyAll = async () => {
    const userList = { 'users': researchers.map(researcher => researcher.userId) };
    if (applyAll) {
      addUsersToDaa(userList);
    } else {
      removeUsersFromDaa(userList);
    }
  };

  const ConditionalDownloadLink = ({ id, fileName }) => {
    if (id === 0 && fileName === '') {
      return (
        <DownloadLink
          label={`Download agreement`}
          onDownload={() => {DAA.getDaaFileById(17, 'DUOS Uniform Data Access Agreement');}}
        />
      );
    }
    return (
      <DownloadLink
        label={`Download agreement`}
        onDownload={() => {DAA.getDaaFileById(id, fileName);}}
      />
    );
  };

  return (
    <ul className="dropdown-menu" role="menu" style={{ padding: '20px', textTransform:'none'}}>
      <div id="link_signOut" style={{display:'flex', padding: '5px', textAlign: 'left'}}>
        <strong>{actionsTitle}</strong>
      </div>
      <form>
        <li style={{paddingTop: '5px', paddingBottom: '5px'}}>
          <ConditionalDownloadLink id={download.id} fileName={download.fileName} />
        </li>
        <li style={{paddingTop: '5px', paddingBottom: '5px'}}>
          <label style={{fontWeight: 'normal', whiteSpace: 'nowrap'}}>
            <input type="radio" name="daa" value="apply" checked={applyAll === true} onChange={handleApplyAllChange}/>
            &nbsp;&nbsp;Apply agreement to all users
          </label>
        </li>
        <li style={{paddingTop: '5px', paddingBottom: '5px'}}>
          <label style={{fontWeight: 'normal', whiteSpace: 'nowrap' }}>
            <input type="radio" name="daa"  value="remove" checked={applyAll === false} onChange={handleRemoveAllChange}/>
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
