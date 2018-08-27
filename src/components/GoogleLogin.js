import { Component } from 'react';
import { h, hh } from 'react-hyperscript-helpers';
import GoogleLogin from 'react-google-login';
import { User } from '../libs/ajax';
import { Storage } from '../libs/storage';

export const GoogleLoginButton = hh(class GoogleLoginButton extends Component {
  constructor(props) {
    super(props);
<<<<<<< HEAD
    this.state = {googleButton: null};
=======
    this.state = { googleButton: null };
>>>>>>> more-modal-fixes
    this.login = props.loginState;
    this.getUser = this.getUser.bind(this);

  }

  responseGoogle = (response) => {
    console.log(response);
    Storage.setGoogleData(response);
    this.getUser().then((data) => {
<<<<<<< HEAD
        Storage.setCurrentUser(data);
        // console.log("USER = ", data);
        this.login(true);
      },
=======
      Storage.setCurrentUser(data);
      // console.log("USER = ", data);
      this.login(true);
    },
>>>>>>> more-modal-fixes
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
<<<<<<< HEAD
      clientId: "complete-clientId",
=======
      clientId: "469451274261-mhatdmqbta3boko0nc9s0ltnhe7q8hc7.apps.googleusercontent.com",
>>>>>>> more-modal-fixes
      buttonText: "Sign In",
      onSuccess: this.responseGoogle,
      onFailure: this.forbidden,
    });
<<<<<<< HEAD
    this.setState({googleButton: googleButton})
=======
    this.setState({ googleButton: googleButton })
>>>>>>> more-modal-fixes
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