import {useState, useEffect} from 'react';
import {div, h, h1, hr} from 'react-hyperscript-helpers';
import {FormField, FormFieldTypes} from '../../components/forms/forms';
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
          h(FormField, {
            id: 'profileName',
            type: FormFieldTypes.TEXT,
            defaultValue: profile.profileName,
            readOnly: true,
          }),
          div({ className: '', style: { 'marginTop': '10px' } }, []),
          h(FormField, {
            id: 'profileEmail',
            type: FormFieldTypes.TEXT,
            defaultValue: profile.email,
            readOnly: true,
          }),
        ])
      ])
    ])
  );
}