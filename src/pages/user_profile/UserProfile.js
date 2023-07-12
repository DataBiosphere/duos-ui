import {useState, useEffect} from 'react';
import {div, h1, hr} from 'react-hyperscript-helpers';
import {PageHeading} from '../../components/PageHeading';
import {Notification} from '../../components/Notification';
import {User} from '../../libs/ajax';
import {NotificationService} from '../../libs/notificationService';
import { Notifications} from '../../libs/utils';

export default function UserProfile() {
  const [profile, setProfile] = useState({
    profileName: '',
    email: undefined,
    id: undefined
  });

  const [notificationData, setNotificationData] = useState();

  useEffect(() => {
    const init = async () => {
      try {
        await getUserProfile();

        setNotificationData(await NotificationService.getBannerObjectById('eRACommonsOutage'));
      } catch (error) {
        Notifications.showError({text: 'Error: Unable to retrieve user data from server'});
      }
    };

    init();
  }, []);

  const getUserProfile = async () => {
    const user = await User.getMe();

    setProfile({
      profileName: user.displayName,
      email: user.email,
      id: user.userId
    });
  };

  return (
    div({
      className: 'container',
      style: {
        color: '#333F52',
      },
    }, [
      div({ className: 'row no-margin'}, [
        div({ className: 'col-md-10 col-md-offset-1 col-sm-12 col-xs-12' }, [
          Notification({notificationData}),
          PageHeading({
            id: 'researcherProfile',
            color: 'common',
            title: 'Your Profile',
            description: 'Please complete the form below to start using DUOS.'
          }),
          hr({ className: 'section-separator' })
        ]),
        div({
          className: 'col-md-10 col-md-offset-1 col-xs-12 no-padding',
          style: {
            fontFamily: 'Montserrat',
          } }, [
          h1({style: {
            color: '#01549F',
            fontSize: '20px',
            fontWeight: '600',
          } }, ['Full Name:']),
          div({ className: '', style: { 'marginTop': '10px' } }, []),
          div({ style: {
            width: '981px',
            height: '40px',
            borderRadius: '4px',
            border: '1px solid #ABABAB',
            background: '#F0F0F0',
            fontSize: '16px',
            fontWeight: '400',
            paddingLeft: '21.54px',
            paddingTop: '7.5px',

          } }, [profile.profileName]),
          div({ className: '', style: { 'marginTop': '10px' } }, []),
          div({ style: {
            width: '981px',
            height: '40px',
            borderRadius: '4px',
            border: '1px solid #ABABAB',
            background: '#F0F0F0',
            fontSize: '16px',
            fontWeight: '400',
            paddingLeft: '21.54px',
            paddingTop: '7.5px',

          } }, [profile.email]),
        ])
      ])
    ])
  );
}