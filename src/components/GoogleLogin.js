import { Component, Redirect, React } from 'react';
import {browserHistory, withRouter } from "react-router-dom";
import { h, hh } from 'react-hyperscript-helpers';
import GoogleLogin from 'react-google-login';
import { User } from '../libs/ajax';
import { Storage } from '../libs/storage';

export const GoogleLoginButton = hh(class GoogleLoginButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      googleButton: null,
      toDashBoard: false
    };
    this.login = props.loginState;
    this.getUser = this.getUser.bind(this);
  }

  responseGoogle = (response) => {
    Storage.setGoogleData(response);
    this.getUser().then((data) => {
      Storage.setCurrentUser(data);
      this.redirectByRole();
      this.login(true);
    },
      (data) => {
        Storage.clearStorage();
      });
  };

  forbidden = (response) => {
    Storage.clearStorage();
  };

  logout = () => {
    console.log('logout');
  };

  async getGoogleConfig() {
    const googleButton = h(GoogleLogin, {
      className: "btn navbar-duos-button",
      clientId: "",
      buttonText: "Sign In",
      onSuccess: this.responseGoogle,
      onFailure: this.forbidden,
    });
    this.setState({ googleButton: googleButton })
  }

  async getUser() {
    return await User.getByEmail(Storage.getGoogleData().profileObj.email);
  }

  componentWillMount() {
    this.getGoogleConfig();
  }

  redirectByRole() {
    // this.props.history.push(`${'chair_console'}`);
    window.location.href = 'chair_console';

    // this.props.history.push("/chair_console");
  }

  render() {
    return (this.state.googleButton);
  }
});
