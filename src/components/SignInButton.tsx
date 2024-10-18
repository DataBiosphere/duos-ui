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
import {OidcUser} from '../libs/auth/oidcBroker';
import {DuosUser} from '../types/model';
import {DuosUserResponse} from '../types/responseTypes';

interface SignInButtonProps {
  history: History;
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
  const {history} = props;
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Utility function called in the normal success case and in the undocumented 409 case
  // Check for ToS Acceptance - redirect user if not set.
  const checkToSAndRedirect = async (redirectPath: string | null) => {
    // Check if the user has accepted ToS yet or not:
    const userStatus = await ToS.getStatus();
    const {tosAccepted} = userStatus;
    if (!isEmpty(userStatus) && !tosAccepted) {
      // User has authenticated, but has not accepted ToS
      Storage.setUserIsLogged(false);
      if (isNil(redirectPath)) {
        history.push(`/tos_acceptance`);
      } else {
        history.push(`/tos_acceptance?redirectTo=${redirectPath}`);
      }
    } else {
      // User is authenticated, registered and has accepted ToS: redirect to destination.
      if (isNil(redirectPath)) {
        await Navigation.back(Storage.getCurrentUser(), history);
      } else {
        history.push(redirectPath);
      }
    }
  };

  // eslint-disable-next-line no-unused-vars
  const onSuccess = async (_: OidcUser) => {
    const redirectTo = getRedirectTo();
    const shouldRedirect = shouldRedirectTo(redirectTo);
    try {
      const duosUser: DuosUserResponse = await User.getMe();
      if (duosUser) {
        Storage.setCurrentUser(duosUser);
        setUserRoleStatuses(duosUser, Storage);
        if (!duosUser.roles) {
          await StackdriverReporter.report('roles not found for user: ' + duosUser.email);
        }
        await syncSignInOrRegistrationEvent(eventList.userSignIn);
        await checkToSAndRedirect(shouldRedirect ? redirectTo : null);
      } else {
        await handleRegistration(redirectTo, shouldRedirect);
      }
    } catch (err) {
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
    const registeredUser: DuosUser = await User.registerUser();
    setUserRoleStatuses(registeredUser, Storage);
    await syncSignInOrRegistrationEvent(eventList.userRegister);
    history.push(`/tos_acceptance${shouldRedirect ? `?redirectTo=${redirectTo}` : ''}`);
  };

  const syncSignInOrRegistrationEvent = async (event: String) => {
    Storage.setAnonymousId();
    await Metrics.identify(Storage.getAnonymousId());
    await Metrics.syncProfile();
    await Metrics.captureEvent(event);
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
    // Known error case from oidc-client-ts PopupWindow: "new Error("Popup closed by user")"
    if (response.toString().includes('Popup closed by user')) {
      setErrorDisplay(
        {title: 'Sign in cancelled', description: 'Sign in cancelled by closing the sign in window'});
      setTimeout(() => {
        setErrorDisplay({});
      }, 2000);
    } else {
      setErrorDisplay({title: 'Error', description: response.toString()});
      setTimeout(() => {
        setErrorDisplay({});
      }, 2000);
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
      <div style={{display: 'flex', marginRight: 30}}>
        <button
          style={{
            height: 50,
            width: 200,
            fontSize: 18,
            fontWeight: 500,
            color: 'rgb(77, 114, 170)',
            borderRadius: 5
          }}
          onClick={async () => {
            setIsLoading(true);
            Auth.signIn().then(onSuccess, onFailure);
            setIsLoading(false);
          }}
          disabled={isLoading}
        >
          {isLoading ? loadingElement() : 'Sign In'}
        </button>
        <a
          className='navbar-duos-icon-help'
          style={{color: 'white', height: 16, width: 16, marginLeft: 5}}
          href='https://support.terra.bio/hc/en-us/articles/28504837523995-How-to-Register-for-DUOS'
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
