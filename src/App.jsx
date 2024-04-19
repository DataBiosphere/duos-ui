import React, { useEffect, useState } from 'react';
import ReactGA from 'react-ga4';
import Modal from 'react-modal';
import './App.css';
import {Config} from './libs/config';
import { Auth } from './libs/auth/auth';
import DuosFooter from './components/DuosFooter';
import DuosHeader from './components/DuosHeader';
import {useHistory, useLocation} from 'react-router-dom';
import loadingImage from './images/loading-indicator.svg';

import {SpinnerComponent as Spinner} from './components/SpinnerComponent';
import {StackdriverReporter} from './libs/stackdriverReporter';

import Routes from './Routes';
import { Storage } from './libs/storage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(Storage.userIsLogged());
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

  return (
    <div className="body">
      <div className="wrap">
        <div className="main">
          <DuosHeader />
          <Spinner name="mainSpinner" group="duos" loadingImage={loadingImage} />
          <Routes isLogged={isLoggedIn} env={env} />
        </div>
      </div>
      <DuosFooter />
    </div>
  );
}

export default App;
