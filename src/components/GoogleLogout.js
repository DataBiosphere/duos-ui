import { Component } from 'react';
import { h, hh } from 'react-hyperscript-helpers';
import GoogleLogout from 'react-google-login';

export const GoogleLogoutButton = hh(class GoogleLogoutButton extends Component {
  constructor(props) {
    super(props);
    this.login = props.loginState;
    this.state = { logoutButton: null };
  }

<<<<<<< HEAD
    logout = () => {
        console.log('logout');
        this.login(false);
        window.location.href = "/";
    };
=======
  logout = () => {
    console.log('logout');
    this.login(false);
    window.location.href = "/";
  };
>>>>>>> more-modal-fixes

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