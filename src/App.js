import React from 'react';
import Modal from 'react-modal';
import DuosHeader from './components/DuosHeader';
import DuosFooter from './components/DuosFooter';
import { div, h } from 'react-hyperscript-helpers';
import './App.css';
import Routes from "./Routes"
import { GoogleLoginButton } from './components/GoogleLogin';
import { Storage } from './libs/storage';

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isLogged: false,
      roles: {}
    };
    this.loginState = this.loginState.bind(this);
  }

  componentWillMount() {
    Modal.setAppElement(document.getElementById('modal-root'));
  }

  loginState(isLogged) {
    this.setState({ isLogged: isLogged }, function () {
      if (isLogged) {
        Storage.setUserIsLogged(isLogged);
      } else {
        Storage.clearStorage();
      }
    });
  }

  render() {
    return (
      div({ className: "body"}, [
        div({ className: "wrap" }, [
          div({ className: "main" }, [
            h(DuosHeader, {
              isLogged: this.state.isLogged,
              loginState: this.loginState,
              button: GoogleLoginButton({
                isLogged: Storage.userIsLogged(),
                loginState: this.loginState
              })
            }),

            h(Routes, {
              roles: Storage.getCurrentUser().roles,
              isLogged: Storage.userIsLogged(),
              loginState: this.loginState
            }),
          ])
        ]),
        h(DuosFooter, {})
      ])
    );
  }
}

export default App;
