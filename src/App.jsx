import React, {useEffect, useState} from 'react';
import ReactGA from 'react-ga4';
import Modal from 'react-modal';
import './App.css';
import {Config} from './libs/config';
import DuosFooter from './components/DuosFooter';
import DuosHeader from './components/DuosHeader';
import {useHistory, useLocation} from 'react-router-dom';
import loadingImage from './images/loading-indicator.svg';

import {SpinnerComponent as Spinner} from './components/SpinnerComponent';
import {StackdriverReporter} from './libs/stackdriverReporter';
import {Storage} from './libs/storage';
import Routes from './Routes';
import {AuthenticateNIH} from '../src/libs/ajax/AuthenticateNIH.js';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [env, setEnv] = useState('');
  const history = useHistory();
  const location = useLocation();

  const trackPageView = (location) => {
    ReactGA.send({ hitType: 'pageview', page: location.pathname+location.search });
  };

  useEffect(() => {
    Modal.setAppElement(document.getElementById('modal-root'));
  });

  useEffect(() => {
    const setEnvironment = async () => {
      const environment = await Config.getEnv();
      setEnv(environment);
      await Storage.setEnv(environment);
    };
    setEnvironment();
  });

  useEffect(() => {
    const initializeReactGA = async (history) => {
      const gaId = await Config.getGAId();
      ReactGA.initialize(gaId, {
        titleCase: false
      });
      //call trackPageView to register initial page load
      trackPageView(location);
      //pass trackPageView as callback function for url change listener
      history.listen(trackPageView);
    };
    initializeReactGA(history);
  }, [history, location]);

  useEffect(() => {
    const stackdriverStart = async () => {
      await StackdriverReporter.start();
    };
    stackdriverStart();
  });

  useEffect(() => {
    const setUserIsLogged = async () => {
      const isLogged = await Storage.userIsLogged();
      setIsLoggedIn(isLogged);
    };
    setUserIsLogged();
  });

  // Check for NIH Authentication URL params that need to be parsed
  useEffect(() => {
    const checkNIHAuth = async () => {
      const queryParams = new URLSearchParams(window.location.search);
      const code = queryParams.get('code')
      const state = queryParams.get('state')
      if (code && state) {
        const linkInfo = await AuthenticateNIH.getECMProviderLinkInfo(code, state);
        if (linkInfo?.externalUserId && linkInfo?.expirationTimestamp) {
          const nihUser = {
            linkedNihUsername: linkInfo.externalUserId,
            linkExpireTime: `${new Date(linkInfo.expirationTimestamp).getTime()}`,
            status: 'true',
          }
          await AuthenticateNIH.saveNihUsr(nihUser);
        }
        if (linkInfo?.additionalState?.redirectTo) {
          window.location.href = linkInfo.additionalState.redirectTo;
        }
      }
    };
    checkNIHAuth();
  });

  return (
    <div className="body">
      <div className="wrap">
        <div className="main">
          <DuosHeader/>
          <Spinner name="mainSpinner" group="duos" loadingImage={loadingImage} />
          <Routes isLogged={isLoggedIn} env={env} />
        </div>
      </div>
      <DuosFooter />
    </div>
  );
}

export default App;
