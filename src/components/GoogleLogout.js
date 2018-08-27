import { Component } from 'react';
import { h, hh } from 'react-hyperscript-helpers';
import GoogleLogout from 'react-google-login';

export const GoogleLogoutButton = hh(class GoogleLogoutButton extends Component {
  constructor(props) {
    super(props);
    this.login = props.loginState;
    this.state = { logoutButton: null };
  }

  logout = () => {
    console.log('logout');
    this.login(false);
  };

  async getGoogleConfig() {
    const logoutButton = h(GoogleLogout, {
      buttonText: "Sign Out",
      onSuccess: this.logout,
    });
    this.setState({ logoutButton: logoutButton })
  }

  componentWillMount() {
    this.getGoogleConfig();
  }

  render() {
    return (this.state.logoutButton);
  }
});