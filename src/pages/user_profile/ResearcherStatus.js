import React, { useEffect, useState } from 'react';
import { eRACommons } from '../../components/eRACommons';
import { Notifications } from '../../libs/utils';
import { User } from '../../libs/ajax';
import { isNil } from 'lodash';
import LibraryCard from './LibraryCard'

export default function ResearcherStatus(props) {

  const {
    user,
    pageProps,
    profile
  } = props;

  const [issuedOn, setIssuedOn] = useState("");
  const [issuedBy, setIssuedBy] = useState("");
  const [hasCard, setHasCard] = useState(true)

  const goToRequestRole = () => {
    pageProps.history.push({
      pathname: '/request_role',
      state: { data: profile }
    });
  };

  useEffect(() => {
    const init = async () => {
      try {
        const cards = [];
        if (!isNil(user) && !isNil(user.libraryCards)) {
          if (user.libraryCards.length == 0) {
            setHasCard(false);
          }
          else {
            const signingOfficialUser = await User.getById(user.libraryCards[0].institution.createUserId);
            setIssuedOn(user.libraryCards[0].createDate);
            setIssuedBy(signingOfficialUser.displayName)
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
      }}
    >
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
      }}>
      eRA Commons ID
    </p>
    <p>
      An&nbsp;
      <a href='https://www.era.nih.gov/register-accounts/understanding-era-commons-accounts.htm'>
        eRA Commons ID
      </a>
      &nbsp;is required to submit a dar.
    </p>
    {eRACommons({
      destination: 'profile',
      onNihStatusUpdate: () => { },
      location: pageProps.location,
      header: false
    })}
    <div style={{ marginTop: '10px' }} />
    <p
      style={{
        color: '#000',
        fontFamily: 'Montserrat',
        fontSize: '16px',
        fontStyle: 'normal',
        fontWeight: '600',
        lineHeight: 'normal'
      }}>
      Library Card
    </p>
    <div style={{ marginTop: '15px' }} />
    {hasCard ? (
      <LibraryCard
        issuedOn={issuedOn}
        issuedBy={issuedBy} />
    ) : (
      <div>
        <p>No Library Card Found</p>
        <button
          className='f-left btn-primary common-background'
          onClick={goToRequestRole}
          style={{
            marginTop: '10px',
            marginBottom: '50px'
          }}>
          Sign Up For a Library Card
        </button>
      </div>
    )}
  </div>;
}