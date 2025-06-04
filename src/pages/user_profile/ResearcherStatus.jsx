import React, {useCallback, useEffect, useState} from 'react';
import ERACommons from '../../components/ERACommons';
import {Notifications} from '../../libs/utils';
import {User} from '../../libs/ajax/User';
import {DAA} from '../../libs/ajax/DAA';
import {isNil} from 'lodash';
import LibraryCard from './LibraryCard';
import DAAs from './DAAs';
import {DAAUtils} from '../../utils/DAAUtils';
import {nihAccountInstructions, nihAccountLabel} from '../../utils/ERACommonsUtils.js';

export default function ResearcherStatus(props) {

  const {
    user,
    pageProps,
  } = props;

  const [issuedOn, setIssuedOn] = useState('');
  const [issuedBy, setIssuedBy] = useState('');
  const [hasCard, setHasCard] = useState(true);
  const [daaObjects, setDaaObjects] = useState([]);
  const nihStatusUpdate = useCallback(() => {}, []);
  const accountLabel = nihAccountLabel();
  const accountLink = nihAccountInstructions();

  useEffect(() => {
    const init = async () => {
      try {
        if (!isNil(user)) {
          if (isNil(user.libraryCard)) {
            setHasCard(false);
          } else {
            setHasCard(true);
            const card = user.libraryCard;
            const daaIds = card.daaIds;
            const signingOfficialUsers = await User.getSOsForCurrentUser();
            setIssuedOn(new Date(card.createDate).toISOString().slice(0, 10));
            const createUser = signingOfficialUsers.find(so => so.userId === card.createUserId);
            if (createUser) {
              setIssuedBy(createUser.displayName);
            } else {
              const names = signingOfficialUsers.map(so => so.displayName);
              setIssuedBy(names.join(', '));
            }

            const daaPromises = daaIds.map(id => DAA.getDaaById(id));
            const daaObjects = await Promise.all(daaPromises);
            setDaaObjects(daaObjects);
          }
        }
      } catch (_error) {
        Notifications.showError({ text: 'Error: Unable to retrieve user data from server' });
      }
    };
    init();
  }, [user]);

  return <div>
    <h1
      style={{
        color: '#01549F',
        fontSize: '20px',
        fontWeight: '600',
      }} >
      Researcher Status
    </h1>
    <div style={{ marginTop: '20px' }} />
    <p
      style={{
        color: '#000',
        fontFamily: 'Montserrat',
        fontSize: '16px',
        fontStyle: 'normal',
        fontWeight: '600',
        lineHeight: 'normal'
      }} >
      {accountLabel} Account
    </p>
    <p>
      A&nbsp;
      <a href={accountLink}>
        {accountLabel} Account
      </a>
      &nbsp;is required to submit a dar.
    </p>
    {ERACommons({
      destination: 'profile',
      onNihStatusUpdate: nihStatusUpdate,
      location: pageProps.location,
      header: false
    })}
    <div style={{ marginTop: '20px' }} />
    <p
      style={{
        color: '#000',
        fontFamily: 'Montserrat',
        fontSize: '16px',
        fontStyle: 'normal',
        fontWeight: '600',
        lineHeight: 'normal'
      }} >
      Library Cards issued to you
    </p>
    <div style={{ marginTop: '15px' }} />
    {hasCard ?
      (DAAUtils.isEnabled() ?
        (
          <DAAs
            issuedOn={issuedOn}
            issuedBy={issuedBy}
            daas={daaObjects}/>
        ) :
        (
          <LibraryCard
            issuedOn={issuedOn}
            issuedBy={issuedBy}
            daas={daaObjects}/>
        )) : (
        <div>
          <p>No Library Card Found</p>
          <p style={{
            marginTop: '10px',
            marginBottom:'50px'
          }}>You must have a Library Card to submit a data access request. To obtain one, your Institutional Signing Official must register in DUOS, request and receive Signing Official permissions, and issue you a Library Card.</p>
        </div>
      )}
  </div>;
}