import { isEmpty, isNil } from 'lodash/fp';
import { ToS } from '../libs/ajax/ToS';
import { DuosUser, User } from '../libs/ajax/User';
import { Metrics } from '../libs/ajax/Metrics';
import { Navigation, setUserRoleStatuses } from '../libs/utils';
import eventList from '../libs/events';
import { StackdriverReporter } from '../libs/stackdriverReporter';
import { Storage } from '../libs/storage';
import { History } from 'history';
import { Auth } from './auth/auth';

// Utility function called in the normal success case and in the undocumented 409 case
// Check for ToS Acceptance - redirect user if not set.
export const checkToSAndRedirect = async (
  redirectPath: string | null,
  history: History
) => {
  // Check if the user has accepted ToS yet or not:
  const user: DuosUser = await User.getMe();
  if (!user.roles) {
    await StackdriverReporter.report('roles not found for user: ' + user.email);
  }
  setUserRoleStatuses(user, Storage);
  const userStatus = await ToS.getStatus();
  const { tosAccepted } = userStatus;
  if (!isEmpty(userStatus) && !tosAccepted) {
    Auth.signOut();
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

export const getRedirectTo = (): string => {
  const queryParams = new URLSearchParams(window.location.search);
  return queryParams.get('redirectTo') || window.location.pathname;
};

export const shouldRedirectTo = (page: string): boolean =>
  page !== '/' && page !== '/home';

export const attemptSignInCheckToSAndRedirect = async (
  redirectTo: string,
  shouldRedirect: boolean,
  history: History
) => {
  await checkToSAndRedirect(shouldRedirect ? redirectTo : null, history);
  Metrics.identify(Storage.getAnonymousId());
  Metrics.syncProfile();
  Metrics.captureEvent(eventList.userSignIn);
};

export const registerAndRedirectNewUser = async (
  redirectTo: string,
  shouldRedirect: boolean,
  history: History
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

export const handleConflictError = async (
  redirectTo: string,
  shouldRedirect: boolean,
  history: History
) => {
  try {
    await checkToSAndRedirect(shouldRedirect ? redirectTo : null, history);
  } catch (error) {
    Auth.signOut();
  }
};
