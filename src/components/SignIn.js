import {useEffect, useState} from 'react';
import {isEmpty, isNil} from 'lodash/fp';
import {a, div, h, img, span} from 'react-hyperscript-helpers';
import {Alert} from './Alert';
import {ToS, User} from '../libs/ajax';
import {Config} from '../libs/config';
import {Storage} from '../libs/storage';
import {Navigation, setUserRoleStatuses} from '../libs/utils';
import loadingIndicator from '../images/loading-indicator.svg';
import {Spinner} from './Spinner';
import ReactTooltip from 'react-tooltip';
import {GoogleIS} from '../libs/googleIS';

export default function SignIn(props) {
  const [clientId, setClientId] = useState('');
  const [errorDisplay, setErrorDisplay] = useState({});
  const {onSignIn, history} = props;

  useEffect(() => {
    // Using `isSubscribed` resolves the
    // "To fix, cancel all subscriptions and asynchronous tasks in a useEffect cleanup function." warning
    let isSubscribed = true;
    const init = async () => {
      if (isSubscribed) {
        const googleClientId = await Config.getGoogleClientId();
        setClientId(googleClientId);
        if (GoogleIS.client === null) {
          await GoogleIS.initTokenClient(googleClientId, onSuccess, onFailure);
        }
      }
      ReactTooltip.rebuild();
    };
    init();
    return () => (isSubscribed = false);
  });

  // Utility function called in the normal success case and in the undocumented 409 case
  // Check for ToS Acceptance - redirect user if not set.
  const checkToSAndRedirect = async (redirectPath) => {
    // Check if the user has accepted ToS yet or not:
    const user = await User.getMe();
    setUserRoleStatuses(user, Storage);
    await onSignIn();
    const userStatus = await ToS.getStatus();
    const {tosAccepted} = userStatus;
    if (!isEmpty(userStatus) && !tosAccepted) {
      await Storage.setUserIsLogged(false);
      if (isNil(redirectPath)) {
        history.push(`/tos_acceptance`);
      } else {
        history.push(`/tos_acceptance?redirectTo=${redirectPath}`);
      }
    } else {
      if (isNil(redirectPath)) {
        Navigation.back(user, history);
      } else {
        history.push(redirectPath);
      }
    }
  };

  const onSuccess = async (response) => {
    Storage.setGoogleData(response);

    // if 'redirectTo' exists, redirect there. otherwise,
    // redirect to the page the user attempted to go to before
    // signing in.
    const queryParams = new URLSearchParams(window.location.search);
    const currentPage = queryParams.get('redirectTo') ? queryParams.get('redirectTo') : window.location.pathname;
    const shouldRedirect = currentPage !== '/' && currentPage !== '/home';

    try {
      await checkToSAndRedirect(shouldRedirect ? currentPage : null);
    } catch (error) {
      try {
        // New users without an existing account will error out in the above call
        // Register them and redirect them to the ToS Acceptance page.
        const registeredUser = await User.registerUser();
        setUserRoleStatuses(registeredUser, Storage);
        await onSignIn();
        history.push(`/tos_acceptance${shouldRedirect ? `?redirectTo=${currentPage}` : ''}`);
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
                await checkToSAndRedirect(shouldRedirect ? currentPage : null);
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

  const spinnerOrSignInButton = () => {
    const disabled = clientId === '';
    return disabled ?
      Spinner :
      div({
        style: {
          display: 'flex'
        }
      }, [
        GoogleIS.signInButton(clientId, onSuccess, onFailure),
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
      div({isRendered: isEmpty(errorDisplay)}, [spinnerOrSignInButton()])
    ])
  );
}

