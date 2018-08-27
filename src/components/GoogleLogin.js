import { Component } from 'react';
import { h, hh } from 'react-hyperscript-helpers';
import GoogleLogin from 'react-google-login';
import { User, Token, Storage } from "../libs/ajax";

export const GoogleLoginButton = hh(class GoogleLoginButton extends Component {
  constructor(props) {
    super(props);
    this.state = {googleButton: null};
    this.login = props.loginState;
    this.getUser = this.getUser.bind(this);

  }

  responseGoogle = (response) => {
    console.log(response);
    Token.setToken(response.accessToken);
    Storage.setGoogleData(response);

    this.getUser().then((data) => {
        Storage.setCurrentUser(data);
        // console.log("USER = ", data);
        this.login(true);
      },
      (data) => {
        Storage.clearStorage();
        console.log("Error: ", data)
      });
  };

  forbidden = (response) => {
    Storage.clearStorage();
    console.log(response);
  };

  logout = () => {
    console.log('logout');
  };

  async getGoogleConfig() {
    const googleButton = h(GoogleLogin, {
      className: "navbar-duos-button",
      clientId: "complete-clientId",
      buttonText: "Sign In",
      onSuccess: this.responseGoogle,
      onFailure: this.forbidden,
    });
    this.setState({googleButton: googleButton})
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