import React, {useState} from 'react';
import ManageUsersDropdown from './ManageUsersDropdown';

export default function DisplayNameCell(props) {
  const {displayName, email, id, daas, setResearchers, refreshResearchers} = props;
  const [visible, setVisible] = useState(false);

  return <>
    <li className="dropdown" style={{listStyleType: 'none'}}>
      <div role="button" data-toggle="dropdown" onClick={() => setVisible(!visible)} >
        <div id="dacUser" style={{color: 'black'}}>
          {displayName || 'Invite sent, pending registration'}
          <span className="caret caret-margin" style={{color: '#337ab7', float: 'right', marginTop: '15px'}}></span>
          <br/>
          <small><a href={`mailto:${email}`}>{email || '- -'}</a></small>
        </div>
      </div>
      <div style={{display: (visible ? 'block' : 'none')}}>
        <ManageUsersDropdown daas={daas} refreshResearchers={refreshResearchers} setResearchers={setResearchers} moreData={{id: id, name: displayName}}/>
      </div>
    </li>
  </>;
}
