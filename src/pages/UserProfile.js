import {useState, useEffect} from 'react';
import {div, h, hr} from 'react-hyperscript-helpers';
import {PageHeading} from '../components/PageHeading';
import {Notification} from '../components/Notification';
import {FormField, FormFieldTypes, FormValidators} from '../components/forms/forms';
import {User} from '../libs/ajax';
import {NotificationService} from '../libs/notificationService';
import { Notifications} from '../libs/utils';

export default function ResearcherProfile(props) {
  const [profile, setProfile] = useState({
    profileName: '',
    email: undefined,
    id: undefined
  });

  const [notificationData, setNotificationData] = useState();

  useEffect(() => {
    const init = async () => {
      try {
        await getResearcherProfile();

        setNotificationData(await NotificationService.getBannerObjectById('eRACommonsOutage'));
      } catch (error) {
        Notifications.showError({text: 'Error: Unable to retrieve user data from server'});
      }
    };

    init();
  }, [props.history]);

  const getResearcherProfile = async () => {
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
      div({ className: 'row no-margin' }, [
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
        div({ className: 'col-md-10 col-md-offset-1 col-xs-12 no-padding' }, [
          h(FormField, {
            type: FormFieldTypes.TEXT,
            title: 'Full Name',
            validators: [FormValidators.REQUIRED],
            id: 'profileName',
            defaultValue: profile.profileName,
          }),
          div({ className: 'col-md-10 col-md-offset-1 col-xs-12 no-padding', style: { 'marginTop': '20px' } }, []),
          h(FormField, {
            type: FormFieldTypes.TEXT,
            validators: [FormValidators.REQUIRED],
            id: 'profileName',
            defaultValue: profile.email,
          }),
        ])
      ])
    ])
  );
}