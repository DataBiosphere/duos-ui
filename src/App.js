import {useState, useEffect} from 'react';
import ReactGA from 'react-ga';
import { div, h } from 'react-hyperscript-helpers';
import Modal from 'react-modal';
import './App.css';
import DuosFooter from './components/DuosFooter';
import DuosHeader from './components/DuosHeader';
import {useHistory} from 'react-router-dom';

import { SpinnerComponent as Spinner } from './components/SpinnerComponent';
import { Storage } from './libs/storage';
import Routes from './Routes';

function App() {
  const [loading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  let history = useHistory();

  const initializeReactGA = () => {
    ReactGA.initialize('UA-173273990-1', {
      titleCase: false
    });
  };

  const trackPageView = (location) => {
    ReactGA.pageview(location.pathname + location.search);
  };

  useEffect(() => {
    const setUserIsLogged = async () => {
      const isLogged = await Storage.userIsLogged();
      setIsLoggedIn(isLogged);
    };

    Modal.setAppElement(document.getElementById('modal-root'));
    initializeReactGA();
    //call trackPageView to register initial page load
    trackPageView(history.location);
    //pass trackPageView as callback function for url change listener
    history.listen(trackPageView);
    setUserIsLogged();
  }, []);

  const signOut = () => {
    Storage.setUserIsLogged(false);
    Storage.clearStorage();
    setIsLoggedIn(false);
  };

  const signIn = () => {
    Storage.setUserIsLogged(true);
    setIsLoggedIn(true);
  };

  return (
    div({ className: 'body' }, [
      div({ className: 'wrap' }, [
        div({ className: 'main' }, [
          h(DuosHeader, { onSignOut: signOut }),
          h(Spinner, {
            name: 'mainSpinner', group: 'duos', loadingImage: '/images/loading-indicator.svg'
          }),
          h(Routes, { onSignIn: signIn, isRendered: !loading, isLogged: isLoggedIn })
        ])
      ]),
      h(DuosFooter, { isLogged: isLoggedIn })
    ])
  );
}

export default App;
