import {isEmpty, isNil} from 'lodash/fp';
import {useEffect, useState, useCallback} from 'react';
import GoogleLogin from 'react-google-login';
import {button, div, h, img, span} from 'react-hyperscript-helpers';
import {Alert} from './Alert';
import {User} from '../libs/ajax';
import {Config} from '../libs/config';
import {Storage} from '../libs/storage';
import {Navigation, setUserRoleStatuses} from '../libs/utils';
import loadingIndicator from '../images/loading-indicator.svg';
import {Spinner} from './Spinner';

export default function SignIn(props) {

  const [clientId, setClientId] = useState('');
  const [user, setUser] = useState({});
  const [errorDisplay, setErrorDisplay] = useState({});
  const {onSignIn, history, customStyle} = props;

  useEffect(() => {
    const init = async () => {
      setClientId(`${await Config.getGoogleClientId()}`);
    };
    init();
  }, []);

  const responseGoogle = async (response) => {
    Storage.setGoogleData(response);
    try {
      const userRes = await User.getMe();
      await setUser(Object.assign(userRes, setUserRoleStatuses(userRes, Storage)));
      redirect(userRes);
    } catch (error) {
      try {
        let registeredUser = await User.registerUser();
        this.setUserRoleStatuses(registeredUser, Storage);
        onSignIn();
        history.push('/profile');
      } catch (error) {
        try {
          const status = error.status;
          switch (status) {
            case 400:
              setErrorDisplay({show: true, title: 'Error', msg: JSON.stringify(error)});
              break;
            case 409:
              try {
                let userRes = await User.getMe();
                await setUser(Object.assign({}, userRes, setUserRoleStatuses(userRes, Storage)));
                redirect(userRes);
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

  const forbidden = (response) => {
    Storage.clearStorage();
    if (response.error === 'popup_closed_by_user') {
      setErrorDisplay({
        description: span({}, ['Sign-in cancelled ... ', img({height: '20px', src: loadingIndicator})])
      });
      setTimeout(() => {
        setErrorDisplay({});
      }, 3000);
    } else {
      setErrorDisplay({'title': response.error, 'description': response.details});
    }
  };

  const redirect = useCallback(async (user) => {
    await Navigation.back(user, history);
    onSignIn();
  }, [onSignIn, history]);

  const spinnerOrSigninButton = () => {
    const disabled = clientId === '';
    const defaultProps = {
      buttonText: 'Sign-in/Register',
      scope: 'openid email profile',
      height: '44px',
      width: '180px',
      theme: 'dark',
      clientId: clientId,
      onSuccess: responseGoogle,
      onFailure: forbidden,
      disabledStyle: {'opacity': '25%', 'cursor': 'not-allowed'}
    };
    return disabled ?
      Spinner :
      h(GoogleLogin,
        isNil(customStyle) ? defaultProps : {
          render: (props) => button({
            className: 'btn-primary',
            onClick: props.onClick,
            style: customStyle
          }, 'Submit a Data Access Request'),
          ...defaultProps
        });
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

