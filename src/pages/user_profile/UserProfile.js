import {useState, useEffect} from 'react';
import {div, h, h1, hr, form, p, label, h2, button, a} from 'react-hyperscript-helpers';
import {FormField, FormFieldTypes} from '../../components/forms/forms';
import {PageHeading} from '../../components/PageHeading';
import {Notification} from '../../components/Notification';
import ControlledAccessGrants from './ControlledAccessGrants';
import AffilliationAndRoles from './AffiliationAndRoles';
import {User} from '../../libs/ajax';
import { Storage } from '../../libs/storage';
import {NotificationService} from '../../libs/notificationService';
import { Notifications, getPropertyValuesFromUser } from '../../libs/utils';

export default function UserProfile() {

  const [user, setUser] = useState({});
  const [userProps, setUserProps] = useState({});
  
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
    const currentUser = await Storage.getCurrentUser()
    setUser(currentUser)
    const currentUserProps = getPropertyValuesFromUser(user)
    
    setUserProps(currentUserProps)
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
          form({
            name: 'researcherForm',
            onKeyDown: (e) => {
              if (e.key == 'Enter') {
                e.preventDefault();
              }
            }
          }, [
            div({ className: 'form-group' }, [
              div({ className: 'col-xs-12' }, [
                h1({style: {
                  color: '#01549F',
                  fontSize: '20px',
                  fontWeight: '600',
                  marginBottom: '15px'
                } }, ['Full Name']),
                h(FormField, {
                  type: FormFieldTypes.TEXT,
                  id: 'profileName',
                  defaultValue: profile.profileName,
                  readOnly: true,
                }),
                div({ className: 'col-xs-12', style: { 'marginTop': '15px' } }, []),
                h(FormField, {
                  type: FormFieldTypes.TEXT,
                  id: 'profileEmail',
                  defaultValue: profile.email,
                  readOnly: true,
                }),
              ]),
            ]),
            div({ className: 'flex' }, [

              div({ className: 'col-xs-12', style: { 'marginTop': '20px' } }, [
                AffilliationAndRoles({
                  user: Storage.getCurrentUser(),
                  userProps: getPropertyValuesFromUser(Storage.getCurrentUser())
                }),
              ]),


            ]),
          ])
        ])
      ])
    ])
  );
}