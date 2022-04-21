import {isEmpty, isNil} from 'lodash/fp';
import {useEffect, useState, useCallback} from 'react';
import GoogleLogin from 'react-google-login';
import {button, div, h, img, span} from 'react-hyperscript-helpers';
import {Alert} from './Alert';
import {User} from '../libs/ajax';
import {Config} from '../libs/config';
import {Storage} from '../libs/storage';
import {Navigation, setUserRoleStatuses} from '../libs/utils';
import loadingIndicator from '../images/loading-indicator.svg';
import {Spinner} from './Spinner';

export default function SignIn(props) {

  const [clientId, setClientId] = useState('');
  const [errorDisplay, setErrorDisplay] = useState({});
  const {onSignIn, history, customStyle} = props;

  useEffect(() => {
    // Using `isSubscribed` resolves the
    // "To fix, cancel all subscriptions and asynchronous tasks in a useEffect cleanup function." warning
    let isSubscribed = true;
    const init = async () => {
      if (isSubscribed) {
        setClientId(`${await Config.getGoogleClientId()}`);
      }
    };
    init();
    return () => (isSubscribed = false);
  }, []);

  const onSuccess = async (response) => {
    Storage.setGoogleData(response);
    try {
      const user = await User.getMe();
      setUserRoleStatuses(user, Storage);
      await onSignIn();
      redirect(user);
    } catch (error) {
      try {
        // New users without an existing account will error out in the above call
        // Register them and redirect them to the profile page.
        const registeredUser = await User.registerUser();
        setUserRoleStatuses(registeredUser, Storage);
        onSignIn();
        history.push('/profile');
      } catch (error) {
        // Handle common error cases
        try {
          const status = error.status;
          switch (status) {
            case 400:
              setErrorDisplay({show: true, title: 'Error', msg: JSON.stringify(error)});
              break;
            case 409:
              try {
                let user = await User.getMe();
                user = setUserRoleStatuses(user, Storage);
                redirect(user);
              } catch (error) {
                Storage.clearStorage();
              }
              break;
            default:
              setErrorDisplay({show: true, title: 'Error', msg: 'Unexpected error, please try again'});
              break;
          }
        } catch (error) {
          setErrorDisplay({show: true, title: 'Error', msg: JSON.stringify(error)});
        }
      }
    }
  };

  const onFailure = (response) => {
    Storage.clearStorage();
    if (response.error === 'popup_closed_by_user') {
      setErrorDisplay({
        description: span({}, ['Sign-in cancelled ... ', img({height: '20px', src: loadingIndicator})])
      });
      setTimeout(() => {
        setErrorDisplay({});
      }, 2000);
    } else {
      setErrorDisplay({'title': response.error, 'description': response.details});
    }
  };

  const redirect = useCallback( (user) => {
    Navigation.back(user, history);
  }, [history]);

  const spinnerOrSigninButton = () => {
    const disabled = clientId === '';
    const defaultProps = {
      buttonText: 'Sign-in/Register',
      scope: 'openid email profile',
      height: '44px',
      width: '180px',
      theme: 'dark',
      clientId: clientId,
      onSuccess: onSuccess,
      onFailure: onFailure,
      disabledStyle: {'opacity': '25%', 'cursor': 'not-allowed'}
    };
    return disabled ?
      Spinner :
      h(GoogleLogin,
        isNil(customStyle) ? defaultProps : {
          render: (props) => button({
            className: 'btn-primary',
            onClick: props.onClick,
            style: customStyle
          }, 'Submit a Data Access Request'),
          ...defaultProps
        });
  };

  return (
    div({}, [
      div({isRendered: !isEmpty(errorDisplay), className: 'dialog-alert'}, [
        Alert({
          id: 'dialog',
          type: 'danger',
          title: errorDisplay.title,
          description: errorDisplay.description
        })
      ]),
      div({isRendered: isEmpty(errorDisplay)}, [spinnerOrSigninButton()])
    ])
  );
}

