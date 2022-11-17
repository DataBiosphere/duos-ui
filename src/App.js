import React, {useEffect, useState} from 'react';
import ReactGA from 'react-ga';
import Modal from 'react-modal';
import './App.css';
import {Config} from './libs/config';
import DuosFooter from './components/DuosFooter';
import DuosHeader from './components/DuosHeader';
import {useHistory} from 'react-router-dom';
import loadingImage from './images/loading-indicator.svg';

import {SpinnerComponent as Spinner} from './components/SpinnerComponent';
import {StackdriverReporter} from './libs/stackdriverReporter';
import {Storage} from './libs/storage';
import Routes from './Routes';
import {GoogleIS} from './libs/googleIS';
import {GoogleOAuthProvider} from '@react-oauth/google';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [env, setEnv] = useState('');
  const [clientId, setClientId] = useState(null);
  let history = useHistory();

  const trackPageView = (location) => {
    ReactGA.pageview(location.pathname + location.search);
  };

  useEffect(() => {
    const setUserIsLogged = async () => {
      const isLogged = await Storage.userIsLogged();
      setIsLoggedIn(isLogged);
    };

    const initializeReactGA = async (history) => {
      const gaId = await Config.getGAId();
      ReactGA.initialize(gaId, {
        titleCase: false
      });
      //call trackPageView to register initial page load
      trackPageView(history.location);
      //pass trackPageView as callback function for url change listener
      history.listen(trackPageView);
    };

    const stackdriverStart = async () => {
      await StackdriverReporter.start();
    };

    const setEnvironment = async () => {
      const environment = await Config.getEnv();
      setEnv(environment);
    };

    const setGoogleClientId = async () => {
      const id = await Config.getGoogleClientId();
      setClientId(id);
    }

    const initApp = async () => {
      Modal.setAppElement(document.getElementById('modal-root'));
      await initializeReactGA(history);
      await setUserIsLogged();
      await setEnvironment();
      await stackdriverStart();
      await setGoogleClientId();
    };

    initApp();

  }, [history]);

  const signOut = async () => {
    const clientId = await Config.getGoogleClientId();
    await GoogleIS.revokeAccessToken(clientId);
    await Storage.setUserIsLogged(false);
    await Storage.clearStorage();
    await setIsLoggedIn(false);
  };

  const signIn = async () => {
    await Storage.setUserIsLogged(true);
    await setIsLoggedIn(true);
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className={'body'}>
        <div className={'wrap'}>
          <div className={'main'}>
            <DuosHeader onSignOut={signOut}/>
            <Spinner name={'mainSpinner'} group={'duos'} loadingImage={loadingImage}/>
            <Routes onSignOut={signOut} onSignIn={signIn} isLogged={isLoggedIn} env={env}/>
          </div>
          <DuosFooter/>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
