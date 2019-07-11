import React from 'react';
import Modal from 'react-modal';
import { Storage } from './libs/storage';
import DuosHeader from './components/DuosHeader';
import DuosFooter from './components/DuosFooter';
import { div, h } from 'react-hyperscript-helpers';
import './App.css';
import Routes from "./Routes";

import { SpinnerComponent as Spinner } from './components/SpinnerComponent';

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      isLoggedIn: false
    };
  }

  showSpinner = () => {
    this.setState({
      loading: true
    });
  };

  hideSpinner = () => {
    this.setState({
      loading: false
    });
  };

  async componentDidMount() {
    const isLogged = await Storage.userIsLogged();
    this.setState({ isLoggedIn: isLogged } );
  };

  signOut = () => {
    Storage.setUserIsLogged(false);
    Storage.clearStorage();
    this.setState({ isLoggedIn: false } );
  };

  signIn = () => {
    Storage.setUserIsLogged(true);
    this.setState({ isLoggedIn: true } );
  };

  componentWillMount() {
    Modal.setAppElement(document.getElementById('modal-root'));
  }

  render() {

    const { loading } = this.state;

    return (
      div({ className: "body" }, [
        div({ className: "wrap" }, [
          div({ className: "main" }, [
            h(DuosHeader, {onSignOut: this.signOut}),
            h(Spinner, {
              name: "mainSpinner", group: "duos", loadingImage: "/images/loading-indicator.svg"
            }),
            h(Routes, { onSignIn: this.signIn, isRendered: !loading }),
          ])
        ]),
        h(DuosFooter, {isLogged: this.state.isLoggedIn})
      ])

    );
  }
}

export default App;
