import { useState, useEffect } from 'react';
import { div, h, h1, hr, button } from 'react-hyperscript-helpers';
import { FormField, FormFieldTypes } from '../../components/forms/forms';
import { PageHeading } from '../../components/PageHeading';
import { Notification } from '../../components/Notification';
import AffiliationAndRoles from './AffiliationAndRoles';
import ResearcherStatus from './ResearcherStatus';
import AcceptedAcknowledgements from './AcceptedAcknowledgements';
import { Institution } from '../../libs/ajax';
import { Storage } from '../../libs/storage';
import { NotificationService } from '../../libs/notificationService';
import { Notifications, getPropertyValuesFromUser } from '../../libs/utils';

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

  return div({
    className: '',
    style: {
      flexDirection: 'column',
      padding: '20px 240px 20px'
    }
  }, [
    div({ className: '' }, [
      Notification({ notificationData }),
      PageHeading({
        id: 'researcherProfile',
        color: 'common',
        title: 'Your Profile',
        description: 'Please complete the form below to start using DUOS.'
      }),
      hr({ className: 'section-separator' })
    ]),
    h1({
      style: {
        color: '#01549F',
        fontSize: '20px',
        fontWeight: '600',
        marginBottom: '15px',
        marginTop: '40px'
      }
    }, ['Full Name']),
    h(FormField, {
      type: FormFieldTypes.TEXT,
      id: 'profileName',
      defaultValue: profile.profileName,
      readOnly: true,
    }),
    div({ className: '', style: { 'marginTop': '10px' } }, []),
    h(FormField, {
      type: FormFieldTypes.TEXT,
      id: 'profileEmail',
      defaultValue: profile.email,
      readOnly: true,
    }),
    div({ className: '', style: { 'marginTop': '60px' } }, []),
    AffiliationAndRoles({
      user: user,
      userProps: userProps,
      institutions: institutions
    }),
    button({
      className: 'f-left btn-primary common-background',
      onClick: goToRequestRole,
      style: {
        marginTop: '10px',
        marginBottom: '50px'
      },
    }, ['Request a New Role']),
    div({ className: '', style: { 'marginTop': '115px' } }, []),
    ResearcherStatus({
      user: user,
      pageProps: props,
      profile: profile
    }),
    div({ className: '', style: { 'marginTop': '115px' } }, []),
    AcceptedAcknowledgements(),
    div({ className: '', style: { 'marginTop': '50px' } }, []),
  ]);

}
