import React, { useEffect, useState } from 'react';
import { isEmpty, isNil } from 'lodash/fp';
import { Alert } from './Alert';
import loadingIndicator from '../images/loading-indicator.svg';
import {Auth} from '../libs/auth/auth';
import { ToS } from '../libs/ajax/ToS';
import { User } from '../libs/ajax/User';
import { Metrics } from '../libs/ajax/Metrics';
import { Config } from '../libs/config';
import eventList from '../libs/events';
import { GoogleIS } from '../libs/googleIS';
import { StackdriverReporter } from '../libs/stackdriverReporter';
import { Storage } from '../libs/storage';
import { setUserRoleStatuses } from '../libs/utils';
import {DuosUserResponse} from '../types/responseTypes';
import { Spinner } from './Spinner';
import CSS from 'csstype';
import ReactTooltip from 'react-tooltip';
import {useNavigate} from 'react-router-dom';

interface SignInButtonProps {
  customStyle: CSS.Properties | undefined;
  onSignIn: () => Promise<void>;
}

interface ErrorInfo {
  title?: string;
  description?: string;
  show?: boolean;
  msg?: string;
}

type ErrorDisplay = ErrorInfo | JSX.Element;

interface HttpError extends Error {
  status?: number;
}

interface GoogleSuccessPayload {
  accessToken: string;
}

declare global {
  interface Window { google: any; }
}

export const SignInButton = (props: SignInButtonProps) => {
  const [clientId, setClientId] = useState('');
  const [errorDisplay, setErrorDisplay] = useState<ErrorDisplay>({});
  const { onSignIn, customStyle } = props;
  const navigate = useNavigate();

  useEffect(() => {
    // Using `isSubscribed` resolves the
    // "To fix, cancel all subscriptions and asynchronous tasks in a useEffect cleanup function." warning
    let isSubscribed = true;
    const init = async () => {
      if (isSubscribed) {
        const googleClientId = await Config.getGoogleClientId();
        setClientId(googleClientId);
        if (window.google !== undefined && GoogleIS.client === null) {
          await GoogleIS.initTokenClient(googleClientId, onSuccess, onFailure);
        }
      }
      ReactTooltip.rebuild();
    };
    init();
    return () => {
      isSubscribed = false;
    };
  });

  // Utility function called in the normal success case and in the undocumented 409 case
  // Check for ToS Acceptance - redirect user if not set.
  const checkToSAndRedirect = async (redirectPath: string | null) => {
    // Check if the user has accepted ToS yet or not:
    const user: DuosUserResponse = await User.getMe();
    if (!user.roles) {
      await StackdriverReporter.report('roles not found for user: ' + user.email);
    }
    setUserRoleStatuses(user, Storage);
    await onSignIn();
    const userStatus = await ToS.getStatus();
    const { tosAccepted } = userStatus;
    if (!isEmpty(userStatus) && !tosAccepted) {
      await Auth.signOut();
      if (isNil(redirectPath)) {
        navigate('/tos_acceptance');
      } else {
        navigate(`/tos_acceptance?redirectTo=${redirectPath}`);
      }
    } else {
      if (isNil(redirectPath)) {
        navigate('/');
      } else {
        navigate(redirectPath);
      }
    }
  };

  const onSuccess = async (response: GoogleSuccessPayload) => {
    Storage.setGoogleData(response);

    const redirectTo = getRedirectTo();
    const shouldRedirect = shouldRedirectTo(redirectTo);
    Storage.setAnonymousId();

    try {
      await attemptSignInCheckToSAndRedirect(redirectTo, shouldRedirect);
    } catch (error) {
      await handleRegistration(redirectTo, shouldRedirect);
    }
  };

  const getRedirectTo = (): string => {
    const queryParams = new URLSearchParams(window.location.search);
    return queryParams.get('redirectTo') || window.location.pathname;
  };

  const shouldRedirectTo = (page: string): boolean => page !== '/' && page !== '/home';

  const attemptSignInCheckToSAndRedirect = async (redirectTo:string, shouldRedirect: boolean) => {
    await checkToSAndRedirect(shouldRedirect ? redirectTo : null);
    Metrics.identify(Storage.getAnonymousId());
    Metrics.syncProfile();
    Metrics.captureEvent(eventList.userSignIn);
  };

  const handleRegistration = async (redirectTo: string, shouldRedirect: boolean) => {
    try {
      await registerAndRedirectNewUser(redirectTo, shouldRedirect);
    } catch (error) {
      await handleErrors(error as HttpError, redirectTo, shouldRedirect);
    }
  };

  const registerAndRedirectNewUser = async (redirectTo: string, shouldRedirect: boolean) => {
    const registeredUser = await User.registerUser();
    setUserRoleStatuses(registeredUser, Storage);
    await onSignIn();
    Metrics.identify(Storage.getAnonymousId());
    Metrics.syncProfile();
    Metrics.captureEvent(eventList.userRegister);
    navigate(`/tos_acceptance${shouldRedirect ? `?redirectTo=${redirectTo}` : ''}`);
  };

  const handleErrors = async (error: HttpError, redirectTo: string, shouldRedirect: boolean) => {
    const status = error.status;

    switch (status) {
      case 400:
        setErrorDisplay({ show: true, title: 'Error', msg: JSON.stringify(error) });
        break;
      case 409:
        await handleConflictError(redirectTo, shouldRedirect);
        break;
      default:
        setErrorDisplay({ show: true, title: 'Error', msg: 'Unexpected error, please try again' });
        break;
    }
  };

  const handleConflictError = async (redirectTo: string, shouldRedirect: boolean) => {
    try {
      await checkToSAndRedirect(shouldRedirect ? redirectTo : null);
    } catch (error) {
      await Auth.signOut();
    }
  };

  const onFailure = (response: any) => {
    Storage.clearStorage();
    if (response.error === 'popup_closed_by_user') {
      setErrorDisplay(
        <span>
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

  const spinnerOrSignInButton = () => {
    return (clientId === ''
      ? Spinner()
      : (<div style={{ display: 'flex' }}>
        {isNil(customStyle)
          ? GoogleIS.signInButton(clientId, onSuccess, onFailure)
          : <button className={'btn-primary'} style={customStyle} onClick={() => {
            GoogleIS.requestAccessToken(clientId, onSuccess, onFailure);
          }}>
          Submit a Data Access Request
          </button>}
        {isNil(customStyle) &&
        <a
          className='navbar-duos-icon-help'
          style={{ color: 'white', height: 16, width: 16, marginLeft: 5 }}
          href='https://broad-duos.zendesk.com/hc/en-us/articles/6160103983771-How-to-Create-a-Google-Account-with-a-Non-Google-Email'
          data-for="tip_google-help"
          data-tip="No Google help? Click here!"
        />
        }
        <ReactTooltip id="tip_google-help" place="top" effect="solid" multiline={true} className="tooltip-wrapper" />
      </div>));
  };

  return (
    <div>
      {isEmpty(errorDisplay)
        ? <div>
          {spinnerOrSignInButton()}
        </div>
        : <div className="dialog-alert">
          <Alert
            id="dialog"
            type="danger"
            title={(errorDisplay as ErrorInfo).title}
            description={(errorDisplay as ErrorInfo).description}
          />
        </div>
      }
    </div>
  );
};

export default SignInButton;
