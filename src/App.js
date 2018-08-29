import React from 'react';
import DuosHeader from './components/DuosHeader';
import { div, h } from 'react-hyperscript-helpers';
import './App.css';
import Routes from "./Routes"
import { GoogleLoginButton } from './components/GoogleLogin';
import { Storage } from './libs/storage';

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isLogged: false
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
      div({}, [

        h(DuosHeader, {
          isLogged: this.state.isLogged,
          loginState: this.loginState,
          button: GoogleLoginButton({
            isLogged: Storage.userIsLogged(),
            loginState: this.loginState
          })
        }),

        h(Routes, {
          isLogged: Storage.userIsLogged(),
          loginState: this.loginState
        })
      ])
    );
  }
}

export default App;
