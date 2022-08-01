import {isEmpty, isNil} from 'lodash/fp';
import {useEffect, useState, useCallback} from 'react';
import GoogleLogin from 'react-google-login';
import {a, button, div, h, img, span} from 'react-hyperscript-helpers';
import {Alert} from './Alert';
import {ToS, User} from '../libs/ajax';
import {Config} from '../libs/config';
import {Storage} from '../libs/storage';
import {Navigation, setUserRoleStatuses, researcherProfileComplete} from '../libs/utils';
import loadingIndicator from '../images/loading-indicator.svg';
import {Spinner} from './Spinner';
import ReactTooltip from 'react-tooltip';

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
      ReactTooltip.rebuild();
    };
    init();
    return () => (isSubscribed = false);
  }, []);

  // Utility function called in the normal success case and in the undocumented 409 case
  // Check for ToS Acceptance - redirect user if not set.
  const checkToSAndRedirect = async () => {
    // Check if the user has accepted ToS yet or not:
    const user = await User.getMe();
    setUserRoleStatuses(user, Storage);
    await onSignIn();
    const userStatus = await ToS.getStatus();
    const {tosAccepted} = userStatus;
    if (!isEmpty(userStatus) && !tosAccepted) {
      await Storage.setUserIsLogged(false);
      history.push('/tos_acceptance');
      return;
    }

    const {isResearcher} = Storage.getCurrentUser();
    if (isResearcher && !researcherProfileComplete(user)) {
      history.push('/profile');
      return;
    }
    redirect(user);
  };

  const onSuccess = async (response) => {
    Storage.setGoogleData(response);
    try {
      await checkToSAndRedirect();
    } catch (error) {
      try {
        // New users without an existing account will error out in the above call
        // Register them and redirect them to the ToS Acceptance page.
        const registeredUser = await User.registerUser();
        setUserRoleStatuses(registeredUser, Storage);
        await onSignIn();
        history.push('/tos_acceptance');
      } catch (error) {
        // Handle common error cases
        try {
          const status = error.status;
          switch (status) {
            case 400:
              setErrorDisplay({show: true, title: 'Error', msg: JSON.stringify(error)});
              break;
            case 409:
              // If the user exists, regardless of conflict state, log them in.
              try {
                await checkToSAndRedirect();
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
      div({
        style: {
          display: 'flex'
        }
      }, [
        h(GoogleLogin,
          isNil(customStyle) ? defaultProps : {
            render: (props) => button({
              className: 'btn-primary',
              onClick: props.onClick,
              style: customStyle
            }, 'Submit a Data Access Request'),
            ...defaultProps
          }),
        a({
          className: 'navbar-duos-icon-help',
          style: {
            color: 'white',
            height: 16, width: 16,
            marginLeft: 5
          },
          href: 'https://broad-duos.zendesk.com/hc/en-us/articles/6160103983771-How-to-Create-a-Google-Account-with-a-Non-Google-Email',
          'data-for': 'tip_google-help',
          'data-tip': 'No Google account? Click here!'
        }),
        h(ReactTooltip, {
          id: 'tip_google-help',
          place: 'top',
          effect: 'solid',
          multiline: true,
          className: 'tooltip-wrapper'
        })
      ]);
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

