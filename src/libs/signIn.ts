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

export const SignIn = {
  checkToSAndRedirect: (redirectPath : string | null, history: History) =>  checkToSAndRedirect(redirectPath, history),
  getRedirectTo: () => getRedirectTo(),
  shouldRedirectTo: (page: string) => shouldRedirectTo(page),
  attemptSignInCheckToSAndRedirect: (
    redirectTo: string,
    shouldRedirect: boolean,
    history: History
  ) => attemptSignInCheckToSAndRedirect(redirectTo, shouldRedirect, history),
  registerAndRedirectNewUser: (
    redirectTo: string,
    shouldRedirect: boolean,
    history: History
  ) => registerAndRedirectNewUser(redirectTo, shouldRedirect, history),
  handleConflictError: (
    redirectTo: string,
    shouldRedirect: boolean,
    history: History
  ) => handleConflictError(redirectTo, shouldRedirect, history),
};

// Utility function called in the normal success case and in the undocumented 409 case
// Check for ToS Acceptance - redirect user if not set.
const checkToSAndRedirect = async (
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

const getRedirectTo = (): string => {
  const queryParams = new URLSearchParams(window.location.search);
  return queryParams.get('redirectTo') || window.location.pathname;
};

const shouldRedirectTo = (page: string): boolean =>
  page !== '/' && page !== '/home';

const attemptSignInCheckToSAndRedirect = async (
  redirectTo: string,
  shouldRedirect: boolean,
  history: History
) => {
  await SignIn.checkToSAndRedirect(shouldRedirect ? redirectTo : null, history);
  Metrics.identify(Storage.getAnonymousId());
  Metrics.syncProfile();
  Metrics.captureEvent(eventList.userSignIn);
};

const registerAndRedirectNewUser = async (
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

const handleConflictError = async (
  redirectTo: string,
  shouldRedirect: boolean,
  history: History
) => {
  try {
    await SignIn.checkToSAndRedirect(shouldRedirect ? redirectTo : null, history);
  } catch (error) {
    Auth.signOut();
  }
};
