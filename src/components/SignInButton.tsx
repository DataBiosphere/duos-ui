import React, { useState } from 'react';
import { Alert } from './Alert';
import { Storage } from '../libs/storage';
import loadingImage from '../images/loading-indicator.svg';
import { Auth } from '../libs/auth/auth';
import CSS from 'csstype';
import { useHistory } from 'react-router';
import { OidcUser } from '../libs/auth/oidcBroker';
import { SignIn } from '../libs/signIn';

interface SignInButtonProps {
  style: CSS.Properties | undefined;
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
  const { style } = props;

  const history = useHistory();

  // eslint-disable-next-line no-unused-vars
  const onSuccess = async (_: OidcUser) => {

    const redirectTo = SignIn.getRedirectTo();
    const shouldRedirect = SignIn.shouldRedirectTo(redirectTo);
    Storage.setAnonymousId();
    try {
      await SignIn.attemptSignInCheckToSAndRedirect(
        redirectTo,
        shouldRedirect,
        history
      );
    } catch (error: unknown) {
      await SignIn.registerAndRedirectNewUser(
        redirectTo,
        shouldRedirect,
        history
      ).catch((reason) => handleErrors(reason, redirectTo, shouldRedirect));
    }
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
        SignIn.handleConflictError(redirectTo, shouldRedirect, history);
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

  const onFailure = (error: Error) => {
    Auth.signOut();
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
        style={style}
        onClick={async () => {
          setIsLoading(true);
          await Auth.signIn(true).then(onSuccess, onFailure);
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

  return <div>{showError ? errorAlert(errorInfo) : signInButton()}</div>;
};

export default SignInButton;
