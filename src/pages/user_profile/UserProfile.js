import React, { useState, useEffect } from 'react';
import { FormField, FormFieldTypes } from '../../components/forms/forms';
import { PageHeading } from '../../components/PageHeading';
import { Notification } from '../../components/Notification';
import { Institution } from '../../libs/ajax';
import { Storage } from '../../libs/storage';
import { NotificationService } from '../../libs/notificationService';
import { Notifications, getPropertyValuesFromUser } from '../../libs/utils';
import AffiliationAndRoles from './AffiliationAndRoles';
import ResearcherStatus from './ResearcherStatus';
import AcceptedAcknowledgements from './AcceptedAcknowledgements';
import ControlledAccessGrants from './ControlledAccessGrants';
import ga4ghLogo from '../../images/ga4gh-logo.png';
import userProfileIcon from '../../images/user-profile.png';

export default function UserProfile(props) {

  const [user, setUser] = useState({});
  const [userProps, setUserProps] = useState({});
  const [institutions, setInstitutions] = useState([]);

  const [profile, setProfile] = useState({
    profileName: '',
    email: undefined,
    id: undefined
  });

  const [notificationData, setNotificationData] = useState({});

  useEffect(() => {
    const init = async () => {
      try {
        const user = Storage.getCurrentUser();
        setUser(user);
        setUserProps(getPropertyValuesFromUser(user));
        setProfile({
          profileName: user.displayName,
          email: user.email,
          id: user.userId
        });
        const institutions = await Institution.list();
        setInstitutions(institutions);
        setNotificationData(await NotificationService.getBannerObjectById('eRACommonsOutage'));
      } catch (error) {
        Notifications.showError({ text: 'Error: Unable to retrieve user data from server' });
      }
    };

    init();
  }, []);

  const goToRequestRole = () => {
    props.history.push({
      pathname: '/request_role',
      state: { data: profile }
    });
  };

  return <div
    style={{
      flexDirection: 'column',
      padding: '50px 275px 70px'
    }}
  >
    <div className='header'>
      <Notification>
        {notificationData}
      </Notification>
      <div
        style={{
          flexDirection: 'column'
        }}
      >
        <div
          style={{
            marginBottom: '40px'
          }}
        >
          <PageHeading
            id='researcherProfile'
            color='common'
            title='Your Profile'
            descriptionStyle={{fontSize: '10000px'}}
            style={{
              float: 'left',
            }}
            imgSrc={userProfileIcon}
            iconSize='large'
          />
        </div>
        <div
          style={{
            display: 'flex'
          }}
        >
          <img
            src={ga4ghLogo}
            style={{
              width: '166px',
              height: '48px',
              top: '213px',
              left: '230px',
              marginRight: '50px'
            }}
          />
          <p>
            DUOS user profile components are based off of the GA4GH Passports specification Visa types. More information on the GA4GH Passports standard can be found&nbsp;
            <a href='https://github.com/ga4gh-duri/ga4gh-duri.github.io/blob/master/researcher_ids/ga4gh_passport_v1.md'>
              here.
            </a>
          </p>
        </div>
      </div>
      <hr className='section-separator' />
    </div>
    <h1
      style={{
        color: '#01549F',
        fontSize: '20px',
        fontWeight: '600',
        marginBottom: '15px',
        marginTop: '40px'
      }}
    >
      Full Name
    </h1>
    <h>
      <FormField
        type={FormFieldTypes.TEXT}
        id='profileName'
        defaultValue={profile.profileName}
        disabled={true}
      />
    </h>
    <div style={{ marginTop: '10px' }} />
    <h>
      <FormField
        type={FormFieldTypes.TEXT}
        id='profileEmail'
        defaultValue={profile.email}
        disabled={true}
      />
    </h>
    <div style={{ marginTop: '60px' }} />
    <div style={{ 'marginTop': '60px' }} />
    <ControlledAccessGrants />
    <div style={{ 'marginTop': '60px' }} />
    <AffiliationAndRoles
      user={user}
      userProps={userProps}
      institutions={institutions}
    />
    <button
      className='f-left btn-primary common-background'
      onClick={goToRequestRole}
      style={{
        marginTop: '10px',
        marginBottom: '50px'
      }}
    >
      Request a New Role
    </button>
    <div style={{ marginTop: '115px' }} />
    <ResearcherStatus
      user={user}
      pageProps={props}
      profile={profile}
    />
    <div style={{ marginTop: '115px' }} />
    <AcceptedAcknowledgements />
  </div>;
}
