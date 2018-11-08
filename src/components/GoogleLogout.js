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
    this.login(false);
    window.location.href = "/";
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
<<<<<<< HEAD
});
=======
});
>>>>>>> e91a15aa0b00ba88642a96803bad846fee159cf9
