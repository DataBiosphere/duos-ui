import React, {useCallback} from 'react';
import { useEffect, useState } from 'react';
import ERACommons from '../../components/ERACommons';
import { Notifications } from '../../libs/utils';
import { User } from '../../libs/ajax/User';
import { DAA } from '../../libs/ajax/DAA';
import { isNil } from 'lodash';
import LibraryCard from './LibraryCard';
import DAAs from './DAAs';
import { checkEnv, envGroups } from '../../utils/EnvironmentUtils';

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

  useEffect(() => {
    const init = async () => {
      try {
        if (!isNil(user) && !isNil(user.libraryCards)) {
          if (user.libraryCards.length === 0) {
            setHasCard(false);
          }
          else {
            const card = user.libraryCards[0];
            const daaIds = card.daaIds;
            const signingOfficialUsers = await User.getSOsForCurrentUser();
            setIssuedOn(card.createDate);
            const names = signingOfficialUsers.map(so => so.displayName);
            setIssuedBy(names.join(', '));

            const daaPromises = daaIds.map(id => DAA.getDaaById(id));
            const daaObjects = await Promise.all(daaPromises);
            setDaaObjects(daaObjects);
          }
        }
      } catch (error) {
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
      eRA Commons ID
    </p>
    <p>
      An&nbsp;
      <a href='https://www.era.nih.gov/register-accounts/understanding-era-commons-accounts.htm'>
        eRA Commons ID
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
      (checkEnv(envGroups.DEV) ?
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