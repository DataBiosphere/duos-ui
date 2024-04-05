import React, { useState } from 'react';
import { isEmpty, isNil } from 'lodash/fp';
import { Alert } from './Alert';
import { ToS } from '../libs/ajax/ToS';
import { User } from '../libs/ajax/User';
import { Metrics } from '../libs/ajax/Metrics';
import { Storage } from '../libs/storage';
import { Navigation, setUserRoleStatuses } from '../libs/utils';
import loadingIndicator from '../images/loading-indicator.svg';
import Auth from '../libs/auth/auth';
import eventList from '../libs/events';
import { StackdriverReporter } from '../libs/stackdriverReporter';
import { useAuth } from 'react-oidc-context';
import CSS from 'csstype';
import { useHistory } from 'react-router';
import { OidcUser } from 'src/libs/auth/oidcBroker';

interface SignInProps {
  history: any;
  customStyle: CSS.Properties | undefined;
  onSignIn: any;
}

interface ErrorDisplay  {
  title?: string,
  description?: string, 
  show?: boolean,
  msg?: string,
}

interface HttpError extends Error {
  status?: number
}

export const SignIn = (props: SignInProps) => {
  const [errorDisplay, setErrorDisplay] = useState<ErrorDisplay | JSX.Element>({});
  const { onSignIn, customStyle } = props;
  const authInstance = useAuth();
  const history = useHistory();

  // Utility function called in the normal success case and in the undocumented 409 case
  // Check for ToS Acceptance - redirect user if not set.
  const checkToSAndRedirect = async (redirectPath: string | null) => {
    // Check if the user has accepted ToS yet or not:
    const user = await User.getMe();
    if (!user.roles) {
      await StackdriverReporter.report('roles not found for user: ' + user.email);
    }
    setUserRoleStatuses(user, Storage);
    await onSignIn();
    const userStatus = await ToS.getStatus();
    const { tosAccepted } = userStatus;
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

  const onSuccess = async (response: OidcUser) => {
    const redirectTo = getRedirectTo();
    const shouldRedirect = shouldRedirectTo(redirectTo);
    Storage.setAnonymousId();
    try {
      await attemptSignInCheckToSAndRedirect(redirectTo, shouldRedirect);
    } catch (error: unknown) {
      await handleRegistration(redirectTo, shouldRedirect);
    }
  };

  const getRedirectTo = (): string => {
    const queryParams = new URLSearchParams(window.location.search);
    return queryParams.get('redirectTo') || window.location.pathname;
  };

  const shouldRedirectTo = (page: string): boolean => page !== '/' && page !== '/home';

  const attemptSignInCheckToSAndRedirect = async (
    redirectTo: string,
    shouldRedirect: boolean,
  ) => {
    await checkToSAndRedirect(shouldRedirect ? redirectTo : null);
    Metrics.identify(Storage.getAnonymousId());
    Metrics.syncProfile();
    Metrics.captureEvent(eventList.userSignIn);
  };

  const handleRegistration = async (redirectTo: string, shouldRedirect: boolean) => {
    try {
      await registerAndRedirectNewUser(redirectTo, shouldRedirect);
    } catch (error: unknown) {
      await handleErrors(error as HttpError, redirectTo, shouldRedirect);
    }
  };

  const registerAndRedirectNewUser = async (redirectTo: string, shouldRedirect: boolean) => {
    const registeredUser = await User.registerUser();
    setUserRoleStatuses(registeredUser, Storage)
    await onSignIn();
    Metrics.identify(Storage.getAnonymousId());
    Metrics.syncProfile();
    Metrics.captureEvent(eventList.userRegister);
    history.push(
      `/tos_acceptance${shouldRedirect ? `?redirectTo=${redirectTo}` : ''}`
    );
  };

  const handleErrors = async (error: HttpError, redirectTo: string, shouldRedirect: boolean) => {
    const status = error.status;

    switch (status) {
      case 400:
        setErrorDisplay({
          show: true,
          title: 'Error',
          msg: JSON.stringify(error),
        });
        break;
      case 409:
        handleConflictError(redirectTo, shouldRedirect);
        break;
      default:
        setErrorDisplay({
          show: true,
          title: 'Error',
          msg: 'Unexpected error, please try again',
        });
        break;
    }
  };

  const handleConflictError = async (redirectTo:string, shouldRedirect: boolean) => {
    try {
      await checkToSAndRedirect(shouldRedirect ? redirectTo : null);
    } catch (error) {
      Storage.clearStorage();
    }
  };

  const onFailure = (response: any) => {
    Storage.clearStorage();
    if (response.error === 'popup_closed_by_user') {
      setErrorDisplay( <span>
          Sign-in cancelled ...
          <img height="20px" src={loadingIndicator} />
        </span>
    );
      setTimeout(() => {
        setErrorDisplay({});
      }, 2000);
    } else {
      setErrorDisplay({ title: response.error, description: response.details });
    }
  };


  //TODO: Add spinner aftr registering/logging in
  const signInButton = (): JSX.Element => {
    return (<button
      className={'btn-secondary'}
      style={customStyle}
      onClick={() => {
        Auth.signIn(authInstance, true, onSuccess, onFailure);
      }}
    >
      Sign In
    </button>)
  }

  return (
    <div>
      {isEmpty(errorDisplay) ? (
        <div>{signInButton()}</div>
      ) : (
        <div className="dialog-alert">
          <Alert
            id="dialog"
            type="danger"
            title={(errorDisplay as ErrorDisplay).title}
            description={(errorDisplay as ErrorDisplay).description}
          />
        </div>
      )}
    </div>
  );
};

export default SignIn;
