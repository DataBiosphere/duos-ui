import React, { useState } from 'react';
import { isEmpty, isNil } from 'lodash/fp';
import { Alert } from './Alert';
import { ToS } from '../libs/ajax/ToS';
import { DuosUser, User } from '../libs/ajax/User';
import { Metrics } from '../libs/ajax/Metrics';
import { Storage } from '../libs/storage';
import { Navigation, setUserRoleStatuses } from '../libs/utils';
import loadingImage from '../images/loading-indicator.svg';
import { Auth } from '../libs/auth/auth';
import eventList from '../libs/events';
import { StackdriverReporter } from '../libs/stackdriverReporter';
import CSS from 'csstype';
import { useHistory } from 'react-router';
import { OidcUser } from 'src/libs/auth/oidcBroker';

interface SignInButtonProps {
  customStyle: CSS.Properties | undefined;
}

interface ErrorInfo {
  title?: string;
  description?: string;
}

interface HttpError extends Error {
  status?: number;
}

export const SignInButton = (props: SignInButtonProps) => {
  const [errorInfo, setErrorInfo] = useState<ErrorInfo>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showError, setShowError] = useState<boolean>(false);
  const { customStyle } = props;
  const history = useHistory();

  // Utility function called in the normal success case and in the undocumented 409 case
  // Check for ToS Acceptance - redirect user if not set.
  const checkToSAndRedirect = async (redirectPath: string | null) => {
    // Check if the user has accepted ToS yet or not:
    const user: DuosUser = await User.getMe();
    if (!user.roles) {
      await StackdriverReporter.report(
        'roles not found for user: ' + user.email
      );
    }
    setUserRoleStatuses(user, Storage);
    const userStatus = await ToS.getStatus();
    const { tosAccepted } = userStatus;
    if (!isEmpty(userStatus) && !tosAccepted) {
      Storage.setUserIsLogged(false);
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

  const shouldRedirectTo = (page: string): boolean =>
    page !== '/' && page !== '/home';

  const attemptSignInCheckToSAndRedirect = async (
    redirectTo: string,
    shouldRedirect: boolean
  ) => {
    await checkToSAndRedirect(shouldRedirect ? redirectTo : null);
    Metrics.identify(Storage.getAnonymousId());
    Metrics.syncProfile();
    Metrics.captureEvent(eventList.userSignIn);
  };

  const handleRegistration = async (
    redirectTo: string,
    shouldRedirect: boolean
  ) => {
    try {
      await registerAndRedirectNewUser(redirectTo, shouldRedirect);
    } catch (error: unknown) {
      await handleErrors(error as HttpError, redirectTo, shouldRedirect);
    }
  };

  const registerAndRedirectNewUser = async (
    redirectTo: string,
    shouldRedirect: boolean
  ) => {
    const registeredUser = await User.registerUser();
    setUserRoleStatuses(registeredUser, Storage);
    Metrics.identify(Storage.getAnonymousId());
    Metrics.syncProfile();
    Metrics.captureEvent(eventList.userRegister);
    history.push(
      `/tos_acceptance${shouldRedirect ? `?redirectTo=${redirectTo}` : ''}`
    );
  };

  const handleErrors = async (
    error: HttpError,
    redirectTo: string,
    shouldRedirect: boolean
  ) => {
    const status = error.status;

    switch (status) {
      case 400:
        setShowError(true);
        setErrorInfo({
          title: 'Error',
          description: JSON.stringify(error),
        });
        break;
      case 409:
        handleConflictError(redirectTo, shouldRedirect);
        break;
      default:
        setShowError(true);
        setErrorInfo({
          title: 'Error',
          description: 'Unexpected error, please try again',
        });
        break;
    }
  };

  const handleConflictError = async (
    redirectTo: string,
    shouldRedirect: boolean
  ) => {
    try {
      await checkToSAndRedirect(shouldRedirect ? redirectTo : null);
    } catch (error) {
      Storage.clearStorage();
    }
  };

  const onFailure = (error: Error) => {
    Storage.clearStorage();
    setIsLoading(false);
    if (!error.message.includes('Popup closed by user')) {
      setShowError(true);
      setErrorInfo({
        title: 'Error',
        description: error.message,
      });
    }
  };

  const loadingIndicator = (): JSX.Element => {
    return (
      <span>
        <img height='20px' src={loadingImage} />
      </span>
    );
  };

  const signInButton = (): JSX.Element => {
    return (
      <button
        className={'btn-secondary'}
        style={customStyle}
        onClick={async () => {
          setIsLoading(true);
          await Auth.signIn(true, onSuccess, onFailure);
          setIsLoading(false);
        }}
        disabled={isLoading}
      >
        {isLoading ? loadingIndicator() : 'Sign In'}
      </button>
    );
  };

  const errorAlert = (errorInfo: ErrorInfo): JSX.Element => {
    return (
      <div className='dialog-alert'>
        <Alert
          id='dialog'
          type='danger'
          title={errorInfo.title}
          description={errorInfo.description}
        />
      </div>
    );
  };

  return <div>{!showError ? signInButton() : errorAlert(errorInfo)}</div>;
};

export default SignInButton;
