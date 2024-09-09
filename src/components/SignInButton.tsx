import React, {useState} from 'react';
import {isEmpty, isNil} from 'lodash/fp';
import {Alert} from './Alert';
import {Auth} from '../libs/auth/auth';
import {ToS} from '../libs/ajax/ToS';
import {User} from '../libs/ajax/User';
import {Metrics} from '../libs/ajax/Metrics';
import {Storage} from '../libs/storage';
import {Navigation, setUserRoleStatuses} from '../libs/utils';
import loadingIndicator from '../images/loading-indicator.svg';
import ReactTooltip from 'react-tooltip';
import eventList from '../libs/events';
import {StackdriverReporter} from '../libs/stackdriverReporter';
import {History} from 'history';
import CSS from 'csstype';
import {OidcUser} from '../libs/auth/oidcBroker';
import {DuosUserResponse} from '../types/responseTypes';


interface SignInButtonProps {
  customStyle: CSS.Properties | undefined;
  history: History;
  onSignIn: () => Promise<void>;
}

interface ErrorInfo {
  title?: string;
  description?: string;
  show?: boolean;
  msg?: string;
}

type ErrorDisplay = ErrorInfo | React.JSX.Element;

interface HttpError extends Error {
  status?: number;
}

export const SignInButton = (props: SignInButtonProps) => {
  const [errorDisplay, setErrorDisplay] = useState<ErrorDisplay>({});
  const {onSignIn, history} = props;
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Utility function called in the normal success case and in the undocumented 409 case
  // Check for ToS Acceptance - sign out and redirect user if not set.
  const checkToSAndRedirect = async (redirectPath: string | null) => {
    // Check if the user has accepted ToS yet or not:
    const userStatus = await ToS.getStatus();
    const {tosAccepted} = userStatus;
    if (!isEmpty(userStatus) && !tosAccepted) {
      await Auth.signOut();
      if (isNil(redirectPath)) {
        history.push(`/tos_acceptance`);
      } else {
        history.push(`/tos_acceptance?redirectTo=${redirectPath}`);
      }
    } else {
      if (isNil(redirectPath)) {
        Navigation.back(Storage.getCurrentUser(), history);
      } else {
        history.push(redirectPath);
      }
    }
  };

  // eslint-disable-next-line no-unused-vars
  const onSuccess = async (_: OidcUser) => {
    const duosUser: DuosUserResponse = await User.getMe();
    Storage.setCurrentUser(duosUser);
    setUserRoleStatuses(duosUser, Storage);
    if (!duosUser.roles) {
      await StackdriverReporter.report('roles not found for user: ' + duosUser.email);
    }

    const redirectTo = getRedirectTo();
    const shouldRedirect = shouldRedirectTo(redirectTo);
    Storage.setAnonymousId();
    await Metrics.identify(Storage.getAnonymousId());
    await Metrics.syncProfile();
    await Metrics.captureEvent(eventList.userSignIn);

    try {
      await checkToSAndRedirect(shouldRedirect ? redirectTo : null);
    } catch (error) {
      await handleRegistration(redirectTo, shouldRedirect);
    }
  };

  const getRedirectTo = (): string => {
    const queryParams = new URLSearchParams(window.location.search);
    return queryParams.get('redirectTo') || window.location.pathname;
  };

  const shouldRedirectTo = (page: string): boolean => page !== '/' && page !== '/home';

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
    await Metrics.identify(Storage.getAnonymousId());
    await Metrics.syncProfile();
    await Metrics.captureEvent(eventList.userRegister);
    history.push(`/tos_acceptance${shouldRedirect ? `?redirectTo=${redirectTo}` : ''}`);
  };

  const handleErrors = async (error: HttpError, redirectTo: string, shouldRedirect: boolean) => {
    const status = error.status;

    switch (status) {
      case 400:
        setErrorDisplay({show: true, title: 'Error', msg: JSON.stringify(error)});
        break;
      case 409:
        await handleConflictError(redirectTo, shouldRedirect);
        break;
      default:
        setErrorDisplay({show: true, title: 'Error', msg: 'Unexpected error, please try again'});
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
          <img height="20px" src={loadingIndicator} alt={'loading'}/>
        </span>
      );
      setTimeout(() => {
        setErrorDisplay({});
      }, 2000);
    } else {
      setErrorDisplay({title: response.error, description: response.details});
    }
  };

  const loadingElement = (): React.JSX.Element => {
    return (
      <span>
        <img height='20px' src={loadingIndicator} alt={'loading'}/>
      </span>
    );
  };

  const signInElement = (): React.JSX.Element => {
    return (
      <div style={{display: 'flex'}}>
        <button
          className={'btn-secondary'}
          onClick={async () => {
            setIsLoading(true);
            Auth.signIn(true).then(onSuccess, onFailure);
            setIsLoading(false);
          }}
          disabled={isLoading}
        >
          {isLoading ? loadingElement() : 'Sign In'}
        </button>
        <a
          className='navbar-duos-icon-help'
          style={{color: 'white', height: 16, width: 16, marginLeft: 5}}
          href='https://broad-duos.zendesk.com/hc/en-us/articles/6160103983771-How-to-Create-a-Google-Account-with-a-Non-Google-Email'
          data-for="tip_google-help"
          data-tip="Need account help? Click here!"
        />
        <ReactTooltip id="tip_google-help" place="top" effect="solid" multiline={true} className="tooltip-wrapper"/>
      </div>
    );
  };

  return (
    <div>
      {isEmpty(errorDisplay)
        ? <div>
          {signInElement()}
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
