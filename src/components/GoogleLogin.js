import { Component } from 'react';
import { h, hh } from 'react-hyperscript-helpers';
import GoogleLogin from 'react-google-login';
import { User } from '../libs/ajax';
import { Storage } from '../libs/storage';

export const GoogleLoginButton = hh(class GoogleLoginButton extends Component {
  constructor(props) {
    super(props);
    this.state = { googleButton: null };
    this.login = props.loginState;
    this.getUser = this.getUser.bind(this);
  }

  responseGoogle = (response) => {
    Storage.setGoogleData(response);
    this.getUser().then((data) => {
      Storage.setCurrentUser(data);
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
      clientId: "complete-clientId",
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

  render() {
    return (this.state.googleButton);
  }
});
